"use strict";

let windMouseX = -9999, windMouseY = -9999;
let windVx = 0, windVy = 0;
let windSpeed = 0;            // its magnitude, shared with leaves.js
let lastWindX = -9999, lastWindY = -9999, lastWindT = 0;
const VMAX = 8000;            // px/s — no real hand moves faster; rejects teleports

let windVortex = 0;
let windSpin = 0;
let windCx = 0, windCy = 0;

// The pointer as a translating circular body:
const PTR_RADIUS = 13;      // px — effective radius of the "body"
const DIPOLE_RANGE = 300;
// Shed vortex blobs (Lamb–Oseen):
const BLOB_RC0 = 16;
const BLOB_NU = 480;        // px²/s — viscous diffusion (rc² grows by 4ν·t)
const BLOB_TAU = 2.0;
const BLOB_MAX = 44;
const BLOB_CUT = 520;
// Turning sheds circulation proportional to V × a (wing-like):
const SHED_K = 0.018;
const SHED_MIN = 5200;
const SHED_MAX = 14000;
const SHED_SPEED_MIN = 140;
const SHED_CROSS_MIN = 20000;
// Fast straight motion trails a Strouhal wake of alternating eddies:
const WAKE_ST = 0.2;        // Strouhal number (~0.2 for a cylinder)
const WAKE_K = 0.028;
const WAKE_MIN = 2600;
const WAKE_MAX = 6500;
// Momentum wake: the air pushed along the pointer's recent path.
const WAKE_SIGMA0 = 26;
const WAKE_SIGMA_RATE = 90;
const WAKE_TAU = 0.3;
const WAKE_GAIN = 0.3;      // fraction of the pointer's speed felt at the trail core
const WAKE_TRAIL_MS = 900;
// Tornado detector (derived from what was actually shed):
const SWIRL_WINDOW = 1100;
const SWIRL_TIGHT = 160;
const AMB_BASE = 1.4;
const AMB_GUST = 8.2;

let shedAcc = 0;
let wakeAcc = 0;
let wakePhase = 0;
const blobs = [];
const shedLog = [];
const wakeTrail = [];

let ambTheta = Math.random() * Math.PI * 2;
let gustT0 = 0;
let gustRise = 0, gustHold = 0, gustFall = 0, gustPeak = 0, gustTilt = 0;
let gustEnd = 0;

const ease01 = (x) => x * x * (3 - 2 * x);

function spawnGust(now) {
  gustT0 = now + 5000 + Math.random() * 9000;
  gustRise = 700 + Math.random() * 700;
  gustHold = 1200 + Math.random() * 2200;
  gustFall = 800 + Math.random() * 1200;
  gustPeak = 0.7 + Math.random() * 0.3;
  gustTilt = (Math.random() - 0.5) * 1.2;
  gustEnd = gustT0 + gustRise + gustHold + gustFall;
}

function gustEnv(now) {
  if (now < gustT0 || now >= gustEnd) return 0;
  const t = now - gustT0;
  if (t < gustRise) return ease01(t / gustRise) * gustPeak;
  if (t < gustRise + gustHold) return gustPeak;
  return gustPeak * (1 - ease01((t - gustRise - gustHold) / gustFall));
}

function ambientMean(now) {
  if (now >= gustEnd) spawnGust(now);
  const g = gustEnv(now);
  const t = now / 1000;
  const cellPx = CELL.w || 7.2;
  const wander = (perlin1D(t * 0.021, 3) - 0.5) * 2;
  const speed = cellPx * (AMB_BASE + AMB_GUST * g) * (0.72 + 0.14 * (wander + 1));
  const theta = ambTheta
    + Math.sin(t * 0.09 + 1.7) * 0.28
    + wander * 0.5
    + gustTilt * g;
  return { u: Math.cos(theta) * speed, v: Math.sin(theta) * speed * 0.75 };
}

/* 2D value noise so turbulence varies across the column as well as in time. */
function vnoise2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi + yi * 157.31);
  const b = hash(xi + 1 + yi * 157.31);
  const c = hash(xi + (yi + 1) * 157.31);
  const d = hash(xi + 1 + (yi + 1) * 157.31);
  const ab = a + (b - a) * u;
  const cd = c + (d - c) * u;
  return ab + (cd - ab) * v;
}

/* Turbulence advected with the mean wind, scaled by wind speed. */
function turbVector(x, y, now, mean) {
  const S = Math.hypot(mean.u, mean.v);
  if (S < 1) return { u: 0, v: 0 };
  const t = now / 1000;
  const L = 260;
  const n1 = vnoise2((x - mean.u * t) / L, (y - mean.v * t) / L + 3.7);
  const n2 = vnoise2((x - mean.u * t * 0.85) / (L * 0.55) + 41.3, (y - mean.v * t * 0.85) / (L * 0.55) + 91.2);
  const n3 = vnoise2((x - mean.u * t * 0.7) / (L * 0.22) - 13.1, (y - mean.v * t * 0.7) / (L * 0.22) - 7.7);
  return {
    u: ((n1 - 0.5) * 1.2 + (n2 - 0.5) * 0.5) * S * 0.5,
    v: ((n2 - 0.5) * 1.1 + (n3 - 0.5) * 0.4) * S * 0.38,
  };
}

