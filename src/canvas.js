import Tinygif from "./tinygif"

window.onload = function() {
  var recordingStatus = document.getElementById("recording_status");
  var processingStatus = document.getElementById("processing_status");
  var recordButton = document.getElementById("record");
  var snapshotButton = document.getElementById("snapshot");
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
    context.fillStyle = "white";
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
        draw(v);
      },false);
      v.play()
      v.volume = 0
      v.crossOrigin = "Anonymous"
      v.setAttribute("style", "display:none")
      document.body.appendChild(v)
    }

    var bunny = createVideo("https://tiny-packages.s3.amazonaws.com/dist/big-buck-bunny_trailer.webm")
  }
  video()
  //simple()

  let start = Date.now()

  const progress = (recorder, count) => {
    recordingStatus.innerHTML = ((Date.now() - start) + 'ms elapsed; Frames: ' + count)
  }

  const record = async (count) => {
    start = Date.now()
    let tg = new Tinygif({frames: count}, progress)
    let blob = await tg.record(canvas)
    let img = document.createElement("img")
    img.src = URL.createObjectURL(blob)
    document.body.appendChild(img)
    processingStatus.innerHTML = ((Date.now() - start) + 'ms elapsed; Done')
  }


  recordButton.onclick = () => { record() }
  snapshotButton.onclick = () => { record(1) }
};
