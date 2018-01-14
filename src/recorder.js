import EncoderWorker from './encoder.worker.js'

export default class Recorder {
  constructor(options) {
    options = options || {}
    this.complete = options.complete || (() => {})
    this.progress = options.progress || (() => {})
    this.width = options.width
    this.height = options.height
    this.sample = options.sample || 10 // smaller == more accurate, larger == faster
    this.loop = options.loop || 0 // null == do not loop; 0 == loop forever; N = number of loops
    this.delay = options.delay || 2 // in hundredths of seconds, 2 == 50 fps
    this.frames = []
    this.encoded = 0
    this.capturing = false
    this.waiting = false
    this.encoder = new EncoderWorker()
  }

  // Get ready to capture, call this before capturing frames
  start() {
    this.capturing = true
    this.waiting = true
  }

  // No more frames will be captured, finish up the work and render
  stop() {
    this.capturing = false
    // If processing is all caught up... complete the encoding
    if (this.encoded >= this.frames.length) {
      this.render()
    }
  }

  error(error) {
    this.capturing = false
  }

  render() {
    // Fire the callback
    this.encoder.onmessage = (message) => {
      this.frames = []
      this.complete(message.data.blob)
    }
    this.encoder.postMessage({
      render: true
    })
  }

  // Capture a frame from the canvas
  capture(canvas, context, delay) {
    if (!this.capturing) {
      throw "Not capturing"
    }

    delay = delay || this.delay

    let imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    let data = imageData.data

    // Pre-2013 imageData could be a pixel array, backward-compatabile
    if (typeof data === "CanvasPixelArray") {
      data = new Uint8Array(imageData.data)
    }

    // Add this frame onto the stack
    this.frames.push({
      data: data,
      delay: delay
    })

    if (this.waiting) {
      this.waiting = false
      this.encode()
    }
  }

  // Process the palette and index the image data for the next available frame
  encode() {
    let index = this.encoded
    let frame = this.frames[index]

    this.encoder.onmessage = (message) => {
      delete(frame.data)
      this.progress(index, this.frames.length)
      this.encoded += 1

      // Check for pending frames, if any process
      if (this.encoded < this.frames.length) {
        setTimeout(() => { this.encode() }, 0)
        return
      }

      // If still capturing and no pending frames, start waiting again
      if (this.capturing) {
        this.waiting = true
        return
      }

      // Everything is done...
      this.render()
    }

    // TODO: it doesn't make sense to pass width and height around
    this.encoder.postMessage({
      frame: frame,
      width: this.width,
      height: this.height,
      sample: this.sample,
      loop: this.loop
    })
  }
}
