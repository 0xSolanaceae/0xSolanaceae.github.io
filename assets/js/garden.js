'use strict';

const CONFIG = {
  boil: true,
  recoil: 20,
  density: 0.85,
  speed: 0.75,
  bounce: 1.35,
  sway: 0.42,
  boilMs: 240,
  boilAmp: 0.7,
  wobble: 0.8,
  leanAmt: 0.85,

  flowers: { marigold: 1.4, rose: 0.5, daisy: 0.35, peony: 0.3, tulip: 0.25, poppy: 0.2, bell: 0.2 },
  avoidOverlap: true,
  insects: { butterfly: 1, bee: 1.2, dragonfly: 0.5 },
  ambient: true,
  ambientEvery: 5500
};

class Garden {
  constructor() {
    this.el = { cv: document.getElementById('cv') };
    this.cfg = CONFIG;

    this.KF = { rose: 1, peony: 1.08, tulip: 1.1, daisy: 1.05, poppy: 1.02, bell: 0.95, marigold: 1.1 };

    this.MV = {
      butterfly: { max: 0.34, base: 0.06, k: 0.0016, leave: 0.42, acc: 0.06, fy: 7, fa: 0.12, wf: 4.3, wo: 0.1, jf: 13, ja: 0.6, wx: 1.3, wy: 2.1, wA: 70, wB: 40 },
      bee: { max: 0.55, base: 0.12, k: 0.003, leave: 0.62, acc: 0.12, fy: 9, fa: 0.22, wf: 6, wo: 0.2, jf: 41, ja: 1.1, wx: 2.6, wy: 3.7, wA: 90, wB: 50 },
      dragonfly: { max: 1.0, base: 0.25, k: 0.005, leave: 1.1, acc: 0.22, fy: 3, fa: 0.03, wf: 2, wo: 0.03, jf: 30, ja: 0.3, wx: 1.9, wy: 2.8, wA: 170, wB: 60 }
    };

    this.F = '"Playfair Display",Georgia,serif'; this.FW = 700;

    this.PAL = [
      ['Rose noir', '#000000', '#FF1400', '#3257FF', '#FFB4A8', '#FFFFFF'],
      ['Paper', '#F3EEE4', '#FF3B1F', '#1C2B8F', '#FFD2C4', '#111111'],
      ['Midnight', '#0D1B4C', '#FF5A4E', '#9FB4FF', '#FFD6CF', '#FFFFFF'],
      ['Citrus', '#0E1A12', '#FF8A00', '#1FA463', '#FFE2B8', '#FFF6E8'],
      ['Orchid', '#140A1F', '#E63CFF', '#2FB8A6', '#F9D1FF', '#FFFFFF'],
      ['Moss', '#133A2A', '#FFB7C5', '#7FD18B', '#FFFFFF', '#F6F1E7'],
      ['Tomato', '#FF1400', '#FFF1E0', '#0B0B0B', '#FF1400', '#000000'],
      ['Butter', '#FFE9A8', '#E4002B', '#0F5132', '#FFC2C2', '#1A1A1A'],
      ['Blush', '#FAD4D8', '#C8102E', '#274690', '#FFE3E6', '#1A1A1A'],
      ['Mono', '#000000', '#F2F2F2', '#6E6E6E', '#000000', '#FFFFFF']
    ];
    this.state = { palette: 3 };
    this.phone = matchMedia('(max-width: 720px)');
    this.init();
  }

  init() {
    this.letters = []; this.uid = 1; this.cache = {}; this.Sd = 0; this.St = 0; this.wrapped = false;
    this.t0 = performance.now(); this.lastKey = 0; this.rand = Math.random;
    this.g = this.el.cv.getContext('2d', { alpha: false });
    this.BK = this.backend(this.g);
    this._pass = 0; this.msAvg = 0; this.pace = 0;
    this.fa = {}; this.mx = null; this.flies = []; this.perch = [];
    this.mount();
  }

  mount() {
    window.addEventListener('resize', () => this.resize());
    this.resize();
    window.addEventListener('pointermove', e => { this.mx = e.clientX; this.my = e.clientY; });
    document.addEventListener('pointerleave', () => { this.mx = null; });

    if (document.fonts) document.fonts.load(`${this.FW} 100px ${this.F}`).then(() => { this.cache = {}; this.layout(); this.paint(performance.now(), false); }).catch(() => {});
    this.still = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (this.still) { this.frame = () => {}; return; }
    let last = 0;
    const loop = () => {
      requestAnimationFrame(loop);
      if (this.paused) return;
      const now = performance.now();
      if (this.pace && now - last < this.pace) return;
      last = now;
      this.frame();
    };
    loop();
  }

  pickInsect() {
    const w = this.cfg.insects || { butterfly: 1 }, ks = Object.keys(w).filter(k => w[k] > 0);
    if (!ks.length) return 'butterfly';
    let tot = 0; for (const k of ks) tot += w[k];
    let x = Math.random() * tot; for (const k of ks) { x -= w[k]; if (x <= 0) return k; }
    return ks[ks.length - 1];
  }
  insectSize(k) { const S = this.Sd || this.St || 100; return k === 'bee' ? Math.max(8, S * 0.075) : k === 'dragonfly' ? Math.max(9, S * 0.08) : Math.max(9, S * 0.09); }
  spawnFly(cx, cy, kind) {
    kind = kind || this.pickInsect();
    if (this.flies.length >= 6) { const o = this.flies.find(f => f.st !== 'leave'); if (o) this.flyOff(o); }
    const taken = new Set(this.flies.filter(f => f.st !== 'leave').map(f => f.pid));
    let best = null, bd = 1e9;
    for (const p of this.perch) { if (taken.has(p.id)) continue; const d = Math.hypot(p.x - cx, p.y - cy); if (d < bd) { bd = d; best = p; } }
    const left = cx < this.W / 2, r = Math.random;
    this.flies.push({ kind, x: left ? -40 : this.W + 40, y: cy + (r() - 0.5) * this.H * 0.4, vx: 0, vy: 0,
      st: best ? 'fly' : 'wander', pid: best ? best.id : null, hx: cx, hy: cy, t0: performance.now(), ph: r() * 6,
      sz: this.insectSize(kind), seed: r() * 100, ang: 0, dir: left ? 1 : -1, pit: 0, open: 1, until: 0,
      visits: kind === 'butterfly' ? 1 + Math.floor(r() * 2) : 2 + Math.floor(r() * 3) });
  }

  ambient(now) {
    if (!this.cfg.ambient || !this.perch.length) return;
    if (this._amb == null) this._amb = now + 2500;
    if (now < this._amb) return;
    this._amb = now + this.cfg.ambientEvery * (0.6 + Math.random() * 0.8);
    if (this.flies.filter(f => f.st !== 'leave').length >= 3) return;
    const free = this.perch.filter(p => !this.flies.some(f => f.pid === p.id));
    if (!free.length) return;
    const p = free[Math.floor(Math.random() * free.length)];
    this.spawnFly(p.x, p.y);
  }
  flyOff(f) { f.st = 'leave'; f.pid = null; f.ex = f.x < this.W / 2 ? -80 : this.W + 80; f.ey = f.y - this.H * (f.kind === 'dragonfly' ? 0.12 : 0.3); }

