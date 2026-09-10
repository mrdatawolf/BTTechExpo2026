(function () {
  var track = document.getElementById('track');
  var dotsWrap = document.getElementById('dots');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var logoChip = document.getElementById('logoChip');
  var eventInfo = document.getElementById('eventInfo');
  var index = 0;
  var timer = null;
  var AUTOPLAY_MS = 10000;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isAnimating = false;
  // Which transitions can play between slides — edit this list to add/remove
  // effects. The order is shuffled once per page load, then played through in
  // that fixed order (wrapping back to the start) — so every effect shows up
  // once before any repeat, and the order changes again on the next refresh.
  var EFFECTS = ['fade-black', 'tile-flip', 'clock-wipe', 'iris', 'push', 'matrix', 'peel'];

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  var effectOrder = shuffle(EFFECTS.slice());
  var effectPos = 0;

  function pickEffect() {
    var choice = effectOrder[effectPos % effectOrder.length];
    effectPos++;
    return choice;
  }

  var RINGS_SVG =
    '<svg class="rings" viewBox="0 0 640 640" aria-hidden="true">' +
    '<g fill="none" stroke="#ffffff" stroke-opacity="0.14">' +
    '<circle cx="560" cy="560" r="80"/><circle cx="560" cy="560" r="150"/>' +
    '<circle cx="560" cy="560" r="220"/><circle cx="560" cy="560" r="290"/>' +
    '<circle cx="560" cy="560" r="360"/></g></svg>';

  var PLACEHOLDER_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 15l4.5-4.5a2 2 0 0 1 2.8 0L15 15"/>' +
    '<circle cx="16.5" cy="8.5" r="1.5"/></svg>';

  // Resolves a slide's target URL. Slides can give a full "url" (used as-is —
  // for real external systems like the ERP), or build one from "ip" + "port"
  // + "path". When "ip" is left blank, we assume the app runs on this same
  // box that's serving the slideshow, so we use whatever host/IP the viewer's
  // browser used to reach this page (window.location.hostname) — that's
  // always the current, reachable address for this box, on whatever network
  // it's plugged into, with no manual IP-hunting needed.
  function resolveUrl(product) {
    if (product.url && product.url.toUpperCase() !== 'TBD') return product.url;
    if (!product.port) return '';
    var protocol = product.protocol || 'http';
    var host = (product.ip && product.ip.trim()) ? product.ip.trim() : window.location.hostname;
    var path = product.path || '';
    if (!path) path = '/';
    else if (path.charAt(0) !== '/') path = '/' + path;
    return protocol + '://' + host + ':' + product.port + path;
  }

  function buildSlide(product, i) {
    var hasUrl = !!(product.url && product.url.toUpperCase() !== 'TBD');

    var slide = document.createElement('a');
    slide.className = 'slide ' + (i % 2 === 0 ? 'rings-a' : 'rings-b') + (hasUrl ? '' : ' is-placeholder');
    slide.href = hasUrl ? product.url : '#';
    if (hasUrl) {
      slide.addEventListener('click', function (e) {
        e.preventDefault();
        stop();
        window.openTheater(product, function () { start(); });
      });
    } else {
      slide.addEventListener('click', function (e) { e.preventDefault(); });
    }
    slide.setAttribute('aria-label', product.name + (hasUrl ? ' — open app' : ' — coming soon'));

    slide.innerHTML =
      RINGS_SVG +
      '<div class="slide-content">' +
        '<div class="slide-text">' +
          '<span class="slide-tag">' + product.tag + '</span>' +
          '<h2>' + product.name + '</h2>' +
          '<p class="desc">' + product.description + '</p>' +
          '<span class="open-pill"><span class="arrow">' + (hasUrl ? '↗' : '') + '</span> ' +
            (hasUrl ? 'Open App' : 'Coming soon') +
          '</span>' +
        '</div>' +
        '<div class="shot-frame">' +
          '<div class="shot-chrome"><span></span><span></span><span></span></div>' +
          '<div class="shot-body">' +
            (product.image
              ? '<img src="' + product.image + '" alt="' + product.name + ' screenshot">'
              : placeholderMarkup()) +
          '</div>' +
        '</div>' +
      '</div>';

    if (product.image) {
      var img = slide.querySelector('.shot-body img');
      img.addEventListener('error', function () {
        img.parentNode.innerHTML = placeholderMarkup();
      });
    }

    return slide;
  }

  function placeholderMarkup() {
    return '<div class="shot-placeholder">' + PLACEHOLDER_SVG + '<span>Preview coming soon</span></div>';
  }

  var slides = [];
  var dots = [];

  function goTo(i) {
    var newIndex = (i + slides.length) % slides.length;
    if (newIndex === index || isAnimating) return;
    var outgoing = slides[index];
    var incoming = slides[newIndex];
    index = newIndex;
    dots.forEach(function (dot, di) { dot.setAttribute('aria-current', di === index ? 'true' : 'false'); });
    isAnimating = true;
    window.playTransition(outgoing, incoming, track, pickEffect()).then(function () {
      isAnimating = false;
    });
  }
  function next() { goTo(index + 1); }
  function prev() { goTo(index - 1); }
  function start() { if (reduceMotion) return; stop(); timer = setInterval(next, AUTOPLAY_MS); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function restart() { start(); }

  nextBtn.addEventListener('click', function () { next(); restart(); });
  prevBtn.addEventListener('click', function () { prev(); restart(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { next(); restart(); }
    if (e.key === 'ArrowLeft') { prev(); restart(); }
  });

  function showLoadError(message) {
    track.innerHTML = '<div class="load-error">' + message + '</div>';
  }

  fetch('site.json')
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (site) {
      logoChip.innerHTML = '<img src="' + site.logo + '" alt="' + (site.logoAlt || '') + '">';
      eventInfo.innerHTML = '<strong>' + site.eventName + '</strong> · ' + site.eventDate + ' · ' + site.eventLocation;
    })
    .catch(function (err) {
      console.error("Couldn't load site.json:", err);
    });

  fetch('slides.json')
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (products) {
      if (!Array.isArray(products) || products.length === 0) {
        showLoadError('slides.json has no slides in it.');
        return;
      }
      slides = products.map(function (product, i) {
        product.url = resolveUrl(product);
        var slide = buildSlide(product, i);
        track.appendChild(slide);
        return slide;
      });

      slides.forEach(function (slide, i) {
        var dot = document.createElement('button');
        dot.className = 'dot';
        dot.type = 'button';
        dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        dot.setAttribute('aria-current', i === 0 ? 'true' : 'false');
        dot.addEventListener('click', function () { goTo(i); restart(); });
        dotsWrap.appendChild(dot);
      });
      dots = Array.prototype.slice.call(dotsWrap.children);

      slides[0].classList.add('is-active');
      start();
    })
    .catch(function (err) {
      showLoadError('Couldn\'t load slides.json: ' + err.message);
    });
})();