/* Potential-flow dipole field of the pointer as a translating body. */
function dipoleWindAt(x, y) {
  if (windMouseX < -999) return { u: 0, v: 0 };
  const dx = x - windMouseX, dy = y - windMouseY;
  const d2 = dx * dx + dy * dy;
  if (d2 < 1) return { u: windVx, v: windVy };
  if (d2 > DIPOLE_RANGE * DIPOLE_RANGE) return { u: 0, v: 0 };
  const d = Math.sqrt(d2);
  const fade = clamp((DIPOLE_RANGE - d) / (DIPOLE_RANGE * 0.45), 0, 1);
  const env = ease01(fade);
  const speedGate = clamp((windSpeed - 25) / 90, 0, 1);
  if (d < PTR_RADIUS) return { u: windVx * env, v: windVy * env };
  const f = (PTR_RADIUS * PTR_RADIUS) / d2;
  const proj = (dx * windVx + dy * windVy) / d;
  return {
    u: f * (2 * proj * (dx / d) - windVx) * env * speedGate,
    v: f * (2 * proj * (dy / d) - windVy) * env * speedGate,
  };
}

/* A shed Lamb–Oseen vortex blob (core spreads by diffusion, γ decays). */
function blobWindAt(x, y) {
  let u = 0, v = 0;
  for (const b of blobs) {
    const dx = x - b.x, dy = y - b.y;
    const d2 = dx * dx + dy * dy;
    if (d2 > BLOB_CUT * BLOB_CUT) continue;
    const r = Math.sqrt(d2) || 1;
    const sw = (b.gamma / (2 * Math.PI)) * (r / (d2 + b.rc2)) * (1 - Math.exp(-d2 / b.rc2));
    u += (-dy / r) * sw;
    v += (dx / r) * sw;
  }
  return { u, v };
}

function wakeWindAt(x, y, now) {
  if (!wakeTrail.length) return { u: 0, v: 0 };
  let u = 0, v = 0;
  for (const s of wakeTrail) {
    const age = (now - s.t) / 1000;
    if (age > 1.2) continue;
    const dx = x - s.x, dy = y - s.y;
    const d2 = dx * dx + dy * dy;
    const sigma = WAKE_SIGMA0 + WAKE_SIGMA_RATE * age;
    const w = Math.exp(-d2 / (2 * sigma * sigma)) * Math.exp(-age / WAKE_TAU);
    u += s.vx * w;
    v += s.vy * w;
  }
  return { u: u * WAKE_GAIN, v: v * WAKE_GAIN };
}

function ambientWindAt(x, y, now) {
  const mean = ambientMean(now);
  const turb = turbVector(x, y, now, mean);
  return { u: mean.u + turb.u, v: mean.v + turb.v };
}

/* Flow created only by the cursor (used for leaf glow/scatter). */
function interactionWindAt(x, y, now) {
  const dip = dipoleWindAt(x, y);
  const bl = blobWindAt(x, y);
  const wk = wakeWindAt(x, y, now);
  return { u: dip.u + bl.u + wk.u, v: dip.v + bl.v + wk.v };
}

function windAt(x, y, now) {
  const mean = ambientMean(now);
  const turb = turbVector(x, y, now, mean);
  const dip = dipoleWindAt(x, y);
  const bl = blobWindAt(x, y);
  const wk = wakeWindAt(x, y, now);
  return { u: mean.u + turb.u + dip.u + bl.u + wk.u, v: mean.v + turb.v + dip.v + bl.v + wk.v };
}

function emitBlob(gamma, now) {
  const nx = windVx / (windSpeed || 1), ny = windVy / (windSpeed || 1);
  const bx = windMouseX - nx * 8 + (Math.random() * 8 - 4);
  const by = windMouseY - ny * 8 + (Math.random() * 8 - 4);
  blobs.push({ x: bx, y: by, gamma, rc2: BLOB_RC0 * BLOB_RC0, age: 0 });
  shedLog.push({ x: bx, y: by, gamma, t: now });
  if (blobs.length > BLOB_MAX) blobs.shift();
  if (shedLog.length > 64) shedLog.shift();
}

function shedVorticity(now, dt, ax, ay) {
  if (windMouseX < -999 || windSpeed < SHED_SPEED_MIN) return;
  if (windSpeed > 260) {
    wakePhase += (windSpeed / (2 * PTR_RADIUS)) * 2 * Math.PI * WAKE_ST * dt;
    wakeAcc += Math.sin(wakePhase) * WAKE_K * windSpeed * windSpeed * dt;
    let n = 0;
    while (Math.abs(wakeAcc) >= WAKE_MIN && n++ < 6) {
      const g = Math.sign(wakeAcc) * Math.min(Math.abs(wakeAcc), WAKE_MAX);
      wakeAcc -= g;
      emitBlob(g, now);
    }
  }
  const cross = windVx * ay - windVy * ax;
  if (Math.abs(cross) >= SHED_CROSS_MIN) {
    shedAcc += SHED_K * cross * dt;
    let n = 0;
    while (Math.abs(shedAcc) >= SHED_MIN && n++ < 6) {
      const g = Math.sign(shedAcc) * Math.min(Math.abs(shedAcc), SHED_MAX);
      shedAcc -= g;
      emitBlob(g, now);
    }
  }
}

