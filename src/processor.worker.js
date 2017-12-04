import Processor from './processor'

var processor = new Processor()

function run(data) {
  var frame = data.frame
  var previous = data.previous
  var palette = data.palette
  var quantizer = data.quantizer
  return processor.run(frame, previous, palette, quantizer)
}

self.onmessage = function(message) {
  var data = message.data
  var response = run(data)
  postMessage(response)
}
