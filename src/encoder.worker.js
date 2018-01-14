import Encoder from './encoder'

let encoder

self.onmessage = function(message) {
  let data = message.data
  if (data.render) {
    let gif = encoder ? encoder.render() : null
    let array = new Uint8Array(gif)
    let blob = new Blob([array], {type: 'image/gif'})
    console.log(encoder.timing)
    postMessage({blob: blob})
    close()
    return
  }
  encoder = encoder || new Encoder({
    width: data.width,
    height: data.height,
    sample: data.sample,
    loop: data.loop
  })
  let frame = data.frame
  encoder.encode(frame)
  postMessage({})
}
