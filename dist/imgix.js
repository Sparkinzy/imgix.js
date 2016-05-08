(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var util = require('./util.js'),
    targetWidths = require('./targetWidths.js');

var ImgixTag = (function() {
  function ImgixTag(el) {
    this.el = el;

    if (this.el.hasAttribute('ix-initialized')) {
      return;
    }
    this.el.setAttribute('ix-initialized', 'ix-initialized');

    this.ixPathVal = el.getAttribute('ix-path');
    this.ixParamsVal = el.getAttribute('ix-params');
    this.ixSrcVal = el.getAttribute('ix-src');

    if (this.ixPathVal && !imgix.config.host) {
      throw new Error('You must set a value for `imgix.config.host` to use `ix-path` and `ix-params`.');
    }

    this.baseParams = this._extractBaseParams();
    this.baseUrl = this._buildBaseUrl();
    this.baseUrlWithoutQuery = this.baseUrl.split('?')[0];

    this.el.setAttribute('sizes', this.sizes());
    this.el.setAttribute('srcset', this.srcset());
    this.el.setAttribute('src', this.src());
  }

  ImgixTag.prototype._extractBaseParams = function() {
    if (this.ixParamsVal) {
      var params = JSON.parse(this.ixParamsVal);
    } else {
      // If the user used `ix-src`, we have to extract the base params
      // from that string URL.
      var lastQuestion = this.ixSrcVal.lastIndexOf('?'),
          paramString = this.ixSrcVal.substr(lastQuestion + 1),
          splitParams = paramString.split('&'),
          params = {};

      for (var i = 0, splitParam; i < splitParams.length; i++) {
        splitParam = splitParams[i].split('=');

        params[splitParam[0]] = splitParam[1];
      }
    }

    // Encode any passed Base64 variant params
    for (var key in params) {
      if (key.substr(-2) === '64') {
        params[key] = util.encode64(params[key]);
      }
    }

    return params;
  };

  ImgixTag.prototype._buildBaseUrl = function() {
    if (this.ixSrcVal) {
      return this.ixSrcVal;
    } else {
      var path = this.ixPathVal,
          protocol = 'http';
      if (imgix.config.useHttps) {
        protocol += 's';
      }

      var url = protocol + '://' + imgix.config.host,
          hostEndsWithSlash = imgix.config.host.substr(-1) === '/',
          pathStartsWithSlash = path[0] === '/'

      // Make sure we don't end up with 2 or 0 slashes between
      // the host and path portions of the generated URL
      if (hostEndsWithSlash && pathStartsWithSlash) {
        url += path.substr(1);
      } else if (!hostEndsWithSlash && !pathStartsWithSlash) {
        url += '/' + path;
      } else {
        url += path;
      }

      url += '?'
      var param;
      for (var key in this.baseParams) {
        param = this.baseParams[key];
        url += encodeURIComponent(key) + '=' + encodeURIComponent(param);
      }

      return url;
    }
  };

  ImgixTag.prototype.src = function() {
    return this.baseUrl;
  };

  // Returns a comma-separated list of `url widthDescriptor` pairs,
  // scaled appropriately to the same aspect ratio as the base image
  // as appropriate.
  ImgixTag.prototype.srcset = function() {
    var pairs = [];

    for (var i = 0, targetWidth, clonedParams, url; i < targetWidths.length; i++) {
      targetWidth = targetWidths[i];
      clonedParams = util.clone(this.baseParams);

      clonedParams.w = targetWidth

      if (this.baseParams.w != null && this.baseParams.h != null) {
        clonedParams.h = targetWidth * (this.baseParams.h / this.baseParams.w);
      }

      url = this.baseUrlWithoutQuery + '?';
      var val,
          params = [];
      for (var key in clonedParams) {
        val = clonedParams[key];
        params.push(key + '=' + val);
      }

      url += params.join('&');

      pairs.push(url + ' ' + targetWidth + 'w');
    }

    return pairs.join(', ');
  };

  ImgixTag.prototype.sizes = function() {
    var existingSizes = this.el.getAttribute('sizes');

    if (existingSizes) {
      return existingSizes;
    } else {
      return '100vw';
    }
  };

  return ImgixTag;
}());

module.exports = ImgixTag;

},{"./targetWidths.js":3,"./util.js":4}],2:[function(require,module,exports){
(function (global){
var ImgixTag = require('./ImgixTag.js'),
    elementQuery = [
      'img[ix-src]',
      'source[ix-src]',
      'img[ix-path]',
      'source[ix-path]',
    ].join(',');

global.imgix = {
  init: function() {
    // find all the `img` and `source` tags that need processing
    // ix-src or ix-path + ix-params

    var allImgandSourceTags = document.querySelectorAll(elementQuery);

    for (var i = 0, el; i < allImgandSourceTags.length; i++) {
      el = allImgandSourceTags[i];
      console.log('hi', allImgandSourceTags[i]);

      new ImgixTag(el);
    }

    // In Coffee, this would be something along the lines of…
    // `new ImgixTag(el) for el in allImgAndSourceTags`
  },
  config: {
    host: null,
    useHttps: true
  }
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./ImgixTag.js":1}],3:[function(require,module,exports){
var util = require('./util.js');

var MAXIMUM_SCREEN_WIDTH = 2560 * 2;
var SCREEN_STEP = 100;

// Screen data from http://mydevice.io/devices/

// Phones
var IPHONE = { cssWidth: 320, dpr: 1 };
var IPHONE_4 = { cssWidth: 320, dpr: 2 };
var IPHONE_6 = { cssWidth: 375, dpr: 2 };
var LG_G3 = { cssWidth: 360, dpr: 4 };

// Phablets
var IPHONE_6_PLUS = { cssWidth: 414, dpr: 3 };
var IPHONE_6_PLUS_LANDSCAPE = { cssWidth: 736, dpr: 3 };
var MOTO_NEXUS_6 = { cssWidth: 412, dpr: 3.5 };
var MOTO_NEXUS_6_LANDSCAPE = { cssWidth: 690, dpr: 3.5 };
var LUMIA_1520 = { cssWidth: 432, dpr: 2.5 };
var LUMIA_1520_LANDSCAPE = { cssWidth: 768, dpr: 2.5 };
var GALAXY_NOTE_3 = { cssWidth: 360, dpr: 3 };
var GALAXY_NOTE_3_LANDSCAPE = { cssWidth: 640, dpr: 3 };
var GALAXY_NOTE_4 = { cssWidth: 360, dpr: 4 };
var GALAXY_NOTE_4_LANDSCAPE = { cssWidth: 640, dpr: 4 };

// Tablets
var IPAD = { cssWidth: 768, dpr: 1 };
var IPAD_LANDSCAPE = { cssWidth: 1024, dpr: 1 };
var IPAD_3 = { cssWidth: 768, dpr: 2 };
var IPAD_3_LANDSCAPE = { cssWidth: 1024, dpr: 2 };
var IPAD_PRO = { cssWidth: 1024, dpr: 2 };
var IPAD_PRO_LANDSCAPE = { cssWidth: 1366, dpr: 2 };

// Bootstrap breapoints
var BOOTSTRAP_SM = { cssWidth: 576, dpr: 1 };
var BOOTSTRAP_SM_2X = { cssWidth: 576, dpr: 2 };
var BOOTSTRAP_MD = { cssWidth: 720, dpr: 1 };
var BOOTSTRAP_MD_2X = { cssWidth: 720, dpr: 2 };
var BOOTSTRAP_LG = { cssWidth: 940, dpr: 1 };
var BOOTSTRAP_LG_2X = { cssWidth: 940, dpr: 2 };
var BOOTSTRAP_XL = { cssWidth: 1140, dpr: 1 };
var BOOTSTRAP_XL_2X = { cssWidth: 1140, dpr: 2 };

var PHONES = [IPHONE, IPHONE_4, IPHONE_6, LG_G3];

var TABLETS = [
  IPAD,
  IPAD_LANDSCAPE,
  IPAD_3,
  IPAD_3_LANDSCAPE,
  IPAD_PRO,
  IPAD_PRO_LANDSCAPE
];

var PHABLETS = [
  IPHONE_6_PLUS,
  IPHONE_6_PLUS_LANDSCAPE,
  MOTO_NEXUS_6,
  MOTO_NEXUS_6_LANDSCAPE,
  LUMIA_1520,
  LUMIA_1520_LANDSCAPE,
  GALAXY_NOTE_3,
  GALAXY_NOTE_3_LANDSCAPE,
  GALAXY_NOTE_4,
  GALAXY_NOTE_4_LANDSCAPE
];

var BOOTSTRAP_BREAKS = [
  BOOTSTRAP_SM,
  BOOTSTRAP_SM_2X,
  BOOTSTRAP_MD,
  BOOTSTRAP_MD_2X,
  BOOTSTRAP_LG,
  BOOTSTRAP_LG_2X,
  BOOTSTRAP_XL,
  BOOTSTRAP_XL_2X
];

function devices() {
  return PHONES.concat(PHABLETS, TABLETS, BOOTSTRAP_BREAKS);
}

function deviceWidths() {
  var device, i, len;
  var ref = devices();
  var widths = [];

  for (i = 0, len = ref.length; i < len; i++) {
    device = ref[i];
    widths.push(device.cssWidth * device.dpr);
  }

  return widths;
}

// Generates an array of physical screen widths to represent
// the different potential viewport sizes.
//
// We step by `SCREEN_STEP` to give some sanity to the amount
// of widths we output.
//
// The upper bound is the widest known screen on the planet.
// @return {Array} An array of {Fixnum} instances
function screenWidths() {
  var widths = [];

  for (var i = SCREEN_STEP; i < MAXIMUM_SCREEN_WIDTH; i += SCREEN_STEP) {
    widths.push(i);
  }
  widths.push(MAXIMUM_SCREEN_WIDTH);

  return widths;
}

// Return the widths to generate given the input `sizes`
// attribute.
//
// @return {Array} An array of {Fixnum} instances representing the unique `srcset` URLs to generate.
function targetWidths() {
  var allWidths = deviceWidths().concat(screenWidths()),
      selectedWidths = [],
      dpr = window.devicePixelRatio || 1,
      maxPossibleWidth = Math.max(window.screen.availWidth, window.screen.availHeight),
      minScreenWidthRequired = SCREEN_STEP,
      maxScreenWidthRequired = typeof window === 'undefined' ?
        Infinity :
        maxPossibleWidth * dpr;

  var width, i;
  for (i = 0; i < allWidths.length; i++) {
    width = allWidths[i];

    if (width <= maxScreenWidthRequired && width >= minScreenWidthRequired) {
      selectedWidths.push(width);
    }
  }

  selectedWidths.push(maxScreenWidthRequired);

  return util.uniq(selectedWidths).sort(function(x, y) {
    return x - y;
  });
}

module.exports = targetWidths();

},{"./util.js":4}],4:[function(require,module,exports){
module.exports = {
  compact: function(arr) {
    var compactedArr = [];

    for (var i = 0; i < arr.length; i++) {
      arr[i] && compactedArr.push(arr[i]);
    }

    return compactedArr;
  },
  clone: function(obj) {
    return JSON.parse(JSON.stringify(obj));
  },
  uniq: function(arr) {
    var n = {},
        r = [],
        i;

    for (i = 0; i < arr.length; i++) {
      if (!n[arr[i]]) {
        n[arr[i]] = true;
        r.push(arr[i]);
      }
    }

    return r;
  },
  encode64: function(str) {
    var encodedUtf8Str = unescape(encodeURIComponent(str)),
        b64Str = btoa(encodedUtf8Str);
        urlSafeB64Str = b64Str.replace(/\+/g, '-');

    urlSafeB64Str = urlSafeB64Str.replace(/\//g, '_')
      .replace(/\//g, '_').replace(/\=+$/, '');

    return urlSafeB64Str;
  },
  decode64: function(urlSafeB64Str) {
    var b64Str = urlSafeB64Str.replace(/-/g, '+').replace(/_/g, '/'),
        encodedUtf8Str = atob(b64Str),
        str = decodeURIComponent(escape(encodedUtf8Str));

    return str;
  }
}

},{}]},{},[2]);
