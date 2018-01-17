import NeuQuant from "./NeuQuant"

const GifWriter = require('omggif').GifWriter

export default class Encoder {
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
        frame.palette = null
      }

      // If it is the first frame, just use the global palette to save a frame
      if (this.encoded === 0) frame.palette = null

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
      let previous = this.previous ? this.previous.data : null
      let data = frame.data

      // Find the delta
      let delta = this.dirtyRect(previous, data)
      if (!delta) {
        return {
          skip: true
        }
      }

      // TODO: optimize if everything is changed, just use the incoming data
      // Grab only the changed portion and work with that
      let deltaImageData = new Uint8ClampedArray(delta.width * delta.height * 4)
      let deltaIndex = 0
      let totalPixels = [0, 0]
      for (let y = delta.y, l = delta.y + delta.height; y < l; y++) {
        let start = (y * this.width * 4) + (delta.x * 4)
        let end = (y * this.width * 4) + (delta.x * 4) + (delta.width * 4)
        for (let i = start; i < end; i += 4) {
          let alpha = 1
          if (this.rendered) {
            // If the color is already the same, make it transparent,
            // otherwise update it to the new color
            if (this.rendered[i] === data[i] &&
                this.rendered[i + 1] === data[i + 1] &&
                this.rendered[i + 2] === data[i + 2]) {
              // ignore alpha, make it transparent
              alpha = 0
              totalPixels[0] += 1
            } else {
              this.rendered[i] = data[i]
              this.rendered[i + 1] = data[i + 1]
              this.rendered[i + 2] = data[i + 2]
              this.rendered[i + 3] = 1
              totalPixels[1] += 1
            }
          }
          deltaImageData[deltaIndex++] = data[i]
          deltaImageData[deltaIndex++] = data[i + 1]
          deltaImageData[deltaIndex++] = data[i + 2]
          deltaImageData[deltaIndex++] = alpha
        }
      }
      // console.log("Total pixels: ", totalPixels)

      if (!this.rendered) {
        this.rendered = deltaImageData
      }

      // Prepare an index array into the palette
      let numberPixels = delta.width * delta.height
      let indexedPixels = new Uint8Array(numberPixels)
      let pixel = 0

      // If we can use the global palette directly let's do it... even if we have
      // to add a couple more colors, if we used a quantized palette before we
      // assume we have a more complex image animating and just go down that road
      if (this.palette && !this.quantizer) {
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
      let nq = new NeuQuant(deltaImageData, deltaImageData.length, this.sample || 10)
      let paletteRGB = nq.process()
      let paletteArray = this.componentizedPaletteToArray(paletteRGB)
      paletteArray.splice(0, 0, 0) // insert a transparent
      let k = 0
      for (let i = 0; i < numberPixels; i++) {
        let r = deltaImageData[k++]
        let g = deltaImageData[k++]
        let b = deltaImageData[k++]
        let a = deltaImageData[k++]
        if (a === 0) {
          indexedPixels[i] = 0
        } else {
          indexedPixels[i] = nq.map(r, g, b) + 1
        }
      }

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
}
