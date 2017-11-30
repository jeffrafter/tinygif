# Tinygif

Fast and efficient animated gif creator in EcmaScript.

This code is based on @sole's https://github.com/sole/Animated_GIF. It adds a few optimizations:

* Optimized for reading from a canvas (requires a single worker)
* Starting processing while still recording frames
* Leverage global palette where possible
* Try to use a 256 color palette before Quantizing
* Attempt to skip duplicate frames
* Render/write only the changed portion (delta) of each frame

In general this makes processing much faster and dramatically reduces the size of the generated files.

# How to use it

```
let canvas = document.getElementById("demo-canvas")

let tg = new Tinygif({
  loop: 0, // loop 0 = Repeat forever
  delay: 2,
  width: canvas.width,
  height: canvas.height,
  complete: function(blob) {
    console.log("Image size: " + blob.size)
    var img = document.createElement("img");
    img.src = URL.createObjectURL(blob);
    document.body.appendChild(img)
  }
});

var seconds = 5; // how many seconds to record
var fps = 50; // how many frames per second
var numFrames = fps * seconds;
var numRenderedFrames = 0;

tg.start()
var captureInterval = setInterval(function() {
  // Capture a frame right now
  tg.capture(canvas)
  numRenderedFrames++;
  if (numRenderedFrames >= numFrames) {
    clearInterval(captureInterval);
    tg.stop() // No more frames; trigger rendering
  }
}, 1000 / fps);
```


## Credits

We based it on:

* https://github.com/sole/Animated_GIF

We're using these fantastic libraries to do GIF stuff:

* Anthony Dekker's [NeuQuant](http://members.ozemail.com.au/~dekker/NEUQUANT.HTML) image quantization algorithm which was ported from C into Java by Kevin Weiner and then to [ActionScript 3](http://www.bytearray.org/?p=93) by Thibault Imbert, and to [JavaScript](http://antimatter15.com/wp/2010/07/javascript-to-animated-gif/) by antimatter15, and fixed, patched and revised by [sole](http://soledadpenades.com).
* Dean McNamee's [omggif](https://github.com/deanm/omggif) library - for actually encoding into GIF89

[npm-image]: https://img.shields.io/npm/v/tinygif.svg
[npm-url]: https://npmjs.org/package/tinygif