"use strict";

// `fill` must match the layer's glyph set: mixing spaces with dot glyphs on
// one row lets browsers use different fallback-font widths and shears the art.
function makeGrid(w = W_TOTAL, h = ROWS, fill = " ") {
  return Array.from({ length: h }, () => new Array(w).fill(fill));
}

function paint(grid, x, y, ch) {
  if (x < 0 || x >= grid[0].length || y < 0 || y >= grid.length) return;
  if (ch === " " || ch === EMPTY) return;
  grid[y][x] = ch;
}

function putString(grid, x, y, s) {
  for (let c = 0; c < s.length; c++) paint(grid, x + c, y, s[c]);
}

function putSprite(grid, rows, x, y) {
  for (let r = 0; r < rows.length; r++) {
    const gy = y + r;
    if (gy < 0 || gy >= grid.length) continue;
    const line = rows[r];
    for (let c = 0; c < line.length; c++) paint(grid, x + c, gy, line[c]);
  }
}

/* Dot layout, precomputed once: dot bit n -> (sub-column, sub-row) of the
 * 2x4 cell matrix (normal and mirrored). */
const DOT_LAYOUT = [
  [0, 0, 0], [1, 0, 1], [2, 0, 2], [3, 1, 0],
  [4, 1, 1], [5, 1, 2], [6, 0, 3], [7, 1, 3],
];
const PIXEL_DOTS = new Array(0x100);
const PIXEL_DOTS_M = new Array(0x100);
for (let code = 0; code < 0x100; code++) {
  const dots = [];
  const dotsM = [];
  for (const [bit, col, row] of DOT_LAYOUT) {
    if (code & (1 << bit)) {
      dots.push([col, row]);
      dotsM.push([1 - col, row]);
    }
  }
  PIXEL_DOTS[code] = dots;
  PIXEL_DOTS_M[code] = dotsM;
}

const CHUNK_DOTS = 30000;

function pathBatcher(ctx) {
  ctx.beginPath();
  let n = 0;
  return {
    rect(x, y, w, h) {
      ctx.rect(x, y, w, h);
      if (++n >= CHUNK_DOTS) {
        ctx.fill();
        ctx.beginPath();
        n = 0;
      }
    },
    flush() {
      if (n > 0) ctx.fill();
    },
  };
}

function renderCanvasLayer(canvas, mask, color, cellW, cellH, dpr, dotScale = 1) {
  const w = mask[0].length;
  const h = mask.length;
  canvas.width = Math.max(1, Math.round(w * cellW * dpr));
  canvas.height = Math.max(1, Math.round(h * cellH * dpr));
  canvas.style.width = `${w * cellW}px`;
  canvas.style.height = `${h * cellH}px`;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w * cellW, h * cellH);
  ctx.fillStyle = color;
  const dotW = cellW / 2;
  const dotH = cellH / 4;
  const pxW = dotW * dotScale;
  const pxH = dotH * dotScale;
  const grow = dotScale >= 0.999 ? 0.35 : 0;
  const full = dotScale >= 0.999;
  const batcher = pathBatcher(ctx);
  for (let y = 0; y < h; y++) {
    const row = mask[y];
    const baseY = y * cellH;
    for (let x = 0; x < w; x++) {
      const code = row[x];
      if (code === 0) continue;
      if (full && code === 0xff) {
        const bx = x * cellW;
        batcher.rect(bx - grow, baseY - grow, cellW + grow * 2, cellH + grow * 2);
        continue;
      }
      const dots = PIXEL_DOTS[code];
      if (dots.length === 0) continue;
      const baseX = x * cellW;
      for (const [col, drow] of dots) {
        const cx = baseX + col * dotW + dotW / 2;
        const cy = baseY + drow * dotH + dotH / 2;
        batcher.rect(cx - pxW / 2 - grow, cy - pxH / 2 - grow, pxW + grow * 2, pxH + grow * 2);
      }
    }
  }
  batcher.flush();
}

/* Each unique (sprite, scale, mirror, colour) is rasterised once into an
   offscreen canvas and blitted for every instance that shares it. */
const spriteCanvasCache = new Map();

function spriteCanvas(sprite, scale, mirror, color, cellW, cellH, dotScale) {
  let bySprite = spriteCanvasCache.get(sprite);
  if (!bySprite) {
    bySprite = new Map();
    spriteCanvasCache.set(sprite, bySprite);
  }
  const key = `${scale.toFixed(3)}|${mirror ? 1 : 0}|${color}|${dotScale}`;
  const hit = bySprite.get(key);
  if (hit) return hit;

  const dotW = (cellW * scale) / 2;
  const dotH = (cellH * scale) / 4;
  const pxW = dotW * dotScale;
  const pxH = dotH * dotScale;
  const grow = dotScale >= 0.999 ? 0.35 : 0;
  const full = dotScale >= 0.999;
  const cellPxW = cellW * scale;
  const cellPxH = cellH * scale;
  const cw = Math.max(1, Math.ceil(sprite.width * cellPxW + grow * 2));
  const ch = Math.max(1, Math.ceil(sprite.height * cellPxH + grow * 2));
  const c = document.createElement("canvas");
  c.width = cw;
  c.height = ch;
  const ctx = c.getContext("2d");
  ctx.fillStyle = color;
  const batcher = pathBatcher(ctx);
  const cells = mirror ? sprite.cellsM : sprite.cells;
  const dotsTable = mirror ? PIXEL_DOTS_M : PIXEL_DOTS;
  for (let i = 0; i < cells.length; i++) {
    const cx0 = cells[i][0], cy0 = cells[i][1], code = cells[i][2];
    if (full && code === 0xff) {
      const bx = cx0 * cellPxW;
      const by = cy0 * cellPxH;
      batcher.rect(bx - grow, by - grow, cellPxW + grow * 2, cellPxH + grow * 2);
      continue;
    }
    const dots = dotsTable[code];
    if (dots.length === 0) continue;
    const colPxX = cx0 * cellPxW;
    const rowPxY = cy0 * cellPxH;
    for (const [dcol, drow] of dots) {
      const cx = colPxX + dcol * dotW + dotW / 2;
      const cy = rowPxY + drow * dotH + dotH / 2;
      batcher.rect(cx - pxW / 2 - grow, cy - pxH / 2 - grow, pxW + grow * 2, pxH + grow * 2);
    }
  }
  batcher.flush();
  const entry = { canvas: c, w: cw, h: ch };
  bySprite.set(key, entry);
  return entry;
}

function renderForestCanvas(canvas, instances, color, cellW, cellH, dpr, worldCells, rowsCells, dotScale = 1, offX = 0, offY = 0, clear = true) {
  if (clear !== false) {
    canvas.width = Math.max(1, Math.round(worldCells * cellW * dpr));
    canvas.height = Math.max(1, Math.round(rowsCells * cellH * dpr));
    canvas.style.width = `${worldCells * cellW}px`;
    canvas.style.height = `${rowsCells * cellH}px`;
    const sizingCtx = canvas.getContext("2d");
    sizingCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sizingCtx.clearRect(0, 0, worldCells * cellW, rowsCells * cellH);
  }
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = color;
  for (const inst of instances) {
    const { sprite, x, scale, mirror, baseY } = inst;
    const originX = x * cellW;
    const originY = baseY * cellH - sprite.height * cellH * scale;
    const sc = spriteCanvas(sprite, scale, mirror, color, cellW, cellH, dotScale);
    ctx.drawImage(sc.canvas, Math.round(originX + offX * Math.min(cellW, cellH)), Math.round(originY + offY * Math.min(cellW, cellH)), sc.w, sc.h);
  }
}
