"use strict";

let mx = 0;
let tmx = 0;
let rafId = 0;
let wakeTimer = 0;
let lastTick = 0;
let viewportW = window.innerWidth || 1;

/* The scene is a dozen full-bleed layers over one another, so every drawn frame
 * is a full-screen composite. On a 120 Hz or 165 Hz panel doing that on every
 * refresh buys nothing the eye can see — the parallax eases and the leaves fall
 * at the same speed either way — but it does cost the compositor most of its
 * budget. So a frame is held for as many refreshes as it takes to stay above
 * MIN_FPS, measured once per page from the display's own cadence. */
const TARGET_FPS = 60;
const MIN_FPS = 50;
const VSYNC_SAMPLES = 24;
let framePeriod = 0;
let drawnAt = 0;
let vsyncAt = 0;
const vsyncGaps = [];

let lightLit = false;

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
      m.el.style.transform =
        `translate3d(${(-s - MARGIN) * CELL.w + (m.offX || 0)}px, ` +
        `${(yOff - ROWS / 2) * CELL.h + (m.offY || 0)}px, 0)`;
    }
  }
}

/* The shaft of light breathes. It used to be a CSS animation, but a running
 * animation keeps the compositor working on every refresh no matter how the
 * frame loop is paced, which would have undone the pacing above. */
function breatheLight(now) {
  if (REDUCED_MOTION) {
    if (lightLit) {
      lightEl.style.opacity = "";
      lightEl.style.transform = "";
      lightLit = false;
    }
    return;
  }
  const p = 0.5 - 0.5 * Math.cos((now * Math.PI) / LIGHT_BREATH_MS);
  lightEl.style.opacity = (0.65 + 0.35 * p).toFixed(3);
  lightEl.style.transform = `skewX(-7deg) scaleY(${(0.985 + 0.03 * p).toFixed(4)})`;
  lightLit = true;
}

function measureVsync(now) {
  if (framePeriod) return;
  if (vsyncAt) {
    const gap = now - vsyncAt;
    // A hidden or throttled tab reports absurd gaps; those say nothing about
    // the display, so the window starts again rather than locking onto them.
    if (gap >= 2 && gap <= 40) vsyncGaps.push(gap);
    else vsyncGaps.length = 0;
  }
  vsyncAt = now;
  if (vsyncGaps.length < VSYNC_SAMPLES) return;
  vsyncGaps.sort((a, b) => a - b);
  // The fastest intervals are the display's own; the slower ones are frames the
  // machine could not start on time, and start-up is full of those.
  const vsync = clamp(vsyncGaps[Math.floor(VSYNC_SAMPLES * 0.2)] || 1000 / TARGET_FPS, 4, 20);
  let skip = 1;
  for (let s = 2; s <= 4; s++) {
    if (1000 / (vsync * s) >= MIN_FPS) skip = s;
  }
  framePeriod = vsync * skip;
  vsyncGaps.length = 0;
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
  measureVsync(now);
  if (drawnAt && framePeriod && now - drawnAt < framePeriod - 2) {
    rafId = requestAnimationFrame(tick);
    return;
  }
  drawnAt = now;
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
  breatheLight(now);
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

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    if (wakeTimer) { clearTimeout(wakeTimer); wakeTimer = 0; }
    return;
  }
  drawnAt = 0;
  ensureTicking();
});

window.addEventListener("resize", () => { viewportW = window.innerWidth || 1; });
