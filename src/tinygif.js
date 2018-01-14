import Recorder from './recorder'

export default class Tinygif {
  constructor(options={}) {
    let defaults = {
      prerender: true,
      loop: 0,
      fps: 50,
      seconds: 5,
      frames: null,
      recordingProgress: () => {},
      renderingProgress: () => {},
    }

    this.options = Object.assign({}, defaults, options)
  }

  capture(recorder, canvas, context, count) {
    recorder.capture(canvas, context)
    this.options.recordingProgress(count)
  }

  record(canvas) {
    return new Promise((resolve, reject) => {
      this.done = null;

      let complete = (blob) => {
        resolve(blob)
      }

      let error = (err) => {
        reject(err)
      }

      let tick = 1000 / this.options.fps
      let delay = tick / 10

      let recorder = new Recorder({
        loop: this.options.loop,
        delay: delay | 0,
        width: canvas.width,
        height: canvas.height,
        progress: this.options.renderingProgress,
        complete: complete
      })

      let start = Date.now()
      let count = 0
      let context = canvas.getContext('2d')

      recorder.start()
      this.captureInterval = setInterval(() => {
        let elapsed = Date.now() - start
        try {
          this.capture(recorder, canvas, context, count)
        } catch(err) {
          this.done = Date.now()
          recorder.error(err)
          if (this.captureInterval) clearInterval(this.captureInterval)
          error(err)
          return
        }
        count++
        var maxFrames = this.options.frames
        var maxElapsed = this.options.seconds ? (this.options.seconds * 1000) : null
        if ((maxFrames && (count >= maxFrames)) || (maxElapsed && (elapsed >= maxElapsed))) {
          this.done = Date.now()
          recorder.stop()
          if (this.captureInterval) clearInterval(this.captureInterval)
        }
      }, tick)
    })
  }
}
