
    (function () {
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var HEADER = 72;

      /* One rAF-throttled scroll handler: progress bar, header state, scrollspy, journey */
      var progress = document.getElementById('progress');
      var header = document.getElementById('header');
      var navLinks = [].slice.call(document.querySelectorAll('#nav a'));
      var spy = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); });
      var journey = document.getElementById('journey');
      var steps = [].slice.call(journey.querySelectorAll('.step'));
      var layers = [].slice.call(journey.querySelectorAll('.layer'));
      var stack = document.getElementById('stack');
      var fill = document.getElementById('railFill');
      var packet = document.getElementById('packet');
      var wide = window.matchMedia('(min-width: 901px)');
      var ticking = false;

      function setStatic() {
        journey.classList.remove('is-scrolly');
        stack.classList.add('static');
        steps.forEach(function (s) { s.classList.remove('active'); });
        layers.forEach(function (l) { l.classList.remove('active'); l.classList.add('done'); });
        fill.style.height = '100%';
        packet.style.top = '100%';
      }

      function update() {
        ticking = false;
        var max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
        header.classList.toggle('at-top', window.scrollY < 8);

        var current = -1;
        spy.forEach(function (sec, i) {
          if (sec && sec.getBoundingClientRect().top <= 140) current = i;
        });
        navLinks.forEach(function (a, i) {
          if (i === current) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });

        if (!wide.matches || reduce) { setStatic(); return; }
        journey.classList.add('is-scrolly');
        stack.classList.remove('static');
        var r = journey.getBoundingClientRect();
        var total = r.height - (window.innerHeight - HEADER);
        var p = Math.min(1, Math.max(0, (HEADER - r.top) / total));
        var idx = Math.min(steps.length - 1, Math.floor(p * steps.length));
        steps.forEach(function (s, i) { s.classList.toggle('active', i === idx); });
        layers.forEach(function (l, i) {
          l.classList.toggle('active', i === idx);
          l.classList.toggle('done', i < idx);
        });
        var pct = (p * 100).toFixed(1) + '%';
        fill.style.height = pct;
        packet.style.top = pct;
      }
      function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      wide.addEventListener('change', onScroll);
      update();

      /* Live status checks (no-cors: resolves if the server answers at all) */
      [].forEach.call(document.querySelectorAll('.status-item'), function (el) {
        var out = el.querySelector('.state');
        var ctrl = new AbortController();
        var slow = setTimeout(function () {
          el.setAttribute('data-state', 'wait');
          out.textContent = 'Waking up. Free hosting sleeps when idle.';
        }, 3500);
        var kill = setTimeout(function () { ctrl.abort(); }, 40000);
        fetch(el.getAttribute('data-url'), { mode: 'no-cors', cache: 'no-store', signal: ctrl.signal })
          .then(function () { el.setAttribute('data-state', 'ok'); out.textContent = 'Online'; })
          .catch(function () { el.setAttribute('data-state', 'bad'); out.textContent = 'Not reachable right now'; })
          .then(function () { clearTimeout(slow); clearTimeout(kill); });
      });

      /* Tabs with arrow-key support */
      var tabs = [].slice.call(document.querySelectorAll('[role="tab"]'));
      function select(tab) {
        tabs.forEach(function (t) {
          var on = t === tab;
          t.setAttribute('aria-selected', on ? 'true' : 'false');
          t.tabIndex = on ? 0 : -1;
          document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
        });
      }
      tabs.forEach(function (tab, i) {
        tab.addEventListener('click', function () { select(tab); });
        tab.addEventListener('keydown', function (e) {
          var n = null;
          if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
          if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
          if (e.key === 'Home') n = tabs[0];
          if (e.key === 'End') n = tabs[tabs.length - 1];
          if (n) { e.preventDefault(); select(n); n.focus(); }
        });
      });

      /* Contact form: send in place, no page reload */
      var form = document.getElementById('contactForm');
      var msg = document.getElementById('formMsg');
      var sendBtn = document.getElementById('sendBtn');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        sendBtn.disabled = true;
        sendBtn.textContent = 'Sending';
        fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(new FormData(form)).toString()
        }).then(function (res) {
          if (!res.ok) throw new Error('bad status');
          form.hidden = true;
          msg.className = 'form-msg';
          msg.textContent = 'Message sent. I will reply to the email you entered.';
          msg.hidden = false;
        }).catch(function () {
          msg.className = 'form-msg error';
          msg.textContent = 'The message could not be sent. Please try again in a moment.';
          msg.hidden = false;
          sendBtn.disabled = false;
          sendBtn.textContent = 'Send message';
        });
      });
    })();
  