function updateBlobs(now, dt) {
  const mean = ambientMean(now);
  for (let i = blobs.length - 1; i >= 0; i--) {
    const b = blobs[i];
    b.age += dt;
    b.rc2 = BLOB_RC0 * BLOB_RC0 + 4 * BLOB_NU * b.age;
    b.gamma *= Math.exp(-dt / BLOB_TAU);
    b.x += mean.u * dt * 0.55;
    b.y += mean.v * dt * 0.55;
    if (b.age > 4.5 || Math.abs(b.gamma) < 700) blobs.splice(i, 1);
  }
}

function updateSwirl(now, dt) {
  while (shedLog.length && now - shedLog[0].t > SWIRL_WINDOW) shedLog.shift();
  let sum = 0, wsum = 0, cx = 0, cy = 0;
  for (const s of shedLog) {
    const w = Math.abs(s.gamma);
    sum += s.gamma;
    wsum += w;
    cx += s.x * w;
    cy += s.y * w;
  }
  let target = 0, spinT = 0;
  if (wsum > 0) {
    cx /= wsum;
    cy /= wsum;
    let spread2 = 0;
    for (const s of shedLog) {
      const dx = s.x - cx, dy = s.y - cy;
      spread2 += Math.abs(s.gamma) * (dx * dx + dy * dy);
    }
    spread2 /= wsum;
    if (Math.sqrt(spread2) < SWIRL_TIGHT) {
      target = clamp((Math.abs(sum) - 6000) / 24000, 0, 1);
      spinT = clamp(sum / (Math.PI * Math.max(spread2, 55 * 55)), -12, 12);
    }
  }
  const k = 1 - Math.exp(-6 * dt);
  windVortex += (target - windVortex) * k;
  windSpin += (spinT - windSpin) * k;
  if (target > 0) {
    windCx += (cx - windCx) * k;
    windCy += (cy - windCy) * k;
  }
}

function updateWind(now) {
  const dt = lastWindT ? Math.min(0.1, Math.max(0.016, (now - lastWindT) / 1000)) : 0.016;
  if (windMouseX < -999) {
    windVx = 0;
    windVy = 0;
    windSpeed = 0;
    // Keep lastWindT at 0 so the pointer's return can't register a phantom teleport.
    updateBlobs(now, dt);
    updateSwirl(now, dt);
    return;
  }
  if (lastWindT) {
    const ix = clamp((windMouseX - lastWindX) / dt, -VMAX, VMAX);
    const iy = clamp((windMouseY - lastWindY) / dt, -VMAX, VMAX);
    const k = 1 - Math.exp(-12 * dt);
    const nvx = windVx + (ix - windVx) * k;
    const nvy = windVy + (iy - windVy) * k;
    const ax = (nvx - windVx) / dt;
    const ay = (nvy - windVy) / dt;
    windVx = nvx;
    windVy = nvy;
    windSpeed = Math.hypot(windVx, windVy);
    shedVorticity(now, dt, ax, ay);
    if (windSpeed > 50) {
      wakeTrail.push({ x: windMouseX, y: windMouseY, vx: windVx, vy: windVy, t: now });
      while (wakeTrail.length && now - wakeTrail[0].t > WAKE_TRAIL_MS) wakeTrail.shift();
      if (wakeTrail.length > 96) wakeTrail.shift();
    }
  }
  lastWindT = now;
  lastWindX = windMouseX;
  lastWindY = windMouseY;
  updateBlobs(now, dt);
  updateSwirl(now, dt);
}

function resetWind() {
  windMouseX = -9999;
  windMouseY = -9999;
  windVx = 0;
  windVy = 0;
  windSpeed = 0;
  windVortex = 0;
  windSpin = 0;
  shedAcc = 0;
  wakeAcc = 0;
  shedLog.length = 0;
  wakeTrail.length = 0;
  lastWindT = 0;
}

window.addEventListener("pointermove", (e) => {
  windMouseX = e.clientX;
  windMouseY = e.clientY;
  ensureTicking();
});
document.documentElement.addEventListener("pointerleave", () => {
  resetWind();
  ensureTicking();
});
// A lifted finger ends the touch rather than firing a reliable pointerleave,
// so reset explicitly so the wind stops the moment the touch is released.
window.addEventListener("pointerup", (e) => {
  if (e.pointerType !== "touch") return;
  resetWind();
  ensureTicking();
});
window.addEventListener("pointercancel", (e) => {
  if (e.pointerType !== "touch") return;
  resetWind();
  ensureTicking();
});
