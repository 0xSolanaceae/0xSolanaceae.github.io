(function () {
  'use strict';

  const engine = window.garden;
  if (!engine) return;
  const g: Garden = engine;

  var cv = document.getElementById('cv');

  var NAME = 'solanaceae';
  var STILL = !!g.still;
  var CHAR_MS = 145;

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
    document.documentElement.classList.remove('no-garden');
    g.plantEdges(STILL);
    if (STILL) seedStill(); else typeOut();
  }

  var DISPLAY = '700 100px "Playfair Display"';
  var FONT_WAIT = 900;

  function start() {
    if (!document.fonts || !document.fonts.load) return boot();
    var settled = false;
    var go = function () {
      if (settled) return;
      settled = true;
      boot();
    };
    setTimeout(go, FONT_WAIT);
    document.fonts.load(DISPLAY).then(go).catch(go);
  }

  start();

  if (cv) {
    cv.addEventListener('pointerdown', function (e) {
      g.spawnFly(e.clientX, e.clientY);
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
    if (window.ResizeObserver) new ResizeObserver(repaint).observe(cv!);
  }
})();

(() => {
  const hero = document.querySelector('.hero');
  const eng = window.garden;
  if (!hero || !eng) return;

  const MIN_VISIBLE = 120;

  const measure = () => {
    if (document.hidden) { eng.paused = true; return; }
    const r = hero.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
    if (visible < MIN_VISIBLE) { eng.paused = true; return; }
    if (eng.paused) { eng.paused = false; eng.lt = 0; }
  };

  let queued = 0;
  const schedule = () => {
    cancelAnimationFrame(queued);
    queued = requestAnimationFrame(() => { queued = 0; measure(); });
  };

  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  document.addEventListener('visibilitychange', schedule);
  measure();
})();
