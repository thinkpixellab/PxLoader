// @depends PxLoader.js
// @depends Font.js

/**
 * PxLoader plugin to load fonts
 */
function PxLoaderFont(fontFamily, src, tags, priority) {
    var self = this,
        loader = null;

    this.tags = tags;
    this.priority = priority;
    this.font = new Font();
    this.font.fontFamily = fontFamily;

    this.font.onload = function() {
        removeEventHandlers();
        loader.onLoad(self);
    };

    this.font.onerror = function() {
        removeEventHandlers();
        loader.onError(self);
    };

    var removeEventHandlers = function() {
        self.font.onload = null;
        self.font.onerror = null;
    };

    this.start = function(pxLoader) {
        // we need the loader ref so we can notify upon completion
        loader = pxLoader;

        // when a font is loaded externally (by css, google font loader, etc)
        // we won't have a url src. Font.js can use the font family name if
        // no src is provided.
        self.font.src = src || fontFamily;
    };

    // called by PxLoader when it is no longer waiting
    this.onTimeout = function() {
        removeEventHandlers();
    };

    // returns a name for the resource that can be used in logging
    this.getName = function() {
        return src;
    };
}

// add a convenience method to PxLoader for adding a font
PxLoader.prototype.addFont = function(fontFamily, src, tags, priority) {
    var fontLoader = new PxLoaderFont(fontFamily, src, tags, priority);
    this.add(fontLoader);

    // return the Font instance to the caller
    return fontLoader.font;
};
