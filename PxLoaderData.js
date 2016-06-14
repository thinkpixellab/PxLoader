// PxLoader plugin to load data
(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['pxloader'], function(PxLoader) {
            return (root.PxLoaderData = factory(PxLoader));
        });
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('pxloader'));
    } else {
        // Browser globals
        root.PxLoaderData = factory(root.PxLoader);
    }
}(this, function(PxLoader) {
    function PxLoaderData(url, tags, priority, options) {
        options = options || {};

        var self = this,
            loader = null;

        // used by the loader to categorize and prioritize
        this.tags = tags;
        this.priority = priority;

        this.xhr = new XMLHttpRequest();

        var onReadyStateChange = function() {
            if (self.xhr.readyState !== 4) {
                return;
            }

            if (self.xhr.status === 200 ) {
                onLoad();
            } else {
                onError();
            }
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
            self.unbind('readystatechange', onReadyStateChange);
            self.unbind('error', onError);
        };

        // called by PxLoader to trigger download
        this.start = function( pxLoader ) {
            // we need the loader ref so we can notify upon completion
            loader = pxLoader;

            // set up event handlers so we send the loader progress updates
            self.bind('readystatechange', onReadyStateChange);
            self.bind('error', onError);

            self.xhr.open('GET', url, true);
            self.xhr.send(null);
            self.xhr.responseType = (options.responseType) ? options.responseType : '';
        };

        // called by PxLoader to check status of request (fallback in case
        // the event listeners are not triggered).
        this.checkStatus = function() {
            onReadyStateChange();
        };

        // called by PxLoader when it is no longer waiting
        this.onTimeout = function() {
            // must report a status to the loader: load, error, or timeout
            if (self.xhr.readyState === 4) {
                if (self.xhr.status === 200) {
                    onLoad();
                } else {
                    onError();
                }
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
            self.xhr.addEventListener(eventName, eventHandler, false);
        };

        // cross-browser event un-binding
        this.unbind = function(eventName, eventHandler) {
            self.xhr.removeEventListener(eventName, eventHandler, false);
        };
    }

    // add a convenience method to PxLoader for adding a data
    PxLoader.prototype.addData = function(url, tags, priority, options) {
        var dataLoader = new PxLoaderData(url, tags, priority, options);

        this.add(dataLoader);

        // return the request object to the caller
        return dataLoader.xhr;
    };

    return PxLoaderData;
}));
