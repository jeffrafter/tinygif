/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__encoder__ = __webpack_require__(1);


let encoder

self.onmessage = function(message) {
  let data = message.data
  if (data.render) {
    let gif = encoder ? encoder.render() : null
    let array = new Uint8Array(gif)
    let blob = new Blob([array], {type: 'image/gif'})
    console.log(JSON.stringify(encoder.timing))
    postMessage({blob: blob})
    close()
    return
  }
  encoder = encoder || new __WEBPACK_IMPORTED_MODULE_0__encoder__["a" /* default */]({
    width: data.width,
    height: data.height,
    sample: data.sample,
    loop: data.loop
  })
  let frame = data.frame
  encoder.encode(frame)
  postMessage({})
}


/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__NeuQuant__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__NeuQuant___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__NeuQuant__);


const GifWriter = __webpack_require__(3).GifWriter

class Encoder {
  constructor(options) {
    this.width = options.width
    this.height = options.height
    this.sample = options.sample
    this.loop = options.loop
    this.colors = null
    this.palette = null
    this.quantizer = null
    this.previous = null
    this.encoded = 0
    this.rendered = null
  }

  componentizedPaletteToArray(paletteRGB) {
    let paletteArray = []

    for (let i = 0; i < paletteRGB.length; i += 3) {
      let r = paletteRGB[i]
      let g = paletteRGB[i + 1]
      let b = paletteRGB[i + 2]
      paletteArray.push(r << 16 | g << 8 | b)
    }

    return paletteArray
  }

  dirtyRect(previousData, imageData) {
    return this.time("dirty", () => {
      let result = {
        x: 0,
        y: 0,
        width: this.width,
        height: this.height
      }

      if (!previousData) {
        return result
      }

      let left = -1, right = -1, top = -1, bottom = -1

      for (let i = 0, l = previousData.length; i < l; i++) {
        if (previousData[i] !== imageData[i]) {
          top = Math.floor(i / (this.width * 4))
          break
        }
      }

      // There is no delta, all pixels match
      if (top == -1) {
        return null
      }

      for (let i = previousData.length - 1; i > -1; i--) {
        if (previousData[i] !== imageData[i]) {
          bottom = Math.floor(i / (this.width * 4))
          break
        }
      }

      for (let x = 0, l = (this.width * 4); x < l; x += 4) {
        for (let y = 0; y < this.height; y++) {
          let pos = (y * (this.width * 4)) + x
          if (previousData[pos] !== imageData[pos] ||
            previousData[pos + 1] !== imageData[pos + 1] ||
            previousData[pos + 2] !== imageData[pos + 2] ||
            previousData[pos + 3] !== imageData[pos + 3]) {
            left = x / 4
            break
          }
        }
        if (left > -1) break
      }

      for (let x = ((this.width - 1) * 4); x > -1; x -= 4) {
        for (let y = 0; y < this.height; y++) {
          let pos = (y * (this.width * 4)) + x
          if (previousData[pos] !== imageData[pos] ||
            previousData[pos + 1] !== imageData[pos + 1] ||
            previousData[pos + 2] !== imageData[pos + 2] ||
            previousData[pos + 3] !== imageData[pos + 3]) {
            right = x / 4
            break
          }
        }
        if (right > -1) break
      }

      return {
        x: left,
        y: top,
        width: (right - left) + 1,
        height: (bottom - top) + 1
      }
    })
  }

  encode(frame) {
    let processed = this.process(frame)

    // If nothing has changed between frames, lets just skip this frame
    if (processed.skip) {
      this.previous.delay += frame.delay
      delete(frame.data)
    } else {
      frame.pixels = processed.pixels
      frame.palette = processed.palette
      frame.colors = processed.colors
      frame.x = processed.delta.x
      frame.y = processed.delta.y
      frame.width = processed.delta.width
      frame.height = processed.delta.height

      // Try to save the palette as the global palette if there is none
      if (!this.palette) {
        this.palette = frame.palette
        this.colors = frame.colors
      }

      // We've accounted for the skips and can render the previous frame
      if (this.previous) {
        this.write(this.previous)
        delete(this.previous.data)
      }

      this.previous = frame
    }
    this.encoded += 1
  }

