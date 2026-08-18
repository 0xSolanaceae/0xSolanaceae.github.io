"use strict";

const PAPER_SEED = 401;     // fixed so the tatter/stain/scribble pattern is stable
const PAPER_W_CELLS = 11;
const PAPER_H_CELLS = 8.8;
const INK = "#231a0d";
const INK_ALPHA = 0.8;

/* The note's position/size/lean in its layer canvas, for papercard.js. */
let PAPER_INFO = null;

function seededRand(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* One ragged edge: [t, offsetRatio] pairs in normalized coordinates, so it
   can be scaled to any sheet size and the card reuses the note's tears. */
function edgeOffsets(len, u, rng) {
  const step = Math.max(0.8, Math.min(len / 34, u * 0.16));
  const n = Math.max(5, Math.round(len / step));
  const off = new Array(n + 1);
  for (let i = 0; i <= n; i++) {
    const roll = rng();
    if (roll < 0.06) off[i] = -(0.16 + rng() * 0.44);
    else if (roll < 0.12) off[i] = -(0.02 + rng() * 0.06);
    else if (roll < 0.3) off[i] = 0.04 + rng() * 0.24;
    else off[i] = 0;
  }
  const rips = 1 + Math.floor(rng() * 2);
  for (let r = 0; r < rips; r++) {
    const c = 2 + Math.floor(rng() * (n - 3));
    const depth = 0.35 + rng() * 0.75;
    off[c] = -depth;
    off[Math.max(0, c - 1)] = Math.min(off[Math.max(0, c - 1)], -depth * 0.5);
    off[Math.min(n, c + 1)] = Math.min(off[Math.min(n, c + 1)], -depth * 0.5);
  }
  return off.map((o, i) => [i / n, o]);
}

/* The note's torn-edge data, reused by the card. */
let PAPER_EDGES = null;

function makeSheetEdges(w, h, u, rng) {
  return {
    top: edgeOffsets(w, u, rng),
    right: edgeOffsets(h, u, rng),
    bottom: edgeOffsets(w, u, rng),
    left: edgeOffsets(h, u, rng),
  };
}

function buildSheetPath(w, h, u, edges) {
  const scale = (edge, len) => edge.map(([t, o]) => [t * len, o * u]);
  const top = scale(edges.top, w);
  const right = scale(edges.right, h);
  const bottom = scale(edges.bottom, w);
  const left = scale(edges.left, h);
  const p = new Path2D();
  p.moveTo(top[0][0], -top[0][1]);
  for (let i = 1; i < top.length; i++) p.lineTo(top[i][0], -top[i][1]);
  for (let i = 0; i < right.length; i++) p.lineTo(w + right[i][1], right[i][0]);
  for (let i = bottom.length - 1; i >= 0; i--) p.lineTo(bottom[i][0], h + bottom[i][1]);
  for (let i = left.length - 1; i >= 0; i--) p.lineTo(-left[i][1], left[i][0]);
  p.closePath();
  return p;
}

function strokeVarWidth(ctx, pts, widthAt, color, alpha) {
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let i = 0; i < pts.length - 1; i++) {
    const t = i / (pts.length - 1);
    ctx.globalAlpha = alpha;
    ctx.lineWidth = widthAt(t, i);
    ctx.beginPath();
    ctx.moveTo(pts[i][0], pts[i][1]);
    ctx.lineTo(pts[i + 1][0], pts[i + 1][1]);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawWord(ctx, x0, y0, len, slant, inkW, u, rng) {
  const step = Math.max(1.1, u * 0.12);
  const n = Math.max(4, Math.round(len / step));
  const phase = rng() * Math.PI * 2;
  const freq = (2 + rng() * 2.2) / len;
  const amp = u * (0.07 + rng() * 0.09);
  const slope = slant + (rng() - 0.5) * 0.09;

  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x0 + t * len;
    const y = y0 + Math.sin(phase + t * len * freq) * amp * Math.sin(Math.PI * t) + t * len * slope;
    pts.push([x, y]);
  }

  const widthAt = (t) => {
    const taper = Math.min(1, t * 8) * Math.min(1, (1 - t) * 8);
    const pressure = 0.7 + 0.3 * Math.sin(phase * 0.8 + t * len * freq * 1.8);
    return inkW * taper * pressure;
  };

  strokeVarWidth(ctx, pts, (t) => widthAt(t) * 1.9, INK, INK_ALPHA * 0.12);
  strokeVarWidth(ctx, pts, widthAt, INK, INK_ALPHA);

  if (rng() < 0.38) {
    const t = 0.15 + rng() * 0.7;
    const down = rng() < 0.5;
    const base = pts[Math.round(t * n)];
    const tailLen = u * (0.14 + rng() * 0.14);
    const tailPts = [];
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const tt = i / steps;
      tailPts.push([
        base[0] + tt * u * (0.03 + rng() * 0.03),
        base[1] + (down ? 1 : -1) * tt * tailLen,
      ]);
    }
    const tailW = (tt) => inkW * (1 - tt) * 0.85;
    strokeVarWidth(ctx, tailPts, (tt) => tailW(tt) * 1.6, INK, INK_ALPHA * 0.1);
    strokeVarWidth(ctx, tailPts, tailW, INK, INK_ALPHA * 0.85);
  }
}

