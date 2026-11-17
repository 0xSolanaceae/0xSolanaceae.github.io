'use strict';

const CONFIG = {
  boil: true,
  recoil: 20,
  density: 0.85,
  showHint: true,
  speed: 0.75,
  bounce: 1.35,
  sway: 0.42,
  boilMs: 240,
  boilAmp: 0.7,
  wobble: 0.8,
  leanAmt: 0.85,
  sound: false,
  volume: 0.5,

  flowers: { marigold: 1.4, rose: 0.5, daisy: 0.35, peony: 0.3, tulip: 0.25, poppy: 0.2, bell: 0.2 },
  avoidOverlap: true,
  insects: { butterfly: 1, bee: 1.2, dragonfly: 0.5 },
  ambient: true,
  ambientEvery: 5500
};

class Garden {
  constructor() {
    const $ = id => document.getElementById(id);
    this.el = { app: $('app'), cv: $('cv'), inp: $('inp'), pcv: $('pcv'), modes: $('modes'), bar: $('bar'), barPal: $('barPal'),
      poster: $('poster'), info: $('info'), pText: $('pText'), presets: $('presets'), ppal: $('ppal'),
      status: $('status'), credit: $('credit'), psizes: $('psizes'), pfonts: $('pfonts'), fontSel: $('fontSel') };
    this.cfg = CONFIG;

    this.KF = { rose: 1, peony: 1.08, tulip: 1.1, daisy: 1.05, poppy: 1.02, bell: 0.95, marigold: 1.1 };

    this.MV = {
      butterfly: { max: 0.34, base: 0.06, k: 0.0016, leave: 0.42, acc: 0.06, fy: 7, fa: 0.12, wf: 4.3, wo: 0.1, jf: 13, ja: 0.6, wx: 1.3, wy: 2.1, wA: 70, wB: 40 },
      bee: { max: 0.55, base: 0.12, k: 0.003, leave: 0.62, acc: 0.12, fy: 9, fa: 0.22, wf: 6, wo: 0.2, jf: 41, ja: 1.1, wx: 2.6, wy: 3.7, wA: 90, wB: 50 },
      dragonfly: { max: 1.0, base: 0.25, k: 0.005, leave: 1.1, acc: 0.22, fy: 3, fa: 0.03, wf: 2, wo: 0.03, jf: 30, ja: 0.3, wx: 1.9, wy: 2.8, wA: 170, wB: 60 }
    };
    this.SENT = String.fromCharCode(0x200b);

    this.FONTS = [
      { id: 'playfair', name: 'Playfair Display', w: 700, fb: 'Georgia,serif', cat: 'Serif · classic' },
      { id: 'dmserif', name: 'DM Serif Display', w: 400, fb: 'Georgia,serif', cat: 'Serif · soft' },
      { id: 'abril', name: 'Abril Fatface', w: 400, fb: 'Georgia,serif', cat: 'Serif · fat face' },
      { id: 'bodoni', name: 'Bodoni Moda', w: 700, fb: 'Georgia,serif', cat: 'Serif · high contrast' },
      { id: 'fraunces', name: 'Fraunces', w: 700, fb: 'Georgia,serif', cat: 'Serif · wonky' },
      { id: 'cormorant', name: 'Cormorant Garamond', w: 700, fb: 'Georgia,serif', cat: 'Serif · elegant' },
      { id: 'pacifico', name: 'Pacifico', w: 400, fb: 'cursive', cat: 'Script · retro' },
      { id: 'caveat', name: 'Caveat', w: 700, fb: 'cursive', cat: 'Handwritten' },
      { id: 'archivo', name: 'Archivo Black', w: 400, fb: 'Arial,sans-serif', cat: 'Sans · heavy' },
      { id: 'bebas', name: 'Bebas Neue', w: 400, fb: 'Arial,sans-serif', cat: 'Sans · condensed' }
    ];
    this.F = '"Playfair Display",Georgia,serif'; this.FW = 700;
    this.SIZES = [
      { id: 'square', label: 'Square', sub: '1:1 · 1080×1080', r: '1:1', W: 1080, H: 1080 },
      { id: 'phone', label: 'Phone', sub: '9:16 · 1080×1920', r: '9:16', W: 1080, H: 1920 },
      { id: 'desktop', label: 'Desktop', sub: '16:9 · 1920×1080', r: '16:9', W: 1920, H: 1080 },
      { id: 'wide', label: 'Ultrawide', sub: '21:9 · 2560×1080', r: '21:9', W: 2560, H: 1080 }
    ];
    this.PRESETS = [
      { id: 'breathe', label: 'Breathe', sub: 'Slow sway · 3s', T: 3000 },
      { id: 'grow', label: 'Grow & wither', sub: 'Bloom, then back · 6s', T: 6000 },
      { id: 'typed', label: 'Typed', sub: 'Type, cut, repeat · 5s', T: 5000 },
      { id: 'wind', label: 'Gust', sub: 'Wind sweeps through · 4s', T: 4000 },
      { id: 'reach', label: 'Reach', sub: 'Stems follow a light · 6s', T: 6000 },
      { id: 'scatter', label: 'Scatter', sub: 'Random bloom, fade · 6s', T: 6000 },
      { id: 'visit', label: 'Visitors', sub: 'Butterfly, bee & dragonfly · 7s', T: 7000 }
    ];

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
    this.state = { mode: 'type', preset: 'breathe', size: 'square', font: 'playfair', palette: 3, text: 'solanaceae', seed: 7, status: '', busy: false };
    this.headless = true;
    this.init();
  }

  set(patch, cb) { Object.assign(this.state, patch); this.ui(); if (cb) cb(); }
  upd(patch) { this.set(patch, () => this.buildPoster()); }

