/**

  Font.js v2012.01.25
  (c) Mike "Pomax" Kamermans, 2012
  Licensed under MIT ("expat" flavour) license.
  Hosted on http://github.com/Pomax/Font.js

  This library adds Font objects to the general pool
  of available JavaScript objects, so that you can load
  fonts through a JavaScript object similar to loading
  images through a new Image() object.

  Font.js is compatible with all browsers that support
  <canvas> and Object.defineProperty - This includes
  all versions of Firefox, Chrome, Opera, IE and Safari
  that were 'current' (Firefox 9, Chrome 16, Opera 11.6,
  IE9, Safari 5.1) at the time Font.js was released.
  
  Font.js will not work on IE8 or below due to the lack
  of Object.defineProperty - I recommend using the
  solution outlined in http://ie6update.com/ for websites
  that are not corporate intranet sites, because as a home
  user you have no excuse not to have upgraded to Internet
  Explorer 9 yet, or simply not using Internet Explorer if
  you're still using Windows XP. If you have friends or
  family that still use IE8 or below: intervene.
  
  You may remove every line in this header except for
  the first block of four lines, for the purposes of
  saving space and minification. If minification strips
  the header, you'll have to paste that paragraph back in.

  Issue tracker: https://github.com/Pomax/Font.js/issues

**/

