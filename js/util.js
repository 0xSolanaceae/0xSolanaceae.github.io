"use strict";

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const debounce = (fn, ms) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

/* #rrggbb (or #rgb) to the triple the canvas pixel loop wants. */
function cssToRgb(css) {
  let hex = css.trim();
  if (hex[0] !== "#") return [0, 0, 0];
  hex = hex.slice(1);
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  const n = parseInt(hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function haptic(ms) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

function noise1D(x) {
  const xi = Math.floor(x);
  const xf = x - xi;
  const a = hash(xi);
  const b = hash(xi + 1);
  const u = xf * xf * (3 - 2 * xf);
  return a + (b - a) * u;
}
function perlin1D(x, octaves = 3) {
  let total = 0, amp = 0.5, freq = 1, norm = 0;
  for (let i = 0; i < octaves; i++) {
    total += noise1D(x * freq) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return total / norm;
}
