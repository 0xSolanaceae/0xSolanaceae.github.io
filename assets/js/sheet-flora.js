(() => {
  const sheet = document.querySelector('.plate');
  if (!sheet) return;
  const wrap = sheet.closest('.sheet') || sheet.parentElement;

  const layer = document.createElement('div');
  layer.className = 'sheet-flora';
  layer.setAttribute('aria-hidden', 'true');
  wrap.insertBefore(layer, wrap.firstChild);

  const STEM = '#1FA463';
  const STEM_DEEP = '#157F4C';
  const STEM_DRY = '#8C7A3F';
  const MARIGOLD = '#FF8A00';
  const AMBER = '#FFB25E';
  const CREAM = '#FFE2B8';
  const CORE = '#0E1A12';

  let collect = null;
  const plants = [];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function mulberry(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function bez(p0, p1, p2, p3, n) {
    const out = [];
    for (let k = 0; k <= n; k++) {
      const t = k / n, u = 1 - t;
      out.push([
        u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
        u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
      ]);
    }
    return out;
  }

  function strokeLine(g, pts, w0, w1, colour) {
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1], q = pts[i];
      const u = i / (pts.length - 1);
      g.beginPath();
      g.moveTo(p[0], p[1]);
      g.lineTo(q[0], q[1]);
      g.strokeStyle = colour;
      g.lineWidth = w0 + (w1 - w0) * u;
      g.lineCap = 'round';
      g.stroke();
    }
  }

  const tangent = (pts, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    return Math.atan2(b[1] - a[1], b[0] - a[0]);
  };

  function leaf(g, x, y, ang, L, kind, colour) {
    g.save();
    g.translate(x, y);
    g.rotate(ang);
    g.beginPath();
    if (kind === 'blade') {
      g.moveTo(0, 0);
      g.quadraticCurveTo(L * 0.55, -L * 0.16, L, 0);
      g.quadraticCurveTo(L * 0.55, L * 0.16, 0, 0);
    } else if (kind === 'round') {
      g.ellipse(L * 0.5, 0, L * 0.5, L * 0.38, 0, 0, Math.PI * 2);
    } else if (kind === 'slim') {
      g.moveTo(0, 0);
      g.bezierCurveTo(L * 0.3, -L * 0.22, L * 0.8, -L * 0.14, L, 0);
      g.bezierCurveTo(L * 0.8, L * 0.14, L * 0.3, L * 0.22, 0, 0);
    } else {
      g.moveTo(0, 0);
      g.bezierCurveTo(L * 0.3, -L * 0.44, L * 0.84, -L * 0.32, L, 0);
      g.bezierCurveTo(L * 0.84, L * 0.32, L * 0.3, L * 0.44, 0, 0);
    }
    g.fillStyle = colour;
    g.fill();
    g.strokeStyle = 'rgba(9,44,29,0.45)';
    g.lineWidth = 0.5;
    g.stroke();
    g.restore();
  }

  function petal(g, x, y, rx, ry, ang, fill) {
    g.save();
    g.translate(x, y);
    g.rotate(ang);
    g.beginPath();
    g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    g.fillStyle = fill;
    g.fill();
    g.restore();
  }

  function bloom(g, kind, x, y, r, rot) {
    if (r < 0.6) return;
    if (collect) collect.push({ x, y, r });
    const rb = mulberry(Math.round(x * 29 + y * 13) | 0);

    g.save();
    g.translate(x, y);
    g.rotate(rot + (rb() - 0.5) * 0.3);

    if (kind === 'marigold') {
      for (let ring = 0; ring < 2; ring++) {
        const rr = r * (ring ? 0.58 + rb() * 0.09 : 1);
        const n = ring ? 9 : 13;
        for (let k = 0; k < n; k++) {
          const a = (k / n) * Math.PI * 2 + ring * 0.26 + (rb() - 0.5) * 0.16;
          const len = rr * (0.86 + rb() * 0.3);
          petal(g, Math.cos(a) * rr * 0.5, Math.sin(a) * rr * 0.5,
            len * 0.46, len * 0.24, a, ring ? MARIGOLD : 'rgba(255,138,0,0.93)');
        }
      }
      g.beginPath();
      g.arc((rb() - 0.5) * r * 0.08, 0, r * (0.17 + rb() * 0.06), 0, Math.PI * 2);
      g.fillStyle = CREAM;
      g.fill();

    } else if (kind === 'poppy') {
      for (let k = 0; k < 4; k++) {
        const a = k * (Math.PI / 2) + 0.42 + (rb() - 0.5) * 0.28;
        const s = 0.86 + rb() * 0.3;
        petal(g, Math.cos(a) * r * 0.32, Math.sin(a) * r * 0.32,
          r * 0.54 * s, r * 0.46 * s, a, k % 2 ? MARIGOLD : 'rgba(255,138,0,0.85)');
      }
      g.beginPath();
      g.arc(0, 0, r * 0.27, 0, Math.PI * 2);
      g.fillStyle = CORE;
      g.fill();
      for (let k = 0; k < 6; k++) {
        const a = k * 1.05 + rb();
        g.beginPath();
        g.arc(Math.cos(a) * r * 0.14, Math.sin(a) * r * 0.14, r * 0.045, 0, Math.PI * 2);
        g.fillStyle = CREAM;
        g.fill();
      }

    } else if (kind === 'daisy') {
      const n = 9 + ((rb() * 4) | 0);
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + (rb() - 0.5) * 0.2;
        const len = r * (0.36 + rb() * 0.24);
        petal(g, Math.cos(a) * (r * 0.34 + len * 0.5), Math.sin(a) * (r * 0.34 + len * 0.5),
          len, r * 0.12, a, CREAM);
      }
      g.beginPath();
      g.arc(0, 0, r * (0.2 + rb() * 0.07), 0, Math.PI * 2);
      g.fillStyle = AMBER;
      g.fill();

    } else if (kind === 'bell') {
      g.beginPath();
      g.moveTo(-r * 0.5, -r * 0.42);
      g.quadraticCurveTo(-r * 0.64, r * 0.52, 0, r * 0.6);
      g.quadraticCurveTo(r * 0.64, r * 0.52, r * 0.5, -r * 0.42);
      g.quadraticCurveTo(0, -r * 0.8, -r * 0.5, -r * 0.42);
      g.fillStyle = 'rgba(255,138,0,0.9)';
      g.fill();
      g.strokeStyle = 'rgba(90,40,0,0.3)';
      g.lineWidth = 0.6;
      g.stroke();
      g.beginPath();
      g.arc(0, r * 0.5, r * 0.2, 0, Math.PI);
      g.fillStyle = CREAM;
      g.fill();

    } else if (kind === 'tulip') {
      for (let k = -1; k <= 1; k++) {
        const s = 0.88 + rb() * 0.24;
        g.beginPath();
        g.ellipse(k * r * 0.34, -r * 0.1, r * 0.38 * s, r * 0.62 * s, k * 0.3 + (rb() - 0.5) * 0.2,
          0, Math.PI * 2);
        g.fillStyle = k === 0 ? AMBER : 'rgba(255,178,94,0.88)';
        g.fill();
      }
      g.beginPath();
      g.ellipse(0, r * 0.5, r * 0.3, r * 0.2, 0, 0, Math.PI * 2);
      g.fillStyle = MARIGOLD;
      g.fill();

    } else if (kind === 'seed') {
      const n = 12 + ((rb() * 4) | 0);
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + (rb() - 0.5) * 0.16;
        const len = r * (0.78 + rb() * 0.28);
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(Math.cos(a) * len, Math.sin(a) * len);
        g.strokeStyle = 'rgba(255,226,184,0.72)';
        g.lineWidth = 0.7;
        g.stroke();
      }
      g.beginPath();
      g.arc(0, 0, r * 0.22, 0, Math.PI * 2);
      g.fillStyle = STEM_DEEP;
      g.fill();
    }
    g.restore();
  }

  function bud(g, x, y, r, ang) {
    g.save();
    g.translate(x, y);
    g.rotate(ang);
    g.beginPath();
    g.moveTo(0, 0);
    g.quadraticCurveTo(-r * 0.9, -r * 1.1, 0, -r * 2.1);
    g.quadraticCurveTo(r * 0.9, -r * 1.1, 0, 0);
    g.fillStyle = STEM;
    g.fill();
    g.beginPath();
    g.moveTo(0, -r * 1.2);
    g.quadraticCurveTo(r * 0.4, -r * 1.7, 0, -r * 2.05);
    g.fillStyle = 'rgba(255,138,0,0.5)';
    g.fill();
    g.restore();
  }

  const BLOOMS = ['marigold', 'poppy', 'daisy', 'bell', 'tulip', 'seed'];
  const LEAF_KINDS = ['broad', 'slim', 'round', 'blade'];

  function tall(g, x, baseY, h, dir, rnd, lean) {

    const k1 = (rnd() - 0.5) * 0.1, k2 = (rnd() - 0.5) * 0.14;
    const tipX = x + dir * h * lean * (0.7 + rnd() * 0.7);
    const pts = bez([x, baseY],
      [x + dir * h * (0.08 + k1), baseY - h * 0.4],
      [tipX - dir * h * (0.16 + k2), baseY - h * (0.68 + rnd() * 0.1)],
      [tipX, baseY - h], 34);
    strokeLine(g, pts, 2.6 + rnd() * 1.2, 1.1 + rnd() * 0.5, STEM);

    const n = 3 + ((rnd() * 3) | 0);
    for (let i = 0; i < n; i++) {
      const u = 0.14 + (i / n) * 0.74 + (rnd() - 0.5) * 0.05;
      const i0 = Math.min(pts.length - 1, Math.round(u * (pts.length - 1)));
      const p = pts[i0];

      const side = rnd() < 0.62 ? (i % 2 ? 1 : -1) : (i % 2 ? -1 : 1);
      const L = (13 + rnd() * 17) * (1 - u * 0.35);
      const colour = rnd() < 0.12 ? STEM_DRY : (i % 3 ? STEM : 'rgba(31,164,99,0.7)');
      leaf(g, p[0], p[1], tangent(pts, i0) + side * (0.8 + rnd() * 0.5),
        L, LEAF_KINDS[(rnd() * 4) | 0], colour);
    }

    if (rnd() < 0.4) {
      const u = 0.45 + rnd() * 0.25;
      const i0 = Math.round(u * (pts.length - 1));
      const p = pts[i0];
      const sd = rnd() < 0.5 ? -1 : 1;
      const sl = h * (0.18 + rnd() * 0.14);
      const sp = bez([p[0], p[1]], [p[0] + sd * sl * 0.4, p[1] - sl * 0.28],
        [p[0] + sd * sl * 0.8, p[1] - sl * 0.42], [p[0] + sd * sl * 0.9, p[1] - sl * 0.2], 16);
      strokeLine(g, sp, 1.6, 0.8, STEM);
      const tip = sp[sp.length - 1];
      bloom(g, BLOOMS[(rnd() * BLOOMS.length) | 0], tip[0], tip[1], 7 + rnd() * 4.5, rnd() * 6.3);
    }

    const tip = pts[pts.length - 1];
    bloom(g, BLOOMS[(rnd() * BLOOMS.length) | 0], tip[0], tip[1],
      10 + rnd() * 6, rnd() * Math.PI * 2);

    if (rnd() < 0.6) {
      const under = pts[pts.length - 4] || tip;
      const side = rnd() < 0.5 ? -1 : 1;
      const ex = under[0] + side * 11, ey = under[1] - 4;
      strokeLine(g, bez([under[0], under[1]], [under[0] + side * 5, under[1] - 2],
        [under[0] + side * 9, under[1] - 3], [ex, ey], 6), 1.2, 0.7, STEM);
      bloom(g, BLOOMS[(rnd() * BLOOMS.length) | 0], ex, ey, 6 + rnd() * 4, rnd() * 6.3);
    }

    const nb = 2 + ((rnd() * 2) | 0);
    for (let i = 0; i < nb; i++) {
      const u = 0.6 + (i / Math.max(1, nb)) * 0.28;
      const i0 = Math.min(pts.length - 1, Math.round(u * (pts.length - 1)));
      const p = pts[i0];
      const side = rnd() < 0.5 ? -1 : 1;
      const reach = side * (9 + rnd() * 11);
      const lift = -(3 + rnd() * 7);
      const ex = p[0] + reach, ey = p[1] + lift;
      const stalk = bez([p[0], p[1]],
        [p[0] + reach * 0.35, p[1] - 1.5],
        [p[0] + reach * 0.78, p[1] + lift * 0.45],
        [ex, ey], 7);
      strokeLine(g, stalk, 1.35, 0.8, STEM);
      bloom(g, BLOOMS[(rnd() * BLOOMS.length) | 0], ex, ey,
        (7 + rnd() * 5) * (0.85 + u * 0.3), rnd() * Math.PI * 2);
      if (rnd() < 0.4) bud(g, p[0] - reach * 0.5, p[1] - 2, 2.2 + rnd() * 1.6, -Math.PI / 2 + side * 0.4);
    }
  }

  function clump(g, x, baseY, h, dir, rnd) {
    const bias = (rnd() - 0.5) * 1.1;
    const stems = 4 + ((rnd() * 4) | 0);
    for (let s = 0; s < stems; s++) {
      const lx = x + (rnd() - 0.5) * h * 0.5;
      const lh = h * (0.4 + rnd() * 0.62);
      const d = Math.max(-0.95, Math.min(0.95, bias + (rnd() - 0.5) * 0.9));
      const pts = bez([lx, baseY], [lx + d * lh * 0.2, baseY - lh * 0.45],
        [lx + d * lh * 0.55, baseY - lh * 0.72], [lx + d * lh * 0.9, baseY - lh], 22);
      strokeLine(g, pts, 1.6 + rnd() * 1.0, 0.7 + rnd() * 0.4, STEM);

      const p = pts[pts.length - 1];
      if (rnd() < 0.8) {
        bloom(g, BLOOMS[(rnd() * BLOOMS.length) | 0], p[0], p[1] - 3,
          6 + rnd() * 5, rnd() * 6.3);
      } else if (rnd() < 0.7) {
        bud(g, p[0], p[1] + 2, 2.6 + rnd() * 1.8, -Math.PI / 2 + d * 0.4);
      }
      if (rnd() < 0.75) {
        leaf(g, lx, baseY - lh * (0.2 + rnd() * 0.3), -1.2 * dir + d + (rnd() - 0.5),
          9 + rnd() * 9, rnd() < 0.5 ? 'round' : 'slim', 'rgba(31,164,99,0.75)');
      }
    }
  }

  function grass(g, x, baseY, h, rnd) {
    const bias = (rnd() - 0.5) * 1.3;
    const blades = 5 + ((rnd() * 6) | 0);
    for (let i = 0; i < blades; i++) {
      const d = bias + (rnd() - 0.5) * 0.9;
      const bh = h * (0.32 + rnd() * 0.78);
      const w = 1.1 + rnd() * 1.2;
      const pts = bez([x + (rnd() - 0.5) * h * 0.45, baseY],
        [x + d * bh * 0.3, baseY - bh * 0.5],
        [x + d * bh * 0.95, baseY - bh * 0.82],
        [x + d * bh * (0.9 + rnd() * 0.25), baseY - bh], 14);
      strokeLine(g, pts, w, w * 0.25, i % 4 ? STEM : STEM_DEEP);
    }

    if (rnd() < 0.6) {
      const bh = h * (0.3 + rnd() * 0.3);
      const pts = bez([x, baseY], [x + bias * bh * 0.4, baseY - bh * 0.7],
        [x + bias * bh * 1.0, baseY - bh * 0.8], [x + bias * bh * 1.35, baseY - bh * 0.5], 14);
      strokeLine(g, pts, 1.6, 0.5, STEM_DRY);
    }
  }

  function fern(g, x, baseY, h, dir, rnd) {
    const pts = bez([x, baseY], [x + dir * h * (0.14 + rnd() * 0.1), baseY - h * 0.38],
      [x + dir * h * (0.36 + rnd() * 0.12), baseY - h * 0.7],
      [x + dir * h * (0.44 + rnd() * 0.16), baseY - h * (0.9 + rnd() * 0.1)], 30);
    strokeLine(g, pts, 2.0, 0.8, STEM_DEEP);

    for (let i = 3; i < pts.length - 1; i++) {
      const p = pts[i];
      const a = tangent(pts, i);
      const fade = 1 - i / pts.length;

      const l1 = (13 * fade + 3) * (0.72 + rnd() * 0.5);
      const l2 = (13 * fade + 3) * (0.66 + rnd() * 0.5);
      if (rnd() > 0.1) leaf(g, p[0], p[1], a - (0.8 + rnd() * 0.25), l1, 'slim',
        rnd() < 0.14 ? 'rgba(140,122,63,0.8)' : 'rgba(31,164,99,0.85)');
      if (rnd() > 0.14) leaf(g, p[0], p[1], a + (0.8 + rnd() * 0.25), l2, 'slim',
        'rgba(31,164,99,0.7)');
    }
    const tip = pts[pts.length - 1];
    bloom(g, 'seed', tip[0], tip[1], 7.5 + rnd() * 3, rnd() * 6.3);
  }

  function tendril(g, x, baseY, h, dir, rnd) {
    const pts = bez([x, baseY], [x + dir * h * 0.16, baseY - h * 0.5],
      [x + dir * h * (0.5 + rnd() * 0.1), baseY - h * 0.6],
      [x + dir * h * (0.44 + rnd() * 0.12), baseY - h], 30);
    strokeLine(g, pts, 1.8 + rnd() * 0.6, 0.8, STEM);

    const tip = pts[pts.length - 1];
    g.beginPath();
    let a0 = tangent(pts, pts.length - 1);
    let r = h * (0.08 + rnd() * 0.05);
    let px = tip[0], py = tip[1];
    g.moveTo(px, py);
    const turn = 0.30 + rnd() * 0.1;
    for (let k = 0; k < 44; k++) {
      a0 += turn;
      r *= 0.955;
      px += Math.cos(a0) * r * 0.17;
      py += Math.sin(a0) * r * 0.17;
      g.lineTo(px, py);
    }
    g.strokeStyle = STEM;
    g.lineWidth = 1.0;
    g.lineCap = 'round';
    g.stroke();

    for (let i = 0; i < 3; i++) {
      const i0 = Math.round((0.28 + i * 0.2) * (pts.length - 1));
      const p = pts[i0];
      leaf(g, p[0], p[1], tangent(pts, i0) + (i % 2 ? 1 : -1) * (0.7 + rnd() * 0.5),
        8 + rnd() * 8, 'blade', 'rgba(31,164,99,0.8)');
    }

    const mi = Math.round(pts.length * (0.55 + rnd() * 0.15));
    const mid = pts[mi];
    const ta = tangent(pts, mi);
    const side = rnd() < 0.5 ? -1 : 1;
    const ex = mid[0] + Math.cos(ta + side * 1.35) * 11;
    const ey = mid[1] + Math.sin(ta + side * 1.35) * 11;
    strokeLine(g, bez([mid[0], mid[1]],
      [mid[0] + (ex - mid[0]) * 0.42, mid[1] + (ey - mid[1]) * 0.3],
      [mid[0] + (ex - mid[0]) * 0.78, mid[1] + (ey - mid[1]) * 0.72],
      [ex, ey], 7), 1.2, 0.8, STEM);
    bloom(g, rnd() < 0.5 ? 'bell' : 'tulip', ex, ey, 8.5 + rnd() * 4.5, rnd() * 6.3);
  }

  function bed(g, x, baseY, w, h, rnd) {
    const bias = (rnd() - 0.5) * 0.6;
    const k = window.matchMedia('(max-width: 720px)').matches ? Math.max(1, h / 96) : 1;
    const n = Math.max(10, Math.round(w / 8));
    for (let i = 0; i < n; i++) {
      const bx = x - w / 2 + (i + rnd() * 0.85) * (w / n);
      const bh = h * (0.34 + rnd() * 0.72);
      const d = bias + (rnd() - 0.5) * 0.85;
      const thick = 1.4 + rnd() * 1.3;
      const pts = bez([bx, baseY],
        [bx + d * bh * 0.28, baseY - bh * 0.5],
        [bx + d * bh * 0.8, baseY - bh * 0.82],
        [bx + d * bh * 1.15, baseY - bh], 10);
      const dry = rnd() < 0.07;
      strokeLine(g, pts, thick, thick * 0.3,
        dry ? STEM_DRY : (i % 5 ? STEM : STEM_DEEP));
    }

    const short = Math.max(14, Math.round(w / 4));
    for (let i = 0; i < short; i++) {
      const bx = x - w / 2 + (i + rnd()) * (w / short);
      const bh = h * (0.1 + rnd() * 0.24);
      const d = (rnd() - 0.5) * 0.6;
      strokeLine(g, bez([bx, baseY], [bx + d * bh * 0.3, baseY - bh * 0.5],
        [bx + d * bh * 0.8, baseY - bh * 0.8], [bx + d * bh, baseY - bh], 6),
        1.2, 0.4, STEM_DEEP);
    }

    const heads = Math.max(2, Math.round(w / 74));
    for (let i = 0; i < heads; i++) {
      const bx = x - w / 2 + (0.1 + rnd() * 0.8) * w;
      const bh = h * (0.44 + rnd() * 0.46);
      const d = (rnd() - 0.5) * 0.8;
      const pts = bez([bx, baseY], [bx + d * bh * 0.3, baseY - bh * 0.5],
        [bx + d * bh * 0.8, baseY - bh * 0.8], [bx + d * bh, baseY - bh], 10);
      strokeLine(g, pts, 1.7, 0.7, STEM);
      const tip = pts[pts.length - 1];

      if (rnd() < 0.8) {
        const r = (6.2 + rnd() * 4.6 * (0.7 + bh / h * 0.5)) * k;
        bloom(g, BLOOMS[(rnd() * BLOOMS.length) | 0], tip[0], tip[1] - r * 0.35,
          r, rnd() * 6.3);

        if (rnd() < 0.5) {
          const side = rnd() < 0.5 ? -1 : 1;
          const ex = tip[0] + side * r * (1.1 + rnd() * 0.7);
          const ey = tip[1] - r * (0.5 + rnd() * 0.7);
          strokeLine(g, bez([tip[0], tip[1]],
            [tip[0] + side * r * 0.5, tip[1] - r * 0.35],
            [tip[0] + side * r * 0.95, tip[1] - r * 0.6],
            [ex, ey], 6), 1.1, 0.7, STEM);
          bloom(g, BLOOMS[(rnd() * BLOOMS.length) | 0], ex, ey, r * 0.62, rnd() * 6.3);
        }
      } else {
        bud(g, tip[0], tip[1] + 2, (3 + rnd() * 2) * k, -Math.PI / 2 + d * 0.3);
      }
    }
  }

  function addSoil(W, H, soilH) {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const cv = document.createElement('canvas');
    cv.className = 'sheet-soil';
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(soilH * dpr);
    cv.style.width = W + 'px';
    cv.style.height = soilH + 'px';
    cv.style.left = '0px';
    cv.style.top = (H - soilH) + 'px';

    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const rnd = mulberry(913);

    const grad = g.createLinearGradient(0, 0, 0, soilH);
    grad.addColorStop(0, '#3b2718');
    grad.addColorStop(0.28, '#2a1b11');
    grad.addColorStop(1, '#100b07');
    g.fillStyle = grad;
    g.fillRect(0, 0, W, soilH);

    g.globalCompositeOperation = 'destination-out';
    for (let x = 0; x < W; x += 5) {
      const wave = 0.5 + 0.5 * Math.sin(x * 0.011 + 1.3) * Math.cos(x * 0.0037);
      g.fillRect(x, 0, 5, 1.2 + wave * 2.8 + rnd() * 1.4);
    }
    g.globalCompositeOperation = 'source-over';

    for (let i = 0; i < Math.round(W * 1.7); i++) {
      const light = rnd() < 0.48;
      g.fillStyle = light ? 'rgba(255,214,170,0.07)' : 'rgba(0,0,0,0.22)';
      g.fillRect(rnd() * W, rnd() * soilH, 1, 1);
    }
    for (let i = 0; i < Math.round(W / 48); i++) {
      const r = 1.3 + rnd() * 2.5;
      g.beginPath();
      g.ellipse(rnd() * W, 5 + rnd() * (soilH - 9), r, r * 0.7, rnd() * 3, 0, Math.PI * 2);
      g.fillStyle = 'rgba(150,120,90,0.26)';
      g.fill();
    }

    const sh = g.createLinearGradient(0, 0, 0, 11);
    sh.addColorStop(0, 'rgba(0,0,0,0.55)');
    sh.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = sh;
    g.fillRect(0, 0, W, 11);

    layer.appendChild(cv);
    return cv;
  }

  const FOOT = { tall: 0.85, fern: 1.5, tendril: 1.3, clump: 2.3, grass: 2.1 };

  function addPlant(kind, x, baseY, h, dir, seed, clipEdge, found, width) {
    const rnd = mulberry(seed);

    const dpr = Math.min(window.devicePixelRatio || 1, h > 380 ? 1.25 : 1.5);

    const w = Math.ceil(width || Math.max(140, h * (FOOT[kind] || 0.9) + 70));
    const hh = Math.ceil(h * 1.14 + 48);
    const bx = w / 2;
    const by = hh - 8;

    const cv = document.createElement('canvas');
    cv.className = 'sheet-plant';
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(hh * dpr);
    cv.style.width = w + 'px';
    cv.style.height = hh + 'px';
    cv.style.left = Math.round(x - bx) + 'px';
    cv.style.top = Math.round(baseY - by) + 'px';
    cv.style.transformOrigin = bx + 'px ' + by + 'px';
    cv.style.animationDuration = (5.4 + rnd() * 4.2).toFixed(2) + 's';
    cv.style.animationDelay = (-rnd() * 9).toFixed(2) + 's';
    cv.style.setProperty('--sway', (0.5 + rnd() * 0.85).toFixed(2) + 'deg');

    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (clipEdge !== null) {
      const localEdge = clipEdge - (x - bx);
      g.beginPath();
      if (dir > 0) g.rect(0, 0, localEdge, hh);
      else g.rect(localEdge, 0, w - localEdge, hh);
      g.clip();
    }

    g.translate(bx - x, by - baseY);

    collect = found;
    if (kind === 'bed') bed(g, x, baseY, w, h, rnd);
    else if (kind === 'tall') tall(g, x, baseY, h, dir, rnd, 0.12);
    else if (kind === 'fern') fern(g, x, baseY, h, dir, rnd);
    else if (kind === 'tendril') tendril(g, x, baseY, h, dir, rnd);
    else if (kind === 'clump') clump(g, x, baseY, h, dir, rnd);
    else grass(g, x, baseY, h, rnd);
    collect = null;

    layer.appendChild(cv);
    plants.push({ el: cv, x, y: baseY, h, lean: 0, max: leanCap(kind, h) });
    return cv;
  }

  // Wide clumps pivot on a base that spans the whole canvas, so they get a
  // gentler cap than the narrow creepers in the gutters.
  function leanCap(kind, h) {
    if (kind === 'bed') return 1.6;
    return Math.min(4, (Math.atan(18 / Math.max(60, h)) * 180) / Math.PI);
  }

  function still(el) { if (el) { el.style.animation = 'none'; el.stillFrame = true; } return el; }

  function layout() {
    layer.textContent = '';
    plants.length = 0;

    const wRect = wrap.getBoundingClientRect();
    const rect = sheet.getBoundingClientRect();
    const W = Math.round(wRect.width);
    const H = Math.round(wRect.height);

    const padB = parseFloat(getComputedStyle(sheet).paddingBottom) || 0;
    const padX = parseFloat(getComputedStyle(sheet).paddingLeft) || 0;
    const left = rect.left - wRect.left;
    const right = left + rect.width;
    const gutterL = left;
    const gutterR = W - right;
    const rnd = mulberry(2027);
    const anchors = [];
    const jit = (v, amt) => v + (rnd() - 0.5) * amt;

    if (gutterL > 90) {
      const x0 = 12, x1 = gutterL - 18;
      const span = x1 - x0;
      const fx = jit(x0 + span * 0.5, span * 0.16);
      addPlant('tall', jit(x0 + span * 0.15, 18), H - 14, Math.min(H * (0.52 + rnd() * 0.14), 620),
        1, 11, gutterL - 10, anchors);
      addPlant('fern', fx, H - 12, Math.min(H * 0.42, 380, (gutterL - fx) / 0.55), 1, 12, gutterL - 10, anchors);
      still(addPlant('clump', jit(x0 + span * 0.82, 16), H - 10, 120 + rnd() * 90, 1, 13, gutterL - 10, anchors));
      still(addPlant('grass', jit(x0 + span * 0.3, 20), H - 8, 110 + rnd() * 80, 1, 14, gutterL - 10, anchors));
    }

    if (gutterR > 90) {
      const x0 = right + 18, x1 = W - 12;
      const span = x1 - x0;
      const tx = jit(x0 + span * 0.45, span * 0.14);
      addPlant('tall', jit(x0 + span * 0.85, 14), H - 14, Math.min(H * (0.46 + rnd() * 0.14), 580),
        -1, 21, right + 10, anchors);
      addPlant('tendril', tx, H - 12, Math.min(330, (tx - right) / 0.58), -1, 22, right + 10, anchors);
      still(addPlant('clump', jit(x0 + span * 0.18, 14), H - 10, 120 + rnd() * 90, -1, 23, right + 10, anchors));
      still(addPlant('grass', jit(x0 + span * 0.68, 18), H - 8, 100 + rnd() * 80, 1, 24, right + 10, anchors));
    }

    let ground = null;
    if (padB > 74) {
      const soilH = Math.max(26, Math.min(56, Math.round(window.innerHeight * 0.042)));
      const grassH = Math.max(56, Math.round((padB - soilH) * 0.92));
      addSoil(W, H, soilH);

      const segW = 260;
      const step = segW - 62;
      let k = 0;
      for (let sx = -20; sx < W; sx += step, k++) {
        still(addPlant('bed', sx + segW / 2, H - soilH + 2, grassH, 1, 400 + k,
          null, anchors, segW));
      }
      ground = { soilH, grassH, top: H - soilH - grassH };
    }

    const inGutter = (a) => a.x < gutterL - 26 || a.x > right + 26;
    const inStrip = (a) => a.y > H - padB - 2;
    window.sheetFlora = {
      blooms: anchors.filter((a) => inGutter(a) || inStrip(a)).map((a) => ({
        x: a.x, y: a.y, r: a.r,
      })),
      bounds: { left, right, bottom: H - 4, padB, W, H, ground },
    };
    dispatchEvent(new CustomEvent('sheetflora:layout'));
    wake();
  }

  // The plants lean towards the cursor the way the hero's do: a smoothstep
  // falloff across the reach, eased into place frame by frame.
  const REACH = 320;
  let pointer = null, leanRaf = 0;

  function setLean(p) {
    const deg = Math.abs(p.lean) < 0.02 ? 0 : p.lean;
    if (p.deg === deg) return deg !== 0;
    p.deg = deg;
    if (p.el.stillFrame) p.el.style.transform = deg ? 'rotate(' + deg.toFixed(2) + 'deg)' : '';
    else p.el.style.setProperty('--lean', deg.toFixed(2) + 'deg');
    return deg !== 0;
  }

  function tick() {
    leanRaf = 0;
    if (!plants.length || layer.classList.contains('is-paused')) return;
    const r = layer.getBoundingClientRect();
    const px = pointer ? pointer.x - r.left : null;
    const py = pointer ? pointer.y - r.top : null;
    let moving = false;
    for (const p of plants) {
      let target = 0;
      if (px != null) {
        const dx = px - p.x, dy = py - (p.y - p.h * 0.6), d = Math.hypot(dx, dy);
        if (d < REACH && d > 1) {
          const w = 1 - d / REACH;
          target = (dx / d) * w * w * (3 - 2 * w) * Math.min(1, d / 40) * p.max;
        }
      }
      p.lean += (target - p.lean) * 0.09;
      if (Math.abs(target - p.lean) < 0.02) p.lean = target;
      if (setLean(p)) moving = true;
    }
    if (pointer || moving) leanRaf = requestAnimationFrame(tick);
  }

  function wake() {
    if (reduce || leanRaf) return;
    leanRaf = requestAnimationFrame(tick);
  }

  addEventListener('pointermove', (e) => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    pointer = { x: e.clientX, y: e.clientY };
    wake();
  }, { passive: true });

  const release = () => { pointer = null; wake(); };
  document.addEventListener('pointerleave', release);
  addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') release(); });
  addEventListener('pointercancel', release);
  addEventListener('blur', release);

  let pending = 0;
  function schedule() {
    if (pending) return;
    pending = requestAnimationFrame(() => { pending = 0; layout(); });
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      layer.classList.toggle('is-paused', !entries[0].isIntersecting);
      if (entries[0].isIntersecting) wake();
    }, { rootMargin: '80px' }).observe(sheet);
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  window.addEventListener('resize', schedule, { passive: true });
  schedule();
})();
