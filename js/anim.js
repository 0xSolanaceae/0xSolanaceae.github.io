"use strict";

let mx = 0;      // the value on screen — every animation starts from this one
let tmx = 0;     // where tracking is aiming it
let rafId = 0;
let wakeTimer = 0;
let lastTick = 0;
let viewportW = window.innerWidth || 1;

/* Touch pans the parallax: a finger cannot hover, so it takes hold of the scene
 * and drags it. A mouse maps its position across the window instead. Both are
 * 1:1 with the hand, which is what makes the scene feel like a surface rather
 * than something being played at. */
let dragging = false;
let dragStartX = 0;
let dragStartTmx = 0;
let dragRaw = 0; // unclamped, so momentum and the soft edge have real positions to work from

/* Tracking stays an exponential approach: frame-rate independent, and correct
 * for a target that keeps moving (a spring would lag behind a live finger). The
 * release is a spring, because that is motion which has to be handed a velocity
 * and stay interruptible. */
let coasting = false;
const coast = makeSpring({
  damping: 0.8, response: 0.35, restDistance: 0.0006, restVelocity: 0.006,
});

/* Exponential smoothing constant (1/s), frame-rate independent. */
const SMOOTH_RATE = 14;

/* Screens of pan travel that sweep the whole parallax range. */
const PAN_SPAN = 2;

/* How much of an overshoot past the end survives as motion. */
const EDGE_GIVE = 0.55;

/* Ignore sub-pixel shifts so the easing tail doesn't rewrite transforms. */
const SHIFT_EPS = 0.03; // cells

/* Past the ends of the range there is nothing more to show, so resist instead
 * of stopping dead: the further out it is pulled, the less it follows. */
function edgeLimit(raw) {
  const over = Math.abs(raw) - 1;
  if (over <= 0) return raw;
  return (raw < 0 ? -1 : 1) * (1 + rubberband(over, 1, EDGE_GIVE));
}

function onNote(x, y) {
  return !!PAPER_INFO && hitPaper(x, y);
}

/* The end of the ease: a finger's flick is thrown, not dropped. Where it lands
 * comes from the projection first, then the velocity it already had is handed
 * to the spring so there is no seam between the finger and the motion. */
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
  // A press on the note is a tap until it travels: the pan only claims it once
  // intent is clear, and it claims it from where the hand is by then.
  if (onNote(PTR.x0, PTR.y0)) return;
  dragging = true;
  dragStartX = PTR.x0;
  dragStartTmx = mx;
  dragRaw = mx;
});

onPointer("move", () => {
  if (PTR.down && PTR.touch) {
    if (!dragging) {
      if (onNote(PTR.x0, PTR.y0) && !PTR.dragged) return; // still a tap on the note
      dragging = true;
      dragStartX = PTR.x;
      dragStartTmx = mx; // take hold of what is on screen, not of a stale target
      coasting = false;
    }
    dragRaw = dragStartTmx + (PTR.x - dragStartX) * (PAN_SPAN / viewportW);
    tmx = edgeLimit(dragRaw);
  } else if (!PTR.touch) {
    // A mouse taking over mid-flick is the hand grabbing the scene again, so it
    // takes over from the value on screen: no jump, the approach just continues.
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
    lastTick = 0; // fresh wake: don't let a long sleep skew the first frame's dt
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
      mx = tmx = coast.value; // land exactly on it, then resume tracking from there
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

  // Leaves animate continuously; otherwise sleep until the next flock spawns.
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
