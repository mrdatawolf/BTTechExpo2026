// Bottom-third testimonial band. Reads testimonials.json (a plain array,
// separate from and independent in length from slides.json) and exposes
// window.advanceTestimonial(), which script.js calls every time the slide
// changes (autoplay or manual). Testimonials play in a shuffled order that
// reshuffles once exhausted, so the count of slides and testimonials can
// differ freely without anything getting out of sync.

(function () {
  var bar = document.getElementById('testimonial');
  var quoteEl = document.getElementById('testimonialQuote');
  var authorEl = document.getElementById('testimonialAuthor');
  var FADE_MS = 500;

  var testimonials = [];
  var queue = [];
  var current = null;

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function refillQueue() {
    queue = shuffle(testimonials.slice());
    // Avoid immediately repeating the testimonial that was just shown when
    // the shuffle happens to put it first again.
    if (queue.length > 1 && current && queue[0] === current) {
      queue.push(queue.shift());
    }
  }

  function formatByline(t) {
    var bits = [];
    if (t.role) bits.push(t.role);
    if (t.company) bits.push(t.company);
    var roleCompany = bits.join(', ');
    var author = t.author || '';
    if (author && roleCompany) return author + ' — ' + roleCompany;
    return author || roleCompany;
  }

  function render(t) {
    quoteEl.textContent = t.quote;
    authorEl.textContent = formatByline(t);
  }

  window.advanceTestimonial = function () {
    if (!testimonials.length) return;
    if (!queue.length) refillQueue();
    current = queue.shift();

    if (!bar.classList.contains('is-visible')) {
      render(current);
      bar.classList.add('is-visible');
      return;
    }

    bar.classList.remove('is-visible');
    setTimeout(function () {
      render(current);
      bar.classList.add('is-visible');
    }, FADE_MS);
  };

  fetch('testimonials.json')
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      if (!Array.isArray(data) || data.length === 0) return;
      testimonials = data;
      document.body.classList.add('has-testimonials');
      window.advanceTestimonial();
    })
    .catch(function (err) {
      console.error("Couldn't load testimonials.json:", err);
    });
})();
