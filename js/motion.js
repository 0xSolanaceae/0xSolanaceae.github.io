"use strict";

/* Motion math: springs, momentum projection, and boundary resistance.
 *
 * Springs are the house primitive because they are the only motion that can be
 * interrupted: the solver is re-derived from the current value and velocity on
 * every step, so a new target redirects motion already underway without a jump
 * and without a velocity discontinuity.
 *
 * Parameters are Apple's two, not mass/stiffness/damping:
 *   damping  — damping ratio. 1 is critically damped and never overshoots;
 *              below 1 overshoots, which is only for motion a gesture threw.
 *   response — roughly the settle time in seconds. Not a duration: a spring has
 *              none, it falls out of the parameters.
 */

function makeSpring(opts) {
  const o = opts || {};
  const value = o.value === undefined ? 0 : o.value;
  return {
    value: value,
    velocity: 0,
    target: value,
    damping: o.damping === undefined ? 1 : o.damping,
    response: o.response === undefined ? 0.35 : o.response,
    // What counts as settled, in the spring's own units.
    restDistance: o.restDistance === undefined ? 0.001 : o.restDistance,
    restVelocity: o.restVelocity === undefined ? 0.01 : o.restVelocity,
    resting: true,
  };
}

/* Aim a spring at a new target. It keeps the velocity it already has unless one
 * is handed in — carrying that across a retarget is what lets a gesture's
 * motion continue into the animation instead of stopping at a seam. */
function springTo(s, target, velocity) {
  s.target = target;
  if (velocity !== undefined) s.velocity = velocity;
  s.resting = false;
}

/* Advance by dt. Returns false once settled, with the value snapped to the
 * target so the caller can stop writing styles. The solution is exact, so a
 * variable frame time costs no accuracy. */
function stepSpring(s, dt) {
  if (s.resting) return false;
  const w0 = (2 * Math.PI) / s.response;
  const zeta = clamp(s.damping, 0, 1); // above 1 is overdamped, never wanted here
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

/* Apple's momentum projection: where a gesture is going, not where it let go.
 * The exponential form (rather than v²/2a) is what iOS ships and what scroll
 * deceleration follows, so a flick throws and a slow release barely drifts. */
function projectMomentum(velocity, deceleration) {
  const d = deceleration === undefined ? DECELERATION_NORMAL : deceleration;
  return (velocity / 1000) * (d / (1 - d));
}

/* Resist past a boundary instead of stopping hard: the further out it is pulled
 * the less it follows, so an edge reads as "nothing more here" rather than
 * "frozen". */
function rubberband(overshoot, dimension, constant) {
  const c = constant === undefined ? 0.55 : constant;
  return (overshoot * dimension * c) / (dimension + c * Math.abs(overshoot));
}
