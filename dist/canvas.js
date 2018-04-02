window.onload = function() {
  var recordingStatus = document.getElementById("recording_status");
  var renderingStatus = document.getElementById("rendering_status");
  var completeStatus = document.getElementById("complete_status");
  var recordButton = document.getElementById("record");
  var snapshotButton = document.getElementById("snapshot");

  var stop = false

  var findCanvas = function() {
    var sampleCanvas = document.getElementById("sample_canvas");
    return sampleCanvas.querySelector("canvas")
  }

  var createCanvas = function() {
    var sampleCanvas = document.getElementById("sample_canvas");
    var canvas = document.createElement("canvas")
    canvas.width = 300
    canvas.height = 300
    sampleCanvas.appendChild(canvas)
    return canvas
  }

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
      var canvas = createCanvas()
      var context = canvas.getContext("2d")
      context.fillStyle = "black";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "purple";
      context.fillRect(pos.x, pos.y, 20, 20);
      if (!stop) requestAnimationFrame(animate);
    }
    animate()
  }

  var complex = function() {
    var squares = [];
    for (var i = 0; i < 30; i++) {
      squares.push({
        x: (Math.random() * canvas.width) | 0,
        y: (Math.random() * canvas.width) | 0,
        speed: ((Math.random() * 4) | 0) + 1
      })
    }
    var img = new Image()
    img.crossOrigin = "Anonymous"
    img.src = "https://tiny-packages.s3.amazonaws.com/dist/555561.jpg"
    var canvas = createCanvas()
    var context = canvas.getContext("2d")

    var animate = function() {
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      context.fillStyle = "white"
      for (var i = 0; i < squares.length; i++) {
        var square = squares[i]
        square.x += square.speed;
        square.y += square.speed;
        if (square.x > 300 || square.x < 0) {
           square.speed = -square.speed;
        }
        context.fillRect(square.x, square.y, 20, 20);
      }
      if (!stop) requestAnimationFrame(animate);
    }
    animate()
  }

  var corey = function() {
    let startedAt = Date.now()
    var canvas = createCanvas()
    var context = canvas.getContext("2d")

    var animate = () => {
      let elapsedTime = (Date.now() - startedAt) / 1000
      context.fillStyle = 'red'
      context.fillRect(0, 0, 300, 300)

      context.fillStyle = 'black'
      context.fillText(elapsedTime, 10, 10)
      u(elapsedTime)
      requestAnimationFrame(animate)
    }

    function u(t){
      let i = 22
      let lastCenter = {x: 150, y: 150}
      let lastRadius = 0
      context.lineWidth=2
      while(i--) {
        context.beginPath()

        let angle = (t * i * 2) / 5
        // if (i % 2 === 0) angle = -angle
        let newRadius = i * 10
        let edgeX = lastCenter.x + Math.sin(angle) * lastRadius
        let edgeY = lastCenter.y + Math.cos(angle) * lastRadius

        let x
        let y
        if (lastRadius) {
          x = lastCenter.x = edgeX - Math.sin(angle) * newRadius
          y = lastCenter.y = edgeY - Math.cos(angle) * newRadius
        } else {
          x = lastCenter.x
          y = lastCenter.y
        }
        let radius = lastRadius = newRadius
        let startAngle = 0
        let endAngle = Math.PI * 2
        if (i % 2 == 0) {
          context.fillStyle = `rgb(${i * 10}, ${Math.round(Math.cos(t) * 255)}, 255)`
        } else {
          context.fillStyle = 'black'
        }
        context.arc(x, y, radius, startAngle, endAngle)
        context.fill()
        context.stroke()
      }

    }

    animate()
  }

  // A video animation
  var video = function() {
    var canvas = createCanvas()
    var context = canvas.getContext("2d")
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);

    var draw = function(v) {
      if (v.paused || v.ended) return false;
      context.beginPath();
      context.drawImage(v,32,32,236,154);
      if (!stop) requestAnimationFrame(() => draw(v))
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

  var phaser = function() {
    var config = {
      type: Phaser.CANVAS,
      parent: 'sample_canvas',
      width: 500,
      height: 300,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 200 }
        }
      },
      scene: {
        preload: phaserPreload,
        create: phaserCreate
      }
    };

    var game = new Phaser.Game(config);

    function phaserPreload()
    {
      this.load.setBaseURL('https://labs.phaser.io');

      this.load.image('sky', 'assets/skies/space3.png');
      this.load.image('logo', 'assets/sprites/phaser3-logo.png');
      this.load.image('red', 'assets/particles/red.png');
    }

    function phaserCreate () {
      this.add.image(300, 300, 'sky');

      var particles = this.add.particles('red');

      var emitter = particles.createEmitter({
        speed: 100,
        scale: { start: 1, end: 0 },
        blendMode: 'ADD'
      });

      var logo = this.physics.add.image(400, 100, 'logo');

      logo.setVelocity(100, 200);
      logo.setBounce(1, 1);
      logo.setCollideWorldBounds(true);

      emitter.startFollow(logo);
    }
  }

  // video()
  // simple()
  // complex()
  // corey()
  phaser()

  let start = Date.now()

  const recordingProgress = (count) => {
    recordingStatus.innerHTML = ((Date.now() - start) + 'ms elapsed; Frames: ' + count)
    // if (count > 50) stop = true
  }

  const renderingProgress = (index, count, frame) => {
    renderingStatus.innerHTML = ((Date.now() - start) + 'ms elapsed; Frames: ' + index + '/' + count)
  }

  const record = async (count) => {
    stop = false
    start = Date.now()
    let tg = new Tinygif.default({
      fps: 30,
      frames: count,
      recordingProgress: recordingProgress,
      renderingProgress: renderingProgress,
    })
    let canvas = findCanvas()
    let blob = await tg.record(canvas)
    let img = document.createElement("img")
    img.src = URL.createObjectURL(blob)
    document.body.appendChild(img)
    completeStatus.innerHTML = ((Date.now() - start) + 'ms elapsed; Done')
  }


  recordButton.onclick = () => { record() }
  snapshotButton.onclick = () => { record(1) }
  setTimeout(() => { record() }, 3000)
};