  process(frame) {
    return this.time("process", () => {
      let t0
      let data = frame.data
      let deltaImageData
      let delta

      // Find the delta
      if (!this.previous) {
        delta = {x: 0, y: 0, width: this.width, height: this.height }
        deltaImageData = data
        this.rendered = deltaImageData
      } else {
        delta = this.dirtyRect(this.previous.data, data)
        // A null result means nothing changed, the frame is the same
        if (!delta) {
          return {
            skip: true
          }
        }

        // Grab only the changed portion and work with that
        deltaImageData = new Uint8ClampedArray(delta.width * delta.height * 4)
        let deltaIndex = 0
        t0 = performance.now()
        for (let y = delta.y, l = delta.y + delta.height; y < l; y++) {
          let start = (y * this.width * 4) + (delta.x * 4)
          let end = (y * this.width * 4) + (delta.x * 4) + (delta.width * 4)
          for (let i = start; i < end; i += 4) {
            let r = data[i]
            let g = data[i + 1]
            let b = data[i + 2]
            // If the color is already the same, make it transparent,
            // otherwise update it to the new color
            if (this.rendered[i] === r &&
                this.rendered[i + 1] === g &&
                this.rendered[i + 2] === b) {
              // ignore alpha, make it transparent
              deltaImageData[deltaIndex++] = r
              deltaImageData[deltaIndex++] = g
              deltaImageData[deltaIndex++] = b
              deltaImageData[deltaIndex++] = 0
            } else {
              // Pixel has changed, overwrite it
              this.rendered[i] = r
              this.rendered[i + 1] = g
              this.rendered[i + 2] = b
              this.rendered[i + 3] = 1
              deltaImageData[deltaIndex++] = r
              deltaImageData[deltaIndex++] = g
              deltaImageData[deltaIndex++] = b
              deltaImageData[deltaIndex++] = 1
            }
          }
        }
        this.report("deltaImageData", t0)
      }

      // Prepare an index array into the palette
      let numberPixels = delta.width * delta.height
      let indexedPixels = new Uint8Array(numberPixels)
      let pixel = 0

      // If we can use the global palette directly let's do it... even if we have
      // to add a couple more colors, if we used a quantized palette before we
      // assume we have a more complex image animating and just go down that road
      if (this.palette && !this.quantizer) {
        t0 = performance.now()
        let globalPaletteMatches = true
        let globalPaletteAdded = false
        for (let i = 0, l = deltaImageData.length; i < l; i+=4){
          let r = deltaImageData[i]
          let g = deltaImageData[i + 1]
          let b = deltaImageData[i + 2]
          // Ignore alpha, make it solid
          let color = (r << 16 | g << 8 | b)
          let foundIndex = this.colors[color]
          // If we didn't find it on the global palette, is there room to add it?
          if (foundIndex == null && this.palette.length >= 256) {
            globalPaletteMatches = false
            break
          }
          if (foundIndex == null) {
            this.palette.push(color)
            foundIndex = this.palette.length - 1
            this.colors[color] = foundIndex
          }
          indexedPixels[pixel++] = foundIndex
        }
        this.report("check_global_palette", t0)

        if (globalPaletteMatches) {
          return {
            delta: delta,
            pixels: indexedPixels,
          }
        }
      }

      // We couldn't use the global palette, try to create a local palette instead
      // Grabbing the unique colors and just using them is way more efficient, but
      // it doesn't work for images > 256 colors; we'll be optimisitic about it
      // We start the palette with a single color 0 which is for transparency. This
      // reduces our total color space by 1 but is optimal for potential transparency
      // savings which we won't know a priori, but are betting on.
      let colorsArray = [0]
      let colorsHash = {}
      pixel = 0
      t0 = performance.now()
      for (let i = 0, l = deltaImageData.length; i < l; i += 4) {
        let r = deltaImageData[i]
        let g = deltaImageData[i + 1]
        let b = deltaImageData[i + 2]
        let a = deltaImageData[i + 3]
        if (a === 0) {
          indexedPixels[pixel++] = 0 // transparent
        } else {
          // Ignore the alpha channel, make it solid
          let color = (r << 16 | g << 8 | b)
          let foundIndex = colorsHash[color]
          if (foundIndex == null) {
            colorsArray.push(color)
            foundIndex = colorsArray.length - 1
            // If there are already too many colors, just bail on this approach
            if (foundIndex >= 256) break
            colorsHash[color] = foundIndex
          }
          indexedPixels[pixel++] = foundIndex
        }
      }
      // this.report("local", t0)

      if (colorsArray.length <= 256) {
        return {
          delta: delta,
          pixels: indexedPixels,
          palette: colorsArray,
          colors: colorsHash
        }
      }

      // This is the "traditional" animated gif style of going from RGBA to
      // indexed color frames via sampling
      t0 = performance.now()
      let nq = new __WEBPACK_IMPORTED_MODULE_0__NeuQuant___default.a(deltaImageData, deltaImageData.length, this.sample)
      let paletteRGB = nq.process()
      this.report("neuquant", t0)

      t0 = performance.now()
      let paletteArray = this.componentizedPaletteToArray(paletteRGB)
      paletteArray.splice(0, 0, 0) // insert a transparent index
      let k = 0
      colorsHash = {}
      for (let i = 0; i < numberPixels; i++) {
        let r = deltaImageData[k++]
        let g = deltaImageData[k++]
        let b = deltaImageData[k++]
        let a = deltaImageData[k++]
        if (a === 0) {
          indexedPixels[i] = 0
        } else {
          let color = (r << 16 | g << 8 | b)
          let foundIndex = colorsHash[color]
          if (foundIndex == null) {
            foundIndex = nq.map(r, g, b) + 1
            colorsHash[color] = foundIndex
          }
          indexedPixels[i] = foundIndex
        }
      }
      this.report("mapping", t0)

      this.quantizer = true

      return {
        delta: delta,
        pixels: indexedPixels,
        palette: paletteArray
      }
    })
  }

  write(frame) {
    return this.time("write", () => {
      // If we haven't started the gif lets do it now
      if (!this.gif) {
        this.buffer = []
        // We default to an empty 2 color palette which we replace later
        let options = {loop: this.loop, palette: [0, 0]}
        this.gif = new GifWriter(this.buffer, this.width, this.height, options)
      }

      if (frame.palette) {
        this.ensurePalettePowerOfTwo(frame.palette)
      }

      this.gif.addFrame(frame.x, frame.y, frame.width, frame.height, frame.pixels, {
        num_colors: (frame.palette || this.palette).length,
        palette: frame.palette, // might be null if using global
        delay: frame.delay,
        transparent: 0,
        disposal: 1
      })

      // Let go of memory fast
      if (frame.palette) delete(frame.palette)
      if (frame.pixels) delete(frame.pixels)
    })
  }

  render() {
    return this.time("render", () => {
      // Write the final frame if pending
      if (this.previous) {
        this.write(this.previous)
        delete(this.previous.data)
        this.previous = null
      }
      this.frames = []
      this.gif.end()

      // Insert the palette now
      this.ensurePalettePowerOfTwo(this.palette)

      // Adjust the packed field
      let gp_num_colors_pow2 = 0
      let gp_num_colors = this.palette.length
      while (gp_num_colors >>= 1) ++gp_num_colors_pow2
      gp_num_colors = 1 << gp_num_colors_pow2
      --gp_num_colors_pow2;
      let packedField = 0x80 | gp_num_colors_pow2
      this.buffer[10] = packedField

      // Build Global Color Table
      let colorTable = []
      let p = 0
      for (var i = 0, il = this.palette.length; i < il; ++i) {
        var rgb = this.palette[i];
        colorTable[p++] = rgb >> 16 & 0xff;
        colorTable[p++] = rgb >> 8 & 0xff;
        colorTable[p++] = rgb & 0xff;
      }

      // Insert the global palette into the array
      let tail = this.buffer.splice(19, this.buffer.length)
      this.buffer.splice(13, 19)
      this.buffer = this.buffer.concat(colorTable)
      this.buffer = this.buffer.concat(tail)

      return this.buffer
    })
  }

  ensurePalettePowerOfTwo(palette) {
    // GIF89a palettes must be lenghts that are 2..256 and a power of 2
    let next = Math.pow(2, Math.ceil(Math.log(palette.length)/Math.log(2)))
    if (next < 2) next = 2
    while (palette.length < next) {
      palette.push(0)
    }
  }

  time(key, func) {
    this.timing = this.timing || {}
    let t0 = performance.now()
    let result = func()
    this.timing[key] = this.timing[key] || 0
    this.timing[key] += performance.now() - t0
    return result
  }

