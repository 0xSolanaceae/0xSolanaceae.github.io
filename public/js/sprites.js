"use strict";

/* Braille dot bit -> [sub-col, sub-row] in the 2x4 cell matrix. */
const SPRITE_DOT_BITS = [
  [0, 0], [0, 1], [0, 2], [1, 0],
  [1, 1], [1, 2], [0, 3], [1, 3],
];

function upscaleSpriteRows(rows, width, k) {
  const h = rows.length;
  const gw = width * 2;
  const gh = h * 4;
  const grid = new Uint8Array(gw * gh);
  for (let y = 0; y < h; y++) {
    const line = rows[y];
    for (let x = 0; x < width; x++) {
      const ch = line[x];
      if (ch === " " || ch === EMPTY) continue;
      const code = ch.codePointAt(0) - 0x2800;
      if (code <= 0 || code > 0xff) continue;
      const base = y * 4 * gw + x * 2;
      for (let bit = 0; bit < 8; bit++) {
        if (code & (1 << bit)) {
          const [col, drow] = SPRITE_DOT_BITS[bit];
          grid[base + drow * gw + col] = 1;
        }
      }
    }
  }
  const nw = gw * k, nh = gh * k;
  const out = new Uint8Array(nw * nh);
  for (let y = 0; y < nh; y++) {
    const sy = Math.min(gh - 1, (y / k) | 0);
    const srcRow = sy * gw;
    const dstRow = y * nw;
    for (let x = 0; x < nw; x++) {
      out[dstRow + x] = grid[srcRow + Math.min(gw - 1, (x / k) | 0)];
    }
  }
  const newW = nw / 2, newH = nh / 4;
  const result = [];
  for (let cy = 0; cy < newH; cy++) {
    let line = "";
    for (let cx = 0; cx < newW; cx++) {
      let code = 0;
      const base = cy * 4 * nw + cx * 2;
      for (let bit = 0; bit < 8; bit++) {
        if (out[base + SPRITE_DOT_BITS[bit][1] * nw + SPRITE_DOT_BITS[bit][0]]) code |= (1 << bit);
      }
      line += String.fromCodePoint(0x2800 + code);
    }
    result.push(line);
  }
  return result;
}

async function loadSprite(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  const text = await res.text();
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  const srcWidth = Math.max(...lines.map((l) => l.length));
  let rows = lines.map((l) => l.padEnd(srcWidth, EMPTY));
  if (SPRITE_UPSCALE > 1) rows = upscaleSpriteRows(rows, srcWidth, SPRITE_UPSCALE);
  const width = Math.max(...rows.map((l) => l.length));
  // Precompute flat cell lists [x, y, dot code] for both orientations.
  const cells = [];
  const cellsM = [];
  for (let y = 0; y < rows.length; y++) {
    const line = rows[y];
    for (let x = 0; x < line.length; x++) {
      const ch = line[x];
      if (ch === " " || ch === EMPTY) continue;
      const code = ch.codePointAt(0) - 0x2800;
      if (code <= 0 || code > 0xff) continue;
      cells.push([x, y, code]);
      cellsM.push([width - 1 - x, y, code]);
    }
  }
  return { rows, width, height: rows.length, cells, cellsM };
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.decoding = "async";
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error(url + " failed to load"));
    im.src = url;
  });
}

function tintSprite(sheet, src, color, alpha) {
  const c = document.createElement("canvas");
  c.width = src[2];
  c.height = src[3];
  const ctx = c.getContext("2d");
  ctx.drawImage(sheet, src[0], src[1], src[2], src[3], 0, 0, src[2], src[3]);
  ctx.globalCompositeOperation = "source-in";
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  return c;
}