(function(window){

  // 1) Do we have a mechanism for binding implicit get/set?
  if(!Object.defineProperty) {
    throw("Font.js requires Object.defineProperty, which this browser does not support.");
  }

  // 2) Do we have Canvas2D available?
  if(!document.createElement("canvas").getContext) {
    throw("Font.js requires <canvas> and the Canvas2D API, which this browser does not support.");
  }

  // Make sure type arrays are available in IE9
  // Code borrowed from pdf.js (https://gist.github.com/1057924)
  (function(window) {
    try { var a = new Uint8Array(1); return; } catch (e) { }
    function subarray(start, end) { return this.slice(start, end); }
    function set_(array, offset) {
      var i, n = array.length;
      if (arguments.length < 2) { offset = 0; }
      for (i = 0; i < n; ++i, ++offset) { this[offset] = array[i] & 0xFF; }}
    function TypedArray(arg1) {
      var result, i;
      if (typeof arg1 === "number") {
        result = new Array(arg1);
        for (i = 0; i < arg1; ++i) { result[i] = 0; }
      } else { result = arg1.slice(0); }
      result.subarray = subarray;
      result.buffer = result;
      result.byteLength = result.length;
      result.set = set_;
      if (typeof arg1 === "object" && arg1.buffer) {
        result.buffer = arg1.buffer; }
      return result; }
    window.Uint8Array = TypedArray;
    window.Uint32Array = TypedArray;
    window.Int32Array = TypedArray;
  }(window));

  // Also make sure XHR understands typing.
  // Code based on pdf.js (https://gist.github.com/1057924)
  (function(window) {
    // shortcut for Opera - it's already fine
    if(window.opera) return;
    // shortcuts for browsers that already implement XHR minetyping
    if ("response" in XMLHttpRequest.prototype ||
        "mozResponseArrayBuffer" in XMLHttpRequest.prototype ||
        "mozResponse" in XMLHttpRequest.prototype ||
        "responseArrayBuffer" in XMLHttpRequest.prototype) { return; }
    var getter;
    // If we have access to the VBArray (i.e., we're in IE), use that
    if(window.VBArray) {
      getter = function() {
        return new Uint8Array(new VBArray(this.responseBody).toArray()); }}
    // Okay... umm.. untyped arrays? This may break completely.
    // (Android browser 2.3 and 3 don't do typed arrays)
    else { getter = function() { this.responseBody; }}
    Object.defineProperty(XMLHttpRequest.prototype, "response", {get: getter});
  }(window));


  // IE9 does not have binary-to-ascii built in O_O
  if(!window.btoa) {
    // Code borrowed from PHP.js (http://phpjs.org/functions/base64_encode:358)
    window.btoa = function(data) {
      var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
      var o1, o2, o3, h1, h2, h3, h4, bits, i = 0, ac = 0, enc = "", tmp_arr = [];
      if (!data) { return data; }
      do { // pack three octets into four hexets
          o1 = data.charCodeAt(i++);
          o2 = data.charCodeAt(i++);
          o3 = data.charCodeAt(i++);
          bits = o1 << 16 | o2 << 8 | o3;
          h1 = bits >> 18 & 0x3f;
          h2 = bits >> 12 & 0x3f;
          h3 = bits >> 6 & 0x3f;
          h4 = bits & 0x3f;
          // use hexets to index into b64, and append result to encoded string
          tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
      } while (i < data.length);
      enc = tmp_arr.join('');
      var r = data.length % 3;
      return (r ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);
    };
  }

  /**

    Not-borrowed-code starts here!

   **/
  function Font() {}

  // if this is not specified, a random name is used
  Font.prototype.fontFamily = "fjs" + (999999 * Math.random() | 0);

  // the font resource URL
  Font.prototype.url = "";

  // the font's format ('truetype' for TT-OTF or 'opentype' for CFF-OTF)
  Font.prototype.format = "";

  // the font's byte code
  Font.prototype.data = "";
  
  // custom font, implementing the letter 'A' as zero-width letter.
  Font.prototype.base64 = "AAEAAAAKAIAAAwAgT1MvMgAAAAAAAACsAAAAWGNtYXAA"+
                          "AAAAAAABBAAAACxnbHlmAAAAAAAAATAAAAAQaGVhZAAAA"+
                          "AAAAAFAAAAAOGhoZWEAAAAAAAABeAAAACRobXR4AAAAAA"+
                          "AAAZwAAAAIbG9jYQAAAAAAAAGkAAAACG1heHAAAAAAAAA"+
                          "BrAAAACBuYW1lAAAAAAAAAcwAAAAgcG9zdAAAAAAAAAHs"+
                          "AAAAEAAEAAEAZAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"+
                          "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"+
                          "AAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAABAAMAAQA"+
                          "AAAwABAAgAAAABAAEAAEAAABB//8AAABB////wAABAAAA"+
                          "AAABAAAAAAAAAAAAAAAAMQAAAQAAAAAAAAAAAABfDzz1A"+
                          "AAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAEAAg"+
                          "AAAAAAAAABAAAAAQAAAAEAAAAAAAAAAAAAAAAAAAAAAAA"+
                          "AAAAAAAAAAQAAAAAAAAAAAAAAAAAIAAAAAQAAAAIAAQAB"+
                          "AAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAIAHgADAAEEC"+
                          "QABAAAAAAADAAEECQACAAIAAAAAAAEAAAAAAAAAAAAAAA"+
                          "AAAA==";

  // these metrics represent the font-indicated values,
  // not the values pertaining to text as it is rendered
  // on the page (use fontmetrics.js for this instead).
  Font.prototype.metrics = {
    quadsize: 0,
    leading: 0,
    ascent: 0,
    descent: 0,
    weightclass: 400
  };

  // Will this be a remote font, or a system font?
  Font.prototype.systemfont = false;

  // internal indicator that the font is done loading
  Font.prototype.loaded = false;

  /**
   * This function gets called once the font is done
   * loading, its metrics have been determined, and it
   * has been parsed for use on-page. By default, this
   * function does nothing, and users can bind their
   * own handler function.
   */
  Font.prototype.onload = function () {};

  /**
   * This function gets called when there is a problem
   * loading the font.
   */
  Font.prototype.onerror = function () {};

  // preassigned quad × quad context, for measurements
  Font.prototype.canvas = false;
  Font.prototype.context = false;

  /**
   * validation function to see if the zero-width styled
   * text is no longer zero-width. If this is true, the
   * font is properly done loading. If this is false, the
   * function calls itself via a timeout
   */
  Font.prototype.validate = function (target, zero, mark, font, timeout) {
    if (timeout !== false && timeout < 0 ) {
      this.onerror("Requested system font '"+this.fontFamily+"' could not be loaded (it may not be installed).");
      return;
    }

    var computedStyle = document.defaultView.getComputedStyle(target, '');
    var width = computedStyle.getPropertyValue("width").replace("px", '');
    // font has finished loading - remove the zero-width and
    // validation paragraph, but leave the actual font stylesheet (mark);
    if (width > 0) {
      document.head.removeChild(zero);
      document.body.removeChild(target);
      this.loaded = true;
      this.onload();
    }
    // font has not finished loading - wait 50ms and try again
    else { setTimeout(function () { font.validate(target, zero, mark, font, timeout === false ? false : timeout-50); }, 50); }
  };

  /**
   * This gets called when the file is done downloading.
   */
  Font.prototype.ondownloaded = function () {
    // decimal to character
    var chr = function (val) {
      return String.fromCharCode(val);
    };

    // decimal to ushort
    var chr16 = function (val) {
      if (val < 256) { return chr(0) + chr(val); }
      var b1 = val >> 8;
      var b2 = val & 0xFF;
      return chr(b1) + chr(b2);
    };

    // decimal to hexadecimal
    // See http://phpjs.org/functions/dechex:382
    var dechex =  function (val) {
      if (val < 0) { val = 0xFFFFFFFF + val + 1; }
      return parseInt(val, 10).toString(16);
    };

    // unsigned short to decimal
    var ushort = function (b1, b2) {
      return 256 * b1 + b2;
    };

    // signed short to decimal
    var fword = function (b1, b2) {
      var negative = b1 >> 7 === 1, val;
      b1 = b1 & 0x7F;
      val = 256 * b1 + b2;
      // positive numbers are already done
      if (!negative) { return val; }
      // negative numbers need the two's complement treatment
      return val - 0x8000;
    };

    // unsigned long to decimal
    var ulong = function (b1, b2, b3, b4) {
      return 16777216 * b1 + 65536 * b2 + 256 * b3 + b4;
    };

    // unified error handling
    var error = function (msg) {
      this.onerror(msg);
    };

    // we know about TTF (0x00010000) and CFF ('OTTO') fonts
    var ttf = chr(0) + chr(1) + chr(0) + chr(0);
    var cff = "OTTO";

    // so what kind of font is this?
    var data = this.data;
    var version = chr(data[0]) + chr(data[1]) + chr(data[2]) + chr(data[3]);
    var isTTF = (version === ttf);
    var isCFF = (isTTF ? false : version === cff);
    if (isTTF) { this.format = "truetype"; }
    else if (isCFF) { this.format = "opentype"; }
    // terminal error: stop running code
    else { error("Error: file at " + this.url + " cannot be interpreted as OpenType font."); return; }

    // ================================================================
    // if we get here, this is a legal font. Extract some font metrics,
    // and then wait for the font to be available for on-page styling.
    // ================================================================

    // first, we parse the SFNT header data
    var numTables = ushort(data[4], data[5]),
        tagStart = 12, ptr, end = tagStart + 16 * numTables, tags = {},
        tag;
    for (ptr = tagStart; ptr < end; ptr += 16) {
      tag = chr(data[ptr]) + chr(data[ptr + 1]) + chr(data[ptr + 2]) + chr(data[ptr + 3]);
      tags[tag] = {
        name: tag,
        checksum: ulong(data[ptr+4], data[ptr+5], data[ptr+6], data[ptr+7]),
        offset:   ulong(data[ptr+8], data[ptr+9], data[ptr+10], data[ptr+11]),
        length:   ulong(data[ptr+12], data[ptr+13], data[ptr+14], data[ptr+15])
      };
    }

    // first we define a quick error shortcut function:
    var checkTableError = function (tag) {
      if (!tags[tag]) {
        error("Error: font is missing the required OpenType '" + tag + "' table.");
        // return false, so that the result of this function can be used to stop running code
        return false;
      }
      return tag;
    };

    // Then we access the HEAD table for the "font units per EM" value.
    tag = checkTableError("head");
    if (tag === false) { return; }
    ptr = tags[tag].offset;
    tags[tag].version = "" + data[ptr] + data[ptr+1] + data[ptr+2] + data[ptr+3];
    var unitsPerEm = ushort(data[ptr+18], data[ptr+19]);
    this.metrics.quadsize = unitsPerEm;

    // We follow up by checking the HHEA table for ascent, descent, and leading values.
    tag = checkTableError("hhea");
    if (tag===false) { return; }
    ptr = tags[tag].offset;
    tags[tag].version = "" + data[ptr] + data[ptr+1] + data[ptr+2] + data[ptr+3];
    this.metrics.ascent  = fword(data[ptr+4], data[ptr+5]) / unitsPerEm;
    this.metrics.descent = fword(data[ptr+6], data[ptr+7]) / unitsPerEm;
    this.metrics.leading = fword(data[ptr+8], data[ptr+9]) / unitsPerEm;

    // And then finally we check the OS/2 table for the font-indicated weight class.
    tag = checkTableError("OS/2");
    if (tag===false) { return; }
    ptr = tags[tag].offset;
    tags[tag].version = "" + data[ptr] + data[ptr+1];
    this.metrics.weightclass = ushort(data[ptr+4], data[ptr+5]);

    // ==================================================================
    // Then the mechanism for determining whether the font is not
    // just done downloading, but also fully parsed and ready for
    // use on the page for typesetting: we pick a letter that we know
    // is supported by the font, and generate a font that implements
    // only that letter, as a zero-width glyph. We can then test
    // whether the font is available by checking whether a paragraph
    // consisting of just that letter, styled with "desiredfont, zwfont"
    // has zero width, or a real width. As long as it's zero width, the
    // font has not finished loading yet.
    // ==================================================================

    // To find a letter, we must consult the character map ("cmap") table
    tag = checkTableError("cmap");
    if (tag===false) { return; }
    ptr = tags[tag].offset;
    tags[tag].version = "" + data[ptr] + data[ptr+1];
    numTables = ushort(data[ptr+2], data[ptr+3]);

    // For the moment, we only look for windows/unicode records, with
    // a cmap subtable format 4 because OTS (the sanitiser used in
    // Chrome and Firefox) does not actually support anything else
    // at the moment.
    //
    // When http://code.google.com/p/chromium/issues/detail?id=110175
    // is resolved, remember to stab me to add support for the other
    // maps, too.
    //
    var encodingRecord, rptr, platformID, encodingID, offset, cmap314 = false;
    for (var encodingRecord = 0; encodingRecord < numTables; encodingRecord++) {
      rptr = ptr + 4 + encodingRecord * 8;
      platformID = ushort(data[rptr], data[rptr+1]);
      encodingID = ushort(data[rptr+2], data[rptr+3]);
      offset     = ulong(data[rptr+4], data[rptr+5], data[rptr+6], data[rptr+7]);
      if (platformID === 3 && encodingID === 1) { cmap314 = offset; }
    }

    // This is our fallback font - a minimal font that implements
    // the letter "A". We can transform this font to implementing
    // any character between 0x0000 and 0xFFFF by altering a
    // handful of letters.
    var printChar = "A";

    // Now, if we found a format 4 {windows/unicode} cmap subtable,
    // we can find a suitable glyph and modify the 'base64' content.
    if (cmap314 !== false) {
      ptr += cmap314;
      version = ushort(data[ptr], data[ptr+1]);
      if (version === 4) {
        // First find the number of segments in this map
        var segCount = ushort(data[ptr+6], data[ptr+7]) / 2;

        // Then, find the segment end characters. We'll use
        // whichever of those isn't a whitespace character
        // for our verification font, which we check based
        // on the list of Unicode 6.0 whitespace code points:
        var printable = function (chr) {
          return [0x0009,0x000A,0x000B,0x000C,0x000D,0x0020,0x0085,0x00A0,
                   0x1680,0x180E,0x2000,0x2001,0x2002,0x2003,0x2004,0x2005,
                   0x2006,0x2007,0x2008,0x2009,0x200A,0x2028,0x2029,0x202F,
                   0x205F,0x3000].indexOf(chr) === -1; }

        // Loop through the segments in search of a usable character code:
        var i = ptr + 14, e = ptr + 14 + 2 * segCount, endChar = false;
        for (; i < e; i += 2) {
          endChar = ushort(data[i], data[i+1]);
          if (printable(endChar)) { break; }
          endChar = false;
        }

        if (endChar !== false) {
          // We now have a printable character to validate with!
          // We need to make sure to encode the correct "idDelta"
          // value for this character, because our "glyph" will
          // always be at index 1 (index 0 is reserved for .notdef).
          // As such, we need to set up a delta value such that:
          //
          //   [character code] + [delta value] == 1
          //
          printChar = String.fromCharCode(endChar);
          var delta = -(endChar - 1) + 65536;

          // Now we need to substitute the values in our
          // base64 font template. The CMAP modification
          // consists of generating a new base64 string
          // for the bit that indicates the encoded char.
          // In our 'A'-encoding font, this is:
          //
          //   0x00 0x41 0xFF 0xFF 0x00 0x00
          //   0x00 0x41 0xFF 0xFF 0xFF 0xC0
          //
          // which is the 20 letter base64 string at [380]:
          //
          //   AABB//8AAABB////wAAB
          //
          // We replace this with our new character:
          //
          //   [hexchar] 0xFF 0xFF 0x00 0x00
          //   [hexchar] 0xFF 0xFF [ delta ]
          //
          // Note: in order to do so properly, we need to
          // make sure that the bytes are base64 aligned, so
          // we have to add a leading 0x00:
          var newhex = btoa(chr(0) +                         // base64 padding byte
                            chr16(endChar) + chr16(0xFFFF) + // "endCount" array
                            chr16(0) +                       // cmap required padding
                            chr16(endChar) + chr16(0xFFFF) + // "startCount" array
                            chr16(delta) +                   // delta value
                            chr16(1));                       // delta terminator

          // And now we replace the text in 'base64' at
          // position 380 with this new base64 string:
          this.base64 = this.base64.substring(0, 380) + newhex +
                         this.base64.substring(380 + newhex.length);
        }
      }
    }
    
    this.bootstrapValidation(printChar, false);
  }
  
  Font.prototype.bootstrapValidation = function (printChar, timeout) {
    // Create a stylesheet for using the zero-width font:
    var tfName = this.fontFamily+" testfont";
    var zerowidth = document.createElement("style");
    zerowidth.setAttribute("type", "text/css");
    zerowidth.innerHTML =  "@font-face {\n" +
                          "  font-family: '" + tfName + "';\n" +
                          "  src: url('data:application/x-font-ttf;base64," + this.base64 + "')\n" +
                          "       format('truetype');}";
    document.head.appendChild(zerowidth);

    // Create a validation stylesheet for the requested font, if it's a remote font:
    var realfont = false;
    if (!this.systemfont) {
      realfont = this.toStyleNode();
      document.head.appendChild(realfont);
    }

    // Create a validation paragraph, consisting of the zero-width character
    var para = document.createElement("p");
    para.style.cssText = "position: absolute; top: 0; left: 0; opacity: 0;";
    para.style.fontFamily = "'" + this.fontFamily + "', '" + tfName + "'";
    para.innerHTML = printChar + printChar + printChar + printChar + printChar +
                     printChar + printChar + printChar + printChar + printChar;
    document.body.appendChild(para);

    // Quasi-error: if there is no getComputedStyle, claim loading is done.
    if (!document.defaultView.getComputedStyle) {
      this.onload();
      error("Error: document.defaultView.getComputedStyle is not supported by this browser.\n" +
            "Consequently, Font.onload() cannot be trusted."); }

    // If there is getComputedStyle, we do proper load completion verification.
    else {
      // If this is a remote font, we rely on the indicated quad size
      // for measurements. If it's a system font there will be no known
      // quad size, so we simply fix it at 1000 pixels.
      var quad = this.systemfont ? 1000 : this.metrics.quadsize;

      // Because we need to 'preload' a canvas with this
      // font, we have no idea how much surface area
      // we'll need for text measurements later on. So
      // be safe, we assign a surface that is quad² big,
      // and then when measureText is called, we'll
      // actually build a quick <span> to see how much
      // of that surface we don't need to look at.
      var canvas = document.createElement("canvas");
      canvas.width = quad;
      canvas.height = quad;
      this.canvas = canvas;

      // The reason we preload is because some browsers
      // will also take a few milliseconds to assign a font
      // to a Canvas2D context, so if measureText is called
      // later, without this preloaded context, there is no
      // time for JavaScript to "pause" long enough for the
      // context to properly load the font, and metrics may
      // be completely wrong. The solution is normally to
      // add in a setTimeout call, to give the browser a bit
      // of a breather, but then we can't do synchronous
      // data returns, and we need a callback just to get
      // string metrics, which is about as far from desired
      // as is possible.
      var context = canvas.getContext("2d");
      context.font = "1em '" + this.fontFamily + "'";
      context.fillStyle = "white";
      context.fillRect(-1, -1, quad+2, quad+2);
      context.fillStyle = "black";
      context.fillText("test text", 50, quad / 2);
      this.context = context;

      // ===================================================
      // Thanks to Opera and Firefox, we need to add in more
      // "you can do your thing, browser" moments. If we
      // call validate() as a straight function call, the
      // browser doesn't get the breathing space to perform
      // page styling. This is a bit mad, but until there's
      // a JS function for "make the browser update the page
      // RIGHT NOW", we're stuck with this.
      // ===================================================

      // We need to alias "this" because the keyword "this"
      // becomes the global context after the timeout.
      var local = this;
      var delayedValidate = function() { local.validate(para, zerowidth, realfont, local, timeout); };
      setTimeout(delayedValidate, 50);
    }
  };

  /**
   * We take a different path for System fonts, because
   * we cannot inspect the actual byte code.
   */
  Font.prototype.processSystemFont = function () {
    // Mark system font use-case
    this.systemfont = true;
    // There are font-declared metrics to work with.
    this.metrics = false;
    // However, we do need to check whether the font
    // is actually installed.
    this.bootstrapValidation("A", 1000);
  }

  /**
   * This gets called when font.src is set, (the binding
   * for which is at the end of this file).
   */
  Font.prototype.loadFont = function () {
    var font = this;

    // System font?
    if(this.url.indexOf(".") === -1) {
      setTimeout(function(){
        font.processSystemFont(); 
      }, 10);
      return;
    }

    // Remote font.
    var xhr = new XMLHttpRequest();
    xhr.open('GET', font.url, true);
    xhr.responseType = "arraybuffer";
    xhr.onload = function (evt) {
      var arrayBuffer = xhr.response;
      if (arrayBuffer) {
        font.data = new Uint8Array(arrayBuffer);
        font.ondownloaded();
      } else {
        font.onerror("Error downloading font resource from "+font.url);
      }
    };
    xhr.send(null);
  };

  // The stylenode can be added to the document head
  // to make the font available for on-page styling,
  // but it should be requested with .toStyleNode()
  Font.prototype.styleNode = false;

  /**
   * Get the DOM node associated with this Font
   * object, for page-injection.
   */
  Font.prototype.toStyleNode = function () {
    // If we already built it, pass that reference.
    if (this.styleNode) { return this.styleNode; }
    // If not, build a style element
    this.styleNode = document.createElement("style");
    this.styleNode.type = "text/css";
    var styletext = "@font-face {\n";
       styletext += "  font-family: '" + this.fontFamily + "';\n";
       styletext += "  src: url('" + this.url + "') format('" + this.format + "');\n";
       styletext += "}";
    this.styleNode.innerHTML = styletext;
    return this.styleNode;
  }

  /**
   * Measure a specific string of text, given this font.
   * If the text is too wide for our preallocated canvas,
   * it will be chopped up and the segments measured
   * separately.
   */
  Font.prototype.measureText = function (textString, fontSize) {
    // error shortcut
    if (!this.loaded) {
      error("measureText() was called while the font was not yet loaded");
      return false;
    }

    // Set up the right font size.
    this.context.font = fontSize + "px '"+this.fontFamily+"'";

    // Get the initial string width through our preloaded Canvas2D context
    var metrics = this.context.measureText(textString);

    // Assign the remaining default values, because the
    // TextMetrics object is horribly deficient.
    metrics.fontsize = fontSize;
    metrics.ascent  = 0;
    metrics.descent = 0;
    metrics.bounds  = { minx: 0,
                        maxx: metrics.width,
                        miny: 0,
                        maxy: 0 };
    metrics.height = 0;

    // Does the text fit on the canvas? If not, we have to
    // chop it up and measure each segment separately.
    var segments = [],
        minSegments = metrics.width / this.metrics.quadsize;
    if (minSegments <= 1) { segments.push(textString); }
    else {
      // TODO: add the chopping code here. For now this
      // code acts as placeholder 
      segments.push(textString); 
    }

    // run through all segments, updating the metrics as we go.
    var segmentLength = segments.length, i;
    for (i = 0; i < segmentLength; i++) {
      this.measureSegment(segments[i], fontSize, metrics);
    }
    return metrics;
  };

  /**
   * Measure a section of text, given this font, that is
   * guaranteed to fit on our preallocated canvas.
   */
  Font.prototype.measureSegment = function(textSegment, fontSize, metrics) {
    // Shortcut function for getting computed CSS values
    var getCSSValue = function (element, property) {
      return document.defaultView.getComputedStyle(element, null).getPropertyValue(property);
    };

    // We are going to be using you ALL over the place, little variable.
    var i;

    // For text leading values, we measure a multiline
    // text container as built by the browser.
    var leadDiv = document.createElement("div");
    leadDiv.style.position = "absolute";
    leadDiv.style.opacity = 0;
    leadDiv.style.font = fontSize + "px '" + this.fontFamily + "'";
    var numLines = 10;
    leadDiv.innerHTML = textSegment;
    for (i = 1; i < numLines; i++) {
      leadDiv.innerHTML += "<br/>" + textSegment;
    }
    document.body.appendChild(leadDiv);

    // First we guess at the leading value, using the standard TeX ratio.
    metrics.leading = 1.2 * fontSize;

    // We then try to get the real value based on how
    // the browser renders the text.
    var leadDivHeight = getCSSValue(leadDiv,"height");
    leadDivHeight = leadDivHeight.replace("px","");
    if (leadDivHeight >= fontSize * numLines) {
      metrics.leading = (leadDivHeight / numLines) | 0;
    }
    document.body.removeChild(leadDiv);

    // If we're not with a white-space-only string,
    // this is all we will be able to do.
    if (/^\s*$/.test(textSegment)) { return metrics; }

    // If we're not, let's try some more things.
    var canvas = this.canvas,
        ctx = this.context,
        quad = this.systemfont ? 1000 : this.metrics.quadsize,
        w = quad,
        h = quad,
        baseline = quad / 2,
        padding = 50,
        xpos = (quad - metrics.width) / 2;

    // SUPER IMPORTANT, HARDCORE NECESSARY STEP:
    // xpos may be a fractional number at this point, and
    // that will *complete* screw up line scanning, because
    // cropping a canvas on fractional coordiantes does
    // really funky edge interpolation. As such, we force
    // it to an integer.
    if (xpos !== (xpos | 0)) { xpos = xpos | 0; }

    // Set all canvas pixeldata values to 255, with all the content
    // data being 0. This lets us scan for data[i] != 255.
    ctx.fillStyle = "white";
    ctx.fillRect(-padding, -padding, w + 2 * padding, h + 2 * padding);
    // Then render the text centered on the canvas surface.
    ctx.fillStyle = "black";
    ctx.fillText(textSegment, xpos, baseline);

    // Rather than getting all four million+ subpixels, we
    // instead get a (much smaller) subset that we know
    // contains our text. Canvas pixel data is w*4 by h*4,
    // because {R,G,B,A} is stored as separate channels in
    // the array. Hence the factor 4.
    var scanwidth = (metrics.width + padding) | 0,
        scanheight = 4 * fontSize,
        x_offset = xpos - padding / 2,
        y_offset = baseline-scanheight / 2,
        pixelData = ctx.getImageData(x_offset, y_offset, scanwidth, scanheight).data;

    // Set up our scanline variables
    var i = 0,
        j = 0,
        w4 = scanwidth * 4,
        len = pixelData.length,
        mid = scanheight / 2;

    // Scan 1: find the ascent using a normal, forward scan
    while (++i < len && pixelData[i] === 255) {}
    var ascent = (i / w4) | 0;

    // Scan 2: find the descent using a reverse scan
    i = len - 1;
    while (--i > 0 && pixelData[i] === 255) {}
    var descent = (i / w4) | 0;

    // Scan 3: find the min-x value, using a forward column scan
    for (i = 0, j = 0; j < scanwidth && pixelData[i] === 255;) {
      i += w4;
      if (i >= len) { j++; i = (i - len) + 4; }}
    var minx = j;

    // Scan 3: find the max-x value, using a reverse column scan
    var step = 1;
    for (i = len-3, j = 0; j<scanwidth && pixelData[i] === 255; ) {
      i -= w4;
      if (i < 0) { j++; i = (len - 3) - (step++) * 4; }}
    var maxx = scanwidth - j;

    // We have all our metrics now, so fill in the
    // metrics object and return it to the user.
    metrics.ascent  = (mid - ascent);
    metrics.descent = (descent - mid);
    metrics.bounds  = { minx: minx - (padding / 2),
                        maxx: maxx - (padding / 2),
                        miny: -metrics.descent,
                        maxy: metrics.ascent };
    metrics.height = 1 + (descent - ascent);
    return metrics;
  };

  /**
   * we want Font to do the same thing Image does when
   * we set the "src" property value, so we use the
   * Object.defineProperty function to bind a setter
   * that does more than just bind values.
   */
  Object.defineProperty(Font.prototype, "src", { set: function(url) { this.url=url; this.loadFont(); }});


  /**
   * Bind to global scope
   */
  window.Font = Font;

}(window));