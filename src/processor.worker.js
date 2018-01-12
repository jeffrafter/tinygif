import Processor from './processor'

var processor = new Processor()

function run(data) {
  var frame = data.frame
  var previous = data.previous
  var palette = data.palette
  var quantizer = data.quantizer
  return processor.run(frame, previous, palette, quantizer)
}

function debug() {
  console.log(JSON.stringify(processor.timing))
  close()
}

self.onmessage = function(message) {
  var data = message.data
  if (data.debug) {
    debug()
    return
  }
  var response = run(data)
  postMessage(response)
}
