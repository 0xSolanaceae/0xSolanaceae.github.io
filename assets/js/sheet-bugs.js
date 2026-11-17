(() => {
  const sheet = document.querySelector('.plate');
  if (!sheet) return;
  const wrap = sheet.closest('.sheet') || sheet.parentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const cv = document.createElement('canvas');
  cv.className = 'sheet-bugs';
  cv.setAttribute('aria-hidden', 'true');
  const g = cv.getContext('2d');

  const MARIGOLD = '#FF8A00';
  const CREAM = '#FFE2B8';
  const BODY = '#2A2114';
  const INK = '#171008';

  const MV = {
    butterfly: { max: 118, base: 20, k: 1.5, fy: 3.2, fa: 24, wf: 4.3, wo: 7, jf: 13, ja: 5, flap: 17 },
    bee: { max: 168, base: 42, k: 2.4, fy: 9, fa: 38, wf: 6, wo: 13, jf: 41, ja: 9, flap: 62 },
    moth: { max: 96, base: 16, k: 1.7, fy: 4, fa: 16, wf: 5, wo: 9, jf: 21, ja: 7, flap: 12 },
  };

  const BUGS = [
    { kind: 'bee', size: 15, seed: 3, zone: 'left' },
    { kind: 'butterfly', size: 20, seed: 7, zone: 'left' },
    { kind: 'moth', size: 17, seed: 11, zone: 'right' },
    { kind: 'bee', size: 13, seed: 17, zone: 'right' },
    { kind: 'butterfly', size: 17, seed: 23, zone: 'grass' },
    { kind: 'moth', size: 15, seed: 29, zone: 'grass' },
  ];

  function rng(seed) {
    let a = seed;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  let bugs = [];
  let W = 0, H = 0, dpr = 1;
  let raf = 0, last = 0, paused = false, geo = null;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rand = (r, a, b) => a + r() * (b - a);

  function paintBee(open) {
    g.save();
    g.scale(open, 1);
    g.fillStyle = 'rgba(255,246,232,0.62)';
    g.strokeStyle = 'rgba(255,226,184,0.5)';
    g.lineWidth = 0.4;
    g.beginPath();
    g.ellipse(-1.5, -3.2, 5.4, 3, -0.25, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    g.beginPath();
    g.ellipse(2.6, -3.2, 5.4, 3, 0.25, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    g.restore();

    g.fillStyle = BODY;
    g.beginPath();
    g.ellipse(0, 0, 7.6, 4.6, 0, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = '#FFB25E';
    for (const dx of [-3.4, 0, 3.2]) {
      g.beginPath();
      g.ellipse(dx, 0, 1.35, 4.3, 0, 0, Math.PI * 2);
      g.fill();
    }

    g.fillStyle = INK;
    g.beginPath();
    g.arc(8.4, 0, 2.5, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = CREAM;
    g.beginPath();
    g.arc(9.2, -0.8, 0.5, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 0.7;
    g.beginPath();
    g.moveTo(9.8, -1.6);
    g.lineTo(11.6, -3.2);
    g.moveTo(9.8, 1.6);
    g.lineTo(11.6, 3.2);
    g.stroke();
  }

  function paintButterfly(open) {
    for (const side of [-1, 1]) {
      g.save();
      g.scale(side * open, 1);
      g.fillStyle = MARIGOLD;
      g.strokeStyle = CREAM;
      g.lineWidth = 0.55;
      g.beginPath();
      g.moveTo(1.5, 0);
      g.bezierCurveTo(6, -7, 13, -9, 13.6, -4.4);
      g.bezierCurveTo(14.2, -0.4, 8, 1, 1.5, 0);
      g.fill();
      g.stroke();
      g.fillStyle = 'rgba(255,138,0,0.82)';
      g.beginPath();
      g.moveTo(1.5, 1);
      g.bezierCurveTo(6, 3, 11.6, 6, 10.2, 8.6);
      g.bezierCurveTo(9, 11, 4, 6.4, 1.5, 1);
      g.fill();
      g.stroke();
      g.restore();
    }
    g.fillStyle = BODY;
    g.beginPath();
    g.ellipse(0, 0, 5.4, 1.5, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = BODY;
    g.lineWidth = 0.6;
    g.beginPath();
    g.moveTo(-5.2, -0.6);
    g.lineTo(-7.4, -3.2);
    g.moveTo(-5.2, 0.6);
    g.lineTo(-7.4, 3.2);
    g.stroke();
  }

  function paintMoth(open) {
    for (const side of [-1, 1]) {
      g.save();
      g.scale(side * open, 1);
      g.fillStyle = 'rgba(255,226,184,0.8)';
      g.strokeStyle = 'rgba(255,246,232,0.5)';
      g.lineWidth = 0.45;
      g.beginPath();
      g.moveTo(1.4, 0);
      g.bezierCurveTo(5.4, -6, 12, -7, 12.4, -3);
      g.bezierCurveTo(12.8, 0.6, 6.6, 1.4, 1.4, 0);
      g.fill();
      g.stroke();
      g.fillStyle = 'rgba(255,226,184,0.6)';
      g.beginPath();
      g.moveTo(1.4, 1);
      g.bezierCurveTo(5, 3, 9.4, 5.4, 8.4, 7.4);
      g.bezierCurveTo(7.5, 9.2, 3.6, 5, 1.4, 1);
      g.fill();
      g.stroke();
      g.restore();
    }
    g.fillStyle = '#4A3A22';
    g.beginPath();
    g.ellipse(0, 0, 5.2, 1.5, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#4A3A22';
    g.lineWidth = 0.5;
    g.beginPath();
    g.moveTo(-5, -0.5);
    g.lineTo(-7.2, -2.8);
    g.moveTo(-5, 0.5);
    g.lineTo(-7.2, 2.8);
    g.stroke();
  }

  const PAINT = { bee: paintBee, butterfly: paintButterfly, moth: paintMoth };

  function draw(b) {
    const s = b.size / 20;
    g.save();
    g.translate(b.x, b.y);
    g.rotate(b.ang);
    g.scale(b.dir * s, s);
    PAINT[b.kind](0.25 + 0.75 * b.open);
    g.restore();
  }

  function zoneFor(name) {
    const s = window.sheetFlora;
    if (!s) return null;
    const { left, right, padB, W: vw, H: vh, ground } = s.bounds;

    if (name === 'grass') {
      if (!ground) return null;
      return {
        x0: 46, x1: vw - 46,
        y0: Math.max(30, ground.top + 4),
        y1: vh - ground.soilH - 8,
        anchors: s.blooms.filter((b) => b.y > ground.top - 8 && b.y < vh - ground.soilH - 6
          && b.x > 70 && b.x < vw - 70),
      };
    }
    if (name === 'left' && left > 60) {
      return { x0: 16, x1: Math.max(44, left - 30), y0: 40, y1: vh - 20,
        anchors: s.blooms.filter((b) => b.x < left - 24 && b.y < vh - padB - 2) };
    }
    if (name === 'right' && vw - right > 60) {
      return { x0: Math.min(vw - 44, right + 30), x1: vw - 16, y0: 40, y1: vh - 20,
        anchors: s.blooms.filter((b) => b.x > right + 24 && b.y < vh - padB - 2) };
    }
    return null;
  }

  function resize() {
    const r = wrap.getBoundingClientRect();
    W = Math.round(r.width);
    H = Math.round(r.height);
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px';
    cv.style.height = H + 'px';
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn() {
    bugs = [];
    if (!window.sheetFlora) return;
    const rnd = rng(451);

    for (const spec of BUGS) {
      const zone = zoneFor(spec.zone);
      if (!zone || zone.x1 - zone.x0 < 46 || zone.y1 - zone.y0 < 24) continue;
      bugs.push({
        zone, kind: spec.kind, size: spec.size, m: MV[spec.kind], seed: rand(rnd, 0, 20),
        x: rand(rnd, zone.x0, zone.x1), y: rand(rnd, zone.y0, zone.y1),
        vx: 0, vy: 0, ang: 0, open: 1, dir: 1,
        st: 'fly', target: null, until: 0, visits: 0, sitX: 0, sitY: 0,
        ph: rand(rnd, 0, 6.28),
      });
    }
  }

  function perchTarget(b, rnd) {
    const z = b.zone;
    if (z.anchors.length && rnd() < 0.8) {
      const a = z.anchors[(rnd() * z.anchors.length) | 0];
      return { x: a.x + rand(rnd, -a.r * 0.25, a.r * 0.25), y: a.y - a.r * 0.4, bloom: true };
    }
    return { x: rand(rnd, z.x0 + 24, z.x1 - 24), y: rand(rnd, z.y0 + 24, z.y1 - 16), bloom: false };
  }

  function step(dt, now) {
    const t = now / 1000;
    const rnd = Math.random;

    for (const b of bugs) {
      const m = b.m, z = b.zone;

      if (b.st === 'sit') {
        b.x += (b.sitX - b.x) * Math.min(1, dt * 9);
        b.y += (b.sitY - b.y) * Math.min(1, dt * 9);
        b.ang *= 0.9;
        b.open += (0.06 - b.open) * Math.min(1, dt * 6);
        b.y += Math.sin(t * 1.6 + b.ph) * 1.6 * dt;
        if (now > b.until) {
          b.visits++;
          if (b.visits >= 2 + ((rnd() * 3) | 0)) {
            b.st = 'leave';
            const away = b.x < (z.x0 + z.x1) / 2;
            b.target = { x: away ? -120 : W + 120, y: b.y - 50 };
          } else {
            b.st = 'fly';
            b.target = perchTarget(b, rnd);
          }
        }
        continue;
      }

      if (b.st === 'leave') {
        const sp = m.max * 1.2;
        const toRight = b.target.x > b.x;
        b.vx += ((toRight ? sp : -sp) - b.vx) * Math.min(1, dt * 5);
        b.vy += (-sp * 0.3 - b.vy) * Math.min(1, dt * 5);
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.open += (0.95 - b.open) * Math.min(1, dt * 8);
        b.ang += (clamp(b.vx / m.max, -1, 1) * 0.3 - b.ang) * Math.min(1, dt * 5);
        b.dir = b.vx > 0 ? -1 : 1;
        if (b.x < -80 || b.x > W + 80) {
          b.st = 'fly';
          b.visits = 0;
          b.x = toRight ? z.x0 - 20 : z.x1 + 20;
          b.y = rand(rnd, z.y0 + 20, z.y1 - 20);
          b.vx = 0; b.vy = 0;
          b.target = perchTarget(b, rnd);
        }
        continue;
      }

      if (!b.target) b.target = perchTarget(b, rnd);
      if (b.target.x < z.x0 + 18 || b.target.x > z.x1 - 18) b.target = perchTarget(b, rnd);

      const dx = b.target.x - b.x, dy = b.target.y - b.y;
      const d = Math.hypot(dx, dy) || 1;
      const sp = Math.min(m.max, m.base + d * m.k);
      const wob = Math.cos(t * m.wf + b.seed) * m.wo;
      const flut = Math.sin(t * m.fy + b.seed) * m.fa;

      let pushX = 0;
      const edge = 40;
      if (b.x < z.x0 + edge) pushX = (z.x0 + edge - b.x) * 2.4;
      if (b.x > z.x1 - edge) pushX = -(b.x - (z.x1 - edge)) * 2.4;

      const wantX = (dx / d) * sp + wob + pushX;
      const wantY = (dy / d) * sp + flut;
      const steer = Math.min(1, dt * 7);
      b.vx += (wantX - b.vx) * steer;
      b.vy += (wantY - b.vy) * steer;

      b.x += b.vx * dt;
      b.y += b.vy * dt + Math.sin(t * m.jf + b.seed) * m.ja * dt;

      if (b.x < z.x0) { b.x = z.x0; b.vx = Math.abs(b.vx) * 0.4; }
      if (b.x > z.x1) { b.x = z.x1; b.vx = -Math.abs(b.vx) * 0.4; }
      if (b.y < z.y0) { b.y = z.y0; b.vy = Math.abs(b.vy) * 0.5; }
      if (b.y > z.y1) { b.y = z.y1; b.vy = -Math.abs(b.vy) * 0.5; }

      b.ang += (clamp(b.vx / m.max, -1, 1) * 0.32 - b.ang) * Math.min(1, dt * 5);
      if (Math.abs(b.vx) > 6) b.dir = b.vx > 0 ? -1 : 1;

      const beat = 0.34 + 0.66 * Math.abs(Math.sin(t * m.flap + b.seed));
      const burst = b.kind === 'bee' && Math.sin(t * 1.3 + b.seed) > 0.82;
      b.open += ((burst ? 1 : beat) - b.open) * Math.min(1, dt * 18);

      if (d < 8 && b.target.bloom) {
        b.st = 'sit';
        b.sitX = b.target.x;
        b.sitY = b.target.y;
        b.until = now + 2400 + rnd() * 4200;
        b.ang = rand(rnd, -0.15, 0.15);
      } else if (d < 12) {
        b.target = perchTarget(b, rnd);
      }
    }
  }

  function render() {
    for (const b of bugs) {
      if (b.box) g.clearRect(b.box[0], b.box[1], b.box[2], b.box[3]);
    }
    for (const b of bugs) {
      draw(b);
      const r = b.size * 1.6;
      b.box = [b.x - r, b.y - r, r * 2, r * 2];
    }
  }

  function frame(now) {
    raf = 0;
    if (paused) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    step(dt, now);
    render();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (reduce || raf || !bugs.length) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function sitStill() {
    const rnd = rng(97);
    for (const b of bugs) {
      const anchors = b.zone.anchors;
      if (anchors.length) {
        const a = anchors[(rnd() * anchors.length) | 0];
        b.x = a.x;
        b.y = a.y - a.r * 0.4;
      }
      b.ang = 0;
      b.open = 0.06;
    }
    render();
  }

  function build() {
    stop();
    if (!cv.isConnected) wrap.appendChild(cv);
    resize();
    spawn();
    if (!bugs.length) return;
    if (reduce) { sitStill(); return; }
    sitStill();
    start();
  }

  addEventListener('sheetflora:layout', build);
  if (window.sheetFlora) build();

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      paused = !entries[0].isIntersecting;
      if (paused) stop();
      else start();
    }, { rootMargin: '120px' }).observe(sheet);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });
})();