  nextPerch(f) {
    if (f.visits-- <= 0) return this.flyOff(f);
    const taken = new Set(this.flies.filter(o => o !== f && o.st !== 'leave').map(o => o.pid));
    const cand = this.perch.filter(p => p.id !== f.pid && !taken.has(p.id));
    if (!cand.length) return this.flyOff(f);
    cand.sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y));
    const n = cand.length, rn = m => Math.floor(Math.random() * Math.min(m, n));
    const pick = f.kind === 'bee' ? cand[rn(3)] : f.kind === 'dragonfly' ? cand[n - 1 - rn(3)] : cand[rn(5)];
    f.pid = pick.id; f.st = 'fly';
  }
  landed(f, now) {
    f.st = 'sit'; f.ph = 0;
    const r = Math.random();
    f.until = now + (f.kind === 'bee' ? 1800 + r * 1800 : f.kind === 'dragonfly' ? 1300 + r * 1200 : 4000 + r * 4000);
  }
  sitPose(f, now, k) {
    const s = now / 1000;
    if (k === 'bee') {
      const burst = Math.sin(s * 1.3 + f.seed) > 0.8;
      f.open = burst ? Math.sin(s * 62) : 0.25 * Math.sin(s * 14 + f.seed);
      f.y += Math.sin(s * 20 + f.seed) * 0.5;
    } else if (k === 'dragonfly') {
      f.open = 1 - 0.04 * Math.sin(s * 10 + f.seed);
    } else {
      const burst = Math.sin(s * 0.9 + f.seed) > 0.75;
      f.open = burst ? 0.2 + 0.8 * Math.abs(Math.cos(s * 9 + f.seed)) : 0.25 + 0.15 * Math.sin(f.ph);
    }
  }
  drawFlies(B, now, C) {
    this.ambient(now);
    const dt = Math.min(48, now - (this._fl || now)); this._fl = now;
    if (!this.flies.length) return;
    const byId = {}; for (const p of this.perch) byId[p.id] = p;
    this.flies = this.flies.filter(f => {
      const k = f.kind || 'butterfly', m = this.MV[k], t = (now - f.t0) / 1000;
      let tx, ty;
      if (f.st === 'sit' || f.st === 'fly') {
        const p = byId[f.pid];
        if (!p) { this.flyOff(f); }
        else { tx = p.x + p.R * 0.05; ty = p.y - p.R * 0.55; }
      }
      if (f.st === 'wander') {
        tx = f.hx + Math.sin(t * m.wx + f.seed) * m.wA; ty = f.hy + Math.sin(t * m.wy + f.seed) * m.wB;
        if (t > 3.5) this.flyOff(f);
      }
      if (f.st === 'leave') { tx = f.ex; ty = f.ey; }
      if (f.st === 'sit') {
        f.x += (tx - f.x) * 0.35; f.y += (ty - f.y) * 0.35; f.ang *= 0.85; f.pit *= 0.8;
        f.ph += dt * 0.004;
        this.sitPose(f, now, k);
        if (now > f.until) this.nextPerch(f);
      } else {
        const dx = tx - f.x, dy = ty - f.y, d = Math.hypot(dx, dy) || 1, sp = f.st === 'leave' ? m.leave : Math.min(m.max, m.base + d * m.k);
        const flut = Math.sin(t * m.fy + f.seed) * m.fa, wob = Math.cos(t * m.wf + f.seed) * m.wo;
        const ax = (dx / d * sp + wob) - f.vx, ay = (dy / d * sp + flut) - f.vy;
        f.vx += ax * m.acc * dt / 16; f.vy += ay * m.acc * dt / 16;
        f.x += f.vx * dt; f.y += f.vy * dt + Math.sin(t * m.jf + f.seed) * m.ja;
        f.ang += (Math.max(-0.5, Math.min(0.5, f.vx * 1.4)) - f.ang) * 0.1;
        if (Math.abs(f.vx) > 0.03) f.dir = f.vx > 0 ? 1 : -1;
        f.pit += (Math.max(-0.6, Math.min(0.6, Math.atan2(f.vy, Math.max(Math.abs(f.vx), 0.06)) * 0.6)) - f.pit) * 0.12;
        f.open = k === 'bee' ? Math.sin(t * 64 + f.seed) : k === 'dragonfly' ? 0.55 + 0.45 * Math.abs(Math.sin(t * 46 + f.seed)) : Math.abs(Math.cos(t * 17));
        if (f.st === 'fly' && d < (k === 'butterfly' ? 5 : 6)) this.landed(f, now);
        if (f.st === 'leave' && (f.x < -60 || f.x > this.W + 60 || f.y < -60)) return false;
      }
      if (k === 'bee') this.bee(B, f.x, f.y, f.sz, f.dir, f.pit, f.open, C);
      else if (k === 'dragonfly') this.dragonfly(B, f.x, f.y, f.sz, f.dir, f.pit, f.open, C);
      else this.butterfly(B, f.x, f.y, f.sz, f.ang, f.open, C);
      return true;
    });
  }
  butterfly(B, x, y, s, ang, o, C) {
    const ca = Math.cos(ang), sa = Math.sin(ang), T = (px, py) => [x + (px * ca - py * sa) * s, y + (px * sa + py * ca) * s];
    const wing = (cx, cy, rx, ry, a, side) => {
      const pts = [], c = Math.cos(a), sn = Math.sin(a);
      for (let k = 0; k < 22; k++) { const th = k / 22 * Math.PI * 2, r = 1 + 0.08 * Math.sin(th * 3), lx = Math.cos(th) * rx * r, ly = Math.sin(th) * ry * r; pts.push(T(side * (cx + lx * c - ly * sn) * (0.12 + 0.88 * o), cy + lx * sn + ly * c)); }
      return pts;
    };
    for (const sd of [-1, 1]) {
      B.fill(wing(0.46, 0.28, 0.36, 0.3, 0.5 * sd * sd, sd), C.text);
      B.fill(wing(0.55, -0.32, 0.55, 0.36, -0.55, sd), C.text);
      if (o > 0.35) B.fill(wing(0.66, -0.4, 0.13, 0.11, 0, sd), C.red);
    }
    const body = []; for (let k = 0; k < 18; k++) { const th = k / 18 * Math.PI * 2; body.push(T(Math.cos(th) * 0.08, Math.sin(th) * 0.48)); }
    B.fill(body, C.blue);
    const lw = Math.max(0.8, s * 0.05);
    B.stroke([T(0, -0.42), T(-0.14, -0.72), T(-0.24, -0.86)], C.blue, lw);
    B.stroke([T(0, -0.42), T(0.14, -0.72), T(0.24, -0.86)], C.blue, lw);
  }

  insectFrame(x, y, s, dir, pit) {
    const ang = pit * dir, ca = Math.cos(ang), sa = Math.sin(ang);
    const T = (px, py) => { const X = px * dir; return [x + (X * ca - py * sa) * s, y + (X * sa + py * ca) * s]; };
    const ell = (cx, cy, rx, ry, rot, n = 16) => {
      const c = Math.cos(rot), sn = Math.sin(rot), p = [];
      for (let k = 0; k < n; k++) { const th = k / n * Math.PI * 2, lx = Math.cos(th) * rx, ly = Math.sin(th) * ry; p.push(T(cx + lx * c - ly * sn, cy + lx * sn + ly * c)); }
      return p;
    };
    return { T, ell };
  }

  bee(B, x, y, s, dir, pit, fl, C) {
    const { T, ell } = this.insectFrame(x, y, s, dir, pit), lw = Math.max(0.8, s * 0.05);
    const wing = (a, al) => { const px = 0.12, py = -0.2; B.fill(ell(px + Math.cos(a) * 0.32, py + Math.sin(a) * 0.32, 0.34, 0.14, a), C.text, al); };
    wing(-2.0 + 0.7 * fl, 0.38);
    B.stroke([T(-0.67, 0.02), T(-0.84, 0.05)], C.blue, lw);
    B.fill(ell(-0.25, 0.02, 0.42, 0.28, 0), C.text);
    for (const sx of [-0.5, -0.32, -0.14]) B.fill(ell(sx, 0.02, 0.055, 0.22, 0, 10), C.vein);
    B.fill(ell(0.22, 0, 0.25, 0.24, 0), C.text);
    B.fill(ell(0.52, 0.02, 0.16, 0.15, 0), C.blue);
    B.stroke([T(0.6, -0.08), T(0.74, -0.3), T(0.84, -0.32)], C.blue, lw);
    wing(-1.35 + 0.7 * fl, 0.55);
  }

  dragonfly(B, x, y, s, dir, pit, o, C) {
    const { T, ell } = this.insectFrame(x, y, s, dir, pit), lw = Math.max(1, s * 0.11), len = 0.55 + 0.45 * o;
    for (const sd of [-1, 1]) for (let j = 0; j < 2; j++) {
      const px = [0.66, 0.46][j] - j * 0.04 * sd;
      B.fill(ell(px - 0.04 * sd * len, sd * 0.5 * len, 0.12, 0.5 * len, -sd * (0.26 + 0.1 * j)), C.text, 0.4);
    }
    B.stroke([T(0.38, 0), T(-0.5, 0.01)], C.blue, lw);
    B.stroke([T(-0.5, 0.01), T(-1.35, 0.03)], C.blue, lw * 0.62);
    for (const mx of [0.1, -0.15, -0.4, -0.65, -0.9, -1.15]) B.stroke([T(mx, -0.05), T(mx, 0.05)], C.vein, lw * 0.35);
    B.fill(ell(0.55, 0, 0.24, 0.14, 0), C.blue);
    B.fill(ell(0.88, 0, 0.12, 0.13, 0), C.red);
  }
  faceTurn(e, x, y) {
    let wx = 0, wy = 0;
    if (this.mx != null) {
      const dx = this.mx - x, dy = this.my - y, d = Math.hypot(dx, dy), reach = 300;
      if (d < reach && d > 0.001) {
        const w = 1 - d / reach, s = w * w * (3 - 2 * w) * Math.min(1, d / 40);
        wx = dx / d * s; wy = dy / d * s;
      }
    }
    const c = this.fa[e.id] || [0, 0];
    c[0] += (wx - c[0]) * 0.09; c[1] += (wy - c[1]) * 0.09;
    this.fa[e.id] = c;
    return c;
  }

  h(n) { const x = Math.sin(n) * 43758.5453; return x - Math.floor(x); }
  spr(t, k = 7, w = 16) { if (t <= 0) return 0; return 1 - Math.exp(-t * k / this.cfg.bounce) * Math.cos(t * w); }
  eo(t) { if (t <= 0) return 0; if (t >= 1) return 1; return 1 - Math.pow(1 - t, 3); }
  rng(seed) {
    let s = seed | 0;
    return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  bez(a, b, c, d, n) {
    const P = [];
    for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t;
      P.push([u*u*u*a[0] + 3*u*u*t*b[0] + 3*u*t*t*c[0] + t*t*t*d[0], u*u*u*a[1] + 3*u*u*t*b[1] + 3*u*t*t*c[1] + t*t*t*d[1]]); }
    return P;
  }
  at(P, u) {
    const n = P.length; const i = Math.min(n - 2, Math.max(1, Math.round(u * (n - 1))));
    return [P[i], Math.atan2(P[i+1][1] - P[i-1][1], P[i+1][0] - P[i-1][0])];
  }
  jit(id, f, amp) {
    if (!amp) return [0, 0, 0];
    return [(this.h(id*1.37 + f*7.13)*2 - 1)*amp, (this.h(id*2.71 + f*3.11)*2 - 1)*amp, (this.h(id*5.3 + f*1.7)*2 - 1)*0.035];
  }
  path(c, p, closed) {
    const n = p.length; if (n < 2) return;
    const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if (closed) {
      const s = m(p[n-1], p[0]); c.moveTo(s[0], s[1]);
      for (let i = 0; i < n; i++) { const q = m(p[i], p[(i+1) % n]); c.quadraticCurveTo(p[i][0], p[i][1], q[0], q[1]); }
      c.closePath();
    } else {
      c.moveTo(p[0][0], p[0][1]);
      for (let i = 1; i < n - 1; i++) { const q = m(p[i], p[i+1]); c.quadraticCurveTo(p[i][0], p[i][1], q[0], q[1]); }
      c.lineTo(p[n-1][0], p[n-1][1]);
    }
  }
  backend(g) {
    const self = this;
    return {
      fill: (p, col, al) => { g.beginPath(); self.path(g, p, true); g.fillStyle = col; if (al != null) g.globalAlpha = al; g.fill(); if (al != null) g.globalAlpha = 1; },
      stroke: (p, col, w, closed) => { g.beginPath(); self.path(g, p, !!closed); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); },
      fillMany: (list, col) => { g.beginPath(); for (let i = 0; i < list.length; i++) self.path(g, list[i], true); g.fillStyle = col; g.fill(); },
      strokeMany: (list, col, w) => { g.beginPath(); for (let i = 0; i < list.length; i++) self.path(g, list[i], true); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); },
      rect: (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); },
      text: (ch, x, y, S, col) => {
        if (g._fgS !== S || g._fgF !== self.F) { g.font = `${self.FW} ${S}px ${self.F}`; g._fgS = S; g._fgF = self.F; }
        if (g._fgA !== 1) { g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g._fgA = 1; }
        g.fillStyle = col; g.fillText(ch, x, y);
      }
    };
  }
  vine(base, dir, len, amp, waves, ph, bend, n) {
    n = n || 40; const P = [[base[0], base[1]]], step = len / n; let x = base[0], y = base[1];
    for (let i = 1; i <= n; i++) {
      const u = i / n, a = dir + bend * u + amp * Math.sin(u * Math.PI * waves + ph) * Math.min(1, u * 3);
      x += Math.cos(a) * step; y += Math.sin(a) * step; P.push([x, y]);
    }
    return P;
  }
  curl(P, sign, rad) {
    const n = P.length, e = P[n - 1], a = Math.atan2(e[1] - P[n - 2][1], e[0] - P[n - 2][0]);
    const c = [e[0] - Math.sin(a) * sign * rad, e[1] + Math.cos(a) * sign * rad];
    const a0 = Math.atan2(e[1] - c[1], e[0] - c[0]);
    for (let i = 1; i <= 14; i++) { const u = i / 14, t = a0 + sign * u * Math.PI * 1.6, rr = rad * (1 - 0.5 * u); P.push([c[0] + Math.cos(t) * rr, c[1] + Math.sin(t) * rr]); }
    return P;
  }
  weave(r, startLayer) {
    const cuts = []; const nc = 1 + Math.floor(r() * 3);
    for (let i = 0; i < nc; i++) cuts.push(0.15 + r() * 0.7);
    cuts.sort((a, b) => a - b);
    const segs = []; let u0 = 0, layer = startLayer;
    for (const c of cuts) {
      if (c <= u0) continue;
      segs.push({ u0, u1: c, layer });
      if (r() < 0.3) { const g = 0.02 + r() * 0.03; u0 = Math.min(0.98, c + g); } else u0 = c;
      layer = 1 - layer;
    }
    segs.push({ u0, u1: 1, layer });
    return segs;
  }
  layerAt(segs, u) { for (const s of segs) if (u >= s.u0 && u <= s.u1) return s.layer; return segs[segs.length - 1].layer; }

  resize() {
    if (this._rz) return;
    if (this._rzDone) { this._rz = requestAnimationFrame(() => { this._rz = 0; this.resizeNow(); }); return; }
    this._rzDone = true;
    this.resizeNow();
  }
  resizeNow() {
    const c = this.el.cv, r = c.getBoundingClientRect(), d = window.devicePixelRatio || 1;
    if (!r.width) return;
    this.W = r.width; this.H = r.height;
    this.dpr = Math.min(d, 2);
    c.width = Math.round(r.width * this.dpr); c.height = Math.round(r.height * this.dpr);
    this.g._fgS = -1;
    this.clearToBg();
    this.layout(true);
    this.placePlanters();
  }
  clearToBg() {
    const g = this.g, d = this.dpr;
    g.setTransform(d, 0, 0, d, 0, 0);
    g.fillStyle = this.pal().bg;
    g.fillRect(0, 0, this.W, this.H);
  }
  mw(ch) {
    if (this.cache[ch] != null) return this.cache[ch];
    this.g.font = `${this.FW} 100px ${this.F}`;
    this.g._fgS = 100; this.g._fgF = this.F;
    let w = this.g.measureText(ch).width / 100;
    if (ch === ' ') w *= 1.4;
    return (this.cache[ch] = w);
  }

  layoutCore(A, W, H, prevWrapped) {

    const maxW = W * (this.phone.matches ? 0.94 : 0.82), S0 = H * 0.3, LH = 2.1;
    const ws = A.map(l => this.mw(l.ch));
    const words = []; let cur = null;
    A.forEach((l, i) => {
      if (l.ch === ' ') { if (cur) { words.push(cur); cur = null; } words.push({ sp: true, idx: [i] }); }
      else { if (!cur) cur = { idx: [] }; cur.idx.push(i); }
    });
    if (cur) words.push(cur);
    const lineW = (li, S) => { let e = li.length; while (e > 0 && A[li[e-1]].ch === ' ') e--; let w = 0; for (let k = 0; k < e; k++) w += ws[li[k]]; return w * S; };
    const wrap = S => {
      const lines = [[]]; let lw = 0;
      for (const w of words) {
        const ww = w.idx.reduce((s, i) => s + ws[i], 0) * S;
        if (!w.sp && lw > 0 && lw + ww > maxW) { lines.push([]); lw = 0; }
        lines[lines.length - 1].push(...w.idx); lw += ww;
      }
      return lines;
    };
    let lines = [A.map((_, i) => i)];
    const unit = lineW(lines[0], 1);
    let S = unit > 0 ? Math.min(S0, maxW / unit) : S0;
    const multi = words.filter(w => !w.sp).length > 1;
    let wrapped = multi && (S < H * 0.1 || (prevWrapped && S < H * 0.14));
    if (wrapped) {
      let lo = H * 0.03, hi = H * 0.15;
      for (let k = 0; k < 22; k++) {
        const mid = (lo + hi) / 2, ls = wrap(mid);
        const ok = ls.every(li => lineW(li, mid) <= maxW) && ls.length * LH * mid <= H * 0.82;
        if (ok) lo = mid; else hi = mid;
      }
      S = lo; lines = wrap(S);
      if (lines.length < 2) wrapped = false;
    }
    const n = lines.length, lh = LH * S;
    lines.forEach((li, k) => {
      let x = W / 2 - lineW(li, S) / 2;
      const y = H / 2 + (k - (n - 1) / 2) * lh + 0.33 * S;
      li.forEach(i => { const l = A[i], w = ws[i] * S; l.tx = x + w / 2; l.ty = y; l.tw = w; l.line = k; x += w; });
    });
    return { S, wrapped, n };
  }
  layout(snap) {
    if (!this.W) return;
    const A = this.letters.filter(l => !l.dead);
    const res = this.layoutCore(A, this.W, this.H, this.wrapped);
    this.wrapped = res.wrapped;
    A.forEach(l => { if (l.x == null) { l.x = l.tx; l.y = l.ty; } });
    const S = res.S, last = A[A.length - 1];
    this.St = S;
    this.ctx_ = last ? last.tx + last.tw / 2 + 0.07 * S : this.W / 2;
    this.cty = last ? last.ty - 0.33 * S : this.H / 2;
    if (snap || !this.Sd) { this.Sd = S; this.cx = this.ctx_; this.cy = this.cty; A.forEach(l => { l.x = l.tx; l.y = l.ty; }); }
  }

  add(ch, now) {
    const A = this.letters.filter(l => !l.dead), last = A[A.length - 1];
    if (ch === ' ') {
      if (last && last.ch !== ' ') { last.cut = now; this.genEnd(last, (now - last.birth) * this.cfg.speed); }
      this.letters.push({ ch: ' ', id: this.uid++, birth: now, els: [] });
      this.layout(); return;
    }
    const same = last && last.ch !== ' ';
    const l = { ch, id: this.uid++, birth: now, tb: now, ws: same ? last.ws : Math.floor(this.rand() * 1e9), wi: same ? last.wi + 1 : 0, prev: same ? last : null };
    this.gen(l);
    this.letters.push(l);
    this.layout();
  }

  wordParams(ws) {
    const r = this.rng(ws * 7 + 13), dens = this.cfg.density;
    return { roseP: 0.3 + r() * 0.3, leafy: (0.6 + r() * 0.8) * dens, dens, lean: (r() - 0.5) * 0.6, big: (0.85 + r() * 0.45) * this.plantScale(), curvy: 0.8 + r() * 0.6, bridgeP: Math.min(0.95, (0.45 + r() * 0.35) * dens), w: 0.5 };
  }
  plantScale() { return this.phone.matches ? 1.3 : 1; }
  grow(r, E, nid, p, o) {
    const tip = o.tip || (r() < p.roseP ? 'rose' : r() < 0.45 ? 'fan' : r() < 0.6 ? 'leaf' : 'curl');
    let P = o.pts || this.vine(o.base, o.dir, o.len, (0.35 + r() * 0.45) * p.curvy, 1 + r() * 1.6, r() * 6.28, (r() - 0.5) * 1.2, 40);
    if (tip === 'curl') P = this.curl(P, r() < 0.5 ? -1 : 1, 0.05 + r() * 0.05);
    const segs = this.weave(r, o.layer0 != null ? o.layer0 : (r() < 0.5 ? 0 : 1));
    const dur = Math.max(320, (o.len || 0.8) * 620);
    const thorns = []; const nt = Math.floor(r() * 2.5);
    for (let i = 0; i < nt; i++) thorns.push({ u: 0.15 + r() * 0.65, s: r() < 0.5 ? -1 : 1 });
    E.push({ t: 'stem', id: nid(), pts: P, segs, d0: o.d0, dur, w: o.depth ? 0.82 : 1, thorns });
    const nl = Math.floor(r() * 2.8 * p.leafy);
    let sd = r() < 0.5 ? -1 : 1;
    for (let i = 0; i < nl; i++) {
      const u = 0.25 + r() * 0.6, [q, a] = this.at(P, u); sd = -sd;
      E.push({ t: 'leaf', id: nid(), x: q[0], y: q[1], a: a + sd * (0.55 + r() * 0.5), L: (0.14 + r() * 0.2) * (o.depth ? 0.8 : 1), bend: (r() - 0.5) * 1.2, layer: this.layerAt(segs, u), d0: o.d0 + dur * u });
    }
    const [tp, ta] = this.at(P, 1), td = o.d0 + dur * 0.8, tl = this.layerAt(segs, 1);
    if (tip === 'rose') {
      const R = (0.13 + r() * 0.15) * p.big * (o.depth ? 0.75 : 1);

      const over = tp[1] > -0.78 && tp[1] < 0.05 && Math.abs(tp[0]) < p.w * 0.5;
      const layer = over ? (r() < (this.phone.matches ? 0.08 : 0.22) ? 1 : 0) : (r() < 0.6 ? 1 : tl);
      E.push({ t: 'rose', kind: this.pickKind(r), id: nid(), x: tp[0], y: tp[1], R, rot: (r() - 0.5) * 1.0, ph1: r() * 6.28, ph2: r() * 6.28, turns: 1.8 + r() * 1, layer, d0: td });
      if (r() < 0.2) { const oo = ta + (r() < 0.5 ? 1 : -1) * 1.3; E.push({ t: 'rose', kind: this.pickKind(r), id: nid(), x: tp[0] + Math.cos(oo) * R * 1.4, y: tp[1] + Math.sin(oo) * R * 1.4, R: R * (0.6 + r() * 0.3), rot: (r() - 0.5) * 1.2, ph1: r() * 6.28, ph2: r() * 6.28, turns: 1.8 + r(), layer, d0: td + 120 }); }
    } else if (tip === 'fan') {
      const spread = 0.6 + r() * 0.3;
      for (let j = 0; j < 2; j++) E.push({ t: 'leaf', id: nid(), x: tp[0], y: tp[1], a: ta + (j - 0.5) * spread, L: 0.2 + r() * 0.2, bend: (j - 0.5) * 0.8, layer: tl, d0: td + j * 60 });
    } else if (tip === 'leaf') {
      E.push({ t: 'leaf', id: nid(), x: tp[0], y: tp[1], a: ta + (r() - 0.5) * 0.3, L: 0.16 + r() * 0.16, bend: (r() - 0.5), layer: tl, d0: td });
    }
    if (!o.depth && r() < 0.3) {
      const u = 0.35 + r() * 0.35, [q, a] = this.at(P, u);
      this.grow(r, E, nid, p, { base: q, dir: a + (r() < 0.5 ? -1 : 1) * (0.7 + r() * 0.4), len: (o.len || 0.8) * (0.35 + r() * 0.2), d0: o.d0 + dur * u, depth: 1, layer0: this.layerAt(segs, u) });
    }
    return P;
  }
  gen(l) {
    const r = this.rng((l.ws ^ Math.imul(l.wi + 1, 2654435761)) + Math.floor(this.rand() * 1e6));
    const p = this.wordParams(l.ws), E = []; let k0 = 0; const nid = () => l.id * 100 + (k0++);
    const ps = this.plantScale();
    const w = this.mw(l.ch), inX = () => (r() - 0.5) * w * 0.7; p.w = w;
    const nUp = 1 + (r() < 0.45 * p.dens ? 1 : 0);
    for (let i = 0; i < nUp; i++) {
      this.grow(r, E, nid, p, { base: [inX(), -r() * 0.3], dir: -Math.PI / 2 + p.lean * 0.5 + (r() - 0.5) * 0.7, len: (0.6 + r() * 0.5) * ps, d0: 40 + i * 130, tip: l.wi === 0 && i === 0 ? 'rose' : null });
    }
    if (r() < 0.4 * p.dens) this.grow(r, E, nid, p, { base: [inX(), -0.1 - r() * 0.35], dir: Math.PI / 2 + (r() - 0.5) * 0.8, len: (0.35 + r() * 0.35) * ps, d0: 160 });
    if (l.prev && r() < p.bridgeP) {
      const px = -(this.mw(l.prev.ch) + w) / 2;
      const a = [inX(), -0.05 - r() * 0.55], b = [px + (r() - 0.5) * 0.25, -0.05 - r() * 0.55];
      const bulge = (r() < 0.55 ? -1 : 1) * (0.4 + r() * 0.4) * ps, dx = b[0] - a[0];
      let P = this.bez(a, [a[0] + dx * 0.15, a[1] + bulge], [b[0] - dx * 0.15, b[1] + bulge * 0.9], b, 40);
      if (r() < 0.45) P = P.slice(0, Math.floor(P.length * (0.7 + r() * 0.2)));
      this.grow(r, E, nid, p, { pts: P, len: (Math.abs(dx) + Math.abs(bulge)) * ps, d0: 90, tip: r() < 0.5 ? 'curl' : r() < 0.5 ? 'leaf' : 'rose' });
    }
    if (l.wi === 0) this.grow(r, E, nid, p, { base: [-w * 0.3, -0.15 - r() * 0.4], dir: Math.PI + (r() - 0.5) * 1.2, len: (0.45 + r() * 0.3) * ps, d0: 120, tip: 'curl' });
    l.els = E;
    l.endEls = null;
    const T = [], tr = this.rng(l.id * 977 + Math.floor(this.rand() * 1e6));
    this.grow(tr, T, () => l.id * 100 + 90 + T.length, p, { base: [w * 0.25, -0.1 - tr() * 0.45], dir: (tr() - 0.5) * 1.4, len: 0.45 + tr() * 0.25, d0: 0, tip: 'curl', depth: 1 });
    l.tend = T.filter(e => e.t === 'stem').slice(0, 1);
  }
  genEnd(l, rel) {
    const r = this.rng(l.ws + l.wi * 31 + Math.floor(this.rand() * 1e6)), p = this.wordParams(l.ws), E = [];
    let k0 = 50; const nid = () => l.id * 100 + (k0++);
    const w = this.mw(l.ch), n = 1 + Math.floor(r() * 2.5); p.w = w;
    for (let i = 0; i < n; i++) {
      const dir = -Math.PI / 2 + 0.6 + (i - (n - 1) / 2) * 0.9 + (r() - 0.5) * 0.4;
      this.grow(r, E, nid, p, { base: [(r() - 0.2) * w * 0.6, -r() * 0.5], dir, len: 0.4 + r() * 0.45, d0: rel + 40 + i * 90, depth: 1, tip: i === 0 || r() < 0.5 ? 'rose' : 'fan' });
    }
    l.endEls = E;
  }

  strokeRange(B, P, a, b, col, w) {
    const n = P.length - 1, ia = a * n, ib = b * n;
    const lerp = t => { const i = Math.min(n - 1, Math.floor(t)), f = t - i; return [P[i][0] + (P[i+1][0] - P[i][0]) * f, P[i][1] + (P[i+1][1] - P[i][1]) * f]; };
    const pts = [lerp(ia)];
    for (let i = Math.floor(ia) + 1; i < ib; i++) pts.push(P[i]);
    pts.push(lerp(ib));
    if (pts.length >= 2) B.stroke(pts, col, w);
  }
  thorn(B, P, u, s, S) {
    const [p, a] = this.at(P, u), d = a + s * 2.3, L = S * 0.045;
    B.stroke([p, [p[0] + Math.cos(d) * L, p[1] + Math.sin(d) * L]], this.cc.blue, S * 0.022);
  }
  leaf(B, bx, by, a, L, bend) {
    if (L < 0.5) return;
    const ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca;
    const ax = u => { const b = Math.sin(Math.PI * u) * bend * 0.15 * L; return [bx + ca * u * L + px * b, by + sa * u * L + py * b]; };
    const hw = u => L * 0.18 * Math.sin(Math.PI * Math.pow(u, 0.8));
    const N = L < 10 ? 6 : L < 26 ? 9 : 12, s1 = [], s2 = [];
    for (let i = 0; i <= N; i++) { const u = i / N, c = ax(u), w = hw(u); s1.push([c[0] + px * w, c[1] + py * w]); s2.push([c[0] - px * w, c[1] - py * w]); }
    const tip = ax(1), base = ax(0);
    B.fill([base, ...s1.slice(1, N), tip, tip, ...s2.slice(1, N).reverse(), base], this.cc.blue);
    if (L > 6) { const v = []; for (let i = 0; i <= 8; i++) v.push(ax(0.08 + 0.72 * i / 8)); B.stroke(v, this.cc.vein, Math.max(0.8, L * 0.03)); }
  }
  rose(B, cx, cy, R, rot, e, a, tl) {
    const cr = Math.cos(rot), sr = Math.sin(rot);
    const tm = tl ? Math.hypot(tl[0], tl[1]) : 0, ux = tm ? tl[0] / tm : 0, uy = tm ? tl[1] / tm : 0, sq = -0.28 * tm;
    const T = (x, y, z = 0) => {
      let dx = x * cr - y * sr, dy = x * sr + y * cr;
      if (tm) { const k = (dx * ux + dy * uy) * sq; dx += k * ux + tl[0] * R * z; dy += k * uy + tl[1] * R * z; }
      return [cx + dx, cy + dy];
    };

    const P = [
      [0, -0.36, 0.56, 0.54, 0, 0, 0],
      [-0.5, -0.06, 0.6, 0.6, -0.35, 0, 0],
      [0.52, -0.06, 0.6, 0.6, 0.35, 0, 0],
      [-0.42, 0.3, 0.62, 0.48, 0.2, 0.12, 1],
      [0.47, 0.3, 0.62, 0.48, -0.2, 0.12, 1],
      [0.05, 0.42, 0.56, 0.38, 0, 0.14, 0]
    ];
    const ax0 = 0, ay0 = 0.5, lw = Math.max(0.8, R * 0.045), st = 85;
    P.forEach((q, i) => {
      const s = this.spr((a - i * st) / 1000, 8, 14); if (s <= 0.001) return;
      const open = (1 - Math.min(1, s)) * (q[0] < 0 ? 0.5 : -0.5), ang = q[4] + open, ca = Math.cos(ang), sa = Math.sin(ang);
      const pt = th => {
        const rr = 1 + 0.08 * Math.sin(3 * th + e.ph1 + i) + 0.04 * Math.sin(5 * th + e.ph2);
        const lx = Math.cos(th) * q[2] * rr, ly = Math.sin(th) * q[3] * rr;
        const px = q[0] + lx * ca - ly * sa, py = q[1] + lx * sa + ly * ca;
        return T((ax0 + (px - ax0) * s) * R, (ay0 + (py - ay0) * s) * R, q[5]);
      };
      const n = this.tess(2 * q[2] * R * s), pts = []; for (let k = 0; k < n; k++) pts.push(pt(k / n * Math.PI * 2));
      B.fill(pts, this.cc.red);
      if (q[6] && R >= 12 && s > 0.4) {
        const arc = []; for (let k = 0; k <= 14; k++) arc.push(pt(Math.PI * (1.18 + 0.64 * k / 14)));
        this.strokeRange(B, arc, 0, Math.min(1, (s - 0.4) / 0.5), this.cc.line, lw * 0.8);
      }
    });
    const fr = this.eo((a - P.length * st - 80) / 520);
    if (fr > 0 && R > 3) {
      const sp = [], scl = [];
      const turns = R < 20 ? Math.min(e.turns, 1.3) : R < 32 ? e.turns * 0.8 : e.turns;
      for (let i = 0; i <= 70; i++) { const u = i / 70, th = e.ph1 + u * turns * Math.PI * 2, rr = R * (0.08 + 0.57 * u); sp.push(T(Math.cos(th) * rr * 1.05, Math.sin(th) * rr * 0.72 - 0.12 * R, 0.34 - 0.24 * u)); }
      this.strokeRange(B, sp, 0, fr, this.cc.line, lw);
      if (R >= 14) {
        for (let i = 0; i <= 36; i++) { const u = i / 36; scl.push(T((-0.72 + 1.5 * u) * R, 0.36 * R + 0.16 * R * Math.abs(Math.sin(u * Math.PI * 3)), 0.18)); }
        this.strokeRange(B, scl, 0, fr, this.cc.line, lw);
      }
    }
  }

  frame() {
    const now = performance.now(), dt = Math.min(64, now - (this.lt || now)); this.lt = now;
    if (!this.W) return;
    const k = 1 - Math.exp(-dt / 80);
    this.Sd += (this.St - this.Sd) * k;
    this.cx += (this.ctx_ - this.cx) * k; this.cy += (this.cty - this.cy) * k;
    for (const l of this.letters) if (!l.dead && l.tx != null) { l.x += (l.tx - l.x) * k; l.y += (l.ty - l.y) * k; }
    if (this.letters.some(l => l.dead && now - l.dead > 300)) this.letters = this.letters.filter(l => !(l.dead && now - l.dead > 300));

    this.paint(now, !!this.typing && this.letters.length > 0);
  }
  pal() {
    const i = this.state.palette;
    if (this._palI === i) return this._pal;
    const p = this.PAL[i] || this.PAL[0];
    this._palI = i;
    return (this._pal = { bg: p[1], C: { red: p[2], blue: p[3], line: p[4], text: p[5], vein: p[1] } });
  }
  mainState() { return { letters: this.letters, S: this.Sd, C: this.pal().C, boil: this.cfg.boil, recoil: this.cfg.recoil, speed: this.cfg.speed, wither: 260, face: true, sway: this.cfg.sway }; }
  paint(now, caret) {
    const g = this.g, d = this.dpr, t0 = performance.now();
    g.setTransform(d, 0, 0, d, 0, 0);
    g.fillStyle = this.pal().bg; g.fillRect(0, 0, this.W, this.H);
    const B = this.BK, st = this.mainState();
    this.render(B, now, st);
    this.drawFlies(B, now, st.C);
    if (caret) {
      const S = this.Sd, on = now - this.lastKey < 500 || Math.floor(now / 530) % 2 === 0, hf = this.eo((now - this.t0) / 600);
      if (on && hf > 0) { const h = 0.8 * S * hf, w = Math.max(2, S * 0.03); B.rect(this.cx - w / 2, this.cy - h / 2, w, h, st.C.text); }
    }
    const ms = performance.now() - t0;
    this.msAvg = this.msAvg ? this.msAvg + (ms - this.msAvg) * 0.1 : ms;
    if (this.msAvg > 12) this.pace = 32;
    else if (this.msAvg < 7) this.pace = 0;
  }

  relax(L, S, now, sp, smooth) {
    const KF = this.KF, items = [];
    for (const l of L) {
      if (l.dead || l.ch === ' ' || !l.els) continue;
      const age = (now - l.birth) * sp;
      for (let pass = 0; pass < 2; pass++) {
        const list = pass ? l.endEls : l.els;
        if (!list) continue;
        for (const e of list) {
          if (e.t !== 'rose' || age - e.d0 < 0) continue;
          items.push({ e, x: l.x + e.x * S, y: l.y + e.y * S, r: e.R * S * (KF[e.kind || 'rose'] || 1), o: l.birth + e.d0 / sp, k: 1 });
        }
      }
    }
    items.sort((a, b) => a.o - b.o);
    const kept = [];
    for (const it of items) {
      if (it.r < 0.5) continue;
      let k = 1;
      for (const q of kept) { const d = Math.hypot(it.x - q.x, it.y - q.y); k = Math.min(k, (d / 0.88 - q.r * q.k) / it.r); }
      if (k < (it.e._tk === 0 ? 0.55 : 0.42)) k = 0;
      it.k = k; it.e._tk = k;
      if (k > 0) kept.push(it);
    }
    for (const it of items) {
      const e = it.e;
      e._k = (smooth && e._k != null) ? e._k + (it.k - e._k) * 0.14 : it.k;
      if (it.k === 0 && e._k < 0.04) e._k = 0;
    }
  }
  render(B, now, st) {
    const S = st.S, L = st.letters, sp = st.speed || 1;
    this._pass++;

    let nxt = null;
    for (let i = L.length - 1; i >= 0; i--) { const l = L[i]; l._nx = l.dead ? null : nxt; if (!l.dead) nxt = l; }
    let PD = L;
    const PL = this.planters;
    if (PL && PL.length) {
      const pd = this._pd || (this._pd = []);
      pd.length = 0;
      for (let i = 0; i < L.length; i++) pd.push(L[i]);
      for (let i = 0; i < PL.length; i++) { PL[i]._nx = null; pd.push(PL[i]); }
      PD = pd;
    }
    this.cc = st.C; this._now = now;
    if (st.face && this.perch.length) this.perch.length = 0;
    if (this.cfg.avoidOverlap) this.relax(L, S, now, sp, !!st.face);
    if (st.face) for (const l of L) {
      let tx = 0, ty = 0;
      if (this.mx != null && !l.dead && l.ch !== ' ') {
        const dx = this.mx - l.x, dy = this.my - (l.y - S * 0.6), d = Math.hypot(dx, dy), reach = Math.max(260, S * 3.2);
        if (d < reach && d > 1) { const w = 1 - d / reach, s = w * w * (3 - 2 * w); tx = dx / d * s; ty = dy / d * s; }
      }
      const c = l.lean || (l.lean = [0, 0]);
      c[0] += (tx - c[0]) * 0.07; c[1] += (ty - c[1]) * 0.07;
    }
    const f = st.boil ? Math.floor(now / this.cfg.boilMs) : 0, amp = st.boil ? Math.max(0.8, S * 0.01) * (this.cfg.boilAmp != null ? this.cfg.boilAmp : 1) : 0;
    const wither = st.wither;
    const draw = layer => {
      for (let pi = 0; pi < PD.length; pi++) {
        const l = PD[pi];
        if ((l.ch === ' ' && !l.planter) || !l.els) continue;
        const age = (now - l.birth) * sp, kk = l.dead ? 1 - this.eo((now - l.dead) / wither) : 1;
        const els = l.els;
        for (let i = 0; i < els.length; i++) {
          const e = els[i];
          if (e.t === 'stem') this.drawStem(B, e, l, age, kk, st, f, amp, layer);
          else if (e.layer === layer) this.drawEl(B, e, l, age, kk, st, f, amp);
        }
        const ends = l.endEls;
        if (ends) for (let i = 0; i < ends.length; i++) {
          const e = ends[i];
          if (e.t === 'stem') this.drawStem(B, e, l, age, kk, st, f, amp, layer);
          else if (e.layer === layer) this.drawEl(B, e, l, age, kk, st, f, amp);
        }
        if (l.tend && (l.dead || !l._nx || l._nx.ch === ' ')) {
          let fr = this.eo(((now - l.tb) * sp - 150) / 450);
          if (l.cut != null) fr *= 1 - this.eo((now - l.cut) * sp / 150) * Math.min(0.85, st.recoil / (0.6 * S));
          const t = l.tend;
          for (let i = 0; i < t.length; i++) this.drawStem(B, t[i], l, age, kk, st, f, amp, layer, fr * kk);
        }
      }
    };
    draw(0);
    for (const l of L) if (l.ch !== ' ' && !l.dead) B.text(l.ch, l.x, l.y, S, st.C.text);
    draw(1);
  }
  wpt(st, l, x, y) {
    if (l.birth != null && this._now != null) {
      const t = (this._now - l.birth) * (st.speed || 1) / 1000;
      if (t > 0 && t < 4) {
        const hh = Math.max(0, (l.y - y) / st.S), dmp = Math.exp(-t * 3.2 / this.cfg.bounce), dir = (l.id % 2 ? 1 : -1);
        const wob = this.cfg.wobble != null ? this.cfg.wobble : 1;
        x += st.S * 0.07 * wob * hh * dmp * Math.sin(t * 11) * dir;
        y += st.S * 0.035 * wob * hh * dmp * Math.sin(t * 11 + 1.2);
      }
    }
    if (st.face && l.lean) {
      const hh = Math.min(2.5, Math.max(0, (l.y - y) / st.S)), f = hh * hh * 0.5 + hh * 0.5;
      const la = this.cfg.leanAmt != null ? this.cfg.leanAmt : 1;
      x += l.lean[0] * st.S * 0.1 * la * f;
      y += l.lean[1] * st.S * 0.05 * la * f;
    }
    if (st.sway) {
      const hh = Math.max(0, (l.y - y) / st.S), t = this._now / 1000;
      x += Math.sin(t * 0.8 + l.x * 0.004 + hh * 1.1) * st.S * 0.02 * hh * st.sway;
      y += Math.cos(t * 0.6 + x * 0.003) * st.S * 0.006 * hh * st.sway;
    }
    return [x, y];
  }
  drawStem(B, e, l, age, kk, st, f, amp, layer, frO) {
    const S = st.S, fr = frO != null ? frO : this.eo((age - e.d0) / e.dur) * kk; if (fr <= 0) return;
    let P = e._wp;
    if (e._wpP !== this._pass) {
      e._wpP = this._pass;
      const j = this.jit(e.id, f, amp), src = e.pts, n = src.length;
      if (!P || P.length !== n) P = e._wp = new Array(n);
      for (let i = 0; i < n; i++) { const p = src[i]; P[i] = this.wpt(st, l, l.x + p[0] * S + j[0], l.y + p[1] * S + j[1]); }
    }
    const segs = e.segs;
    for (let i = 0; i < segs.length; i++) {
      const sg = segs[i];
      if (sg.layer !== layer) continue;
      const b = Math.min(sg.u1, fr); if (b <= sg.u0) continue;
      this.strokeRange(B, P, sg.u0, b, st.C.blue, S * 0.022 * (e.w || 1));
    }
    const thorns = e.thorns;
    for (let i = 0; i < thorns.length; i++) { const th = thorns[i]; if (fr > th.u && this.layerAt(segs, th.u) === layer) this.thorn(B, P, th.u, th.s, S); }
  }
  drawEl(B, e, l, age, kk, st, f, amp) {
    const S = st.S, j = this.jit(e.id, f, amp), wx = (x, y) => this.wpt(st, l, l.x + x * S + j[0], l.y + y * S + j[1]);
    if (e.t === 'leaf') {
      const sc = this.spr((age - e.d0) / 1000, 7, 15) * kk; if (sc <= 0) return;
      const p = wx(e.x, e.y); this.leaf(B, p[0], p[1], e.a + j[2], e.L * S * sc, e.bend);
    } else if (e.t === 'rose') {
      const a = age - e.d0; if (a < 0) return;
      if (kk <= 0.001) return;
      const kb = this.cfg.avoidOverlap && e._k != null ? e._k : 1;
      if (kb < 0.04) return;
      const Rr = e.R * S * kk * kb, p = wx(e.x, e.y), tl = st.face ? this.faceTurn(e, p[0], p[1]) : null;
      if (st.face && !l.dead && a > 700) this.perch.push({ id: e.id, x: p[0], y: p[1], R: Rr });
      this.bloom(B, p[0], p[1], Rr, e.rot + j[2] + (tl ? tl[0] * 0.22 : 0), e, a, tl);
    }
  }

  marigold(B, cx, cy, R, rot, e, a, tl) {
    const T = this.mkT(cx, cy, R, rot, tl), lw = Math.max(0.8, R * 0.03), C = this.cc;
    const rings = [[13, 0.58, 0.30, 0.19], [11, 0.40, 0.24, 0.16], [8, 0.23, 0.18, 0.13]];
    let i = 0;
    rings.forEach((rg, ri) => {
      const off = e.ph1 * 0.35 + ri * (Math.PI / rg[0]), ps = [];
      for (let k = 0; k < rg[0]; k++, i++) {
        const s = this.spr((a - i * 36) / 1000, 7, 13); if (s <= 0.001) continue;
        const th = off + k / rg[0] * Math.PI * 2;
        const rr = rg[1] * (0.92 + 0.08 * Math.sin(th * 3 + e.ph2));
        ps.push(this.blob(T,
          [Math.cos(th) * rr * 0.9, Math.sin(th) * rr * 0.84 - 0.04, rg[2], rg[3], th, 0.02 * ri],
          s, R, e, i + ri * 3, 0, 0, 1.5 + ri * 0.15));
      }
      if (!ps.length) return;
      B.fillMany(ps, C.red);
      if (R >= 9) B.strokeMany(ps, C.line, lw * 0.6);
    });
    const cs = this.spr((a - (i + 4) * 36) / 1000, 8, 12);
    if (cs > 0.001) {
      const c = [];
      for (let k = 0; k < 10; k++) { const th = k / 10 * Math.PI * 2; c.push(T(Math.cos(th) * 0.085 * R * cs, Math.sin(th) * 0.085 * R * cs * 0.9, 0.06)); }
      B.fill(c, C.line);
    }
  }
  pickKind(r) {
    const w = this.cfg.flowers || { rose: 1 }, ks = Object.keys(w).filter(k => w[k] > 0);
    if (!ks.length) return 'rose';
    let tot = 0; for (const k of ks) tot += w[k];
    let x = r() * tot; for (const k of ks) { x -= w[k]; if (x <= 0) return k; }
    return ks[ks.length - 1];
  }

  mkT(cx, cy, R, rot, tl) {
    const cr = Math.cos(rot), sr = Math.sin(rot);
    const tm = tl ? Math.hypot(tl[0], tl[1]) : 0, ux = tm ? tl[0] / tm : 0, uy = tm ? tl[1] / tm : 0, sq = -0.28 * tm;
    return (x, y, z = 0) => {
      let dx = x * cr - y * sr, dy = x * sr + y * cr;
      if (tm) { const k = (dx * ux + dy * uy) * sq; dx += k * ux + tl[0] * R * z; dy += k * uy + tl[1] * R * z; }
      return [cx + dx, cy + dy];
    };
  }

  tess(px) { return px < 8 ? 10 : px < 18 ? 14 : px < 40 ? 18 : 26; }
  blob(T, q, s, R, e, i, ax, ay, ruf) {
    const ca = Math.cos(q[4]), sa = Math.sin(q[4]), pts = [], n = this.tess(2 * q[2] * R * s);
    for (let k = 0; k < n; k++) {
      const th = k / n * Math.PI * 2, rr = 1 + (0.08 * Math.sin(3 * th + e.ph1 + i) + 0.04 * Math.sin(5 * th + e.ph2)) * ruf;
      const lx = Math.cos(th) * q[2] * rr, ly = Math.sin(th) * q[3] * rr;
      const px = q[0] + lx * ca - ly * sa, py = q[1] + lx * sa + ly * ca;
      pts.push(T((ax + (px - ax) * s) * R, (ay + (py - ay) * s) * R, q[5] || 0));
    }
    return pts;
  }

  lens(T, bx, by, tx, ty, hw, ls, bend, R) {
    const dx = (tx - bx) * ls, dy = (ty - by) * ls, L = Math.hypot(dx, dy) || 1e-6, nx = -dy / L, ny = dx / L, N = this.tess(L * R) > 14 ? 10 : 7, s1 = [], s2 = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N, w = hw * ls * Math.sin(Math.PI * Math.pow(u, 0.72)) * (1 + 0.25 * u), b = bend * Math.sin(Math.PI * u) * ls;
      const x = bx + dx * u + nx * b, y = by + dy * u + ny * b;
      s1.push(T((x + nx * w) * R, (y + ny * w) * R)); s2.push(T((x - nx * w) * R, (y - ny * w) * R));
    }
    return [s1[0], ...s1.slice(1, N), s1[N], s1[N], ...s2.slice(1, N).reverse(), s2[0]];
  }
  bloom(B, cx, cy, R, rot, e, a, tl) {
    const k = e.kind || 'rose';
    if (k === 'peony') return this.peony(B, cx, cy, R * 1.08, rot, e, a, tl);
    if (k === 'tulip') return this.tulip(B, cx, cy, R * 1.5, rot, e, a, tl);
    if (k === 'daisy') return this.daisy(B, cx, cy, R * 1.05, rot, e, a, tl);
    if (k === 'poppy') return this.poppy(B, cx, cy, R * 1.02, rot, e, a, tl);
    if (k === 'bell') return this.bell(B, cx, cy, R * 1.55, rot, e, a, tl);
    if (k === 'marigold') return this.marigold(B, cx, cy, R * 1.18, rot, e, a, tl);
    return this.rose(B, cx, cy, R, rot, e, a, tl);
  }

  plantEdges(past) {
    if (!this.W) return;
    const t0 = performance.now();
    this.planters = [];
    [-1, 1].forEach(side => {

      const rows = this.phone.matches
        ? [[0.15, 0.30, 0.52], [0.83, 0.30, 0.52]]
        : [[0.24, 0.30, 0.52], [0.55, 0.20, 0.32], [0.80, 0.30, 0.52]];
      for (let i = 0; i < rows.length; i++) {
        const r = this.rng(Math.floor(this.rand() * 1e9));
        const p = this.wordParams(Math.floor(this.rand() * 1e9));
        p.w = 0.4; p.lean = 0; p.big = 0.72 * this.plantScale(); p.leafy = 1.15;
        const P = {
          ch: ' ', id: (side < 0 ? 7100 : 7200) + i, planter: true, side,
          ay: rows[i][0] + r() * 0.04,
          x: 0, y: 0, els: [],
          birth: past ? t0 - 12000 + i * 60 : t0 + 700 + i * 240
        };
        const E = [], nid = () => P.id * 100 + E.length;

        const inward = side < 0 ? -0.5 - r() * 0.6 : Math.PI + 0.5 + r() * 0.6;
        const ps = this.plantScale();
        this.grow(r, E, nid, p, {
          base: [side * -0.03, 0.02 + r() * 0.1],
          dir: inward, len: (rows[i][1] + r() * (rows[i][2] - rows[i][1])) * ps, d0: 0, tip: 'rose', depth: 0
        });

        if (r() < 0.75) {
          this.grow(r, E, nid, p, {
            base: [side * -0.02, 0.06 + r() * 0.16],
            dir: inward + (r() - 0.5) * 0.9, len: (0.18 + r() * 0.16) * ps,
            d0: 120 + r() * 160, depth: 1, tip: r() < 0.5 ? 'curl' : 'fan'
          });
        }
        P.els = E;
        this.planters.push(P);
      }
    });
    this.placePlanters();
  }

  placePlanters() {
    if (!this.planters) return;
    const S = this.Sd || this.H * 0.28;
    for (const P of this.planters) {
      P.x = P.side < 0 ? -0.03 * S : this.W + 0.03 * S;
      P.y = P.ay * this.H;
    }
  }
  peony(B, cx, cy, R, rot, e, a, tl) {
    const T = this.mkT(cx, cy, R, rot, tl), lw = Math.max(0.8, R * 0.04), st = 60, C = this.cc;
    const rings = [[7, 0.5, 0.5, 0.36], [6, 0.34, 0.42, 0.32], [5, 0.17, 0.32, 0.26]];
    let i = 0;
    rings.forEach((rg, ri) => {
      const ps = [];
      for (let k = 0; k < rg[0]; k++, i++) {
        const s = this.spr((a - i * st) / 1000, 8, 13); if (s <= 0.001) continue;
        const th = e.ph1 * 0.4 + ri * 0.55 + k / rg[0] * Math.PI * 2;
        ps.push(this.blob(T, [Math.cos(th) * rg[1], Math.sin(th) * rg[1] * 0.88 - 0.04, rg[2], rg[3], th, 0.05 * ri], s, R, e, i, 0, 0, 1.3));
      }
      if (!ps.length) return;
      B.fillMany(ps, C.red);
      if (R >= 10) B.strokeMany(ps, C.line, lw * 0.7);
    });
    const fr = this.eo((a - i * st - 100) / 500);
    if (fr > 0 && R > 4) {
      const sp = [];
      for (let n = 0; n <= 40; n++) { const u = n / 40, th = e.ph1 + u * 2.2 * Math.PI * 2, rr = R * (0.02 + 0.13 * u); sp.push(T(Math.cos(th) * rr, Math.sin(th) * rr * 0.8, 0.1)); }
      this.strokeRange(B, sp, 0, fr, C.line, lw);
    }
  }
  tulip(B, cx, cy, R, rot, e, a, tl) {
    const T = this.mkT(cx, cy, R, rot, tl), lw = Math.max(0.8, R * 0.045), C = this.cc;
    const o = this.spr((a - 350) / 1000, 4.5, 9);
    const sp = 0.1 + 0.36 * Math.max(0, Math.min(1.35, o));
    const petals = [
      [0, 0.45, 0, -0.98, 0.3, 0],
      [-0.05, 0.5, -sp, -0.8, 0.36, 0.12],
      [0.05, 0.5, sp, -0.8, 0.36, -0.12],
      [0, 0.56, sp * 0.08, -0.84, 0.4, 0]
    ];
    petals.forEach((q, i) => {
      const ls = this.spr((a - i * 90) / 1000, 7, 12); if (ls <= 0.001) return;
      const pts = this.lens(T, q[0], q[1], q[2], q[3], q[4], ls, q[5], R);
      B.fill(pts, C.red);
      if (R >= 10) B.stroke(pts, C.line, lw * 0.7, true);
    });
    const fr = this.eo((a - 420) / 400);
    if (fr > 0 && R > 5) this.strokeRange(B, [T(0, 0.52 * R, 0.1), T(sp * 0.04 * R, -0.2 * R, 0.1), T(sp * 0.08 * R, -0.62 * R, 0.1)], 0, fr, C.line, lw * 0.9);
  }
  daisy(B, cx, cy, R, rot, e, a, tl) {
    const T = this.mkT(cx, cy, R, rot, tl), lw = Math.max(0.8, R * 0.04), C = this.cc;
    const rings = [[10, 0.56, 0.4, 0.15], [10, 0.46, 0.32, 0.14]];
    let i = 0;
    rings.forEach((rg, ri) => {
      const ps = [];
      for (let k = 0; k < rg[0]; k++, i++) {
        const s = this.spr((a - i * 35) / 1000, 8, 13); if (s <= 0.001) continue;
        const th = e.ph1 + ri * Math.PI / rg[0] + k / rg[0] * Math.PI * 2;
        ps.push(this.blob(T, [Math.cos(th) * rg[1], Math.sin(th) * rg[1] * 0.92, rg[2], rg[3], th, 0.03 * ri], s, R, e, i, 0, 0, 0.6));
      }
      if (!ps.length) return;
      B.fillMany(ps, C.red);
      if (ri === 1 && R >= 10) B.strokeMany(ps, C.line, lw * 0.6);
    });
    const cs = this.spr((a - 20 * 35 - 40) / 1000, 8, 12);
    if (cs > 0.001) {
      const c = []; for (let k = 0; k < 16; k++) { const th = k / 16 * Math.PI * 2; c.push(T(Math.cos(th) * 0.2 * R * cs, Math.sin(th) * 0.2 * R * cs * 0.92, 0.1)); }
      B.fill(c, C.line);
      if (R >= 14) for (let k = 0; k < 7; k++) { const th = k * 2.39996, rr = (0.05 + 0.11 * Math.sqrt(k / 7)) * R * cs, d = []; for (let m = 0; m < 8; m++) { const t2 = m / 8 * Math.PI * 2; d.push(T(Math.cos(th) * rr + Math.cos(t2) * 0.025 * R, Math.sin(th) * rr * 0.92 + Math.sin(t2) * 0.025 * R, 0.12)); } B.fill(d, C.red); }
    }
  }
  poppy(B, cx, cy, R, rot, e, a, tl) {
    const T = this.mkT(cx, cy, R, rot, tl), lw = Math.max(0.8, R * 0.04), C = this.cc;
    const P = [[-0.36, -0.12, 0.5, 0.46, -0.35, 0], [0.38, -0.12, 0.5, 0.46, 0.35, 0], [-0.3, 0.2, 0.5, 0.44, 0.3, 0.08], [0.32, 0.2, 0.5, 0.44, -0.3, 0.08]];
    const ps = [];
    P.forEach((q, i) => {
      const s = this.spr((a - i * 110) / 1000, 7, 12); if (s <= 0.001) return;
      ps.push(this.blob(T, q, s, R, e, i, 0, 0.15, 2));
    });
    if (ps.length) {
      B.fillMany(ps, C.red);
      if (R >= 10) B.strokeMany(ps, C.line, lw * 0.6);
    }
    const cs = this.spr((a - 520) / 1000, 7, 12);
    if (cs > 0.001 && R > 4) {
      const c = []; for (let k = 0; k < 16; k++) { const th = k / 16 * Math.PI * 2; c.push(T(Math.cos(th) * 0.17 * R * cs, (0.05 + Math.sin(th) * 0.15) * R * cs, 0.15)); }
      B.fill(c, C.vein);
      if (R >= 12) for (let k = 0; k < 9; k++) { const th = k / 9 * Math.PI * 2 + e.ph1, p0 = T(Math.cos(th) * 0.19 * R, (0.05 + Math.sin(th) * 0.17) * R, 0.18), p1 = T(Math.cos(th) * 0.32 * R * cs, (0.05 + Math.sin(th) * 0.28) * R * cs, 0.2); B.stroke([p0, p1], C.line, lw * 0.6); }
    }
  }
  bell(B, cx, cy, R, rot, e, a, tl) {
    const T = this.mkT(cx, cy, R, rot, tl), lw = Math.max(0.8, R * 0.04), C = this.cc;
    const ua = this.bez([0, 0.55], [0.12, 0.1], [-0.05, -0.45], [-0.5, -0.62], 24), arc = ua.map(p => T(p[0] * R, p[1] * R));
    const gs = this.eo(a / 500);
    if (gs > 0) this.strokeRange(B, arc, 0, gs, C.blue, Math.max(1, R * 0.07));
    [[0.22, 0.1, 1.1], [0.45, -0.15, 1], [0.68, 0.2, 0.9], [0.88, -0.1, 0.75]].forEach((bq, i) => {
      const s = this.spr((a - 300 - i * 150) / 1000, 6, 11); if (s <= 0.001) return;
      const at = ua[Math.round(bq[0] * 24)], z = bq[2] * s, wb = 0.2 * z, wt = 0.05 * z, h = 0.38 * z;
      const loc = [[-wt, 0], [-wb * 0.8, h * 0.65], [-wb, h * 0.95], [-wb * 0.5, h * 0.88], [0, h * 1.06], [wb * 0.5, h * 0.88], [wb, h * 0.95], [wb * 0.8, h * 0.65], [wt, 0]];
      const ca = Math.cos(bq[1]), sa = Math.sin(bq[1]);
      const pts = loc.map(q => T((at[0] + q[0] * ca - q[1] * sa) * R, (at[1] + q[0] * sa + q[1] * ca) * R, 0.05));
      B.fill(pts, C.red);
      if (R >= 10) B.stroke(pts.slice(2, 7), C.line, lw * 0.7);
    });
    const bs = this.spr((a - 800) / 1000, 7, 12);
    if (bs > 0.001) {
      const end = ua[24], d = []; for (let k = 0; k < 12; k++) { const th = k / 12 * Math.PI * 2; d.push(T((end[0] + Math.cos(th) * 0.06 * bs) * R, (end[1] + Math.sin(th) * 0.06 * bs) * R)); }
      B.fill(d, C.red);
    }
  }
}

if (document.getElementById('cv')) window.garden = new Garden();