  report(key, t0) {
    this.timing = this.timing || {}
    this.timing[key] = this.timing[key] || 0
    this.timing[key] += performance.now() - t0
  }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = Encoder;



/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/*
* NeuQuant Neural-Net Quantization Algorithm
* ------------------------------------------
*
* Copyright (c) 1994 Anthony Dekker
*
* NEUQUANT Neural-Net quantization algorithm by Anthony Dekker, 1994. See
* "Kohonen neural networks for optimal colour quantization" in "Network:
* Computation in Neural Systems" Vol. 5 (1994) pp 351-367. for a discussion of
* the algorithm.
*
* Any party obtaining a copy of these files from the author, directly or
* indirectly, is granted, free of charge, a full and unrestricted irrevocable,
* world-wide, paid up, royalty-free, nonexclusive right and license to deal in
* this software and documentation files (the "Software"), including without
* limitation the rights to use, copy, modify, merge, publish, distribute,
* sublicense, and/or sell copies of the Software, and to permit persons who
* receive copies from any such party to do so, with the only requirement being
* that this copyright notice remain intact.
*/

/*
* This class handles Neural-Net quantization algorithm
* @author Kevin Weiner (original Java version - kweiner@fmsware.com)
* @author Thibault Imbert (AS3 version - bytearray.org)
* @version 0.1 AS3 implementation
* @version 0.2 JS->AS3 "translation" by antimatter15
* @version 0.3 JS clean up + using modern JS idioms by sole - http://soledadpenades.com
* Also implement fix in color conversion described at http://stackoverflow.com/questions/16371712/neuquant-js-javascript-color-quantization-hidden-bug-in-js-conversion
*/

module.exports = function NeuQuant() {

    var pixSize = 4; // expect rgba
    var netsize = 255; // number of colours used

    // four primes near 500 - assume no image has a length so large
    // that it is divisible by all four primes
    var prime1 = 499;
    var prime2 = 491;
    var prime3 = 487;
    var prime4 = 503;

    // minimum size for input image
    var minpicturebytes = pixSize * prime4;

    // Network Definitions

    var maxnetpos = netsize - 1;
    var netbiasshift = 4; // bias for colour values
    var ncycles = 100; // no. of learning cycles

    // defs for freq and bias
    var intbiasshift = 16; // bias for fractions
    var intbias = 1 << intbiasshift;
    var gammashift = 10; // gamma = 1024
    var gamma = 1 << gammashift;
    var betashift = 10;
    var beta = intbias >> betashift; // beta = 1/1024
    var betagamma = intbias << gammashift - betashift;

    // defs for decreasing radius factor
    // For 256 colors, radius starts at 32.0 biased by 6 bits
    // and decreases by a factor of 1/30 each cycle
    var initrad = netsize >> 3;
    var radiusbiasshift = 6;
    var radiusbias = 1 << radiusbiasshift;
    var initradius = initrad * radiusbias;
    var radiusdec = 30;

    // defs for decreasing alpha factor
    // Alpha starts at 1.0 biased by 10 bits
    var alphabiasshift = 10;
    var initalpha = 1 << alphabiasshift;
    var alphadec;

    // radbias and alpharadbias used for radpower calculation
    var radbiasshift = 8;
    var radbias = 1 << radbiasshift;
    var alpharadbshift = alphabiasshift + radbiasshift;
    var alpharadbias = 1 << alpharadbshift;

    // Input image
    var thepicture;
    // Height * Width * pixSize
    var lengthcount;
    // Sampling factor 1..30
    var samplefac;

    // The network itself
    var network;
    var netindex = [];

    // for network lookup - really netsize max 256
    var bias = [];

    // bias and freq arrays for learning
    var freq = [];
    var radpower = [];

    function NeuQuantConstructor(thepic, len, sample) {

        var i;
        var p;

        thepicture = thepic;
        lengthcount = len;
        samplefac = sample;

        network = new Array(netsize);

        for (i = 0; i < netsize; i++) {
            network[i] = new Array(4);
            p = network[i];
            p[0] = p[1] = p[2] = (i << netbiasshift + 8) / netsize | 0;
            freq[i] = intbias / netsize | 0; // 1 / netsize
            bias[i] = 0;
        }
    }

    function colorMap() {
        var map = [];
        var index = new Array(netsize);
        for (var i = 0; i < netsize; i++) {
            index[network[i][3]] = i;
        }var k = 0;
        for (var l = 0; l < netsize; l++) {
            var j = index[l];
            map[k++] = network[j][0];
            map[k++] = network[j][1];
            map[k++] = network[j][2];
        }
        return map;
    }

    // Insertion sort of network and building of netindex[0..255]
    // (to do after unbias)
    function inxbuild() {
        var i;
        var j;
        var smallpos;
        var smallval;
        var p;
        var q;
        var previouscol;
        var startpos;

        previouscol = 0;
        startpos = 0;

        for (i = 0; i < netsize; i++) {

            p = network[i];
            smallpos = i;
            smallval = p[1]; // index on g
            // find smallest in i..netsize-1
            for (j = i + 1; j < netsize; j++) {

                q = network[j];

                if (q[1] < smallval) {
                    // index on g
                    smallpos = j;
                    smallval = q[1]; // index on g
                }
            }

            q = network[smallpos];

            // swap p (i) and q (smallpos) entries
            if (i != smallpos) {
                j = q[0];
                q[0] = p[0];
                p[0] = j;
                j = q[1];
                q[1] = p[1];
                p[1] = j;
                j = q[2];
                q[2] = p[2];
                p[2] = j;
                j = q[3];
                q[3] = p[3];
                p[3] = j;
            }

            // smallval entry is now in position i
            if (smallval != previouscol) {

                netindex[previouscol] = startpos + i >> 1;

                for (j = previouscol + 1; j < smallval; j++) {
                    netindex[j] = i;
                }

                previouscol = smallval;
                startpos = i;
            }
        }

        netindex[previouscol] = startpos + maxnetpos >> 1;
        for (j = previouscol + 1; j < 256; j++) {
            netindex[j] = maxnetpos; // really netsize - 1 or 254
        }
    }

    // Main Learning Loop

    function learn() {
        var i;
        var j;
        var b;
        var g;
        var r;
        var radius;
        var rad;
        var alpha;
        var step;
        var delta;
        var samplepixels;
        var p;
        var pix;
        var lim;

        if (lengthcount < minpicturebytes) {
            samplefac = 1;
        }

        alphadec = 30 + (samplefac - 1) / pixSize;
        p = thepicture;
        pix = 0;
        lim = lengthcount;
        samplepixels = lengthcount / (pixSize * samplefac);
        delta = samplepixels / ncycles | 0;
        alpha = initalpha;
        radius = initradius;

        rad = radius >> radiusbiasshift;
        if (rad <= 1) {
            rad = 0;
        }

        for (i = 0; i < rad; i++) {
            radpower[i] = alpha * ((rad * rad - i * i) * radbias / (rad * rad));
        }

        if (lengthcount < minpicturebytes) {
            step = pixSize;
        } else if (lengthcount % prime1 !== 0) {
            step = pixSize * prime1;
        } else {

            if (lengthcount % prime2 !== 0) {
                step = pixSize * prime2;
            } else {
                if (lengthcount % prime3 !== 0) {
                    step = pixSize * prime3;
                } else {
                    step = pixSize * prime4;
                }
            }
        }

        i = 0;

        while (i < samplepixels) {

            b = (p[pix + 0] & 0xff) << netbiasshift;
            g = (p[pix + 1] & 0xff) << netbiasshift;
            r = (p[pix + 2] & 0xff) << netbiasshift;
            j = contest(b, g, r);

            altersingle(alpha, j, b, g, r);

            if (rad !== 0) {
                // Alter neighbours
                alterneigh(rad, j, b, g, r);
            }

            pix += step;

            if (pix >= lim) {
                pix -= lengthcount;
            }

            i++;

            if (delta === 0) {
                delta = 1;
            }

            if (i % delta === 0) {
                alpha -= alpha / alphadec;
                radius -= radius / radiusdec;
                rad = radius >> radiusbiasshift;

                if (rad <= 1) {
                    rad = 0;
                }

                for (j = 0; j < rad; j++) {
                    radpower[j] = alpha * ((rad * rad - j * j) * radbias / (rad * rad));
                }
            }
        }
    }

    // Search for BGR values 0..255 (after net is unbiased) and return colour index
    function map(b, g, r) {
        var i;
        var j;
        var dist;
        var a;
        var bestd;
        var p;
        var best;

        // Biggest possible distance is netsize * pixSize
        bestd = 1024;
        best = -1;
        i = netindex[g]; // index on g
        j = i - 1; // start at netindex[g] and work outwards

        while (i < netsize || j >= 0) {

            if (i < netsize) {

                p = network[i];

                dist = p[1] - g; // inx key

                if (dist >= bestd) {
                    i = netsize; // stop iter
                } else {

                    i++;

                    if (dist < 0) {
                        dist = -dist;
                    }

                    a = p[0] - b;

                    if (a < 0) {
                        a = -a;
                    }

                    dist += a;

                    if (dist < bestd) {
                        a = p[2] - r;

                        if (a < 0) {
                            a = -a;
                        }

                        dist += a;

                        if (dist < bestd) {
                            bestd = dist;
                            best = p[3];
                        }
                    }
                }
            }

            if (j >= 0) {

                p = network[j];

                dist = g - p[1]; // inx key - reverse dif

                if (dist >= bestd) {
                    j = -1; // stop iter
                } else {

                    j--;
                    if (dist < 0) {
                        dist = -dist;
                    }
                    a = p[0] - b;
                    if (a < 0) {
                        a = -a;
                    }
                    dist += a;

                    if (dist < bestd) {
                        a = p[2] - r;
                        if (a < 0) {
                            a = -a;
                        }
                        dist += a;
                        if (dist < bestd) {
                            bestd = dist;
                            best = p[3];
                        }
                    }
                }
            }
        }

        return best;
    }

    function process() {
        learn();
        unbiasnet();
        inxbuild();
        return colorMap();
    }

    // Unbias network to give byte values 0..255 and record position i
    // to prepare for sort
    function unbiasnet() {
        var i;
        var j;

        for (i = 0; i < netsize; i++) {
            network[i][0] >>= netbiasshift;
            network[i][1] >>= netbiasshift;
            network[i][2] >>= netbiasshift;
            network[i][3] = i; // record colour no
        }
    }

    // Move adjacent neurons by precomputed alpha*(1-((i-j)^2/[r]^2))
    // in radpower[|i-j|]
    function alterneigh(rad, i, b, g, r) {

        var j;
        var k;
        var lo;
        var hi;
        var a;
        var m;

        var p;

        lo = i - rad;
        if (lo < -1) {
            lo = -1;
        }

        hi = i + rad;

        if (hi > netsize) {
            hi = netsize;
        }

        j = i + 1;
        k = i - 1;
        m = 1;

        while (j < hi || k > lo) {

            a = radpower[m++];

            if (j < hi) {

                p = network[j++];

                try {

                    p[0] -= a * (p[0] - b) / alpharadbias | 0;
                    p[1] -= a * (p[1] - g) / alpharadbias | 0;
                    p[2] -= a * (p[2] - r) / alpharadbias | 0;
                } catch (e) {}
            }

            if (k > lo) {

                p = network[k--];

                try {

                    p[0] -= a * (p[0] - b) / alpharadbias | 0;
                    p[1] -= a * (p[1] - g) / alpharadbias | 0;
                    p[2] -= a * (p[2] - r) / alpharadbias | 0;
                } catch (e) {}
            }
        }
    }

    // Move neuron i towards biased (b,g,r) by factor alpha
    function altersingle(alpha, i, b, g, r) {

        // alter hit neuron
        var n = network[i];
        var alphaMult = alpha / initalpha;
        n[0] -= alphaMult * (n[0] - b) | 0;
        n[1] -= alphaMult * (n[1] - g) | 0;
        n[2] -= alphaMult * (n[2] - r) | 0;
    }

    // Search for biased BGR values
    function contest(b, g, r) {

        // finds closest neuron (min dist) and updates freq
        // finds best neuron (min dist-bias) and returns position
        // for frequently chosen neurons, freq[i] is high and bias[i] is negative
        // bias[i] = gamma*((1/netsize)-freq[i])

        var i;
        var dist;
        var a;
        var biasdist;
        var betafreq;
        var bestpos;
        var bestbiaspos;
        var bestd;
        var bestbiasd;
        var n;

        bestd = ~(1 << 31);
        bestbiasd = bestd;
        bestpos = -1;
        bestbiaspos = bestpos;

        for (i = 0; i < netsize; i++) {

            n = network[i];
            dist = n[0] - b;

            if (dist < 0) {
                dist = -dist;
            }

            a = n[1] - g;

            if (a < 0) {
                a = -a;
            }

            dist += a;

            a = n[2] - r;

            if (a < 0) {
                a = -a;
            }

            dist += a;

            if (dist < bestd) {
                bestd = dist;
                bestpos = i;
            }

            biasdist = dist - (bias[i] >> intbiasshift - netbiasshift);

            if (biasdist < bestbiasd) {
                bestbiasd = biasdist;
                bestbiaspos = i;
            }

            betafreq = freq[i] >> betashift;
            freq[i] -= betafreq;
            bias[i] += betafreq << gammashift;
        }

        freq[bestpos] += beta;
        bias[bestpos] -= betagamma;
        return bestbiaspos;
    }

    NeuQuantConstructor.apply(this, arguments);

    var exports = {};
    exports.map = map;
    exports.process = process;

    return exports;
};

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// (c) Dean McNamee <dean@gmail.com>, 2013.
//
// https://github.com/deanm/omggif
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.
//
// omggif is a JavaScript implementation of a GIF 89a encoder and decoder,
// including animation and compression.  It does not rely on any specific
// underlying system, so should run in the browser, Node, or Plask.

function GifWriter(buf, width, height, gopts) {
  var p = 0;

  var gopts = gopts === undefined ? {} : gopts;
  var loop_count = gopts.loop === undefined ? null : gopts.loop;
  var global_palette = gopts.palette === undefined ? null : gopts.palette;

  if (width <= 0 || height <= 0 || width > 65535 || height > 65535) throw "Width/Height invalid.";

  function check_palette_and_num_colors(palette) {
    var num_colors = palette.length;
    if (num_colors < 2 || num_colors > 256 || num_colors & num_colors - 1) throw "Invalid code/color length, must be power of 2 and 2 .. 256.";
    return num_colors;
  }

  // - Header.
  buf[p++] = 0x47;buf[p++] = 0x49;buf[p++] = 0x46; // GIF
  buf[p++] = 0x38;buf[p++] = 0x39;buf[p++] = 0x61; // 89a

  // Handling of Global Color Table (palette) and background index.
  var gp_num_colors_pow2 = 0;
  var background = 0;
  if (global_palette !== null) {
    var gp_num_colors = check_palette_and_num_colors(global_palette);
    while (gp_num_colors >>= 1) {
      ++gp_num_colors_pow2;
    }gp_num_colors = 1 << gp_num_colors_pow2;
    --gp_num_colors_pow2;
    if (gopts.background !== undefined) {
      background = gopts.background;
      if (background >= gp_num_colors) throw "Background index out of range.";
      // The GIF spec states that a background index of 0 should be ignored, so
      // this is probably a mistake and you really want to set it to another
      // slot in the palette.  But actually in the end most browsers, etc end
      // up ignoring this almost completely (including for dispose background).
      if (background === 0) throw "Background index explicitly passed as 0.";
    }
  }

  // - Logical Screen Descriptor.
  // NOTE(deanm): w/h apparently ignored by implementations, but set anyway.
  buf[p++] = width & 0xff;buf[p++] = width >> 8 & 0xff;
  buf[p++] = height & 0xff;buf[p++] = height >> 8 & 0xff;
  // NOTE: Indicates 0-bpp original color resolution (unused?).
  buf[p++] = (global_palette !== null ? 0x80 : 0) | // Global Color Table Flag.
  gp_num_colors_pow2; // NOTE: No sort flag (unused?).
  buf[p++] = background; // Background Color Index.
  buf[p++] = 0; // Pixel aspect ratio (unused?).

  // - Global Color Table
  if (global_palette !== null) {
    for (var i = 0, il = global_palette.length; i < il; ++i) {
      var rgb = global_palette[i];
      buf[p++] = rgb >> 16 & 0xff;
      buf[p++] = rgb >> 8 & 0xff;
      buf[p++] = rgb & 0xff;
    }
  }

  if (loop_count !== null) {
    // Netscape block for looping.
    if (loop_count < 0 || loop_count > 65535) throw "Loop count invalid.";
    // Extension code, label, and length.
    buf[p++] = 0x21;buf[p++] = 0xff;buf[p++] = 0x0b;
    // NETSCAPE2.0
    buf[p++] = 0x4e;buf[p++] = 0x45;buf[p++] = 0x54;buf[p++] = 0x53;
    buf[p++] = 0x43;buf[p++] = 0x41;buf[p++] = 0x50;buf[p++] = 0x45;
    buf[p++] = 0x32;buf[p++] = 0x2e;buf[p++] = 0x30;
    // Sub-block
    buf[p++] = 0x03;buf[p++] = 0x01;
    buf[p++] = loop_count & 0xff;buf[p++] = loop_count >> 8 & 0xff;
    buf[p++] = 0x00; // Terminator.
  }

  var ended = false;

  this.addFrame = function (x, y, w, h, indexed_pixels, opts) {
    if (ended === true) {
      --p;ended = false;
    } // Un-end.

    opts = opts === undefined ? {} : opts;

    // TODO(deanm): Bounds check x, y.  Do they need to be within the virtual
    // canvas width/height, I imagine?
    if (x < 0 || y < 0 || x > 65535 || y > 65535) throw "x/y invalid.";

    if (w <= 0 || h <= 0 || w > 65535 || h > 65535) throw "Width/Height invalid.";

    if (indexed_pixels.length < w * h) throw "Not enough pixels for the frame size.";

    var using_local_palette = true;
    var palette = opts.palette;
    if (palette === undefined || palette === null) {
      using_local_palette = false;
      palette = global_palette;
    }

    if (palette === undefined || palette === null) throw "Must supply either a local or global palette.";

    var num_colors = opts.num_colors || check_palette_and_num_colors(palette);

    // Compute the min_code_size (power of 2), destroying num_colors.
    var min_code_size = 0;
    while (num_colors >>= 1) {
      ++min_code_size;
    }num_colors = 1 << min_code_size; // Now we can easily get it back.

    var delay = opts.delay === undefined ? 0 : opts.delay;

    // From the spec:
    //     0 -   No disposal specified. The decoder is
    //           not required to take any action.
    //     1 -   Do not dispose. The graphic is to be left
    //           in place.
    //     2 -   Restore to background color. The area used by the
    //           graphic must be restored to the background color.
    //     3 -   Restore to previous. The decoder is required to
    //           restore the area overwritten by the graphic with
    //           what was there prior to rendering the graphic.
    //  4-7 -    To be defined.
    // NOTE(deanm): Dispose background doesn't really work, apparently most
    // browsers ignore the background palette index and clear to transparency.
    var disposal = opts.disposal === undefined ? 0 : opts.disposal;
    if (disposal < 0 || disposal > 3) // 4-7 is reserved.
      throw "Disposal out of range.";

    var use_transparency = false;
    var transparent_index = 0;
    if (opts.transparent !== undefined && opts.transparent !== null) {
      use_transparency = true;
      transparent_index = opts.transparent;
      if (transparent_index < 0 || transparent_index >= num_colors) throw "Transparent color index.";
    }

    if (disposal !== 0 || use_transparency || delay !== 0) {
      // - Graphics Control Extension
      buf[p++] = 0x21;buf[p++] = 0xf9; // Extension / Label.
      buf[p++] = 4; // Byte size.

      buf[p++] = disposal << 2 | (use_transparency === true ? 1 : 0);
      buf[p++] = delay & 0xff;buf[p++] = delay >> 8 & 0xff;
      buf[p++] = transparent_index; // Transparent color index.
      buf[p++] = 0; // Block Terminator.
    }

    // - Image Descriptor
    buf[p++] = 0x2c; // Image Seperator.
    buf[p++] = x & 0xff;buf[p++] = x >> 8 & 0xff; // Left.
    buf[p++] = y & 0xff;buf[p++] = y >> 8 & 0xff; // Top.
    buf[p++] = w & 0xff;buf[p++] = w >> 8 & 0xff;
    buf[p++] = h & 0xff;buf[p++] = h >> 8 & 0xff;
    // NOTE: No sort flag (unused?).
    // TODO(deanm): Support interlace.
    buf[p++] = using_local_palette === true ? 0x80 | min_code_size - 1 : 0;

    // - Local Color Table
    if (using_local_palette === true) {
      for (var i = 0, il = palette.length; i < il; ++i) {
        var rgb = palette[i];
        buf[p++] = rgb >> 16 & 0xff;
        buf[p++] = rgb >> 8 & 0xff;
        buf[p++] = rgb & 0xff;
      }
    }

    p = GifWriterOutputLZWCodeStream(buf, p, min_code_size < 2 ? 2 : min_code_size, indexed_pixels);
  };

  this.end = function () {
    if (ended === false) {
      buf[p++] = 0x3b; // Trailer.
      ended = true;
    }
    return p;
  };
}

// Main compression routine, palette indexes -> LZW code stream.
// |index_stream| must have at least one entry.
function GifWriterOutputLZWCodeStream(buf, p, min_code_size, index_stream) {
  buf[p++] = min_code_size;
  var cur_subblock = p++; // Pointing at the length field.

  var clear_code = 1 << min_code_size;
  var code_mask = clear_code - 1;
  var eoi_code = clear_code + 1;
  var next_code = eoi_code + 1;

  var cur_code_size = min_code_size + 1; // Number of bits per code.
  var cur_shift = 0;
  // We have at most 12-bit codes, so we should have to hold a max of 19
  // bits here (and then we would write out).
  var cur = 0;

  function emit_bytes_to_buffer(bit_block_size) {
    while (cur_shift >= bit_block_size) {
      buf[p++] = cur & 0xff;
      cur >>= 8;cur_shift -= 8;
      if (p === cur_subblock + 256) {
        // Finished a subblock.
        buf[cur_subblock] = 255;
        cur_subblock = p++;
      }
    }
  }

  function emit_code(c) {
    cur |= c << cur_shift;
    cur_shift += cur_code_size;
    emit_bytes_to_buffer(8);
  }

  // I am not an expert on the topic, and I don't want to write a thesis.
  // However, it is good to outline here the basic algorithm and the few data
  // structures and optimizations here that make this implementation fast.
  // The basic idea behind LZW is to build a table of previously seen runs
  // addressed by a short id (herein called output code).  All data is
  // referenced by a code, which represents one or more values from the
  // original input stream.  All input bytes can be referenced as the same
  // value as an output code.  So if you didn't want any compression, you
  // could more or less just output the original bytes as codes (there are
  // some details to this, but it is the idea).  In order to achieve
  // compression, values greater then the input range (codes can be up to
  // 12-bit while input only 8-bit) represent a sequence of previously seen
  // inputs.  The decompressor is able to build the same mapping while
  // decoding, so there is always a shared common knowledge between the
  // encoding and decoder, which is also important for "timing" aspects like
  // how to handle variable bit width code encoding.
  //
  // One obvious but very important consequence of the table system is there
  // is always a unique id (at most 12-bits) to map the runs.  'A' might be
  // 4, then 'AA' might be 10, 'AAA' 11, 'AAAA' 12, etc.  This relationship
  // can be used for an effecient lookup strategy for the code mapping.  We
  // need to know if a run has been seen before, and be able to map that run
  // to the output code.  Since we start with known unique ids (input bytes),
  // and then from those build more unique ids (table entries), we can
  // continue this chain (almost like a linked list) to always have small
  // integer values that represent the current byte chains in the encoder.
  // This means instead of tracking the input bytes (AAAABCD) to know our
  // current state, we can track the table entry for AAAABC (it is guaranteed
  // to exist by the nature of the algorithm) and the next character D.
  // Therefor the tuple of (table_entry, byte) is guaranteed to also be
  // unique.  This allows us to create a simple lookup key for mapping input
  // sequences to codes (table indices) without having to store or search
  // any of the code sequences.  So if 'AAAA' has a table entry of 12, the
  // tuple of ('AAAA', K) for any input byte K will be unique, and can be our
  // key.  This leads to a integer value at most 20-bits, which can always
  // fit in an SMI value and be used as a fast sparse array / object key.

  // Output code for the current contents of the index buffer.
  var ib_code = index_stream[0] & code_mask; // Load first input index.
  var code_table = {}; // Key'd on our 20-bit "tuple".

  emit_code(clear_code); // Spec says first code should be a clear code.

  // First index already loaded, process the rest of the stream.
  for (var i = 1, il = index_stream.length; i < il; ++i) {
    var k = index_stream[i] & code_mask;
    var cur_key = ib_code << 8 | k; // (prev, k) unique tuple.
    var cur_code = code_table[cur_key]; // buffer + k.

    // Check if we have to create a new code table entry.
    if (cur_code === undefined) {
      // We don't have buffer + k.
      // Emit index buffer (without k).
      // This is an inline version of emit_code, because this is the core
      // writing routine of the compressor (and V8 cannot inline emit_code
      // because it is a closure here in a different context).  Additionally
      // we can call emit_byte_to_buffer less often, because we can have
      // 30-bits (from our 31-bit signed SMI), and we know our codes will only
      // be 12-bits, so can safely have 18-bits there without overflow.
      // emit_code(ib_code);
      cur |= ib_code << cur_shift;
      cur_shift += cur_code_size;
      while (cur_shift >= 8) {
        buf[p++] = cur & 0xff;
        cur >>= 8;cur_shift -= 8;
        if (p === cur_subblock + 256) {
          // Finished a subblock.
          buf[cur_subblock] = 255;
          cur_subblock = p++;
        }
      }

      if (next_code === 4096) {
        // Table full, need a clear.
        emit_code(clear_code);
        next_code = eoi_code + 1;
        cur_code_size = min_code_size + 1;
        code_table = {};
      } else {
        // Table not full, insert a new entry.
        // Increase our variable bit code sizes if necessary.  This is a bit
        // tricky as it is based on "timing" between the encoding and
        // decoder.  From the encoders perspective this should happen after
        // we've already emitted the index buffer and are about to create the
        // first table entry that would overflow our current code bit size.
        if (next_code >= 1 << cur_code_size) ++cur_code_size;
        code_table[cur_key] = next_code++; // Insert into code table.
      }

      ib_code = k; // Index buffer to single input k.
    } else {
      ib_code = cur_code; // Index buffer to sequence in code table.
    }
  }

  emit_code(ib_code); // There will still be something in the index buffer.
  emit_code(eoi_code); // End Of Information.

  // Flush / finalize the sub-blocks stream to the buffer.
  emit_bytes_to_buffer(1);

  // Finish the sub-blocks, writing out any unfinished lengths and
  // terminating with a sub-block of length 0.  If we have already started
  // but not yet used a sub-block it can just become the terminator.
  if (cur_subblock + 1 === p) {
    // Started but unused.
    buf[cur_subblock] = 0;
  } else {
    // Started and used, write length and additional terminator block.
    buf[cur_subblock] = p - cur_subblock - 1;
    buf[p++] = 0;
  }
  return p;
}

function GifReader(buf) {
  var p = 0;

  // - Header (GIF87a or GIF89a).
  if (buf[p++] !== 0x47 || buf[p++] !== 0x49 || buf[p++] !== 0x46 || buf[p++] !== 0x38 || (buf[p++] + 1 & 0xfd) !== 0x38 || buf[p++] !== 0x61) {
    throw "Invalid GIF 87a/89a header.";
  }

  // - Logical Screen Descriptor.
  var width = buf[p++] | buf[p++] << 8;
  var height = buf[p++] | buf[p++] << 8;
  var pf0 = buf[p++]; // <Packed Fields>.
  var global_palette_flag = pf0 >> 7;
  var num_global_colors_pow2 = pf0 & 0x7;
  var num_global_colors = 1 << num_global_colors_pow2 + 1;
  var background = buf[p++];
  buf[p++]; // Pixel aspect ratio (unused?).

  var global_palette_offset = null;

  if (global_palette_flag) {
    global_palette_offset = p;
    p += num_global_colors * 3; // Seek past palette.
  }

  var no_eof = true;

  var frames = [];

  var delay = 0;
  var transparent_index = null;
  var disposal = 0; // 0 - No disposal specified.
  var loop_count = null;

  this.width = width;
  this.height = height;

  while (no_eof && p < buf.length) {
    switch (buf[p++]) {
      case 0x21:
        // Graphics Control Extension Block
        switch (buf[p++]) {
          case 0xff:
            // Application specific block
            // Try if it's a Netscape block (with animation loop counter).
            if (buf[p] !== 0x0b || // 21 FF already read, check block size.
            // NETSCAPE2.0
            buf[p + 1] == 0x4e && buf[p + 2] == 0x45 && buf[p + 3] == 0x54 && buf[p + 4] == 0x53 && buf[p + 5] == 0x43 && buf[p + 6] == 0x41 && buf[p + 7] == 0x50 && buf[p + 8] == 0x45 && buf[p + 9] == 0x32 && buf[p + 10] == 0x2e && buf[p + 11] == 0x30 &&
            // Sub-block
            buf[p + 12] == 0x03 && buf[p + 13] == 0x01 && buf[p + 16] == 0) {
              p += 14;
              loop_count = buf[p++] | buf[p++] << 8;
              p++; // Skip terminator.
            } else {
              // We don't know what it is, just try to get past it.
              p += 12;
              while (true) {
                // Seek through subblocks.
                var block_size = buf[p++];
                if (block_size === 0) break;
                p += block_size;
              }
            }
            break;

          case 0xf9:
            // Graphics Control Extension
            if (buf[p++] !== 0x4 || buf[p + 4] !== 0) throw "Invalid graphics extension block.";
            var pf1 = buf[p++];
            delay = buf[p++] | buf[p++] << 8;
            transparent_index = buf[p++];
            if ((pf1 & 1) === 0) transparent_index = null;
            disposal = pf1 >> 2 & 0x7;
            p++; // Skip terminator.
            break;

          case 0xfe:
            // Comment Extension.
            while (true) {
              // Seek through subblocks.
              var block_size = buf[p++];
              if (block_size === 0) break;
              // console.log(buf.slice(p, p+block_size).toString('ascii'));
              p += block_size;
            }
            break;

          default:
            throw "Unknown graphic control label: 0x" + buf[p - 1].toString(16);
        }
        break;

      case 0x2c:
        // Image Descriptor.
        var x = buf[p++] | buf[p++] << 8;
        var y = buf[p++] | buf[p++] << 8;
        var w = buf[p++] | buf[p++] << 8;
        var h = buf[p++] | buf[p++] << 8;
        var pf2 = buf[p++];
        var local_palette_flag = pf2 >> 7;
        var interlace_flag = pf2 >> 6 & 1;
        var num_local_colors_pow2 = pf2 & 0x7;
        var num_local_colors = 1 << num_local_colors_pow2 + 1;
        var palette_offset = global_palette_offset;
        var has_local_palette = false;
        if (local_palette_flag) {
          var has_local_palette = true;
          palette_offset = p; // Override with local palette.
          p += num_local_colors * 3; // Seek past palette.
        }

        var data_offset = p;

        p++; // codesize
        while (true) {
          var block_size = buf[p++];
          if (block_size === 0) break;
          p += block_size;
        }

        frames.push({ x: x, y: y, width: w, height: h,
          has_local_palette: has_local_palette,
          palette_offset: palette_offset,
          data_offset: data_offset,
          data_length: p - data_offset,
          transparent_index: transparent_index,
          interlaced: !!interlace_flag,
          delay: delay,
          disposal: disposal });
        break;

      case 0x3b:
        // Trailer Marker (end of file).
        no_eof = false;
        break;

      default:
        throw "Unknown gif block: 0x" + buf[p - 1].toString(16);
        break;
    }
  }

  this.numFrames = function () {
    return frames.length;
  };

  this.loopCount = function () {
    return loop_count;
  };

  this.frameInfo = function (frame_num) {
    if (frame_num < 0 || frame_num >= frames.length) throw "Frame index out of range.";
    return frames[frame_num];
  };

  this.decodeAndBlitFrameBGRA = function (frame_num, pixels) {
    var frame = this.frameInfo(frame_num);
    var num_pixels = frame.width * frame.height;
    var index_stream = new Uint8Array(num_pixels); // At most 8-bit indices.
    GifReaderLZWOutputIndexStream(buf, frame.data_offset, index_stream, num_pixels);
    var palette_offset = frame.palette_offset;

    // NOTE(deanm): It seems to be much faster to compare index to 256 than
    // to === null.  Not sure why, but CompareStub_EQ_STRICT shows up high in
    // the profile, not sure if it's related to using a Uint8Array.
    var trans = frame.transparent_index;
    if (trans === null) trans = 256;

    // We are possibly just blitting to a portion of the entire frame.
    // That is a subrect within the framerect, so the additional pixels
    // must be skipped over after we finished a scanline.
    var framewidth = frame.width;
    var framestride = width - framewidth;
    var xleft = framewidth; // Number of subrect pixels left in scanline.

    // Output indicies of the top left and bottom right corners of the subrect.
    var opbeg = (frame.y * width + frame.x) * 4;
    var opend = ((frame.y + frame.height) * width + frame.x) * 4;
    var op = opbeg;

    var scanstride = framestride * 4;

    // Use scanstride to skip past the rows when interlacing.  This is skipping
    // 7 rows for the first two passes, then 3 then 1.
    if (frame.interlaced === true) {
      scanstride += width * 4 * 7; // Pass 1.
    }

    var interlaceskip = 8; // Tracking the row interval in the current pass.

    for (var i = 0, il = index_stream.length; i < il; ++i) {
      var index = index_stream[i];

      if (xleft === 0) {
        // Beginning of new scan line
        op += scanstride;
        xleft = framewidth;
        if (op >= opend) {
          // Catch the wrap to switch passes when interlacing.
          scanstride = framestride * 4 + width * 4 * (interlaceskip - 1);
          // interlaceskip / 2 * 4 is interlaceskip << 1.
          op = opbeg + (framewidth + framestride) * (interlaceskip << 1);
          interlaceskip >>= 1;
        }
      }

      if (index === trans) {
        op += 4;
      } else {
        var r = buf[palette_offset + index * 3];
        var g = buf[palette_offset + index * 3 + 1];
        var b = buf[palette_offset + index * 3 + 2];
        pixels[op++] = b;
        pixels[op++] = g;
        pixels[op++] = r;
        pixels[op++] = 255;
      }
      --xleft;
    }
  };

  // I will go to copy and paste hell one day...
  this.decodeAndBlitFrameRGBA = function (frame_num, pixels) {
    var frame = this.frameInfo(frame_num);
    var num_pixels = frame.width * frame.height;
    var index_stream = new Uint8Array(num_pixels); // At most 8-bit indices.
    GifReaderLZWOutputIndexStream(buf, frame.data_offset, index_stream, num_pixels);
    var palette_offset = frame.palette_offset;

    // NOTE(deanm): It seems to be much faster to compare index to 256 than
    // to === null.  Not sure why, but CompareStub_EQ_STRICT shows up high in
    // the profile, not sure if it's related to using a Uint8Array.
    var trans = frame.transparent_index;
    if (trans === null) trans = 256;

    // We are possibly just blitting to a portion of the entire frame.
    // That is a subrect within the framerect, so the additional pixels
    // must be skipped over after we finished a scanline.
    var framewidth = frame.width;
    var framestride = width - framewidth;
    var xleft = framewidth; // Number of subrect pixels left in scanline.

    // Output indicies of the top left and bottom right corners of the subrect.
    var opbeg = (frame.y * width + frame.x) * 4;
    var opend = ((frame.y + frame.height) * width + frame.x) * 4;
    var op = opbeg;

    var scanstride = framestride * 4;

    // Use scanstride to skip past the rows when interlacing.  This is skipping
    // 7 rows for the first two passes, then 3 then 1.
    if (frame.interlaced === true) {
      scanstride += width * 4 * 7; // Pass 1.
    }

    var interlaceskip = 8; // Tracking the row interval in the current pass.

    for (var i = 0, il = index_stream.length; i < il; ++i) {
      var index = index_stream[i];

      if (xleft === 0) {
        // Beginning of new scan line
        op += scanstride;
        xleft = framewidth;
        if (op >= opend) {
          // Catch the wrap to switch passes when interlacing.
          scanstride = framestride * 4 + width * 4 * (interlaceskip - 1);
          // interlaceskip / 2 * 4 is interlaceskip << 1.
          op = opbeg + (framewidth + framestride) * (interlaceskip << 1);
          interlaceskip >>= 1;
        }
      }

      if (index === trans) {
        op += 4;
      } else {
        var r = buf[palette_offset + index * 3];
        var g = buf[palette_offset + index * 3 + 1];
        var b = buf[palette_offset + index * 3 + 2];
        pixels[op++] = r;
        pixels[op++] = g;
        pixels[op++] = b;
        pixels[op++] = 255;
      }
      --xleft;
    }
  };
}

function GifReaderLZWOutputIndexStream(code_stream, p, output, output_length) {
  var min_code_size = code_stream[p++];

  var clear_code = 1 << min_code_size;
  var eoi_code = clear_code + 1;
  var next_code = eoi_code + 1;

  var cur_code_size = min_code_size + 1; // Number of bits per code.
  // NOTE: This shares the same name as the encoder, but has a different
  // meaning here.  Here this masks each code coming from the code stream.
  var code_mask = (1 << cur_code_size) - 1;
  var cur_shift = 0;
  var cur = 0;

  var op = 0; // Output pointer.

  var subblock_size = code_stream[p++];

  // TODO(deanm): Would using a TypedArray be any faster?  At least it would
  // solve the fast mode / backing store uncertainty.
  // var code_table = Array(4096);
  var code_table = new Int32Array(4096); // Can be signed, we only use 20 bits.

  var prev_code = null; // Track code-1.

  while (true) {
    // Read up to two bytes, making sure we always 12-bits for max sized code.
    while (cur_shift < 16) {
      if (subblock_size === 0) break; // No more data to be read.

      cur |= code_stream[p++] << cur_shift;
      cur_shift += 8;

      if (subblock_size === 1) {
        // Never let it get to 0 to hold logic above.
        subblock_size = code_stream[p++]; // Next subblock.
      } else {
        --subblock_size;
      }
    }

    // TODO(deanm): We should never really get here, we should have received
    // and EOI.
    if (cur_shift < cur_code_size) break;

    var code = cur & code_mask;
    cur >>= cur_code_size;
    cur_shift -= cur_code_size;

    // TODO(deanm): Maybe should check that the first code was a clear code,
    // at least this is what you're supposed to do.  But actually our encoder
    // now doesn't emit a clear code first anyway.
    if (code === clear_code) {
      // We don't actually have to clear the table.  This could be a good idea
      // for greater error checking, but we don't really do any anyway.  We
      // will just track it with next_code and overwrite old entries.

      next_code = eoi_code + 1;
      cur_code_size = min_code_size + 1;
      code_mask = (1 << cur_code_size) - 1;

      // Don't update prev_code ?
      prev_code = null;
      continue;
    } else if (code === eoi_code) {
      break;
    }

    // We have a similar situation as the decoder, where we want to store
    // variable length entries (code table entries), but we want to do in a
    // faster manner than an array of arrays.  The code below stores sort of a
    // linked list within the code table, and then "chases" through it to
    // construct the dictionary entries.  When a new entry is created, just the
    // last byte is stored, and the rest (prefix) of the entry is only
    // referenced by its table entry.  Then the code chases through the
    // prefixes until it reaches a single byte code.  We have to chase twice,
    // first to compute the length, and then to actually copy the data to the
    // output (backwards, since we know the length).  The alternative would be
    // storing something in an intermediate stack, but that doesn't make any
    // more sense.  I implemented an approach where it also stored the length
    // in the code table, although it's a bit tricky because you run out of
    // bits (12 + 12 + 8), but I didn't measure much improvements (the table
    // entries are generally not the long).  Even when I created benchmarks for
    // very long table entries the complexity did not seem worth it.
    // The code table stores the prefix entry in 12 bits and then the suffix
    // byte in 8 bits, so each entry is 20 bits.

    var chase_code = code < next_code ? code : prev_code;

    // Chase what we will output, either {CODE} or {CODE-1}.
    var chase_length = 0;
    var chase = chase_code;
    while (chase > clear_code) {
      chase = code_table[chase] >> 8;
      ++chase_length;
    }

    var k = chase;

    var op_end = op + chase_length + (chase_code !== code ? 1 : 0);
    if (op_end > output_length) {
      console.log("Warning, gif stream longer than expected.");
      return;
    }

    // Already have the first byte from the chase, might as well write it fast.
    output[op++] = k;

    op += chase_length;
    var b = op; // Track pointer, writing backwards.

    if (chase_code !== code) // The case of emitting {CODE-1} + k.
      output[op++] = k;

    chase = chase_code;
    while (chase_length--) {
      chase = code_table[chase];
      output[--b] = chase & 0xff; // Write backwards.
      chase >>= 8; // Pull down to the prefix code.
    }

    if (prev_code !== null && next_code < 4096) {
      code_table[next_code++] = prev_code << 8 | k;
      // TODO(deanm): Figure out this clearing vs code growth logic better.  I
      // have an feeling that it should just happen somewhere else, for now it
      // is awkward between when we grow past the max and then hit a clear code.
      // For now just check if we hit the max 12-bits (then a clear code should
      // follow, also of course encoded in 12-bits).
      if (next_code >= code_mask + 1 && cur_code_size < 12) {
        ++cur_code_size;
        code_mask = code_mask << 1 | 1;
      }
    }

    prev_code = code;
  }

  if (op !== output_length) {
    console.log("Warning, gif stream shorter than expected.");
  }

  return output;
}

try {
  exports.GifWriter = GifWriter;exports.GifReader = GifReader;
} catch (e) {} // CommonJS.

/***/ })
/******/ ]);