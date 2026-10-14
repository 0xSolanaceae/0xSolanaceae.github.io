"use strict";

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
  if (!lines.length) throw new Error(`${url} -> empty sprite`);
  const srcWidth = Math.max(...lines.map((l) => l.length));
  let rows = lines.map((l) => l.padEnd(srcWidth, EMPTY));
  if (SPRITE_UPSCALE > 1) rows = upscaleSpriteRows(rows, srcWidth, SPRITE_UPSCALE);
  const width = Math.max(...rows.map((l) => l.length));
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
  return { width, height: rows.length, cells, cellsM };
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

/* Re-hue a sprite through a tonal ramp, keeping its drawing.
 *
 * A flat tint throws away everything the sprite says about itself: a beak, a
 * leg, and most of all the eye, which is the one feature that identifies a bird
 * at a distance. Photographing a dark bird against foliage is hard for exactly
 * this reason — the answer is not more contrast around the silhouette but
 * structure inside it. So each pixel is sorted into a tone by its own luminance
 * and painted in the ramp's colour for that tone: the shading, the beak and
 * legs, and the eye all survive, in the scene's own palette rather than the
 * sprite's.
 *
 * Returns what the placement needs: the bottom of the bird's body (its feet, as
 * opposed to the tail tip that hangs past them) and where a contact shadow
 * belongs under that mass. */
function rampSprite(sheet, src, thresholds, tones, minSpan) {
  const w = src[2];
  const h = src[3];
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  ctx.drawImage(sheet, src[0], src[1], w, h, 0, 0, w, h);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  let inkBottom = -1;
  const spanX0 = new Int16Array(h).fill(w);
  const spanX1 = new Int16Array(h).fill(-1);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (d[i + 3] === 0) continue;
      if (y > inkBottom) inkBottom = y;
      if (x < spanX0[y]) spanX0[y] = x;
      if (x > spanX1[y]) spanX1[y] = x;
      const lum = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
      let tier = tones.length - 1;
      for (let k = 0; k < thresholds.length; k++) {
        if (lum < thresholds[k]) { tier = k; break; }
      }
      const tone = tones[tier];
      d[i] = tone[0];
      d[i + 1] = tone[1];
      d[i + 2] = tone[2];
    }
  }
  /* A perched sprite's lowest ink is usually the tail tip, which hangs past the
     branch. Standing on it would lift the feet off the surface, so the anchor is
     the lowest row that is still a body — a solid span rather than a loner. */
  let bodyBottom = inkBottom;
  for (let y = inkBottom; y >= 0; y--) {
    if (spanX1[y] - spanX0[y] + 1 >= minSpan) { bodyBottom = y; break; }
  }
  const x0 = spanX0[bodyBottom];
  const x1 = spanX1[bodyBottom];
  ctx.putImageData(img, 0, 0);
  return {
    canvas: c, w, h, bodyBottom,
    contactMid: (x0 + x1 + 1) / 2,
    contactHalf: Math.max(1, (x1 - x0 + 1) * 0.225),
  };
}
