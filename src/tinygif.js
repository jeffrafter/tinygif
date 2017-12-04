import Recorder from './recorder'

export default class Tinygif {
  constructor(options={}, callback) {
    let defaults = {
      loop: 0,
      delay: 2,
      fps: 50,
      seconds: 5
    }

    this.options = Object.assign({}, defaults, options)
    this.callback = callback
  }

  capture(recorder, canvas, context, count) {
    recorder.capture(canvas, context)

    // Fire a capture progress callback
    if (this.callback) {
      this.callback(recorder, count)
    }
  }

  async record(canvas) {
    return new Promise((resolve, reject) => {
      this.done = null;

      let complete = (blob) => {
         resolve(blob)
      }

      let recorder = new Recorder({
        loop: this.options.loop,
        delay: this.options.delay,
        width: canvas.width,
        height: canvas.height,
        complete: complete
      })

      let tick = 1000 / this.options.fps
      let start = Date.now()
      let count = 0
      let context = canvas.getContext('2d')

      recorder.start()
      this.captureInterval = setInterval(() => {
        let elapsed = Date.now() - start
        this.capture(recorder, canvas, context, count)
        count++
        if (count >= this.options.fps * this.options.seconds ||
          elapsed >= (this.options.seconds * 1000)) {
          this.done = Date.now()
          recorder.stop()
          clearInterval(this.captureInterval)
        }
      }, tick)
    })
  }
}
