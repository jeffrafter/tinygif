import TinygifRecorder from './recorder'

export default class Tinygif {
  constructor(options={}, callback) {
    let defaults = {
      loop: 0,
      delay: 2,
      fps: 50,
      seconds: 5
    }

    this.options = Object.assign({}, defaults, options)
  }

  capture(recorder, canvas, count, start) {
    let tick = 1000 / this.options.fps
    let elapsed = Date.now() - start
    console.log(elapsed, count)

    recorder.capture(canvas)
    if (count >= this.options.fps * this.options.seconds ||
      elapsed > (this.options.seconds * 1000)) {
      this.done = Date.now()
      recorder.stop()
      return
    }
    setTimeout(() => this.capture(recorder, canvas, count + 1, start), tick)
  }

  async record(canvas) {
    return new Promise((resolve, reject) => {
      this.done = null;

      let complete = (blob) => {
         console.log("Complete " + (Date.now() - this.done), blob.size)
         resolve(blob)
      }

      let recorder = new TinygifRecorder({
        loop: this.options.loop,
        delay: this.options.delay,
        width: canvas.width,
        height: canvas.height,
        complete: complete
      })

      recorder.start()
      this.capture(recorder, canvas, 0, Date.now())
    })
  }
}