  init() {
    this.letters = []; this.uid = 1; this.cache = {}; this.Sd = 0; this.St = 0; this.wrapped = false;
    this.t0 = performance.now(); this.lastKey = 0; this.rand = Math.random;
    this.g = this.el.cv.getContext('2d');
    this.fa = {}; this.mx = null; this.flies = []; this.perch = [];
    if (this.headless) { this.mountHeadless(); return; }
    this.buildUI();
    window.addEventListener('resize', () => this.resize());
    this.resize();
    window.addEventListener('keydown', e => this.key(e));
    window.addEventListener('pointermove', e => { this.mx = e.clientX; this.my = e.clientY; });
    document.addEventListener('pointerleave', () => { this.mx = null; });

    this.touch = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
    if (this.touch) document.documentElement.setAttribute('data-touch', '');
    this.ptype = 'mouse';
    window.addEventListener('pointerdown', e => { this.ptype = e.pointerType || 'mouse'; }, true);
    const up = e => { if (e.pointerType && e.pointerType !== 'mouse') this.mx = null; };
    window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    const fld = this.el.inp;
    this.iv = this.SENT; fld.value = this.SENT;
    fld.addEventListener('compositionstart', () => { this.composing = true; });
    fld.addEventListener('compositionend', () => { this.composing = false; setTimeout(() => { if (!this.composing) this.inputDiff(fld); }, 0); });
    fld.addEventListener('input', e => this.inputDiff(e.target));
    this.vv = window.visualViewport || null; this.vvMax = 0;
    if (this.vv && this.touch) { this.vv.addEventListener('resize', () => this.syncVV()); this.vv.addEventListener('scroll', () => this.syncVV()); this.syncVV(); }

    this.el.app.addEventListener('pointerdown', ev => this.focus(ev));
    this.el.app.addEventListener('click', ev => {
      if (this.state.mode === 'type' && this.ptype !== 'mouse' && ev.target === this.el.cv) fld.focus({ preventScroll: true });
    });
    if (document.fonts) document.fonts.load(`${this.FW} 100px ${this.F}`).then(() => { this.cache = {}; this.layout(); this.buildPoster(); }).catch(() => {});
    this.buildPoster();
    this.ui();
    const loop = () => {
      requestAnimationFrame(loop);
      if (this.paused) return;
      this.frame();
    };
    loop();
    if (!this.touch) setTimeout(() => fld.focus({ preventScroll: true }), 50);
  }

  mountHeadless() {
    window.addEventListener('resize', () => this.resize());
    this.resize();
    window.addEventListener('pointermove', e => { this.mx = e.clientX; this.my = e.clientY; });
    document.addEventListener('pointerleave', () => { this.mx = null; });
    this.touch = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
    this.ptype = 'mouse';
    window.addEventListener('pointerdown', e => { this.ptype = e.pointerType || 'mouse'; }, true);

    if (document.fonts) document.fonts.load(`${this.FW} 100px ${this.F}`).then(() => { this.cache = {}; this.layout(); this.paint(performance.now(), false); }).catch(() => {});
    this.still = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (this.still) { this.frame = () => {}; return; }
    const loop = () => {
      requestAnimationFrame(loop);
      if (this.paused) return;
      this.frame();
    };
    loop();
  }

