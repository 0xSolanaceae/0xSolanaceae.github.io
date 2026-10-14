"use strict";

const PAPER_SEED = 401;
const PAPER_W_CELLS = 11;
const PAPER_NOTE_ROWS = 12;
/* How the writing sits on the sheet: a margin at the top and bottom, filled with
   this many lines. The note in the tree draws its illegible ink from these same
   numbers, so it is the same page of writing that the card opens into.
 *
 * The top margin is the deeper one because the nail is pinned through the sheet
 * just above the writing: it has to sit in blank paper, not under a line. */
const PAPER_WRITE_TOP = 0.115;
const PAPER_WRITE_BOTTOM = 0.07;
const PAPER_WRITE_INSET_X = 0.085;  // of the width
const PAPER_TEXT_ROWS = 14;
const INK = "#2b2113";
const INK_ALPHA = 0.74;

/* The sheet has been pinned to a tree for years: the pulp has yellowed, damp has
 * marked it and left tide rings, foxing has spotted it, and dirt has gathered
 * where the edges were handled. All of it is drawn from u, the height of one row
 * of the note, so the note in the tree and the card that opens from it are the
 * same paper at two sizes rather than two papers. */
const PAPER_PULP = "#e7d9b4";
const PAPER_GRIME = "104, 78, 40";
const PAPER_FOX = "139, 95, 47";

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
  const lines = PAPER_TEXT_ROWS;
  const top = h * PAPER_WRITE_TOP;
  const bottom = h * (1 - PAPER_WRITE_BOTTOM);
  const left = w * PAPER_WRITE_INSET_X;
  const right = w * (1 - PAPER_WRITE_INSET_X);
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
  const s = Math.max(1, Math.round(u * 0.055));
  const M = "#6d6860", L = "#e8e2d8", D = "#332f2a";
  const grid = [
    [0, M, M, M, 0],
    [M, L, L, M, M],
    [M, L, L, M, M],
    [M, M, M, D, M],
    [0, M, M, M, 0],
  ];
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

