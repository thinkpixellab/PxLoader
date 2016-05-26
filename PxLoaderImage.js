// PxLoader plugin to load images
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['pxloader'], function (PxLoader) {
            return (root.PxLoaderImage = factory(PxLoader));
        });
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('pxloader'));
    } else {
        // Browser globals
        root.PxLoaderImage = factory(root.PxLoader);
    }
}(this, function (PxLoader) {
    function PxLoaderImage(url, tags, priority, origin) {
        var self = this,
            loader = null;

        this.img = new Image();
        if(origin !== undefined) {
            this.img.crossOrigin = origin;
        }
        this.tags = tags;
        this.priority = priority;

        var onReadyStateChange = function() {
            if (self.img.readyState === 'complete') {
                removeEventHandlers();
                loader.onLoad(self);
            }
        };

        var onLoad = function() {
            removeEventHandlers();
            loader.onLoad(self);
        };

        var onError = function() {
            removeEventHandlers();
            loader.onError(self);
        };

        var removeEventHandlers = function() {
            self.unbind('load', onLoad);
            self.unbind('readystatechange', onReadyStateChange);
            self.unbind('error', onError);
        };

        this.start = function(pxLoader) {
            // we need the loader ref so we can notify upon completion
            loader = pxLoader;

            // NOTE: Must add event listeners before the src is set. We
            // also need to use the readystatechange because sometimes
            // load doesn't fire when an image is in the cache.
            self.bind('load', onLoad);
            self.bind('readystatechange', onReadyStateChange);
            self.bind('error', onError);

            self.img.src = url;
        };

        // called by PxLoader to check status of image (fallback in case
        // the event listeners are not triggered).
        this.checkStatus = function() {
            if (self.img.complete) {
                removeEventHandlers();
                loader.onLoad(self);
            }
        };

        // called by PxLoader when it is no longer waiting
        this.onTimeout = function() {
            removeEventHandlers();
            if (self.img.complete) {
                loader.onLoad(self);
            } else {
                loader.onTimeout(self);
            }
        };

        // returns a name for the resource that can be used in logging
        this.getName = function() {
            return url;
        };

        // cross-browser event binding
        this.bind = function(eventName, eventHandler) {
            self.img.addEventListener(eventName, eventHandler, false);
        };

        // cross-browser event un-binding
        this.unbind = function(eventName, eventHandler) {
            self.img.removeEventListener(eventName, eventHandler, false);
        };

    }

    // add a convenience method to PxLoader for adding an image
    PxLoader.prototype.addImage = function(url, tags, priority, origin) {
        var imageLoader = new PxLoaderImage(url, tags, priority, origin);
        this.add(imageLoader);

        // return the img element to the caller
        return imageLoader.img;
    };

    return PxLoaderImage;
}));
