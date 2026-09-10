// "Security theater" — a scripted, auto-playing fake login (username, password,
// then a 6-digit MFA code) that plays before a product's real app is revealed
// in a second modal. Nothing here is a real authentication check — it's a
// staged animation for the show floor, meant to demonstrate that these tools
// sit behind a login. Tweak FAKE_USERNAME / FAKE_PASSWORD below if you want
// different text typed on screen.

(function () {
  var FAKE_USERNAME = 'demo.attendee';
  var FAKE_PASSWORD = 'TechShow2026!';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var seq = 0; // bumped whenever a run is cancelled, so in-flight steps know to stop

  function el(tag, className, html) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, reduceMotion ? 0 : ms); });
  }

  function typeInto(fieldEl, text, mySeq) {
    return new Promise(function (resolve) {
      if (reduceMotion) { fieldEl.value = text; resolve(); return; }
      fieldEl.value = '';
      var i = 0;
      (function step() {
        if (seq !== mySeq) return;
        if (i >= text.length) { resolve(); return; }
        fieldEl.value += text.charAt(i);
        i++;
        setTimeout(step, 55 + Math.random() * 70);
      })();
    });
  }

  function fillOtp(boxes, digits, mySeq) {
    return new Promise(function (resolve) {
      if (reduceMotion) {
        boxes.forEach(function (b, i) { b.textContent = digits[i]; b.classList.add('is-filled'); });
        resolve();
        return;
      }
      var i = 0;
      (function step() {
        if (seq !== mySeq) return;
        if (i >= boxes.length) { resolve(); return; }
        boxes[i].textContent = digits.charAt(i);
        boxes[i].classList.add('is-filled');
        i++;
        setTimeout(step, 140 + Math.random() * 90);
      })();
    });
  }

  function randomDigits(n) {
    var s = '';
    for (var i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
    return s;
  }

  function buildOverlay(panelClass, innerHTML) {
    var overlay = el('div', 'theater-overlay');
    var panel = el('div', 'theater-panel ' + panelClass, innerHTML);
    var closeBtn = el('button', 'theater-close', '&times;');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close');
    panel.appendChild(closeBtn);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    requestAnimationFrame(function () { overlay.classList.add('is-open'); });
    return { overlay: overlay, closeBtn: closeBtn };
  }

  function teardown(overlay) {
    overlay.classList.remove('is-open');
    setTimeout(function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 250);
  }

  // Runs the fake-login -> fake-MFA -> real-app sequence for one product.
  // Calls onClose() once, whenever the whole thing ends (cancelled or completed).
  window.openTheater = function (product, onClose) {
    seq++;
    var mySeq = seq;
    var pageOverlayRefs = null;
    var closed = false;

    function closeAll() {
      if (closed) return;
      closed = true;
      seq++; // invalidates any pending typing/wait steps for this run
      document.removeEventListener('keydown', onKey);
      teardown(loginRefs.overlay);
      if (pageOverlayRefs) teardown(pageOverlayRefs.overlay);
      if (onClose) onClose();
    }
    function onKey(e) { if (e.key === 'Escape') closeAll(); }
    document.addEventListener('keydown', onKey);

    var loginHTML =
      '<div class="login-card">' +
        '<img class="login-logo" src="assets/logo/biztech.png" alt="">' +
        '<div class="login-app-name">' + product.name + '</div>' +
        '<div class="login-sub">Secure Sign-In</div>' +
        '<div class="login-field-group"><label>Username</label>' +
          '<input class="login-field" data-field="user" readonly tabindex="-1"></div>' +
        '<div class="login-field-group"><label>Password</label>' +
          '<input class="login-field" type="password" data-field="pass" readonly tabindex="-1"></div>' +
        '<button class="login-btn" type="button" data-role="submit">Sign In</button>' +
        '<div class="mfa-block" hidden>' +
          '<div class="login-sub">Enter the 6-digit verification code</div>' +
          '<div class="otp-row"></div>' +
          '<button class="login-btn" type="button" data-role="verify">Verify</button>' +
        '</div>' +
        '<div class="login-status"></div>' +
      '</div>';

    var loginRefs = buildOverlay('login-panel', loginHTML);
    loginRefs.closeBtn.addEventListener('click', closeAll);

    var overlayEl = loginRefs.overlay;
    var userField = overlayEl.querySelector('[data-field="user"]');
    var passField = overlayEl.querySelector('[data-field="pass"]');
    var submitBtn = overlayEl.querySelector('[data-role="submit"]');
    var verifyBtn = overlayEl.querySelector('[data-role="verify"]');
    var mfaBlock = overlayEl.querySelector('.mfa-block');
    var otpRow = overlayEl.querySelector('.otp-row');
    var status = overlayEl.querySelector('.login-status');
    var otpBoxes = [];
    for (var i = 0; i < 6; i++) {
      var box = el('span', 'otp-box');
      otpRow.appendChild(box);
      otpBoxes.push(box);
    }

    (async function run() {
      await wait(500);
      if (seq !== mySeq) return;
      await typeInto(userField, FAKE_USERNAME, mySeq);
      if (seq !== mySeq) return;

      await wait(300);
      await typeInto(passField, FAKE_PASSWORD, mySeq);
      if (seq !== mySeq) return;

      await wait(350);
      submitBtn.classList.add('is-pressed');
      status.innerHTML = '<span class="spinner"></span> Signing in…';
      await wait(200);
      submitBtn.classList.remove('is-pressed');
      await wait(700);
      if (seq !== mySeq) return;

      status.innerHTML = '';
      mfaBlock.hidden = false;
      await wait(300);
      await fillOtp(otpBoxes, randomDigits(6), mySeq);
      if (seq !== mySeq) return;

      await wait(250);
      verifyBtn.classList.add('is-pressed');
      status.innerHTML = '<span class="spinner"></span> Verifying…';
      await wait(200);
      verifyBtn.classList.remove('is-pressed');
      await wait(650);
      if (seq !== mySeq) return;

      status.innerHTML = '<span class="check-badge">✓</span> Access granted';
      await wait(750);
      if (seq !== mySeq) return;

      teardown(loginRefs.overlay);
      await wait(280);
      if (seq !== mySeq) return;

      var pageHTML =
        '<div class="page-chrome">' +
          '<span class="chrome-dot"></span><span class="chrome-dot"></span><span class="chrome-dot"></span>' +
          '<div class="chrome-url">' + product.url + '</div>' +
          '<a class="chrome-newtab" href="' + product.url + '" target="_blank" rel="noopener">Open in new tab ↗</a>' +
        '</div>' +
        '<iframe class="page-frame" src="' + product.url + '" title="' + product.name + '"></iframe>';

      pageOverlayRefs = buildOverlay('page-panel', pageHTML);
      pageOverlayRefs.closeBtn.addEventListener('click', closeAll);
    })();

    return closeAll;
  };
})();
