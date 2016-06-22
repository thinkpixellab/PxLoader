// PxLoader plugin to load video elements
(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['pxloader'], function(PxLoader) {
            return (root.PxLoaderVideo = factory(PxLoader));
        });
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('pxloader'));
    } else {
        // Browser globals
        root.PxLoaderVideo = factory(root.PxLoader);
    }
}(this, function(PxLoader) {
    function PxLoaderVideo(url, tags, priority, options) {
        options = options || {};
        
        var self = this,
            loader = null,
            video;

        this.readyEventName = 'canplaythrough';
        
        video = this.video = document.createElement('video');

        if (options.origin) {
            video.crossOrigin = options.origin;
        }
        video.preload = 'auto';
        
        this.tags = tags;
        this.priority = priority;

        var onReadyStateChange = function() {
            if (self.video.readyState !== 4) {
                return;
            }
            
            onLoad();
        };

        var onLoad = function() {
            loader.onLoad(self);
            cleanup();
        };

        var onError = function() {
            loader.onError(self);
            cleanup();
        };
        
        var onTimeout = function() {
            loader.onTimeout(self);
            cleanup();
        };

        var cleanup = function() {
            self.unbind('load', onLoad);
            self.unbind(self.readyEventName, onReadyStateChange);
            self.unbind('error', onError);
            // Force browser to release connection
            self.video.src = '';
        };

        this.start = function(pxLoader) {
            // we need the loader ref so we can notify upon completion
            loader = pxLoader;

            // NOTE: Must add event listeners before the src is set. We
            // also need to use the readystatechange because sometimes
            // load doesn't fire when an video is in the cache.
            self.bind('load', onLoad);
            self.bind(self.readyEventName, onReadyStateChange);
            self.bind('error', onError);

            // sometimes the browser will intentionally stop downloading
            // the video. In that case we'll consider the video loaded
            self.bind('suspend', onLoad);

            self.video.src = url;
            self.video.load();
        };

        // called by PxLoader to check status of video (fallback in case
        // the event listeners are not triggered).
        this.checkStatus = function() {
            onReadyStateChange();
        };

        // called by PxLoader when it is no longer waiting
        this.onTimeout = function() {
            if (self.video.readyState !== 4) {
                onLoad();
            } else {
                onTimeout();
            }
        };

        // returns a name for the resource that can be used in logging
        this.getName = function() {
            return url;
        };

        // cross-browser event binding
        this.bind = function(eventName, eventHandler) {
            self.video.addEventListener(eventName, eventHandler, false);
        };

        // cross-browser event un-binding
        this.unbind = function(eventName, eventHandler) {
            self.video.removeEventListener(eventName, eventHandler, false);
        };

    }

    // add a convenience method to PxLoader for adding a video
    PxLoader.prototype.addVideo = function(url, tags, priority, options) {
        var videoLoader = new PxLoaderVideo(url, tags, priority, options);
        this.add(videoLoader);

        // return the video element to the caller
        return videoLoader.video;
    };

    return PxLoaderVideo;
}));
