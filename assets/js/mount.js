(function () {
  'use strict';

  var g = window.garden;
  if (!g) return;

  var cv = document.getElementById('cv');

  var NAME = 'solanaceae';
  var STILL = !!g.still;
  var CHAR_MS = 145;

  document.documentElement.classList.add('garden-ok');

  function typeOut() {
    var i = 0;
    g.typing = true;
    (function step() {
      if (i >= NAME.length) { g.typing = false; return; }
      g.add(NAME.charAt(i), performance.now());
      i += 1;
      setTimeout(step, CHAR_MS);
    })();
  }

  function seedStill() {
    var t = performance.now();
    g.letters = [];
    g.layout();
    for (var i = 0; i < NAME.length; i++) g.add(NAME.charAt(i), t - 12000 + i * 60);
    g.cache = {};
    g.layout(true);
    g.paint(t, false);
  }

  function boot() {
    if (g.plantEdges) g.plantEdges(STILL);
    if (STILL) seedStill(); else typeOut();
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(boot).catch(boot);
  } else {
    boot();
  }

  if (cv) {
    cv.addEventListener('pointerdown', function (e) {
      if (g.spawnFly) g.spawnFly(e.clientX, e.clientY);
    });
  }

  if (STILL) {
    var repaint = function () {
      requestAnimationFrame(function () {
        if (!g.W) return;
        g.layout(true);
        g.paint(performance.now(), false);
      });
    };
    window.addEventListener('resize', repaint);
    if (window.ResizeObserver) new ResizeObserver(repaint).observe(cv);
  }
})();

(() => {
  const hero = document.querySelector('.hero');
  const eng = window.garden;
  if (!hero || !eng) return;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      eng.paused = !e.isIntersecting || document.hidden;
    }, { rootMargin: '80px' }).observe(hero);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) eng.paused = true;
    else {
      const r = hero.getBoundingClientRect();
      eng.paused = r.bottom < 0 || r.top > window.innerHeight;
    }
  });
})();