  buildUI() {
    const E = this.el, mk = (tag, css, parent) => { const n = document.createElement(tag); if (css) n.style.cssText = css; parent && parent.appendChild(n); return n; };
    this.modeBtns = [['type', 'Type'], ['poster', 'Poster']].map(([id, label]) => {
      const b = mk('button', '', E.modes); b.textContent = label;
      b.addEventListener('click', () => {
        if (id === 'poster' && this.state.mode !== 'poster') { const t = this.liveText() || this.state.text; E.pText.value = t; this.upd({ mode: 'poster', text: t }); }
        else if (id === 'type' && this.state.mode !== 'type') this.set({ mode: 'type' }, () => { this.resize(); E.inp.focus({ preventScroll: true }); });
      });
      return { id, b };
    });
    this.sw = this.PAL.map((p, i) => {
      const b = mk('button', '', E.barPal); b.setAttribute('data-tg', 'sw'); b.title = b.ariaLabel = p[0];
      const d = mk('span', `background:${p[2]}`, b); d.setAttribute('data-tg', 'dot');
      b.addEventListener('click', e => { e.stopPropagation(); this.set({ palette: i }, () => this.refocus()); });
      return b;
    });
    this.pcards = this.PAL.map((p, i) => {
      const b = mk('button', '', E.ppal); b.ariaLabel = p[0];
      const chip = mk('span', `background:${p[1]}`, b); chip.className = 'chip';
      mk('i', `width:18px;height:18px;background:${p[2]}`, chip);
      mk('i', `width:12px;height:12px;margin-left:-4px;background:${p[3]}`, chip);
      const aa = mk('span', `font-size:18px;color:${p[5]};margin-left:8px`, chip); aa.className = 'serif'; aa.textContent = 'Aa';
      const nm = mk('span', 'padding:0 4px', b); nm.textContent = p[0];
      b.addEventListener('click', () => this.set({ palette: i }, () => this.refocus()));
      return b;
    });
    this.pbtns = this.PRESETS.map(p => {
      const b = mk('button', '', E.presets);
      const a = mk('span', 'font-size:13px', b); a.textContent = p.label;
      const s = mk('span', '', b); s.textContent = p.sub;
      b.addEventListener('click', () => this.upd({ preset: p.id }));
      return { id: p.id, b };
    });
    this.sbtns = this.SIZES.map(z => {
      const b = mk('button', '', E.psizes);
      const a = mk('span', 'font-size:13px', b); a.textContent = z.label;
      const t = mk('span', '', b); t.textContent = z.sub;
      b.addEventListener('click', () => this.upd({ size: z.id }));
      return { id: z.id, b };
    });
    this.fbtns = this.FONTS.map(f => {
      const b = mk('button', '', E.pfonts);
      const a = mk('span', `font-size:17px;line-height:1.2;font-family:"${f.name}",${f.fb};font-weight:${f.w}`, b); a.textContent = f.name;
      const t = mk('span', '', b); t.textContent = f.cat;
      b.addEventListener('click', () => this.setFont(f.id));
      return { id: f.id, b };
    });
    this.FONTS.forEach(f => { const o = document.createElement('option'); o.value = f.id; o.textContent = f.name; o.style.fontFamily = `"${f.name}",${f.fb}`; E.fontSel.appendChild(o); });
    E.fontSel.addEventListener('change', () => { this.setFont(E.fontSel.value); E.fontSel.blur(); this.refocus(); });
    E.pText.addEventListener('change', e => this.upd({ text: e.target.value }));
    $('bRegrow').addEventListener('click', () => this.upd({ seed: Math.floor(Math.random() * 1e6) }));
    $('bSnd').addEventListener('click', e => { e.stopPropagation(); this.cfg.sound = !this.cfg.sound; if (this.cfg.sound) { this.audioInit(); this.sfx('note', 'g'); } this.ui(); this.refocus(); });
    function $(id) { return document.getElementById(id); }
  }
  ui() {
    const s = this.state, E = this.el, isType = s.mode === 'type', pal = this.pal(), pr = this.preset();
    E.app.style.background = pal.bg;
    E.cv.style.display = isType ? 'block' : 'none';
    E.bar.classList.toggle('hide', !(isType && this.cfg.showHint));
    E.bar.style.color = pal.C.text;
    E.credit.style.color = pal.C.text; E.credit.classList.toggle('hide', !isType);
    E.barPal.style.background = pal.bg;
    E.poster.classList.toggle('hide', isType);
    this.modeBtns.forEach(m => { const on = s.mode === m.id; m.b.style.background = on ? '#FFFFFF' : 'transparent'; m.b.style.color = on ? '#000' : '#BDBDBD'; });
    this.PAL.forEach((p, i) => {
      const on = s.palette === i, b = this.sw[i];
      b.style.background = p[1];
      b.style.borderColor = on ? pal.C.text : (p[1] === pal.bg ? '#3A3A3A' : 'transparent');
      b.style.setProperty('--s', on ? 1.1 : 1);
      this.pcards[i].style.borderColor = on ? '#FFFFFF' : '#2A2A2A';
    });
    this.pbtns.forEach(p => { const on = s.preset === p.id; p.b.style.background = on ? '#161616' : 'transparent'; p.b.style.borderColor = on ? '#FFFFFF' : '#2A2A2A'; });
    this.sbtns.forEach(p => { const on = s.size === p.id; p.b.style.background = on ? '#161616' : 'transparent'; p.b.style.borderColor = on ? '#FFFFFF' : '#2A2A2A'; });
    this.fbtns.forEach(p => { const on = s.font === p.id; p.b.style.background = on ? '#161616' : 'transparent'; p.b.style.borderColor = on ? '#FFFFFF' : '#2A2A2A'; });
    E.fontSel.value = s.font; E.pText.style.fontFamily = this.F; E.pText.style.fontWeight = this.FW;
    const zs = this.psize();
    E.info.textContent = `${zs.r} · ${zs.W}×${zs.H} · ${pr.T / 1000}s loop · 30 fps`;
    E.status.textContent = s.status;
    document.getElementById('bSnd').textContent = this.cfg.sound ? 'SOUND ON' : 'MUTED';
  }
  focus(ev) {
    if (this.state.mode !== 'type') return;
    if (ev.target && ev.target.closest && ev.target.closest('select')) return;
    const touch = ev.pointerType && ev.pointerType !== 'mouse', onCanvas = ev.target === this.el.cv;

    if (touch) { if (ev.cancelable && (onCanvas || (ev.target.closest && ev.target.closest('button')))) ev.preventDefault(); }
    else this.el.inp.focus({ preventScroll: true });
    if (onCanvas) this.spawnFly(ev.clientX, ev.clientY);
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
    return {
      fill: (p, col, al) => { g.beginPath(); this.path(g, p, true); g.fillStyle = col; if (al != null) g.globalAlpha = al; g.fill(); if (al != null) g.globalAlpha = 1; },
      stroke: (p, col, w) => { g.beginPath(); this.path(g, p, false); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); },
      rect: (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); },
      text: (ch, x, y, S, col) => { g.font = `${this.FW} ${S}px ${this.F}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = col; g.fillText(ch, x, y); }
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
    const c = this.el.cv, r = c.getBoundingClientRect(), d = window.devicePixelRatio || 1;
    if (!r.width) return;
    this.W = r.width; this.H = r.height; this.dpr = d;
    c.width = Math.round(r.width * d); c.height = Math.round(r.height * d);
    this.layout(true);
    this.placePlanters();
  }
  mw(ch) {
    if (this.cache[ch] != null) return this.cache[ch];
    this.g.font = `${this.FW} 100px ${this.F}`;
    let w = this.g.measureText(ch).width / 100;
    if (ch === ' ') w *= 1.4;
    return (this.cache[ch] = w);
  }

  layoutCore(A, W, H, prevWrapped) {

    const maxW = W * (W < 640 ? 0.8 : 0.82), S0 = H * 0.3, LH = 2.1;
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

  syncVV() {
    const vv = this.vv; if (!vv) return;
    const w = Math.round(vv.width);
    if (this.vvW !== w) { this.vvW = w; this.vvMax = 0; }
    this.vvMax = Math.max(this.vvMax, vv.height);
    const kb = this.vvMax - vv.height > 120, de = document.documentElement;
    de.style.setProperty('--tg-top', vv.offsetTop + 'px');
    de.style.setProperty('--tg-h', vv.height + 'px');
    if (kb) de.setAttribute('data-kb', ''); else de.removeAttribute('data-kb');

    if (!kb && this.kbWas && document.activeElement === this.el.inp) this.el.inp.blur();
    this.kbWas = kb;
    this.resize();
  }
  refocus() { if (this.ptype === 'mouse' && this.state.mode === 'type') this.el.inp.focus({ preventScroll: true }); }
  liveText() { return (this.letters || []).filter(l => !l.dead).map(l => l.ch).join('').trim(); }
  wither(now) {
    const A = this.letters.filter(l => !l.dead), last = A[A.length - 1];
    if (!last) return;
    this.sfx('wither');
    last.dead = now;
    const pv = A[A.length - 2];
    if (pv && pv.ch !== ' ') { pv.cut = null; pv.endEls = null; pv.tb = now; }
    this.layout();
  }

  inputDiff(el) {
    const S = this.SENT;
    if (this.state.mode !== 'type' || this._kd) { this.iv = this.composing ? el.value : S; if (!this.composing) el.value = S; return; }
    const old = this.iv == null ? S : this.iv, cur = el.value;
    let p = 0; while (p < old.length && p < cur.length && old[p] === cur[p]) p++;
    let dels = old.length - p;
    if (p === 0 && old[0] === S && old.length > 1) dels -= 1;
    const now = performance.now(); this.lastKey = now;
    for (let i = 0; i < dels; i++) this.wither(now);
    for (const ch of cur.slice(p)) {
      if (ch === S) continue;
      if (ch.charCodeAt(0) === 10) { this.sfx('clear'); this.letters = []; this.layout(); } else this.add(ch, now);
    }
    if (this.composing) this.iv = cur; else { el.value = S; this.iv = S; }
  }

  key(e) {
    if (this.state.mode !== 'type') return;
    if (e.target && e.target.tagName === 'SELECT') return;
    if (e.metaKey || e.ctrlKey || e.altKey) {
      return;
    }
    if (e.target && (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') && (e.key === 'Enter' || e.key === ' ')) return;
    const now = performance.now();
    const A = this.letters.filter(l => !l.dead), last = A[A.length - 1];
    if (e.key === 'Backspace') {
      e.preventDefault(); this.mark(); if (!last) return;
      this.sfx('wither');
      last.dead = now;
      const pv = A[A.length - 2];
      if (pv && pv.ch !== ' ') { pv.cut = null; pv.endEls = null; pv.tb = now; }
      this.layout(); return;
    }
    if (e.key === 'Enter') { e.preventDefault(); this.mark(); this.sfx('clear'); this.letters = []; this.layout(); return; }
    if (e.key.length !== 1) return;
    e.preventDefault(); this.mark();
    this.add(e.key, now);
  }
  mark() { this.lastKey = performance.now(); this._kd = true; setTimeout(() => { this._kd = false; }, 0); }
  add(ch, now) {
    const A = this.letters.filter(l => !l.dead), last = A[A.length - 1];
    if (ch === ' ') {
      if (last && last.ch !== ' ') { last.cut = now; this.genEnd(last, (now - last.birth) * this.cfg.speed); this.sfx('snip'); }
      this.letters.push({ ch: ' ', id: this.uid++, birth: now, els: [] });
      this.layout(); return;
    }
    const same = last && last.ch !== ' ';
    const l = { ch, id: this.uid++, birth: now, tb: now, ws: same ? last.ws : Math.floor(this.rand() * 1e9), wi: same ? last.wi + 1 : 0, prev: same ? last : null };
    this.gen(l);
    this.letters.push(l);
    this.sfx('note', ch);
    this.layout();
  }

  wordParams(ws) {
    const r = this.rng(ws * 7 + 13), dens = this.cfg.density;
    return { roseP: 0.3 + r() * 0.3, leafy: (0.6 + r() * 0.8) * dens, dens, lean: (r() - 0.5) * 0.6, big: 0.85 + r() * 0.45, curvy: 0.8 + r() * 0.6, bridgeP: Math.min(0.95, (0.45 + r() * 0.35) * dens), w: 0.5 };
  }
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
      const layer = over ? (r() < 0.22 ? 1 : 0) : (r() < 0.6 ? 1 : tl);
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
    const w = this.mw(l.ch), inX = () => (r() - 0.5) * w * 0.7; p.w = w;
    const nUp = 1 + (r() < 0.45 * p.dens ? 1 : 0);
    for (let i = 0; i < nUp; i++) {
      this.grow(r, E, nid, p, { base: [inX(), -r() * 0.3], dir: -Math.PI / 2 + p.lean * 0.5 + (r() - 0.5) * 0.7, len: 0.6 + r() * 0.5, d0: 40 + i * 130, tip: l.wi === 0 && i === 0 ? 'rose' : null });
    }
    if (r() < 0.4 * p.dens) this.grow(r, E, nid, p, { base: [inX(), -0.1 - r() * 0.35], dir: Math.PI / 2 + (r() - 0.5) * 0.8, len: 0.35 + r() * 0.35, d0: 160 });
    if (l.prev && r() < p.bridgeP) {
      const px = -(this.mw(l.prev.ch) + w) / 2;
      const a = [inX(), -0.05 - r() * 0.55], b = [px + (r() - 0.5) * 0.25, -0.05 - r() * 0.55];
      const bulge = (r() < 0.55 ? -1 : 1) * (0.4 + r() * 0.4), dx = b[0] - a[0];
      let P = this.bez(a, [a[0] + dx * 0.15, a[1] + bulge], [b[0] - dx * 0.15, b[1] + bulge * 0.9], b, 40);
      if (r() < 0.45) P = P.slice(0, Math.floor(P.length * (0.7 + r() * 0.2)));
      this.grow(r, E, nid, p, { pts: P, len: Math.abs(dx) + Math.abs(bulge), d0: 90, tip: r() < 0.5 ? 'curl' : r() < 0.5 ? 'leaf' : 'rose' });
    }
    if (l.wi === 0) this.grow(r, E, nid, p, { base: [-w * 0.3, -0.15 - r() * 0.4], dir: Math.PI + (r() - 0.5) * 1.2, len: 0.45 + r() * 0.3, d0: 120, tip: 'curl' });
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
    const N = 12, s1 = [], s2 = [];
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
      const pts = []; for (let k = 0; k < 26; k++) pts.push(pt(k / 26 * Math.PI * 2));
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
    if (this.state.mode === 'poster') {
      if (!this.state.busy) this.posterDraw(this.el.pcv.getContext('2d'), now - (this.pt0 || 0));
      return;
    }
    if (!this.W) return;
    const k = 1 - Math.exp(-dt / 80);
    this.Sd += (this.St - this.Sd) * k;
    this.cx += (this.ctx_ - this.cx) * k; this.cy += (this.cty - this.cy) * k;
    for (const l of this.letters) if (!l.dead && l.tx != null) { l.x += (l.tx - l.x) * k; l.y += (l.ty - l.y) * k; }
    this.letters = this.letters.filter(l => !(l.dead && now - l.dead > 300));

    this.paint(now, !!this.typing && this.letters.length > 0);
  }
  pal() { const p = this.PAL[this.state.palette] || this.PAL[0]; return { bg: p[1], C: { red: p[2], blue: p[3], line: p[4], text: p[5], vein: p[1] } }; }
  mainState() { return { letters: this.letters, S: this.Sd, C: this.pal().C, boil: this.cfg.boil, recoil: this.cfg.recoil, speed: this.cfg.speed, wither: 260, face: true, sway: this.cfg.sway }; }
  paint(now, caret) {
    const g = this.g, d = this.dpr;
    g.setTransform(d, 0, 0, d, 0, 0); g.fillStyle = this.pal().bg; g.fillRect(0, 0, this.W, this.H);
    const B = this.backend(g), st = this.mainState();
    this.render(B, now, st);
    this.drawFlies(B, now, st.C);
    if (caret) {
      const S = this.Sd, on = now - this.lastKey < 500 || Math.floor(now / 530) % 2 === 0, hf = this.eo((now - this.t0) / 600);
      if (on && hf > 0) { const h = 0.8 * S * hf, w = Math.max(2, S * 0.03); B.rect(this.cx - w / 2, this.cy - h / 2, w, h, st.C.text); }
    }
  }

  relax(L, S, now, sp, smooth) {
    const KF = this.KF, items = [];
    for (const l of L) {
      if (l.dead || l.ch === ' ' || !l.els) continue;
      for (const e of (l.endEls ? l.els.concat(l.endEls) : l.els)) {
        if (e.t !== 'rose' || (now - l.birth) * sp - e.d0 < 0) continue;
        items.push({ e, x: l.x + e.x * S, y: l.y + e.y * S, r: e.R * S * (KF[e.kind || 'rose'] || 1), o: l.birth + e.d0 / sp, k: 1 });
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
    const S = st.S, L = st.letters, act = L.filter(l => !l.dead), sp = st.speed || 1;

    const PD = this.planters && this.planters.length ? L.concat(this.planters) : L;
    this.cc = st.C; this._now = now; if (st.face) this.perch = [];
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
    const kd = l => l.dead ? 1 - this.eo((now - l.dead) / st.wither) : 1;
    const draw = layer => {
      for (const l of PD) {
        if ((l.ch === ' ' && !l.planter) || !l.els) continue;
        const age = (now - l.birth) * sp, kk = kd(l);
        const each = e => { if (e.t === 'stem') this.drawStem(B, e, l, age, kk, st, f, amp, layer); else if (e.layer === layer) this.drawEl(B, e, l, age, kk, st, f, amp); };
        l.els.forEach(each);
        if (l.endEls) l.endEls.forEach(each);
        const i = act.indexOf(l), nx = i >= 0 ? act[i + 1] : null;
        if (l.tend && (l.dead || !nx || nx.ch === ' ')) {
          let fr = this.eo(((now - l.tb) * sp - 150) / 450);
          if (l.cut != null) fr *= 1 - this.eo((now - l.cut) * sp / 150) * Math.min(0.85, st.recoil / (0.6 * S));
          for (const e of l.tend) this.drawStem(B, e, l, age, kk, st, f, amp, layer, fr * kk);
        }
      }
    };
    draw(0);
    for (const l of L) if (l.ch !== ' ' && (st.textAll || !l.dead)) B.text(l.ch, l.x, l.y, S, st.C.text);
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
    return st.warp ? st.warp(x, y, l) : [x, y];
  }
  drawStem(B, e, l, age, kk, st, f, amp, layer, frO) {
    const S = st.S, fr = frO != null ? frO : this.eo((age - e.d0) / e.dur) * kk; if (fr <= 0) return;
    const j = this.jit(e.id, f, amp);
    const P = e.pts.map(p => this.wpt(st, l, l.x + p[0] * S + j[0], l.y + p[1] * S + j[1]));
    for (const sg of e.segs) {
      if (sg.layer !== layer) continue;
      const b = Math.min(sg.u1, fr); if (b <= sg.u0) continue;
      this.strokeRange(B, P, sg.u0, b, st.C.blue, S * 0.022 * (e.w || 1));
    }
    for (const th of e.thorns) if (fr > th.u && this.layerAt(e.segs, th.u) === layer) this.thorn(B, P, th.u, th.s, S);
  }
  drawEl(B, e, l, age, kk, st, f, amp) {
    const S = st.S, j = this.jit(e.id, f, amp), wx = (x, y) => this.wpt(st, l, l.x + x * S + j[0], l.y + y * S + j[1]);
    const rw = st.rotw ? st.rotw(e) : 0;
    if (e.t === 'leaf') {
      const sc = this.spr((age - e.d0) / 1000, 7, 15) * kk; if (sc <= 0) return;
      const p = wx(e.x, e.y); this.leaf(B, p[0], p[1], e.a + j[2] + rw, e.L * S * sc, e.bend);
    } else if (e.t === 'rose') {
      const a = age - e.d0; if (a < 0) return;
      if (kk <= 0.001) return;
      const kb = this.cfg.avoidOverlap && e._k != null ? e._k : 1;
      if (kb < 0.04) return;
      const Rr = e.R * S * kk * kb, p = wx(e.x, e.y), tl = st.face ? this.faceTurn(e, p[0], p[1]) : null;
      if ((st.face || st.perchOn) && !l.dead && a > 700) this.perch.push({ id: e.id, x: p[0], y: p[1], R: Rr });
      this.bloom(B, p[0], p[1], Rr, e.rot + j[2] + rw + (tl ? tl[0] * 0.22 : 0), e, a, tl);
    }
  }

  marigold(B, cx, cy, R, rot, e, a, tl) {
    const T = this.mkT(cx, cy, R, rot, tl), lw = Math.max(0.8, R * 0.03), C = this.cc;
    const rings = [[13, 0.58, 0.30, 0.19], [11, 0.40, 0.24, 0.16], [8, 0.23, 0.18, 0.13]];
    let i = 0;
    rings.forEach((rg, ri) => {
      const off = e.ph1 * 0.35 + ri * (Math.PI / rg[0]);
      for (let k = 0; k < rg[0]; k++, i++) {
        const s = this.spr((a - i * 36) / 1000, 7, 13); if (s <= 0.001) continue;
        const th = off + k / rg[0] * Math.PI * 2;
        const rr = rg[1] * (0.92 + 0.08 * Math.sin(th * 3 + e.ph2));
        const pts = this.blob(T,
          [Math.cos(th) * rr * 0.9, Math.sin(th) * rr * 0.84 - 0.04, rg[2], rg[3], th, 0.02 * ri],
          s, R, e, i + ri * 3, 0, 0, 1.5 + ri * 0.15);
        B.fill(pts, C.red);
        if (R >= 9) B.stroke(pts.concat([pts[0]]), C.line, lw * 0.6);
      }
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

  blob(T, q, s, R, e, i, ax, ay, ruf) {
    const ca = Math.cos(q[4]), sa = Math.sin(q[4]), pts = [];
    for (let k = 0; k < 26; k++) {
      const th = k / 26 * Math.PI * 2, rr = 1 + (0.08 * Math.sin(3 * th + e.ph1 + i) + 0.04 * Math.sin(5 * th + e.ph2)) * ruf;
      const lx = Math.cos(th) * q[2] * rr, ly = Math.sin(th) * q[3] * rr;
      const px = q[0] + lx * ca - ly * sa, py = q[1] + lx * sa + ly * ca;
      pts.push(T((ax + (px - ax) * s) * R, (ay + (py - ay) * s) * R, q[5] || 0));
    }
    return pts;
  }

  lens(T, bx, by, tx, ty, hw, ls, bend, R) {
    const dx = (tx - bx) * ls, dy = (ty - by) * ls, L = Math.hypot(dx, dy) || 1e-6, nx = -dy / L, ny = dx / L, N = 10, s1 = [], s2 = [];
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

      const rows = [[0.24, 0.30, 0.52], [0.55, 0.20, 0.32], [0.80, 0.30, 0.52]];
      for (let i = 0; i < rows.length; i++) {
        const r = this.rng(Math.floor(this.rand() * 1e9));
        const p = this.wordParams(Math.floor(this.rand() * 1e9));
        p.w = 0.4; p.lean = 0; p.big = 0.72; p.leafy = 1.15;
        const P = {
          ch: ' ', id: (side < 0 ? 7100 : 7200) + i, planter: true, side,
          ay: rows[i][0] + r() * 0.04,
          x: 0, y: 0, els: [],
          birth: past ? t0 - 12000 + i * 60 : t0 + 700 + i * 240
        };
        const E = [], nid = () => P.id * 100 + E.length;

        const inward = side < 0 ? -0.5 - r() * 0.6 : Math.PI + 0.5 + r() * 0.6;
        this.grow(r, E, nid, p, {
          base: [side * -0.03, 0.02 + r() * 0.1],
          dir: inward, len: rows[i][1] + r() * (rows[i][2] - rows[i][1]), d0: 0, tip: 'rose', depth: 0
        });

        if (r() < 0.75) {
          this.grow(r, E, nid, p, {
            base: [side * -0.02, 0.06 + r() * 0.16],
            dir: inward + (r() - 0.5) * 0.9, len: 0.18 + r() * 0.16,
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
      for (let k = 0; k < rg[0]; k++, i++) {
        const s = this.spr((a - i * st) / 1000, 8, 13); if (s <= 0.001) continue;
        const th = e.ph1 * 0.4 + ri * 0.55 + k / rg[0] * Math.PI * 2;
        const pts = this.blob(T, [Math.cos(th) * rg[1], Math.sin(th) * rg[1] * 0.88 - 0.04, rg[2], rg[3], th, 0.05 * ri], s, R, e, i, 0, 0, 1.3);
        B.fill(pts, C.red);
        if (R >= 10) B.stroke(pts.concat([pts[0]]), C.line, lw * 0.7);
      }
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
      if (R >= 10) B.stroke(pts.concat([pts[0]]), C.line, lw * 0.7);
    });
    const fr = this.eo((a - 420) / 400);
    if (fr > 0 && R > 5) this.strokeRange(B, [T(0, 0.52 * R, 0.1), T(sp * 0.04 * R, -0.2 * R, 0.1), T(sp * 0.08 * R, -0.62 * R, 0.1)], 0, fr, C.line, lw * 0.9);
  }
  daisy(B, cx, cy, R, rot, e, a, tl) {
    const T = this.mkT(cx, cy, R, rot, tl), lw = Math.max(0.8, R * 0.04), C = this.cc;
    const rings = [[10, 0.56, 0.4, 0.15], [10, 0.46, 0.32, 0.14]];
    let i = 0;
    rings.forEach((rg, ri) => {
      for (let k = 0; k < rg[0]; k++, i++) {
        const s = this.spr((a - i * 35) / 1000, 8, 13); if (s <= 0.001) continue;
        const th = e.ph1 + ri * Math.PI / rg[0] + k / rg[0] * Math.PI * 2;
        const pts = this.blob(T, [Math.cos(th) * rg[1], Math.sin(th) * rg[1] * 0.92, rg[2], rg[3], th, 0.03 * ri], s, R, e, i, 0, 0, 0.6);
        B.fill(pts, C.red);
        if (ri === 1 && R >= 10) B.stroke(pts.concat([pts[0]]), C.line, lw * 0.6);
      }
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
    P.forEach((q, i) => {
      const s = this.spr((a - i * 110) / 1000, 7, 12); if (s <= 0.001) return;
      const pts = this.blob(T, q, s, R, e, i, 0, 0.15, 2);
      B.fill(pts, C.red);
      if (R >= 10) B.stroke(pts.concat([pts[0]]), C.line, lw * 0.6);
    });
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

  audioInit() {
    if (this.ac || !this.cfg.sound) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const ac = this.ac = new AC(), out = this.out = ac.createGain();
    out.gain.value = this.cfg.volume;

    const dl = ac.createDelay(1), fb = ac.createGain(), lp = ac.createBiquadFilter(), wet = ac.createGain();
    dl.delayTime.value = 0.32; fb.gain.value = 0.38; lp.type = 'lowpass'; lp.frequency.value = 2400; wet.gain.value = 0.45;
    out.connect(ac.destination); out.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(wet); wet.connect(ac.destination);
  }
  tone(f, t0, dur, gain, type, f1) {
    const ac = this.ac, o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(this.out); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  sfx(kind, ch) {
    if (!this.cfg.sound) return;
    this.audioInit(); const ac = this.ac; if (!ac) return;
    if (ac.state === 'suspended') ac.resume();
    const t = ac.currentTime + 0.005, S = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
    if (kind === 'note') {
      const f = 261.63 * Math.pow(2, S[(ch.toLowerCase().charCodeAt(0) || 0) % S.length] / 12);
      this.tone(f, t, 1.6, 0.16); this.tone(f * 2.005, t, 0.8, 0.05); this.tone(f * 3.01, t, 0.3, 0.02, 'triangle');
      if (Math.random() < 0.45) this.tone(f * 2, t + 0.42, 1.4, 0.05);
    } else if (kind === 'wither') {
      this.tone(392, t, 0.45, 0.09, 'sine', 196);
    } else if (kind === 'snip') {
      const n = Math.floor(ac.sampleRate * 0.06), buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = ac.createBufferSource(), hp = ac.createBiquadFilter(), g = ac.createGain();
      src.buffer = buf; hp.type = 'highpass'; hp.frequency.value = 3200; g.gain.value = 0.12;
      src.connect(hp); hp.connect(g); g.connect(this.out); src.start(t);
      this.tone(1568, t, 0.25, 0.03);
    } else if (kind === 'clear') {
      [19, 12, 7, 0].forEach((st, i) => this.tone(261.63 * Math.pow(2, st / 12), t + i * 0.09, 1.0, 0.07));
    }
  }

  preset() { return this.PRESETS.find(p => p.id === this.state.preset) || this.PRESETS[0]; }
  fnt() { return this.FONTS.find(f => f.id === this.state.font) || this.FONTS[0]; }

  async setFont(id) {
    const f = this.FONTS.find(x => x.id === id); if (!f || (this.state.font === id && this.F.includes(f.name))) return;
    this.F = `"${f.name}",${f.fb}`; this.FW = f.w;
    this.set({ font: id });
    try { if (document.fonts) await document.fonts.load(`${f.w} 100px ${this.F}`, 'Ab' + (this.state.text || '')); } catch (e) {  }
    if (this.state.font !== id) return;
    this.cache = {}; this.layout(); this.buildPoster(); this.ui();
  }
  psize() { return this.SIZES.find(z => z.id === this.state.size) || this.SIZES[0]; }
  buildPoster() {
    if (!this.g) return;
    const zs = this.psize(), W = zs.W, H = zs.H, cvp = this.el.pcv;
    if (cvp.width !== W || cvp.height !== H) { cvp.width = W; cvp.height = H; }
    cvp.style.aspectRatio = W + ' / ' + H;
    const s = this.state, pr = this.preset(), text = (s.text || '').slice(0, 40) || ' ';
    this.rand = this.rng(s.seed * 7919 + 1);
    const L = []; let prev = null, uid = 1;
    for (const ch of text) {
      if (ch === ' ') { const sp = { ch: ' ', id: 9000 + uid++, els: [] }; L.push(sp); prev = sp; continue; }
      const same = prev && prev.ch !== ' ';
      const l = { ch, id: 9000 + uid++, ws: same ? prev.ws : Math.floor(this.rand() * 1e9), wi: same ? prev.wi + 1 : 0, prev: same ? prev : null };
      this.gen(l); L.push(l); prev = l;
    }
    const n = L.length;
    const step = pr.id === 'grow' ? Math.min(110, 3000 / n) : pr.id === 'typed' ? Math.min(85, 3600 / n) : 0;
    const off = pr.id === 'grow' ? 200 : pr.id === 'typed' ? 300 : 0;
    L.forEach((l, i) => { l.b = off + i * step; });
    if (pr.id === 'scatter') { const r = this.rng(s.seed * 31 + 5); L.forEach(l => { l.b = 150 + r() * 2400; }); }
    const wd = Math.min(60, 900 / n);
    L.forEach((l, i) => {
      l.d = pr.id === 'scatter' ? 4700 + i * 8 : 4200 + (n - 1 - i) * wd;
      const nx = L[i + 1];
      l.cutRel = null;
      if (pr.id !== 'scatter' && l.ch !== ' ' && nx && nx.ch === ' ') { l.cutRel = Math.max(30, nx.b - l.b); this.genEnd(l, l.cutRel); }
    });
    this.rand = Math.random;
    const res = this.layoutCore(L, W, H, false);

    let S = res.S, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const addP = (l, x, y, r) => { const X = l.tx + x * S, Y = l.ty + y * S, R = (r || 0) * S; x0 = Math.min(x0, X - R); x1 = Math.max(x1, X + R); y0 = Math.min(y0, Y - R); y1 = Math.max(y1, Y + R); };
    for (const l of L) {
      if (l.ch === ' ') continue;
      addP(l, -l.tw / S / 2, -0.75); addP(l, l.tw / S / 2, 0.1);
      const all = [...l.els, ...(l.endEls || [])];
      for (const e of all) {
        if (e.t === 'stem') e.pts.forEach(q => addP(l, q[0], q[1], 0.02));
        else if (e.t === 'leaf') addP(l, e.x, e.y, e.L);
        else addP(l, e.x, e.y, e.R * 1.15);
      }
    }

    let tx0 = 1e9, tx1 = -1e9, ty0 = 1e9, ty1 = -1e9;
    for (const l of L) if (l.ch !== ' ') { tx0 = Math.min(tx0, l.tx - l.tw / 2); tx1 = Math.max(tx1, l.tx + l.tw / 2); ty0 = Math.min(ty0, l.ty - 0.72 * S); ty1 = Math.max(ty1, l.ty); }
    const hx = W * 0.44, hy = H * 0.44, bcx = (tx0 + tx1) / 2, bcy = (ty0 + ty1) / 2;
    const k = Math.min(1.25, hx / Math.max(1, bcx - x0, x1 - bcx), hy / Math.max(1, bcy - y0, y1 - bcy));
    L.forEach(l => { l.tx = W / 2 + (l.tx - bcx) * k; l.ty = H / 2 + (l.ty - bcy) * k; l.tw *= k; l.x = l.tx; l.y = l.ty; });
    this.P = { letters: L, S: S * k, T: pr.T, preset: pr.id, W, H };
    this.pt0 = performance.now();
  }
  posterFly(B, tt, P, C) {
    const ps = this.perch.slice().sort((a, b) => a.x - b.x);
    if (!ps.length) return;
    const p1 = ps[Math.floor(ps.length * 0.25)], p2 = ps[Math.min(ps.length - 1, Math.floor(ps.length * 0.75))];
    const A = [-80, P.H * 0.28], s1 = [p1.x, p1.y - p1.R * 0.55], s2 = [p2.x, p2.y - p2.R * 0.55], E = [P.W + 80, P.H * 0.24];
    const sz = Math.max(12, P.S * 0.09), t = tt / 1000, eo = v => this.eo(Math.max(0, Math.min(1, v)));
    const leg = (a, b, u, lift) => { const e = eo(u); return [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e - Math.sin(e * Math.PI) * lift]; };
    let p, flying = true, vx = 0;
    if (t < 1.8) { p = leg(A, s1, t / 1.8, 160); vx = 1; }
    else if (t < 3.4) { p = s1; flying = false; }
    else if (t < 4.6) { p = leg(s1, s2, (t - 3.4) / 1.2, 140); vx = s2[0] > s1[0] ? 1 : -1; }
    else if (t < 5.8) { p = s2; flying = false; }
    else { p = leg(s2, E, (t - 5.8) / 1.2, 60); vx = 1; }
    let o, ang;
    if (flying) { o = Math.abs(Math.cos(t * 17)); p = [p[0] + Math.sin(t * 7) * 6, p[1] + Math.sin(t * 13) * 4]; ang = vx * 0.3; }
    else { const burst = (t > 2.4 && t < 2.8) || (t > 5 && t < 5.3); o = burst ? 0.2 + 0.8 * Math.abs(Math.cos(t * 9)) : 0.3 + 0.1 * Math.sin(t * 3); ang = 0; }
    this.butterfly(B, p[0], p[1], sz, ang, o, C);

    const at = f => { const q = ps[Math.max(0, Math.min(ps.length - 1, Math.floor(ps.length * f)))]; return [q.x, q.y - q.R * 0.55]; };
    const b1 = at(0.5), b2 = at(0.1), b3 = at(0.9), d1 = at(0.62), d2 = at(0.38);
    this.posterInsect(B, 'bee', t, [[-90, P.H * 0.7, 0, 0.25], [b1[0], b1[1], 1.6, 2.8], [b2[0], b2[1], 3.7, 4.9], [b3[0], b3[1], 5.8, 6.2], [P.W + 90, P.H * 0.3, 6.9, 7]], 55, Math.max(10, P.S * 0.075), C);
    this.posterInsect(B, 'dragonfly', t, [[P.W + 90, P.H * 0.39, 0, 0.35], [d1[0], d1[1], 1.5, 2.5], [d2[0], d2[1], 3.2, 4.1], [-100, P.H * 0.17, 5.2, 7]], 30, Math.max(11, P.S * 0.08), C);
  }
  posterRoute(wps, t, lift) {
    const sg = v => (v < 0 ? -1 : 1), w0 = wps[0];
    if (t < w0[3]) return { p: [w0[0], w0[1]], hold: true, dir: sg(wps[1][0] - w0[0]), pit: 0 };
    for (let i = 1; i < wps.length; i++) {
      const a = wps[i - 1], b = wps[i];
      if (t < b[2]) {
        const u = Math.max(0, Math.min(1, (t - a[3]) / (b[2] - a[3]))), e = this.eo(u), dx = b[0] - a[0], dy = b[1] - a[1];
        return { p: [a[0] + dx * e, a[1] + dy * e - Math.sin(e * Math.PI) * lift], hold: false, dir: sg(dx), pit: Math.max(-0.5, Math.min(0.5, Math.atan2(dy, Math.abs(dx) + 1) * 0.6)) };
      }
      if (t < b[3]) return { p: [b[0], b[1]], hold: true, dir: sg(b[0] - a[0]), pit: 0 };
    }
    const z = wps[wps.length - 1], y = wps[wps.length - 2];
    return { p: [z[0], z[1]], hold: true, dir: sg(z[0] - y[0]), pit: 0 };
  }
  posterInsect(B, kind, t, wps, lift, sz, C) {
    const r = this.posterRoute(wps, t, lift), bee = kind === 'bee', sd = bee ? 1.3 : 4.1;
    let x = r.p[0], y = r.p[1];
    if (!r.hold) { x += Math.sin(t * (bee ? 37 : 21) + sd) * (bee ? 3 : 1); y += Math.sin(t * (bee ? 29 : 17)) * (bee ? 3 : 1); }
    else if (bee) y += Math.sin(t * 20) * 0.6;
    if (bee) this.bee(B, x, y, sz, r.dir, r.pit, r.hold ? ((t * 1.3 % 2) > 1.6 ? Math.sin(t * 62) : 0.25 * Math.sin(t * 14)) : Math.sin(t * 64 + sd), C);
    else this.dragonfly(B, x, y, sz, r.dir, r.pit, r.hold ? 1 - 0.04 * Math.sin(t * 10) : 0.55 + 0.45 * Math.abs(Math.sin(t * 46 + sd)), C);
  }
  posterDraw(g, t) {
    const P = this.P; if (!P) return;
    const pc = this.pal();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = pc.bg; g.fillRect(0, 0, P.W, P.H);
    const tt = ((t % P.T) + P.T) % P.T, L = P.letters, B = this.backend(g);
    const st = { letters: L, S: P.S, C: pc.C, boil: this.cfg.boil, recoil: this.cfg.recoil, speed: 1, wither: 600, textAll: true };
    L.forEach(l => { l.x = l.tx; l.y = l.ty; l.dead = null; });
    const set = base => L.forEach(l => { l.birth = base + l.b; l.tb = l.birth; l.cut = l.cutRel != null ? l.birth + l.cutRel : null; });
    if (P.preset === 'breathe') {
      set(-1e5);
      const ph = tt / P.T * Math.PI * 2, S = P.S;
      st.warp = (x, y, l) => { const h = Math.max(0, (l.y - y) / S); return [x + Math.sin(ph + l.x * 0.004 + h * 1.1) * S * 0.03 * h, y + Math.cos(ph + x * 0.003) * S * 0.008 * h]; };
      st.rotw = e => Math.sin(ph + e.id * 0.7) * 0.12;
    } else if (P.preset === 'grow' || P.preset === 'scatter') {
      set(0);
      L.forEach(l => { if (tt >= l.d) l.dead = l.d; });
    } else if (P.preset === 'wind') {
      set(-1e5);
      const S = P.S, u = tt / P.T, front = -0.35 + u * 1.9;
      st.warp = (x, y, l) => {
        const hh = Math.max(0, (l.y - y) / S), d = l.x / P.W - front;
        const g = d < 0 ? Math.exp(d * 2.2) * Math.cos(-d * 9) : Math.exp(-d * d * 30);
        const idle = Math.sin(tt / 1000 * 1.6 + l.x * 0.01) * 0.012;
        return [x + (g * 0.13 + idle) * S * hh * hh * 0.6 + (g * 0.13 + idle) * S * hh * 0.4, y + Math.abs(g) * 0.02 * S * hh];
      };
      st.rotw = e => { const d = e.x / P.W - front; return (d < 0 ? Math.exp(d * 2.2) * Math.cos(-d * 9) : Math.exp(-d * d * 30)) * 0.35; };
    } else if (P.preset === 'reach') {
      set(-1e5);
      const S = P.S, ph = tt / P.T * Math.PI * 2, lx = P.W / 2 + Math.sin(ph) * P.W * 0.398, ly = P.H / 2 + Math.sin(ph * 2) * P.H * 0.24, rr = Math.min(P.W, P.H) * 0.52;
      this._light = [lx, ly];
      st.warp = (x, y, l) => {
        const dx = lx - l.x, dy = ly - (l.y - S * 0.6), d = Math.hypot(dx, dy) || 1, w = Math.max(0, 1 - d / rr), s = w * w * (3 - 2 * w);
        const hh = Math.min(2.5, Math.max(0, (l.y - y) / S)), f = hh * hh * 0.5 + hh * 0.5;
        return [x + dx / d * s * S * 0.12 * f, y + dy / d * s * S * 0.06 * f];
      };
      st.rotw = e => { const a = Math.atan2(ly - e.y, lx - e.x); return Math.sin(a) * 0.15; };
    } else if (P.preset === 'visit') {
      set(-1e5);
      st.perchOn = true; this.perch = [];
      const ph = tt / P.T * Math.PI * 2;
      st.warp = (x, y, l) => { const hh = Math.max(0, (l.y - y) / P.S); return [x + Math.sin(ph + l.x * 0.004 + hh) * P.S * 0.015 * hh, y]; };
    } else {
      if (tt >= 4400) return;
      set(0);
      st.letters = L.filter(l => tt >= l.birth);
      st.textAll = false;
    }
    this.render(B, tt, st);
    if (P.preset === 'reach') {
      const [lx, ly] = this._light, r = P.S * 0.09, pts = [];
      for (let k = 0; k < 20; k++) { const a = k / 20 * Math.PI * 2; pts.push([lx + Math.cos(a) * r, ly + Math.sin(a) * r]); }
      B.fill(pts, st.C.line);
    }
    if (P.preset === 'visit') this.posterFly(B, tt, P, st.C);
    if (P.preset === 'typed') {
      const born = st.letters, last = born[born.length - 1], S = P.S;
      if (Math.floor(tt / 400) % 2 === 0 || (last && tt - last.birth < 300)) {
        const x = last ? last.tx + last.tw / 2 + 0.07 * S : P.W / 2, y = last ? last.ty - 0.33 * S : P.H / 2, w = Math.max(2, S * 0.03), h = 0.8 * S;
        B.rect(x - w / 2, y - h / 2, w, h, st.C.text);
      }
    }
  }

}

if (document.getElementById('cv')) window.garden = new Garden();
