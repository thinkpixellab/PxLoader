/*!  | http://thinkpixellab.com/PxLoader */
/*
 * PixelLab Resource Loader
 * Loads resources while providing progress updates.
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], function () {
            return (root.PxLoader = factory());
        });
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals
        root.PxLoader = factory();
    }
}(this, function () {
    function PxLoader(settings) {

        // merge settings with defaults
        settings = settings || {};
        this.settings = settings;

        // how frequently we poll resources for progress
        if (settings.statusInterval == null) {
            settings.statusInterval = 5000; // every 5 seconds by default
        }

        // delay before logging since last progress change
        if (settings.loggingDelay == null) {
            settings.loggingDelay = 20 * 1000; // log stragglers after 20 secs
        }

        // stop waiting if no progress has been made in the moving time window
        if (settings.noProgressTimeout == null) {
            settings.noProgressTimeout = Infinity; // do not stop waiting by default
        }

        var entries = [],
            // holds resources to be loaded with their status
            completionListeners = [],
            progressListeners = [],
            timeStarted, progressChanged = Date.now();

        /**
         * The status of a resource
         * @enum {number}
         */
        var ResourceState = {
            QUEUED: 0,
            WAITING: 1,
            LOADED: 2,
            ERROR: 3,
            TIMEOUT: 4
        };

        // places non-array values into an array.
        var ensureArray = function(val) {
            if (val == null) {
                return [];
            }

            if (Array.isArray(val)) {
                return val;
            }

            return [val];
        };

        // add an entry to the list of resources to be loaded
        this.add = function(resource) {

            // TODO: would be better to create a base class for all resources and
            // initialize the PxLoaderTags there rather than overwritting tags here
            resource.tags = new PxLoaderTags(resource.tags);

            // ensure priority is set
            if (resource.priority == null) {
                resource.priority = Infinity;
            }

            entries.push({
                resource: resource,
                status: ResourceState.QUEUED
            });
        };

        this.addProgressListener = function(callback, tags) {
            progressListeners.push({
                callback: callback,
                tags: new PxLoaderTags(tags)
            });
        };

        this.addCompletionListener = function(callback, tags) {
            completionListeners.push({
                tags: new PxLoaderTags(tags),
                callback: function(e) {
                    if (e.completedCount === e.totalCount) {
                        callback(e);
                    }
                }
            });
        };

        // creates a comparison function for resources
        var getResourceSort = function(orderedTags) {

            // helper to get the top tag's order for a resource
            orderedTags = ensureArray(orderedTags);
            var getTagOrder = function(entry) {
                var resource = entry.resource,
                    bestIndex = Infinity;
                for (var i = 0; i < resource.tags.length; i++) {
                    for (var j = 0; j < Math.min(orderedTags.length, bestIndex); j++) {
                        if (resource.tags.all[i] === orderedTags[j] && j < bestIndex) {
                            bestIndex = j;
                            if (bestIndex === 0) {
                                break;
                            }
                        }
                        if (bestIndex === 0) {
                            break;
                        }
                    }
                }
                return bestIndex;
            };
            return function(a, b) {
                // check tag order first
                var aOrder = getTagOrder(a),
                    bOrder = getTagOrder(b);
                if (aOrder < bOrder) { return -1; }
                if (aOrder > bOrder) { return 1; }

                // now check priority
                if (a.priority < b.priority) { return -1; }
                if (a.priority > b.priority) { return 1; }
                return 0;
            };
        };

        this.start = function(orderedTags) {
            timeStarted = Date.now();

            // first order the resources
            var compareResources = getResourceSort(orderedTags);
            entries.sort(compareResources);

            // trigger requests for each resource
            for (var i = 0, len = entries.length; i < len; i++) {
                var entry = entries[i];
                entry.status = ResourceState.WAITING;
                entry.resource.start(this);
            }

            // do an initial status check soon since items may be loaded from the cache
            setTimeout(statusCheck, 100);
        };

        var statusCheck = function() {
            var checkAgain = false,
                noProgressTime = Date.now() - progressChanged,
                timedOut = (noProgressTime >= settings.noProgressTimeout),
                shouldLog = (noProgressTime >= settings.loggingDelay);

            for (var i = 0, len = entries.length; i < len; i++) {
                var entry = entries[i];
                if (entry.status !== ResourceState.WAITING) {
                    continue;
                }

                // see if the resource has loaded
                if (entry.resource.checkStatus) {
                    entry.resource.checkStatus();
                }

                // if still waiting, mark as timed out or make sure we check again
                if (entry.status === ResourceState.WAITING) {
                    if (timedOut) {
                        entry.resource.onTimeout();
                    } else {
                        checkAgain = true;
                    }
                }
            }

            // log any resources that are still pending
            if (shouldLog && checkAgain) {
                log();
            }

            if (checkAgain) {
                setTimeout(statusCheck, settings.statusInterval);
            }
        };

        this.isBusy = function() {
            for (var i = 0, len = entries.length; i < len; i++) {
                if (entries[i].status === ResourceState.QUEUED || entries[i].status === ResourceState.WAITING) {
                    return true;
                }
            }
            return false;
        };

        var onProgress = function(resource, statusType) {

            var entry = null,
                i, len, listeners, listener, shouldCall;

            // find the entry for the resource
            for (i = 0, len = entries.length; i < len; i++) {
                if (entries[i].resource === resource) {
                    entry = entries[i];
                    break;
                }
            }

            // we have already updated the status of the resource
            if (entry == null || entry.status !== ResourceState.WAITING) {
                return;
            }
            entry.status = statusType;
            progressChanged = Date.now();

            // ensure completion listeners fire after progress listeners
            listeners = progressListeners.concat( completionListeners );

            // fire callbacks for interested listeners
            for (i = 0, len = listeners.length; i < len; i++) {

                listener = listeners[i];
                if (listener.tags.length === 0) {
                    // no tags specified so always tell the listener
                    shouldCall = true;
                } else {
                    // listener only wants to hear about certain tags
                    shouldCall = resource.tags.intersects(listener.tags);
                }

                if (shouldCall) {
                    sendProgress(entry, listener);
                }
            }
        };

        this.onLoad = function(resource) {
            onProgress(resource, ResourceState.LOADED);
        };
        this.onError = function(resource) {
            onProgress(resource, ResourceState.ERROR);
        };
        this.onTimeout = function(resource) {
            onProgress(resource, ResourceState.TIMEOUT);
        };

        // sends a progress report to a listener
        var sendProgress = function(updatedEntry, listener) {
            // find stats for all the resources the caller is interested in
            var completed = 0,
                total = 0,
                i, len, entry, includeResource;
            for (i = 0, len = entries.length; i < len; i++) {

                entry = entries[i];
                includeResource = false;

                if (listener.tags.length === 0) {
                    // no tags specified so always tell the listener
                    includeResource = true;
                } else {
                    includeResource = entry.resource.tags.intersects(listener.tags);
                }

                if (includeResource) {
                    total++;
                    if (entry.status === ResourceState.LOADED ||
                        entry.status === ResourceState.ERROR ||
                        entry.status === ResourceState.TIMEOUT) {

                        completed++;
                    }
                }
            }

            listener.callback({
                // info about the resource that changed
                resource: updatedEntry.resource,

                // should we expose StatusType instead?
                loaded: (updatedEntry.status === ResourceState.LOADED),
                error: (updatedEntry.status === ResourceState.ERROR),
                timeout: (updatedEntry.status === ResourceState.TIMEOUT),

                // updated stats for all resources
                completedCount: completed,
                totalCount: total
            });
        };

        // prints the status of each resource to the console
        var log = this.log = function(showAll) {
            if (!window.console) {
                return;
            }

            var elapsedSeconds = Math.round((Date.now() - timeStarted) / 1000);
            window.console.log('PxLoader elapsed: ' + elapsedSeconds + ' sec');

            for (var i = 0, len = entries.length; i < len; i++) {
                var entry = entries[i];
                if (!showAll && entry.status !== ResourceState.WAITING) {
                    continue;
                }

                var message = 'PxLoader: #' + i + ' ' + entry.resource.getName();
                switch(entry.status) {
                    case ResourceState.QUEUED:
                        message += ' (Not Started)';
                        break;
                    case ResourceState.WAITING:
                        message += ' (Waiting)';
                        break;
                    case ResourceState.LOADED:
                        message += ' (Loaded)';
                        break;
                    case ResourceState.ERROR:
                        message += ' (Error)';
                        break;
                    case ResourceState.TIMEOUT:
                        message += ' (Timeout)';
                        break;
                }

                if (entry.resource.tags.length > 0) {
                    message += ' Tags: [' + entry.resource.tags.all.join(',') + ']';
                }

                window.console.log(message);
            }
        };
    }


    // Tag object to handle tag intersection; once created not meant to be changed
    // Performance rationale: http://jsperf.com/lists-indexof-vs-in-operator/3

    function PxLoaderTags(values) {

        this.all = [];
        this.first = null; // cache the first value
        this.length = 0;

        // holds values as keys for quick lookup
        this.lookup = {};

        if (values) {

            // first fill the array of all values
            if (Array.isArray(values)) {
                // copy the array of values, just to be safe
                this.all = values.slice(0);
            } else if (typeof values === 'object') {
                for (var key in values) {
                    if(values.hasOwnProperty(key)) {
                        this.all.push(key);
                    }
                }
            } else {
                this.all.push(values);
            }

            // cache the length and the first value
            this.length = this.all.length;
            if (this.length > 0) {
                this.first = this.all[0];
            }

            // set values as object keys for quick lookup during intersection test
            for (var i = 0; i < this.length; i++) {
                this.lookup[this.all[i]] = true;
            }
        }
    }

    // compare this object with another; return true if they share at least one value
    PxLoaderTags.prototype.intersects = function(other) {

        // handle empty values case
        if (this.length === 0 || other.length === 0) {
            return false;
        }

        // only a single value to compare?
        if (this.length === 1 && other.length === 1) {
            return this.first === other.first;
        }

        // better to loop through the smaller object
        if (other.length < this.length) {
            return other.intersects(this);
        }

        // loop through every key to see if there are any matches
        for (var key in this.lookup) {
            if (other.lookup[key]) {
                return true;
            }
        }

        return false;
    };

    return PxLoader;
}));
// PxLoader plugin to load images
(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['pxloader'], function(PxLoader) {
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
}(this, function(PxLoader) {
    function PxLoaderImage(url, tags, priority, options) {
        options = options || {};
        
        var self = this,
            loader = null,
            img;

        img = this.img = new Image();
        if (options.origin) {
            img.crossOrigin = options.origin;
        }

        this.tags = tags;
        this.priority = priority;

        var onReadyStateChange = function() {
            if (self.img.readyState !== 'complete') {
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
            onReadyStateChange();
        };

        // called by PxLoader when it is no longer waiting
        this.onTimeout = function() {
            if (self.img.complete) {
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
            self.img.addEventListener(eventName, eventHandler, false);
        };

        // cross-browser event un-binding
        this.unbind = function(eventName, eventHandler) {
            self.img.removeEventListener(eventName, eventHandler, false);
        };

    }

    // add a convenience method to PxLoader for adding an image
    PxLoader.prototype.addImage = function(url, tags, priority, options) {
        var imageLoader = new PxLoaderImage(url, tags, priority, options);
        this.add(imageLoader);

        // return the img element to the caller
        return imageLoader.img;
    };

    return PxLoaderImage;
}));

/* global soundManager: true */
// PxLoader plugin to load sound using SoundManager2
(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['pxloader'], function(PxLoader) {
            return (root.PxLoaderSound = factory(PxLoader));
        });
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('pxloader'));
    } else {
        // Browser globals
        root.PxLoaderSound = factory(root.PxLoader);
    }
}(this, function(PxLoader) {
    function PxLoaderSound(id, url, tags, priority, options) {
        var self = this,
            loader = null;
    
        // For iOS and Android, soundManager2 uses a global audio object so we 
        // can't preload multiple sounds. We'll have to hope they load quickly
        // when we need to play them. Unfortunately, SM2 doesn't expose
        // a property to indicate its using a global object. For now we'll
        // use the same tests they use.
        var isIOS = navigator.userAgent.match(/(ipad|iphone|ipod)/i),
            isAndroid = navigator.userAgent.match(/android/i);
        this.useGlobalHTML5Audio = isIOS || isAndroid;
    
        this.tags = tags;
        this.priority = priority;
        this.sound = soundManager['createSound']({
            'id': id,
            'url': url,
            'autoLoad': false,
            'onload': function() {
                loader.onLoad(self);
            },
    
            // HTML5-only event: Fires when a browser has chosen to stop downloading.
            // "The user agent is intentionally not currently fetching media data,
            // but does not have the entire media resource downloaded."
            'onsuspend': function() {
                loader.onTimeout(self);
            },
    
            // Fires at a regular interval when a sound is loading and new data
            // has been received.
            'whileloading': function() {
                var bytesLoaded = this['bytesLoaded'],
                    bytesTotal = this['bytesTotal'];
    
                // TODO: provide percentage complete updates to loader?
                // see if we have loaded the file
                if (bytesLoaded > 0 && (bytesLoaded === bytesTotal)) {
                    loader.onLoad(self);
                }
            }
        });
    
        this.start = function(pxLoader) {
            // we need the loader ref so we can notify upon completion
            loader = pxLoader;
    
            // can't preload when a single global audio element is used
            if (this.useGlobalHTML5Audio) {
                loader.onTimeout(self);
            } else {
                this.sound['load']();
            }
        };
    
        this.checkStatus = function() {
            switch(self.sound['readyState']) {
                case 0:
                    // uninitialised
                    break;
                case 1:
                    // loading
                    break;
                case 2:
                    // failed/error
                    loader.onError(self);
                    break;
                case 3:
                    // loaded/success
                    loader.onLoad(self);
                    break;
            }
        };
    
        this.onTimeout = function() {
            loader.onTimeout(self);
        };
    
        this.getName = function() {
            return url;
        };
    }
    
    // add a convenience method to PxLoader for adding a sound
    PxLoader.prototype.addSound = function(id, url, tags, priority, options) {
        var soundLoader = new PxLoaderSound(id, url, tags, priority, options);
        this.add(soundLoader);
        return soundLoader.sound;
    };

    return PxLoaderSound;
}));

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
