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

  capture(recorder, canvas, count, start, last) {
    let elapsed = Date.now() - start
    let duration = Date.now() - last
    let expected = elapsed / (1000 / this.options.fps)
    let tick = 1000 / this.options.fps
    let lag = expected - count
    let skip = false
    let delay = (tick * 2) - duration

    console.log({elapsed: elapsed, count: count, expected: expected, dur: duration, delay: delay})

    if (!skip) {
      recorder.capture(canvas)
    }
    if (count >= this.options.fps * this.options.seconds) {
      this.done = Date.now()
      console.log("Done capturing")
      recorder.stop()
      return
    }
    var d = Date.now()
    setTimeout(() => this.capture(recorder, canvas, count + 1, start, d), delay)
  }

  async record(canvas) {
    return new Promise((resolve, reject) => {
      this.done = null;

      let complete = (blob) => {
         console.log("Complete " + (Date.now() - this.done))
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
      this.capture(recorder, canvas, 0, Date.now(), Date.now())
    })
  }
}
