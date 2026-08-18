"use strict";

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const mod = (a, m) => ((a % m) + m) % m;
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
  return total / norm; // ~0..1, smooth
}
