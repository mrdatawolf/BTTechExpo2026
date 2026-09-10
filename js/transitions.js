// Slide-change transitions. playTransition(outgoing, incoming, track, effect)
// animates from one full-page slide to the next and resolves when done.
//
// Effects: 'fade-black', 'tile-flip', 'clock-wipe', 'iris', 'push'.
// script.js picks one at random for each slide change (see EFFECTS there).

(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TILE_COLS = 6;
  var TILE_ROWS = 4;

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function tween(duration, onFrame) {
    return new Promise(function (resolve) {
      var start = null;
      function frame(ts) {
        if (start === null) start = ts;
        var t = Math.min(1, (ts - start) / duration);
        onFrame(t);
        if (t < 1) requestAnimationFrame(frame);
        else resolve();
      }
      requestAnimationFrame(frame);
    });
  }

  function easeInOutQuad(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function resetSlide(el) {
    el.style.zIndex = '';
    el.style.opacity = '';
    el.style.visibility = '';
    el.style.transform = '';
    el.style.transformOrigin = '';
    el.style.backfaceVisibility = '';
    el.style.webkitBackfaceVisibility = '';
    el.style.boxShadow = '';
    el.style.clipPath = '';
    el.style.webkitClipPath = '';
    el.style.maskImage = '';
    el.style.webkitMaskImage = '';
  }

  var PEEL_CORNERS = [
    { origin: '0% 0%', axis: [1, 1] },
    { origin: '100% 0%', axis: [1, -1] },
    { origin: '0% 100%', axis: [-1, 1] },
    { origin: '100% 100%', axis: [-1, -1] }
  ];

  async function peel(outgoing, incoming) {
    outgoing.style.zIndex = 2;
    incoming.style.zIndex = 1;
    var corner = PEEL_CORNERS[Math.floor(Math.random() * PEEL_CORNERS.length)];
    outgoing.style.transformOrigin = corner.origin;
    outgoing.style.backfaceVisibility = 'hidden';
    outgoing.style.webkitBackfaceVisibility = 'hidden';
    await tween(1300, function (t) {
      var p = easeInOutQuad(t);
      var deg = -112 * p;
      outgoing.style.transform = 'perspective(1400px) rotate3d(' + corner.axis[0] + ',' + corner.axis[1] + ',0,' + deg.toFixed(2) + 'deg)';
      outgoing.style.opacity = String(1 - Math.max(0, p - 0.6) / 0.4);
      outgoing.style.boxShadow = '0 0 ' + Math.round(60 * p) + 'px rgba(0,0,0,' + (0.5 * p).toFixed(2) + ')';
    });
  }

  function prep(outgoing, incoming) {
    incoming.style.visibility = 'visible';
    incoming.style.opacity = '1';
  }

  var blackOverlay = null;
  function getBlackOverlay(track) {
    if (!blackOverlay) {
      blackOverlay = document.createElement('div');
      blackOverlay.className = 'transition-black';
      blackOverlay.setAttribute('aria-hidden', 'true');
      track.appendChild(blackOverlay);
    }
    return blackOverlay;
  }

  async function fadeBlack(outgoing, incoming, track) {
    var overlay = getBlackOverlay(track);
    outgoing.style.zIndex = 2;
    incoming.style.zIndex = 1;
    overlay.style.zIndex = 3;
    overlay.style.transition = 'none';
    overlay.style.opacity = '0';
    void overlay.offsetWidth;
    overlay.style.transition = 'opacity 640ms ease';
    overlay.style.opacity = '1';
    await wait(680);
    outgoing.style.opacity = '0';
    overlay.style.opacity = '0';
    await wait(680);
  }

  async function iris(outgoing, incoming) {
    outgoing.style.zIndex = 1;
    incoming.style.zIndex = 2;
    incoming.style.clipPath = 'circle(0% at 50% 50%)';
    incoming.style.webkitClipPath = 'circle(0% at 50% 50%)';
    await tween(1300, function (t) {
      var p = easeInOutQuad(t);
      var val = 'circle(' + (p * 90).toFixed(1) + '% at 50% 50%)';
      incoming.style.clipPath = val;
      incoming.style.webkitClipPath = val;
    });
  }

  async function clockWipe(outgoing, incoming) {
    outgoing.style.zIndex = 1;
    incoming.style.zIndex = 2;
    await tween(1500, function (t) {
      var deg = 360 * easeInOutQuad(t);
      var mask = 'conic-gradient(from 0deg at 50% 50%, #000 ' + deg + 'deg, transparent ' + deg + 'deg 360deg)';
      incoming.style.maskImage = mask;
      incoming.style.webkitMaskImage = mask;
    });
  }

  async function push(outgoing, incoming) {
    var dirs = [['X', 1], ['X', -1], ['Y', 1], ['Y', -1]];
    var d = dirs[Math.floor(Math.random() * dirs.length)];
    outgoing.style.zIndex = 1;
    incoming.style.zIndex = 2;
    incoming.style.transform = 'translate' + d[0] + '(' + (d[1] * 100) + '%)';
    outgoing.style.transform = 'translate' + d[0] + '(0%)';
    void incoming.offsetWidth;
    await tween(1040, function (t) {
      var p = easeInOutQuad(t);
      incoming.style.transform = 'translate' + d[0] + '(' + (d[1] * 100 * (1 - p)).toFixed(2) + '%)';
      outgoing.style.transform = 'translate' + d[0] + '(' + (-d[1] * 100 * p).toFixed(2) + '%)';
    });
  }

  async function matrixFall(outgoing, incoming, track) {
    var rect = track.getBoundingClientRect();
    var WORD = 'BIZTECH';
    var fontSize = 22;
    var cols = Math.max(16, Math.round(rect.width / (fontSize * 1.15)));
    var colWidth = rect.width / cols;

    var canvas = document.createElement('canvas');
    canvas.className = 'matrix-canvas';
    canvas.width = rect.width;
    canvas.height = rect.height;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    track.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#050b0c';
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.font = fontSize + 'px "Courier New", monospace';
    ctx.textAlign = 'center';

    var reveal = document.createElement('div');
    reveal.className = 'matrix-reveal';
    reveal.style.width = rect.width + 'px';
    reveal.style.height = rect.height + 'px';
    track.appendChild(reveal);

    var cloneIn = incoming.cloneNode(true);
    cloneIn.classList.add('is-active');
    cloneIn.removeAttribute('href');
    cloneIn.removeAttribute('tabindex');
    cloneIn.style.position = 'absolute';
    cloneIn.style.left = '0';
    cloneIn.style.top = '0';
    cloneIn.style.width = rect.width + 'px';
    cloneIn.style.height = rect.height + 'px';
    cloneIn.style.pointerEvents = 'none';
    reveal.appendChild(cloneIn);

    outgoing.style.zIndex = 1;

    var colState = [];
    for (var c = 0; c < cols; c++) {
      colState.push({ delay: Math.random() * 900, duration: 2200 + Math.random() * 1600, done: false });
    }

    await new Promise(function (resolve) {
      var startTs = null;
      function frame(ts) {
        if (startTs === null) startTs = ts;
        var elapsed = ts - startTs;
        var allDone = true;

        for (var c = 0; c < cols; c++) {
          var st = colState[c];
          if (st.done) continue;
          allDone = false;

          ctx.fillStyle = 'rgba(5,11,12,0.35)';
          ctx.fillRect(c * colWidth, 0, colWidth + 1, rect.height);

          var t = (elapsed - st.delay) / st.duration;
          if (t < 0) continue;
          if (t > 1) t = 1;

          var x = c * colWidth + colWidth / 2;
          var dropLen = WORD.length;
          var travel = rect.height + dropLen * fontSize;
          var headY = -dropLen * fontSize + t * travel;

          for (var g = 0; g < dropLen; g++) {
            var y = headY - g * fontSize;
            if (y < -fontSize || y > rect.height + fontSize) continue;
            ctx.fillStyle = g === 0 ? '#eafff2' : 'rgba(60,230,140,' + (1 - g / dropLen).toFixed(2) + ')';
            ctx.fillText(WORD.charAt(g), x, y);
          }

          if (t >= 1) {
            st.done = true;
            ctx.clearRect(c * colWidth, 0, colWidth + 1, rect.height);
          }
        }

        if (!allDone) requestAnimationFrame(frame);
        else resolve();
      }
      requestAnimationFrame(frame);
    });

    track.removeChild(canvas);
    track.removeChild(reveal);
  }

  async function tileFlip(outgoing, incoming, track) {
    var rect = track.getBoundingClientRect();
    var tw = rect.width / TILE_COLS;
    var th = rect.height / TILE_ROWS;

    var grid = document.createElement('div');
    grid.className = 'tflip-grid';
    grid.style.width = rect.width + 'px';
    grid.style.height = rect.height + 'px';
    grid.setAttribute('aria-hidden', 'true');
    track.appendChild(grid);

    var cloneOut = outgoing.cloneNode(true);
    var cloneIn = incoming.cloneNode(true);
    [cloneOut, cloneIn].forEach(function (c) {
      c.classList.add('is-active');
      c.removeAttribute('href');
      c.removeAttribute('tabindex');
      c.style.position = 'absolute';
      c.style.inset = '0';
      c.style.zIndex = '';
      c.style.opacity = '1';
      c.style.visibility = 'visible';
      c.style.pointerEvents = 'none';
    });

    var tiles = [];
    for (var r = 0; r < TILE_ROWS; r++) {
      for (var c = 0; c < TILE_COLS; c++) {
        var tile = document.createElement('div');
        tile.className = 'tflip-tile';
        tile.style.left = (c * tw) + 'px';
        tile.style.top = (r * th) + 'px';
        tile.style.width = tw + 'px';
        tile.style.height = th + 'px';

        var inner = document.createElement('div');
        inner.className = 'tflip-inner';

        var front = document.createElement('div');
        front.className = 'tflip-face tflip-front';
        var frontClone = cloneOut.cloneNode(true);
        frontClone.style.left = (-c * tw) + 'px';
        frontClone.style.top = (-r * th) + 'px';
        frontClone.style.width = rect.width + 'px';
        frontClone.style.height = rect.height + 'px';
        front.appendChild(frontClone);

        var back = document.createElement('div');
        back.className = 'tflip-face tflip-back';
        var backClone = cloneIn.cloneNode(true);
        backClone.style.left = (-c * tw) + 'px';
        backClone.style.top = (-r * th) + 'px';
        backClone.style.width = rect.width + 'px';
        backClone.style.height = rect.height + 'px';
        back.appendChild(backClone);

        inner.appendChild(front);
        inner.appendChild(back);
        tile.appendChild(inner);
        grid.appendChild(tile);
        tiles.push(inner);
      }
    }

    var order = shuffle(tiles.map(function (_, i) { return i; }));
    var span = 1100;
    var flipDur = 840;
    order.forEach(function (tileIdx, orderPos) {
      var delay = (orderPos / tiles.length) * span;
      setTimeout(function () {
        tiles[tileIdx].style.transition = 'transform ' + flipDur + 'ms cubic-bezier(.5,.05,.2,1)';
        tiles[tileIdx].style.transform = 'rotateY(180deg)';
      }, delay);
    });

    await wait(span + flipDur + 60);
    track.removeChild(grid);
  }

  window.playTransition = async function (outgoing, incoming, track, effect) {
    if (reduceMotion) {
      outgoing.classList.remove('is-active');
      incoming.classList.add('is-active');
      return;
    }

    prep(outgoing, incoming);

    if (effect === 'peel') {
      await peel(outgoing, incoming);
    } else if (effect === 'matrix') {
      await matrixFall(outgoing, incoming, track);
    } else if (effect === 'tile-flip') {
      await tileFlip(outgoing, incoming, track);
    } else if (effect === 'clock-wipe') {
      await clockWipe(outgoing, incoming);
    } else if (effect === 'iris') {
      await iris(outgoing, incoming);
    } else if (effect === 'push') {
      await push(outgoing, incoming);
    } else {
      await fadeBlack(outgoing, incoming, track);
    }

    resetSlide(outgoing);
    resetSlide(incoming);
    outgoing.classList.remove('is-active');
    incoming.classList.add('is-active');
  };
})();
