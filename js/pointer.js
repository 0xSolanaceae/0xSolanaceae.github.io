"use strict";

/* The pointer, once.
 *
 * Position, press state and velocity used to be re-derived in anim.js, wind.js
 * and crows.js, so each had its own idea of when the hand was down and none of
 * them could hand a gesture's velocity to an animation. This owns the listeners
 * and the history; everything else reads PTR.
 *
 * Consumers subscribe with onPointer("press"|"move"|"release"|"leave", fn)
 * rather than adding listeners of their own, so a gesture is seen by every
 * subsystem in one pass and in one order. A release freezes its velocity before
 * the release hooks run, which is what makes the handoff possible.
 */

const TAP_SLOP = 10;    // px a press may travel before it counts as a drag, not a tap
const VEL_WINDOW = 100; // ms of history the velocity is fitted over
const VEL_MAX = 8000;   // px/s — no hand moves faster; rejects teleports

const PTR = {
  x: 0,
  y: 0,
  present: false,     // false before the pointer arrives and once it leaves the page
  down: false,
  touch: false,       // the event in hand came from touch
  dragged: false,     // the press in progress has traveled past the tap slop
  x0: 0,              // where the press in progress began
  y0: 0,
  vx: 0,              // px/s, over the recent history
  vy: 0,
  releaseVx: 0,       // px/s, frozen at the last release
  releaseVy: 0,
};

const ptrHooks = { press: [], move: [], release: [], leave: [] };

function onPointer(moment, fn) {
  ptrHooks[moment].push(fn);
}

function firePointer(moment) {
  const list = ptrHooks[moment];
  for (let i = 0; i < list.length; i++) list[i]();
}

/* True while a hand is on the surface and stirring. A pointer that is only
 * hovering is not one: the scene answers to a press, not to a hand passing over
 * it. Shared, because wind.js and leaves.js must agree on it. */
function pointerStirs() {
  return PTR.down && PTR.present;
}

let hist = [];

/* Least-squares slope of position over time: steadier than differencing the
 * last pair, which spikes on a dropped frame and would throw the momentum of a
 * gentle release across the screen. */
function fitVelocity() {
  const n = hist.length;
  if (n < 2) return { vx: 0, vy: 0 };
  let mt = 0, mx = 0, my = 0;
  for (let i = 0; i < n; i++) {
    const p = hist[i];
    mt += p.t;
    mx += p.x;
    my += p.y;
  }
  mt /= n;
  mx /= n;
  my /= n;
  let stt = 0, stx = 0, sty = 0;
  for (let i = 0; i < n; i++) {
    const p = hist[i];
    const dt = p.t - mt;
    stt += dt * dt;
    stx += dt * (p.x - mx);
    sty += dt * (p.y - my);
  }
  if (stt <= 0) return { vx: 0, vy: 0 };
  return {
    vx: clamp((stx / stt) * 1000, -VEL_MAX, VEL_MAX),
    vy: clamp((sty / stt) * 1000, -VEL_MAX, VEL_MAX),
  };
}

function sample(e) {
  hist.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });
  // Two samples are the fewest a slope can be fitted to.
  while (hist.length > 2 && e.timeStamp - hist[0].t > VEL_WINDOW) hist.shift();
}

window.addEventListener("pointermove", (e) => {
  PTR.present = true;
  PTR.touch = e.pointerType === "touch";
  PTR.x = e.clientX;
  PTR.y = e.clientY;
  if (PTR.down) {
    sample(e);
    if (!PTR.dragged && Math.hypot(PTR.x - PTR.x0, PTR.y - PTR.y0) > TAP_SLOP) PTR.dragged = true;
    const v = fitVelocity();
    PTR.vx = v.vx;
    PTR.vy = v.vy;
  }
  firePointer("move");
});

window.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  PTR.present = true;
  PTR.down = true;
  PTR.touch = e.pointerType === "touch";
  PTR.dragged = false;
  PTR.x = PTR.x0 = e.clientX;
  PTR.y = PTR.y0 = e.clientY;
  PTR.vx = 0;
  PTR.vy = 0;
  hist = [{ x: e.clientX, y: e.clientY, t: e.timeStamp }];
  firePointer("press");
});

/* A lifted finger does not reliably deliver a pointerleave, so the release ends
 * the gesture explicitly either way. */
function endPress(e) {
  if (!PTR.down) return;
  const v = fitVelocity();
  PTR.releaseVx = v.vx;
  PTR.releaseVy = v.vy;
  PTR.down = false;
  PTR.vx = 0;
  PTR.vy = 0;
  if (e && e.pointerType === "touch") PTR.present = false;
  firePointer("release");
}

window.addEventListener("pointerup", endPress);
window.addEventListener("pointercancel", endPress);

document.documentElement.addEventListener("pointerleave", () => {
  PTR.present = false;
  hist = [];
  firePointer("leave");
});
