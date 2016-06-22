// PxLoader plugin to load audio elements
(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['pxloader'], function(PxLoader) {
            return (root.PxLoaderAudio = factory(PxLoader));
        });
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('pxloader'));
    } else {
        // Browser globals
        root.PxLoaderAudio = factory(root.PxLoader);
    }
}(this, function(PxLoader) {
    function PxLoaderAudio(url, tags, priority, options) {
        options = options || {};

        var self = this,
            loader = null,
            audio;

        this.readyEventName = 'canplaythrough';
        
        audio = this.audio = document.createElement('audio');

        if (options.origin) {
            audio.crossOrigin = options.origin;
        }
        audio.preload = 'auto';
        
        this.tags = tags;
        this.priority = priority;

        var onReadyStateChange = function() {
            if (self.audio.readyState !== 4) {
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
            self.audio.src = '';
        };

        this.start = function(pxLoader) {
            // we need the loader ref so we can notify upon completion
            loader = pxLoader;

            // NOTE: Must add event listeners before the src is set. We
            // also need to use the readystatechange because sometimes
            // load doesn't fire when an audio is in the cache.
            self.bind('load', onLoad);
            self.bind(self.readyEventName, onReadyStateChange);
            self.bind('error', onError);

            // sometimes the browser will intentionally stop downloading
            // the audio. In that case we'll consider the audio loaded
            self.bind('suspend', onLoad);

            self.audio.src = url;
            self.audio.load();
        };

        // called by PxLoader to check status of audio (fallback in case
        // the event listeners are not triggered).
        this.checkStatus = function() {
            onReadyStateChange();
        };

        // called by PxLoader when it is no longer waiting
        this.onTimeout = function() {
            if (self.audio.readyState !== 4) {
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
            self.audio.addEventListener(eventName, eventHandler, false);
        };

        // cross-browser event un-binding
        this.unbind = function(eventName, eventHandler) {
            self.audio.removeEventListener(eventName, eventHandler, false);
        };

    }

    // add a convenience method to PxLoader for adding audio
    PxLoader.prototype.addAudio = function(url, tags, priority, options) {
        var audioLoader = new PxLoaderAudio(url, tags, priority, options);
        this.add(audioLoader);

        // return the audio element to the caller
        return audioLoader.audio;
    };

    return PxLoaderAudio;
}));
