"use strict";

let mx = 0;
let tmx = 0;
let rafId = 0;
let wakeTimer = 0;
let lastTick = 0;
let viewportW = window.innerWidth || 1;
let dragging = false;
let dragStartX = 0;
let dragStartTmx = 0;

/* Exponential smoothing constant (1/s), frame-rate independent. */
const SMOOTH_RATE = 14;

/* Ignore sub-pixel shifts so the easing tail doesn't rewrite transforms. */
const SHIFT_EPS = 0.03; // cells

function writeTransforms() {
  for (const layer of LAYERS) {
    const m = metas[layer.key];
    if (!m || !m.el) continue;
    const s = clamp(mx * MAX_SHIFT_X * layer.depth, -MARGIN, MARGIN);
    m.shift = s;
    if (m.lastS === undefined || Math.abs(m.lastS - s) >= SHIFT_EPS) {
      m.lastS = s;
      const yOff = m.yOff || 0;
      m.el.style.transform = `translate3d(${(-s - MARGIN) * CELL.w}px, ${(yOff - ROWS / 2) * CELL.h}px, 0)`;
    }
  }
}

function ensureTicking() {
  if (wakeTimer) { clearTimeout(wakeTimer); wakeTimer = 0; }
  if (!rafId) {
    lastTick = 0; // fresh wake: don't let a long sleep skew the first frame's dt
    rafId = requestAnimationFrame(tick);
  }
}

function tick(now) {
  rafId = 0;
  const dt = lastTick ? Math.min(0.05, (now - lastTick) / 1000) : 1 / 60;
  lastTick = now;
  mx += (tmx - mx) * (1 - Math.exp(-SMOOTH_RATE * dt));
  if (Math.abs(tmx - mx) < 0.0005) mx = tmx;
  writeTransforms();
  renderBirdsNear(now);
  renderBirdsFar(now);
  renderLeaves(now);
  updateWind(now);

  // Leaves animate continuously; otherwise sleep until the next flock spawns.
  const leavesAlive = !REDUCED_MOTION && anyLeaves();
  if (Math.abs(tmx - mx) > 0.001 || nearBirds.length > 0 || farBirds.length > 0 || leavesAlive) {
    rafId = requestAnimationFrame(tick);
  } else {
    const wait = REDUCED_MOTION
      ? 60000
      : Math.max(1000, Math.min(nextNearFlocksAt, nextFarFlocksAt) - performance.now());
    wakeTimer = setTimeout(ensureTicking, wait);
  }
}

window.addEventListener("resize", () => { viewportW = window.innerWidth || 1; });

window.addEventListener("pointermove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  if (dragging) {
    // Touch drag pans the parallax: half a screen of travel sweeps the full range.
    tmx = clamp(dragStartTmx + (e.clientX - dragStartX) * (2 / viewportW), -1, 1);
  } else {
    tmx = clamp((e.clientX / viewportW) * 2 - 1, -1, 1);
  }
  ensureTicking();
});

window.addEventListener("pointerdown", (e) => {
  if (e.pointerType !== "touch") return;
  dragging = true;
  dragStartX = e.clientX;
  dragStartTmx = tmx;
  mouseX = e.clientX;
  mouseY = e.clientY;
  ensureTicking();
});

function endDrag(e) {
  if (!dragging) return;
  dragging = false;
  if (e.pointerType === "touch") {
    mouseX = -9999;
    mouseY = -9999;
  }
}
window.addEventListener("pointerup", endDrag);
window.addEventListener("pointercancel", endDrag);

document.documentElement.addEventListener("pointerleave", (e) => {
  if (e.pointerType !== "touch") tmx = 0;
  mouseX = -9999;
  mouseY = -9999;
  ensureTicking();
});
