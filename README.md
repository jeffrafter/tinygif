# Tinygif

Fast and efficient animated gif creator in EcmaScript.

This code is based on @sole's https://github.com/sole/Animated_GIF. It adds a few optimizations:

* Optimized for reading from a canvas (requires a single worker)
* Starting processing while still recording frames
* Leverage global palette where possible
* Try to use a 256 color palette before Quantizing
* Attempt to skip duplicate frames
* Render/write only the changed portion (delta) of each frame

In general this makes processing much faster and significantly reduces the size of the generated files.

# How it works

Tinygif records 5 seconds of a canvas and generates a Gif. There are 3 phases:

* **Capturing** - every 20 ms a new frame is captured from the canvas (note 20ms is the default delay for 50 frames per second which is the default FPS)
* **Processing** - each captured frame is processed to determine the optimal palette for the frame and what changed per frame. This happens in a web worker and starts immediately in the background once frames are captured
* **Rendering** - when capturing and processing are complete a final Gif is rendered from the processed frames. It is returned as a `Blob`

# How to use it

```
let canvas = document.getElementById("demo-canvas")

let start = Date.now()

const progress = (recorder, count) => {
  console.log((Date.now() - start) + 'ms elapsed; Frames: ' + count)
}

const record = async () => {
  start = Date.now()
  let tg = new Tinygif({}, progress) // you may need new Tinygif.default(...)
  let blob = await tg.record(canvas)
  let img = document.createElement("img")
  img.src = URL.createObjectURL(blob)
  document.body.appendChild(img)
  // Note there is usually a delay between the end of capturing
  // frames (which fire progress events) and completing the processing
  // of frames and the rendering of the movie
  console.log((Date.now() - start) + 'ms elapsed; Done')
}

// Record for five seconds, the default
record()
```

## Todo

* In the case of Neural Quantization the generated palette is complex and unlikely to be reusable. Additionally it is usually 256 colors (we sample the maximum we can). Because of this we don't even attempt to re-use the global palette per frame to save time. This is a good trade-off and almost always right - but we could go further. Once the palette is full (because it is based on the quantizer or just completely full of colors) nothing further will change the preamble/header. At that point gif rendering (the step after frame processing) could begin immediately. Not only would this save time but rendered frames could be completely discarded and this would reduce the total amount of memory used while generating. For longer gifs this would be a dramatic saving. Additionally, reduced memory could prevent swapping and increase speed.
* I've experimented with removing the worker code and just processing directly; this prevented a lot of buffer copying and stringifying and generally sped things up but frame-lag became a real issue for complex canvas animations. I would love to simplify the interface and make workers optional.
* When capturing is not in sync (it takes longer to capture a frame than the interval) the code does not adjust well. Some options:
    - Use `setTimeout` instead of `setInterval` and correct for drift
    - Adjust the delay of the generated frame so account for the lag (this is difficult because frame delays are in hundredths of seconds making them not precise enough)
    - Skip frames (this looks very choppy)
    - If you don't capture enough frames and you don't adjust the delays then you end up with an animation that plays faster than the recorded time and looks "sped up". This is the trade-off we are accepting for now.
* Upgrade more code to ES2017
* https://developer.mozilla.org/en-US/docs/Web/API/Transferable, https://developers.google.com/web/updates/2011/12/Transferable-Objects-Lightning-Fast

## Dev

Run a dev server: `yarn start`

Build continuously: `yarn build:watch`

Change the version in `package.json` and `npm publish`

## Credits

We based it on:

* https://github.com/sole/Animated_GIF

We're using these fantastic libraries to do GIF stuff:

* Anthony Dekker's [NeuQuant](http://members.ozemail.com.au/~dekker/NEUQUANT.HTML) image quantization algorithm which was ported from C into Java by Kevin Weiner and then to [ActionScript 3](http://www.bytearray.org/?p=93) by Thibault Imbert, and to [JavaScript](http://antimatter15.com/wp/2010/07/javascript-to-animated-gif/) by antimatter15, and fixed, patched and revised by [sole](http://soledadpenades.com).
* Dean McNamee's [omggif](https://github.com/deanm/omggif) library - for actually encoding into GIF89

Thanks to:

* [@mikekavouras](https://github.com/mikekavouras)
* [@probablycorey](https://github.com/probablycorey)

[npm-image]: https://img.shields.io/npm/v/tinygif.svg
[npm-url]: https://npmjs.org/package/tinygif
