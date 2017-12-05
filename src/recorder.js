import ProcessorWorker from './processor.worker.js'

// Tinygif
//
// tg.start() - we are ready to record, waiting for frames
// tg.capture(canvas) - grab a frame,
//   - once the frame is captured, kick off processing (and stop waiting)
//   - once the frame is processed
//      - check for pending frames, if any process
//      - if still capturing and no pending frames, start waiting again
//      - if done capturing and no pending frames, we're done
// tg.stop()
//   - stop capturing
//   - check for any pending frames, if none, we're done

export default function Recorder(options) {
  'use strict';

  options = options || {};
  var GifWriter = require('omggif').GifWriter;
  var callback = options.complete || function() {};
  var width = options.width;
  var height = options.height;
  var palette = options.palette || null;
  var quantizer = options.quantizer || null;
  var loop = options.loop || 0; // null == do not loop; 0 == loop forever; N = number of loops
  var delay = options.delay || 2; // in hundredths of seconds, 2 == 50 fps
  var sampleInterval = options.sampleInterval || 10; // smaller == more accurate, larger == faster
  var frames = [];
  var previous = null;
  var processor = new ProcessorWorker();
  var index = 0;
  var waiting = false;
  var capturing = false;
  var done = false;
  var blob = null;
  var last = null;
  var start = null;

  // Get ready to capture, call this before capturing frames
  this.start = function() {
    start = Date.now()
    capturing = true
    waiting = true
  }

  // No more frames will be captured, finish up the work and render
  this.stop = function() {
    capturing = false
    if (index >= frames.length) {
      render()
    }
  }

  // Capture a frame from the canvas
  this.capture = function(canvas, context, frameDelay) {
    if (!capturing) {
      throw "Not capturing"
    }

    frameDelay = frameDelay || delay

    var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    var dataLength = imageData.length,
    imageDataArray = imageData.data;

    // Pre-2013 imageData could be a pixel array, backward-compatabile
    if(typeof imageDataArray === "CanvasPixelArray") {
      imageDataArray = new Uint8Array(imageData.data);
    }

    // Add this frame onto the stack
    frames.push({
      data: imageDataArray,
      x: 0,
      y: 0,
      width: imageData.width,
      height: imageData.height,
      delay: frameDelay,
      sampleInterval: sampleInterval,
      palette: null,
      quantizer: null,
      pixels: null,
      processed: false,
      rendered: false
    });

    if (waiting) {
      waiting = false
      process()
    }
  }

  // Process the palette and index the image data for the next available frame
  function process() {
    var frame = frames[index];

    // Prepare the processor for handling the processed data
    processor.onmessage = function(message) {
      var data = message.data;

      frame.processed = true;
      frame.processing = false;
      frame.skip = data.skip

      // If nothing has changed between frames, lets just skip this frame
      if (frame.skip) {
        previous.delay += frame.delay
      } else {
        frame.pixels = data.pixels
        frame.global = data.global
        frame.palette = data.palette
        frame.quantizer = data.quantizer
        frame.x = data.delta.x
        frame.y = data.delta.y
        frame.width = data.delta.width
        frame.height = data.delta.height

        // Try to save the palette as the global palette if there is none
        if (!palette || frame.global) {
          palette = frame.palette
          quantizer = frame.quantizer
          frame.palette = null
        }

        // If it is the first frame, just use the global palette to save a frame
        if (index == 0) frame.palette = null

        // Delete previous data, and free memory
        if (previous) delete(previous.data)
        previous = frame
      }

      processed();
    }

    processor.postMessage({
      frame: frame,
      previous: previous,
      palette: palette,
      quantizer: quantizer
    });
  }

  // A frame was just processed, check for more work or finish
  function processed() {
    // Move to next frame
    index++

    var hasPendingFrames = index < frames.length

    // Check for pending frames, if any process
    if (hasPendingFrames) {
      setTimeout(process, 1);
      return
    }

    // If still capturing and no pending frames, start waiting again
    if (capturing) {
      waiting = true
      return
    }

    // If done capturing and no pending frames, we're done
    render();
  }

  // Render the processed frames as a gif (all at once)
  function render() {
    var buffer = []; // new Uint8Array(width * height * frames.length * 5);
    var gifOptions = { loop: loop };

    if (palette !== null) {
      ensurePalettePowerOfTwo(palette);
      gifOptions.palette = palette
    }

    var gifWriter = new GifWriter(buffer, width, height, gifOptions);

    frames.forEach(function(frame, index) {
      if (frame.skip) {
        return;
      }
      if (frame.palette) {
        ensurePalettePowerOfTwo(frame.palette);
      }
      gifWriter.addFrame(frame.x, frame.y, frame.width, frame.height, frame.pixels, {
        palette: frame.palette,
        delay: frame.delay
      });
    });

    gifWriter.end();
    // Explicitly ask web workers to die so they are explicitly GC'ed
    processor.terminate()
    var array = new Uint8Array(buffer);
    blob = new Blob([ array ], { type: 'image/gif' });
    frames = [];
    done = true
    callback(blob)
  }

  // GIF89a palettes must be lenghts that are 2..256 and a power of 2
  function ensurePalettePowerOfTwo(palette) {
    var next = Math.pow(2, Math.ceil(Math.log(palette.length)/Math.log(2)));
    if (next < 2) next = 2
    while (palette.length < next) {
      palette.push(0)
    }
  }
}