function drawInk(ctx, w, h, u, rng) {
  const inkW = Math.max(0.7, u * 0.07);
  const lines = 4;
  const top = u * 0.8;
  const bottom = h - u * 0.9;
  const left = u * 0.75;
  const right = w - u * 0.75;
  const span = bottom - top;

  for (let li = 0; li < lines; li++) {
    const baseY = top + (span * (li + 0.5)) / lines + (rng() - 0.5) * u * 0.4;
    const slant = (rng() - 0.5) * 0.06;
    let x = left;
    while (x < right - u * 0.5) {
      const available = right - x;
      if (available < u * 0.6) break;
      const wordLen = Math.min(u * (0.9 + rng() * 1.8), available);
      const gap = u * (0.3 + rng() * 0.5);
      drawWord(ctx, x, baseY, wordLen, slant, inkW, u, rng);
      x += wordLen + gap;
    }
  }

  for (let i = 0; i < 3; i++) {
    if (rng() < 0.5) {
      const x = left + rng() * (right - left);
      const y = top + rng() * span;
      ctx.fillStyle = INK;
      ctx.globalAlpha = INK_ALPHA * 0.6;
      ctx.beginPath();
      ctx.arc(x, y, inkW * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}

function drawNail(ctx, nx, ny, u) {
  // Pixel-art nail: hard square pixels, scaled to the scene's cell grid.
  const s = Math.max(1, Math.round(u * 0.055));
  const M = "#6d6860", L = "#e8e2d8", D = "#332f2a";
  const grid = [
    [0, M, M, M, 0],
    [M, L, L, M, M],
    [M, L, L, M, M],
    [M, M, M, D, M],
    [0, M, M, M, 0],
  ];
  // One-pixel drop shadow, offset down-right.
  ctx.fillStyle = "rgba(40, 28, 12, 0.35)";
  ctx.fillRect(nx - s, ny - s, s * 5, s * 5);
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] === 0) continue;
      ctx.fillStyle = grid[y][x];
      ctx.fillRect(nx + (x - 2) * s, ny + (y - 2) * s, s, s);
    }
  }
}

/* Paint the torn sheet itself (fill, lighting, staining, grain, fringe).
   Shared by the note and the card so they match. */
