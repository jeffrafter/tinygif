import Tinygif from "./tinygif"

window.onload = function() {
  var recordingStatus = document.getElementById("recording_status");
  var processingStatus = document.getElementById("processing_status");
  var canvas = document.getElementById("sample_canvas");
  var context = canvas.getContext("2d")

  // A simple animation
  var simple = function() {
    var pos = {x: 0, y: 0};
    var speed = 4;
    var animate = function() {
      pos.x += speed;
      pos.y += speed;
      if (pos.x > 300 || pos.x < 0) {
         speed = -speed;
      }
      context.fillStyle = "black";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "purple";
      context.fillRect(pos.x, pos.y, 20, 20);
      requestAnimationFrame(animate);
    }
    animate()
  }

  // A video animation
  var video = function() {
    context.fillStyle = "red";
    context.fillRect(0, 0, canvas.width, canvas.height);

    var draw = function(v) {
      if (v.paused || v.ended) return false;
      context.beginPath();
      context.drawImage(v,32,32,236,154);
      requestAnimationFrame(() => draw(v))
    }

    var createVideo = function(src) {
      let v = document.createElement('video')
      let s = document.createElement('source')
      s.setAttribute('src', src)
      v.appendChild(s)
      v.addEventListener('play', function(){
        console.log("Playing")
        draw(v);
      },false);
      v.play()
      v.volume = 0
      v.crossOrigin = "Anonymous"
      v.setAttribute("style", "display:none")
      document.body.appendChild(v)
    }

    var bunny = createVideo("https://tiny-packages.s3.amazonaws.com/dist/big-buck-bunny_trailer.webm")
    //http://video.webmfiles.org/big-buck-bunny_trailer.webm
    //https://tiny-packages.s3.amazonaws.com/dist/big-buck-bunny_trailer.webm
    //https://tiny-packages.s3.amazonaws.com/dist/lapse.webm
  }
  video()
  //simple()

  // Getting a gif
  var ag;

  var record = function() {
    ag = new Tinygif({
      loop: 0, // loop 0 = Repeat forever
      delay: 2,
      width: canvas.width,
      height: canvas.height,
      complete: function(blob) {
        console.log(blob.size)
        console.log(window.perf)
        var img = document.createElement("img");
        img.src = URL.createObjectURL(blob);
        document.body.appendChild(img)
        processingStatus.innerHTML = ((Date.now() - done) + 'ms elapsed; Done');
      }
    });

    // TIL Gif has a delay property which if delay==0 it guesses (horribly).
    // You have to set it to a number in hundreds of ms — which is odd and
    // not very precise. I went with 50fps and delay 2 (20 ms)… and it looks
    // amazing… but I’m guessing I’ll need to do more math if I can’t fill
    var seconds = 5;
    var fps = 50;
    var numFrames = fps * seconds;
    var numRenderedFrames = 0;
    var done = null;

    ag.start()
    var captureInterval = setInterval(function() {
      ag.capture(canvas)
      numRenderedFrames++;
      // Call back with an r value indicating how far along we are in capture
      let pendingFrames = numFrames - numRenderedFrames;
      recordingStatus.innerHTML = 'Recording: ' + Math.round(((numFrames - pendingFrames) / numFrames) * 100) + '%';
      if (numRenderedFrames >= numFrames) {
        clearInterval(captureInterval);
        recordingStatus.innerHTML = 'Done';
        done = Date.now()
        ag.stop()
      }
    }, 1000 / fps);
  }

  record();
};
