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
let dragRaw = 0;

let coasting = false;
const coast = makeSpring({
  damping: 0.8, response: 0.35, restDistance: 0.0006, restVelocity: 0.006,
});

const SMOOTH_RATE = 14;

const PAN_SPAN = 2;

const EDGE_GIVE = 0.55;

const SHIFT_EPS = 0.03;

function edgeLimit(raw) {
  const over = Math.abs(raw) - 1;
  if (over <= 0) return raw;
  return (raw < 0 ? -1 : 1) * (1 + rubberband(over, 1, EDGE_GIVE));
}

function onNote(x, y) {
  return !!PAPER_INFO && hitPaper(x, y);
}

function endPan() {
  const wasPanning = dragging;
  dragging = false;
  if (!wasPanning || !PTR.touch) return;
  const vTmx = PTR.releaseVx * (PAN_SPAN / viewportW);
  const thrown = dragRaw + (REDUCED_MOTION ? 0 : projectMomentum(vTmx));
  coast.value = mx;
  coast.damping = REDUCED_MOTION ? 1 : 0.8;
  springTo(coast, clamp(thrown, -1, 1), REDUCED_MOTION ? 0 : vTmx);
  coasting = true;
  ensureTicking();
}

onPointer("press", () => {
  ensureTicking();
  if (!PTR.touch) return;
  coasting = false;
  if (onNote(PTR.x0, PTR.y0)) return;
  dragging = true;
  dragStartX = PTR.x0;
  dragStartTmx = mx;
  dragRaw = mx;
});

onPointer("move", () => {
  if (PTR.down && PTR.touch) {
    if (!dragging) {
      if (onNote(PTR.x0, PTR.y0) && !PTR.dragged) return;
      dragging = true;
      dragStartX = PTR.x;
      dragStartTmx = mx;
      coasting = false;
    }
    dragRaw = dragStartTmx + (PTR.x - dragStartX) * (PAN_SPAN / viewportW);
    tmx = edgeLimit(dragRaw);
  } else if (!PTR.touch) {
    coasting = false;
    tmx = clamp((PTR.x / viewportW) * PAN_SPAN - 1, -1, 1);
  }
  ensureTicking();
});

onPointer("release", endPan);

onPointer("leave", () => {
  if (!PTR.touch) tmx = 0;
  ensureTicking();
});

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
    lastTick = 0;
    rafId = requestAnimationFrame(tick);
  }
}

function tick(now) {
  rafId = 0;
  const dt = lastTick ? Math.min(0.05, (now - lastTick) / 1000) : 1 / 60;
  lastTick = now;
  if (coasting) {
    if (stepSpring(coast, dt)) {
      mx = coast.value;
    } else {
      coasting = false;
      mx = tmx = coast.value;
    }
  } else {
    mx += (tmx - mx) * (1 - Math.exp(-SMOOTH_RATE * dt));
    if (Math.abs(tmx - mx) < 0.0005) mx = tmx;
  }
  writeTransforms();
  renderBirdsNear(now);
  renderBirdsFar(now);
  renderLeaves(now);
  updateWind(now);

  const leavesAlive = !REDUCED_MOTION && anyLeaves();
  if (coasting || Math.abs(tmx - mx) > 0.001 || nearBirds.length > 0 || farBirds.length > 0 || leavesAlive) {
    rafId = requestAnimationFrame(tick);
  } else {
    const wait = REDUCED_MOTION
      ? 60000
      : Math.max(1000, Math.min(nextNearFlocksAt, nextFarFlocksAt) - performance.now());
    wakeTimer = setTimeout(ensureTicking, wait);
  }
}

window.addEventListener("resize", () => { viewportW = window.innerWidth || 1; });