function paintPaperSheet(ctx, sheet, w, h, u, rng) {
  ctx.fillStyle = PAPER_PULP;
  ctx.fill(sheet);
  ctx.save();
  ctx.clip(sheet);

  // Sun from one side, which is what bleached the sheet unevenly in the first place.
  const light = ctx.createLinearGradient(0, 0, w, h);
  light.addColorStop(0, "rgba(255, 251, 235, 0.22)");
  light.addColorStop(0.45, "rgba(0, 0, 0, 0)");
  light.addColorStop(1, "rgba(120, 92, 52, 0.2)");
  ctx.fillStyle = light;
  ctx.fillRect(-u, -u, w + u * 2, h + u * 2);

  // Broad staining.
  for (let i = 0; i < 14; i++) {
    const x = rng() * w, y = rng() * h;
    const r = u * (0.5 + rng() * 1.6);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const dark = rng() < 0.66;
    g.addColorStop(0, dark ? `rgba(${PAPER_GRIME}, 0.13)` : "rgba(255, 250, 230, 0.09)");
    g.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Rain that dried on the sheet, leaving a dark rim where the water stopped. The
  // rim wanders, because a circle on paper reads as a drawn circle, not weather.
  const rings = 1 + Math.floor(rng() * 2);
  for (let i = 0; i < rings; i++) {
    const cx = rng() * w;
    const cy = rng() * h;
    const r = u * (1.0 + rng() * 1.4);
    const n = 16;
    const pts = [];
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      const rr = r * (0.8 + rng() * 0.4);
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    ctx.save();
    ctx.filter = "blur(" + Math.max(1, u * 0.12).toFixed(1) + "px)";
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let k = 1; k <= n; k++) ctx.lineTo(pts[k % n][0], pts[k % n][1]);
    ctx.closePath();
    // Paler inside the rim: water carries the grime out to where it stopped.
    ctx.fillStyle = `rgba(${PAPER_GRIME}, 0.05)`;
    ctx.fill();
    ctx.strokeStyle = `rgba(${PAPER_GRIME}, 0.15)`;
    ctx.lineWidth = u * 0.2;
    ctx.stroke();
    ctx.restore();
  }

  // Foxing: the small rust-brown spots that bloom on old paper.
  const fox = 7 + Math.round(rng() * 7);
  for (let i = 0; i < fox; i++) {
    const x = rng() * w, y = rng() * h;
    const r = u * (0.08 + rng() * 0.26);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${PAPER_FOX}, 0.34)`);
    g.addColorStop(0.5, `rgba(${PAPER_FOX}, 0.17)`);
    g.addColorStop(1, `rgba(${PAPER_FOX}, 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  const streaks = Math.round((w * h) / (u * u * 8));
  for (let i = 0; i < streaks; i++) {
    const x = rng() * w, y = rng() * h;
    const len = u * (0.15 + rng() * 0.35);
    ctx.fillStyle = rng() < 0.6 ? "rgba(255, 250, 232, 0.05)" : `rgba(130, 104, 66, 0.10)`;
    ctx.fillRect(x, y, len, Math.max(0.5, u * 0.025));
  }
  const flecks = Math.round((w * h) / (u * u * 10));
  for (let i = 0; i < flecks; i++) {
    const x = rng() * w, y = rng() * h;
    ctx.fillStyle = rng() < 0.7 ? `rgba(110, 88, 52, 0.11)` : `rgba(${PAPER_FOX}, 0.16)`;
    ctx.fillRect(x, y, Math.max(0.6, u * 0.05), Math.max(0.6, u * 0.05));
  }

  // Creases from a life spent folded, and the shadow each fold catches.
  const creases = [
    [w * 0.44 + (rng() - 0.5) * u, -u, w * 0.38 + (rng() - 0.5) * u, h + u, 0.19, 0.15],
    [-u, h * 0.66 + (rng() - 0.5) * u, w + u, h * 0.60 + (rng() - 0.5) * u, 0.11, 0.22],
  ];
  for (const [x0, y0, x1, y1, alpha, blur] of creases) {
    ctx.save();
    ctx.filter = "blur(" + Math.max(1.1, u * blur).toFixed(1) + "px)";
    ctx.strokeStyle = `rgba(112, 86, 50, ${alpha})`;
    ctx.lineWidth = u * 0.07;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.restore();
  }

  // Grime creeps in from every edge, because the borders of a sheet are what gets
  // handled. Drawn last, and as one band per edge so the corners — where two
  // bands meet — come out dirtiest. It has to go over the bleaching rather than
  // under it, or the light from one side leaves a rim brighter than the middle of
  // the sheet, which is backwards for paper this old.
  const band = Math.min(w, h) * 0.3;
  const edgeBand = (x0, y0, x1, y1) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, `rgba(${PAPER_GRIME}, 0.34)`);
    g.addColorStop(0.45, `rgba(${PAPER_GRIME}, 0.11)`);
    g.addColorStop(1, `rgba(${PAPER_GRIME}, 0)`);
    return g;
  };
  // The rects overhang the sheet by this much. The torn edge bulges outward past
  // its nominal line, and a band stopping at that line would leave the tips of
  // those bulges unpainted — pale spikes along a tear that is meant to be its
  // dirtiest part. The gradient clamps outside its axis, so the overhang simply
  // gets the outermost colour. Clipping to the sheet keeps it off the background.
  const over = u * 2;
  const edgeBands = [
    [[0, 0], [0, band], [-over, -over, w + over * 2, band + over]],
    [[0, h], [0, h - band], [-over, h - band, w + over * 2, band + over]],
    [[0, 0], [band, 0], [-over, -over, band + over, h + over * 2]],
    [[w, 0], [w - band, 0], [w - band, -over, band + over, h + over * 2]],
  ];
  for (const [[gx0, gy0], [gx1, gy1], [rx, ry, rw, rh]] of edgeBands) {
    ctx.fillStyle = edgeBand(gx0, gy0, gx1, gy1);
    ctx.fillRect(rx, ry, rw, rh);
  }

  ctx.restore();

  // The rim of a sheet that has sat out is its dirtiest part, so the edge is
  // darkened here rather than highlighted — a pale line along a tear reads as
  // new paper, which is the one thing this sheet is not. It is also the last
  // thing drawn on the bare edge, which is what keeps the tear's sharp tips from
  // showing the pale pulp underneath everything else.
  ctx.strokeStyle = `rgba(74, 52, 26, 0.66)`;
  ctx.lineWidth = Math.max(0.8, u * 0.07);
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
  const h = PAPER_NOTE_ROWS * cellH;
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
      nx: anchorXCell * cellW + nailX - w / 2,
      ny: anchorYCell * cellH + nailY - h / 2,
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