function paintPaperSheet(ctx, sheet, w, h, u, rng) {
  ctx.fillStyle = "#f3ead2";
  ctx.fill(sheet);
  ctx.save();
  ctx.clip(sheet);

  const light = ctx.createLinearGradient(0, 0, w, h);
  light.addColorStop(0, "rgba(255, 251, 235, 0.55)");
  light.addColorStop(0.45, "rgba(0, 0, 0, 0)");
  light.addColorStop(1, "rgba(120, 92, 52, 0.28)");
  ctx.fillStyle = light;
  ctx.fillRect(-u, -u, w + u * 2, h + u * 2);

  for (let i = 0; i < 9; i++) {
    const x = rng() * w, y = rng() * h;
    const r = u * (0.5 + rng() * 1.4);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const dark = rng() < 0.6;
    g.addColorStop(0, dark ? "rgba(150, 118, 72, 0.10)" : "rgba(255, 250, 230, 0.10)");
    g.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  const streaks = Math.round((w * h) / (u * u * 8));
  for (let i = 0; i < streaks; i++) {
    const x = rng() * w, y = rng() * h;
    const len = u * (0.15 + rng() * 0.35);
    ctx.fillStyle = rng() < 0.7 ? "rgba(255, 250, 232, 0.06)" : "rgba(130, 104, 66, 0.07)";
    ctx.fillRect(x, y, len, Math.max(0.5, u * 0.025));
  }
  const flecks = Math.round((w * h) / (u * u * 10));
  for (let i = 0; i < flecks; i++) {
    const x = rng() * w, y = rng() * h;
    ctx.fillStyle = "rgba(110, 88, 52, 0.08)";
    ctx.fillRect(x, y, Math.max(0.6, u * 0.05), Math.max(0.6, u * 0.05));
  }

  ctx.save();
  ctx.filter = "blur(" + Math.max(1.5, u * 0.14).toFixed(1) + "px)";
  ctx.strokeStyle = "rgba(120, 94, 56, 0.16)";
  ctx.lineWidth = u * 0.06;
  ctx.beginPath();
  ctx.moveTo(w * 0.46, -u);
  ctx.lineTo(w * 0.4, h + u);
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = "rgba(255, 250, 232, 0.55)";
  ctx.lineWidth = Math.max(1, u * 0.14);
  ctx.stroke(sheet);

  ctx.restore();

  ctx.strokeStyle = "rgba(128, 102, 62, 0.30)";
  ctx.lineWidth = Math.max(0.5, u * 0.04);
  ctx.stroke(sheet);
}

function renderNailedPaper(canvas, cellW, cellH, dpr, worldCells, rowsCells, anchorXCell, anchorYCell) {
  const cw = Math.max(1, Math.round(worldCells * cellW * dpr));
  const ch = Math.max(1, Math.round(rowsCells * cellH * dpr));
  if (canvas.width !== cw || canvas.height !== ch) {
    canvas.width = cw;
    canvas.height = ch;
  }
  canvas.style.width = `${worldCells * cellW}px`;
  canvas.style.height = `${rowsCells * cellH}px`;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, worldCells * cellW, rowsCells * cellH);

  const u = Math.max(6, cellH);
  const w = PAPER_W_CELLS * cellW;
  const h = PAPER_H_CELLS * cellH;
  const rng = seededRand(PAPER_SEED);

  const nailX = w * (0.46 + rng() * 0.08);
  const nailY = u * (0.28 + rng() * 0.25);
  const tilt = (rng() - 0.5) * 0.7;
  PAPER_EDGES = makeSheetEdges(w, h, u, rng);
  const sheet = buildSheetPath(w, h, u, PAPER_EDGES);

  {
    const cos = Math.cos(tilt), sin = Math.sin(tilt);
    const dx = w / 2 - nailX;
    const dy = h / 2 - nailY;
    PAPER_INFO = {
      cx: anchorXCell * cellW + (dx * cos - dy * sin - dx),
      cy: anchorYCell * cellH + (dx * sin + dy * cos - dy),
      w, h, tilt,
    };
  }

  ctx.save();
  ctx.translate(anchorXCell * cellW, anchorYCell * cellH);
  ctx.translate(-w / 2, -h / 2);
  ctx.translate(nailX, nailY);
  ctx.rotate(tilt);
  ctx.translate(-nailX, -nailY);

  ctx.save();
  ctx.filter = "blur(" + Math.max(1, u * 0.18).toFixed(1) + "px)";
  ctx.fillStyle = "rgba(10, 6, 2, 0.5)";
  ctx.translate(u * 0.18, u * 0.28);
  ctx.fill(sheet);
  ctx.restore();

  paintPaperSheet(ctx, sheet, w, h, u, rng);
  drawInk(ctx, w, h, u, rng);
  drawNail(ctx, nailX, nailY, u);

  ctx.restore();
}
