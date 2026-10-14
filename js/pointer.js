"use strict";

const TAP_SLOP = 10;
const VEL_WINDOW = 100;
const VEL_MAX = 8000;

const PTR = {
  x: 0,
  y: 0,
  present: false,
  down: false,
  touch: false,
  dragged: false,
  x0: 0,
  y0: 0,
  vx: 0,
  vy: 0,
  releaseVx: 0,
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

function pointerStirs() {
  return PTR.down && PTR.present;
}

let hist = [];

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
