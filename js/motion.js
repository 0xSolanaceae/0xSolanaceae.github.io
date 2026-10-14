"use strict";

function makeSpring(opts) {
  const o = opts || {};
  const value = o.value === undefined ? 0 : o.value;
  return {
    value: value,
    velocity: 0,
    target: value,
    damping: o.damping === undefined ? 1 : o.damping,
    response: o.response === undefined ? 0.35 : o.response,
    restDistance: o.restDistance === undefined ? 0.001 : o.restDistance,
    restVelocity: o.restVelocity === undefined ? 0.01 : o.restVelocity,
    resting: true,
  };
}

function springTo(s, target, velocity) {
  s.target = target;
  if (velocity !== undefined) s.velocity = velocity;
  s.resting = false;
}

function stepSpring(s, dt) {
  if (s.resting) return false;
  const w0 = (2 * Math.PI) / s.response;
  const zeta = clamp(s.damping, 0, 1);
  let d = s.value - s.target;
  let v = s.velocity;
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    const a = d;
    const b = (v + zeta * w0 * d) / wd;
    const e = Math.exp(-zeta * w0 * dt);
    const c = Math.cos(wd * dt);
    const sn = Math.sin(wd * dt);
    d = e * (a * c + b * sn);
    v = e * (b * wd * c - a * wd * sn - zeta * w0 * (a * c + b * sn));
  } else {
    const a = d;
    const b = v + w0 * d;
    const e = Math.exp(-w0 * dt);
    d = (a + b * dt) * e;
    v = (b - w0 * (a + b * dt)) * e;
  }
  s.value = s.target + d;
  s.velocity = v;
  if (Math.abs(d) <= s.restDistance && Math.abs(v) <= s.restVelocity) {
    s.value = s.target;
    s.velocity = 0;
    s.resting = true;
    return false;
  }
  return true;
}

const DECELERATION_NORMAL = 0.998;

function projectMomentum(velocity, deceleration) {
  const d = deceleration === undefined ? DECELERATION_NORMAL : deceleration;
  return (velocity / 1000) * (d / (1 - d));
}

function rubberband(overshoot, dimension, constant) {
  const c = constant === undefined ? 0.55 : constant;
  return (overshoot * dimension * c) / (dimension + c * Math.abs(overshoot));
}
