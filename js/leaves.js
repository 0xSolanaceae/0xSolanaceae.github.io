"use strict";

/* Five leaf sprites across the 80x16 sheet: [sx, sy, sw, sh] source rects. */
const LEAF_FRAMES = [
  [5, 5, 7, 6],
  [23, 4, 4, 8],
  [38, 7, 6, 5],
  [52, 7, 7, 5],
  [67, 6, 6, 5],
];

/* Cap on how bright a leaf's glow can get (soft layering, no white-out). */
const MAX_GLOW = 1.0;

/* One leaf population per parallax layer: own canvas, fall and ground row.
   The multipliers make distant leaves smaller, hazier and slower. */
const LEAF_LAYERS = [
  {
    key: "leaves-far", depth: 0.4, count: 20,
    scaleMul: 0.6, alphaMul: 0.55, fallMul: 0.7, windMul: 0.7, tumbleMul: 0.6,
    restMul: 0.7, maxSettled: 70, cursorR: 120, cursorPush: 90,
    leaves: [], ctx: null, ground: 0, lastT: 0, restLeft: 0, restTop: 0, piles: [], height: null,
  },
  {
    key: "leaves-mid", depth: 0.6, count: 34,
    scaleMul: 0.85, alphaMul: 0.85, fallMul: 0.9, windMul: 0.9, tumbleMul: 0.85,
    restMul: 0.9, maxSettled: 100, cursorR: 180, cursorPush: 170,
    leaves: [], ctx: null, ground: 0, lastT: 0, restLeft: 0, restTop: 0, piles: [], height: null,
  },
  {
    key: "leaves-near", depth: 0.78, count: 48,
    scaleMul: 1, alphaMul: 1, fallMul: 1, windMul: 1, tumbleMul: 1,
    restMul: 1, maxSettled: 170, cursorR: 240, cursorPush: 260,
    leaves: [], ctx: null, ground: 0, lastT: 0, restLeft: 0, restTop: 0, piles: [], height: null,
  },
];

let leafImg = null;

function leafLayer(key) {
  return LEAF_LAYERS.find((l) => l.key === key);
}

function anyLeaves() {
  return LEAF_LAYERS.some((l) => l.leaves.length > 0);
}

const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/* Standard-normal sample (Box-Muller) for Gaussian pile spread. */
function gaussian() {
  let u = 0;
  while (u === 0) u = Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function pickLeafSpec(cfg) {
  const frame = LEAF_FRAMES[Math.floor(Math.random() * LEAF_FRAMES.length)];
  const scale = (0.7 + Math.random() * 1.1) * cfg.scaleMul;
  const dw = (frame[2] * CELL.w) / 4.5 * scale;
  const dh = (dw * frame[3]) / frame[2];
  return { frame, dw, dh };
}

/* Step `a` toward `b` by fraction `k` along the shortest angular path. */
function approachAngle(a, b, k) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * k;
}

function beginSettle(l) {
  l.state = "settle";
  l.settleT = 0;
  l.settleDur = 0.35 + Math.random() * 0.3;
  l.restSquash = 0.3 + Math.random() * 0.35;
  l.restTilt = (Math.random() - 0.5) * 0.9;
  l.x += (Math.random() * 2 - 1) * 1.6;
  const top = groundTopAt(l);
  l.restY = top + (0.3 + Math.random() * 1.0) - (l.dh * l.restSquash) / (2 * CELL.h);
  l.restLife = (6 + Math.random() * 12) * l.cfg.restMul;
  l.fadeAlpha = 1;
  l.dead = false;
  deposit(l, 1); // this leaf joins the pile, raising it a little
  l.piled = true;
}

function resetLeaf(l, y0, cfg) {
  const spec = pickLeafSpec(cfg);
  l.cfg = cfg;
  l.frame = spec.frame;
  l.dw = spec.dw;
  l.dh = spec.dh;
  if (cfg.piles.length && Math.random() < 0.8) {
    const p = cfg.piles[Math.floor(Math.random() * cfg.piles.length)];
    l.x = p.cx + gaussian() * p.sigma;
  } else {
    l.x = -MARGIN + Math.random() * (W_TOTAL + MARGIN * 2);
  }
  l.y = (y0 !== undefined) ? y0 : -4 - Math.random() * 12;
  l.mass = clamp(spec.dw / 8, 0.5, 1.5);
  l.term = (3.6 + Math.random() * 5.6) * (0.85 + l.mass * 0.3) * cfg.fallMul;
  l.vy = l.term * (0.35 + Math.random() * 0.5);
  l.vx = 0;
  l.drag = (1.6 + Math.random() * 1.6) / l.mass;
  l.vdrag = 1.2 + Math.random() * 1.2;
  l.windAffinity = 0.35 + Math.random() * 0.9;
  l.liftK = (0.55 + Math.random() * 0.75) * cfg.tumbleMul;
  l.edgeFrac = 0.22 + Math.random() * 0.2;
  l.rot = Math.random() * Math.PI * 2;
  l.rotV = 0;
  l.torque = (3.5 + Math.random() * 5.5) * cfg.tumbleMul;
  l.rotDamp = 1.2 + Math.random() * 1.4;
  l.rotSeed = Math.random() * 1000;
  l.flip = Math.random() < 0.5 ? 1 : -1;
  l.cosSign = Math.cos(l.rot) < 0;
  l.ambientWind = 0;
  l.windSmooth = 2.5 + Math.random() * 1.5;
  l.alpha = (0.7 + Math.random() * 0.3) * cfg.alphaMul;
  l.baseAlpha = l.alpha;
  l.glow = 0;
  l.loose = Math.random() < 0.6;
  l.state = "fall"; // fall -> settle -> rest -> fade (then removed)
  l.squash = 1;
  l.dead = false;
  l.prevRect = undefined;
  l.airLife = 5 + Math.random() * 3;
  l.airLifeMax = l.airLife;
  l.piled = false;
  l.airFade = false;
}

function updateLeaf(l, now, dt) {
  let glowTarget = 0;
  if (mouseX > -999) {
    const p = leafScreenPos(l);
    const itx = interactionWindAt(p.x, p.y, now);
    glowTarget = smoothstep(30, 150, Math.hypot(itx.u, itx.v));
  }
  const gk = glowTarget > l.glow ? 9 : 2.8; // rise fast, fade gracefully
  l.glow = Math.min(MAX_GLOW, l.glow + (glowTarget - l.glow) * (1 - Math.exp(-gk * dt)));
  if (l.glow < 0.004) l.glow = 0;

  if (l.state === "settle") {
    l.vx *= Math.exp(-6 * dt);
    l.vy *= Math.exp(-6 * dt);
    l.x += l.vx * dt;
    l.y += (l.restY - l.y) * (1 - Math.exp(-6 * dt));
    l.rot = approachAngle(l.rot, l.restTilt, 1 - Math.exp(-6 * dt));
    l.squash += (l.restSquash - l.squash) * (1 - Math.exp(-6 * dt));
    l.settleT += dt;
    if (l.settleT >= l.settleDur) l.state = "rest";
    return;
  }

  if (l.state === "rest") {
    const p = leafScreenPos(l);
    const amb = ambientWindAt(p.x, p.y, now);
    const ambSpeed = Math.hypot(amb.u, amb.v) / (CELL.w || 1);
    const itx = interactionWindAt(p.x, p.y, now);
    const sp = Math.hypot(itx.u, itx.v);

    if (mouseX > -999 && windVortex > 0.22) {
      const rx = p.x - windCx, ry = p.y - windCy;
      const r2 = rx * rx + ry * ry;
      const R = l.cfg.cursorR * 1.5;
      if (r2 < R * R) {
        const r = Math.sqrt(r2) || 1;
        const fall = 1 - r / R;
        l.state = "fall";
        deposit(l, -1);
        l.piled = false;
        l.vy = -(7 + fall * 10);
        l.vx = (itx.u / (CELL.w || 1)) * 0.3 - (rx / r) * (2 + fall * 4);
        l.rotV += (Math.random() < 0.5 ? -1 : 1) * (6 + fall * 10);
        l.rot = l.restTilt;
        l.squash = 1;
        return;
      }
    }
    if (sp > 60) {
      l.state = "fall";
      deposit(l, -1); // no longer part of the pile
      l.piled = false;
      const cellPx = CELL.w || 1;
      l.vx = (itx.u / cellPx) * 0.5;
      l.vy = -1.2 - Math.min(2.5, (sp / cellPx) * 0.12) + (itx.v / cellPx) * 0.4;
      l.rotV += (Math.random() < 0.5 ? -1 : 1) * (4 + (sp / cellPx) * 0.05);
      l.rot = l.restTilt;
      l.squash = 1;
      return;
    }
    if (l.loose && ambSpeed > 5.5 && Math.random() < (ambSpeed - 5.5) * 0.6 * dt) {
      l.state = "fall";
      deposit(l, -1);
      l.piled = false;
      l.vx = (amb.u / (CELL.w || 1)) * 0.7;
      l.vy = -1.5 - Math.random() * 1.5;
      l.rotV += (Math.random() < 0.5 ? -1 : 1) * 4;
      l.rot = l.restTilt;
      l.squash = 1;
      return;
    }
    l.rot = l.restTilt + (noise1D(l.rotSeed + now * 0.0007) - 0.5) * 0.12;
    l.x += (amb.u / (CELL.w || 1)) * 0.02 * dt + Math.sin(now * 0.0004 + l.rotSeed) * 0.06 * dt;
    l.restLife -= dt;
    if (l.restLife <= 0) {
      l.state = "fade";
      l.fadeDur = 1.5 + Math.random() * 1;
    }
    return;
  }

  if (l.state === "fade") {
    if (l.airFade) {
      l.vy += (l.term - l.vy) * (1 - Math.exp(-l.vdrag * dt));
      l.y += l.vy * dt;
      l.x += l.vx * dt;
    }
    l.fadeAlpha -= dt / l.fadeDur;
    l.alpha = l.baseAlpha * Math.max(0, l.fadeAlpha);
    if (l.fadeAlpha <= 0) l.dead = true;
    return;
  }

  // The leaf feels wind.js's airflow: ambient breeze (low-passed per leaf,
  // scaled by windMul) plus the pointer's flow acting straight through
  // momentum.
  const p = leafScreenPos(l);
  const amb = ambientWindAt(p.x, p.y, now);
  const itx = interactionWindAt(p.x, p.y, now);
  const cellPx = CELL.w || 1;
  const itxSpeed = Math.hypot(itx.u, itx.v);
  if (itxSpeed > 150) l.airLife -= dt;
  else if (l.airLife < l.airLifeMax) l.airLife = Math.min(l.airLifeMax, l.airLife + dt * 0.6);
  if (l.airLife <= 0) {
    l.state = "fade";
    l.fadeDur = 1 + Math.random() * 0.8;
    l.fadeAlpha = 1;
    l.airFade = true;
    return;
  }
  const windTarget = (amb.u / cellPx) * l.cfg.windMul;
  l.ambientWind += (windTarget - l.ambientWind) * (1 - Math.exp(-l.windSmooth * dt));
  const fieldVx = l.ambientWind * l.windAffinity + (itx.u / cellPx) * l.cfg.windMul;
  const fieldVy = (itx.v / cellPx) * l.cfg.windMul;

  // Orientation-dependent drag: face-on falls slow, edge-on falls fast.
  const faceFrac = Math.cos(l.rot) ** 2;
  const termEff = l.term * (l.edgeFrac + (1 - l.edgeFrac) * faceFrac);
  l.vy += (termEff + fieldVy * 0.7 - l.vy) * (1 - Math.exp(-l.vdrag * dt));
  l.y += l.vy * dt;
  const plateDrift = Math.sin(l.rot) * Math.cos(l.rot) * l.liftK * Math.abs(l.vy);
  l.vx += (fieldVx + plateDrift - l.vx) * (1 - Math.exp(-l.drag * dt));
  l.x += l.vx * dt;

  // Leaf tornado: inward suction + tangential spin + central updraft, with
  // the orbit's centripetal force supplied so leaves spiral inward.
  if (mouseX > -999 && windVortex > 0.18) {
    const rx = p.x - windCx, ry = p.y - windCy;
    const r2 = rx * rx + ry * ry;
    const R = l.cfg.cursorR * 1.5;
    if (r2 < R * R) {
      const r = Math.sqrt(r2) || 1;
      const fall = 1 - r / R; // 0 at the rim → 1 at the core
      const fall2 = fall * fall;
      const dir = windSpin >= 0 ? 1 : -1;
      const cellPx = CELL.w || 1;
      const g0 = l.cfg.cursorPush * windVortex * 0.75;
      const tang = g0 * fall * 0.55;
      const suck = g0 * fall * 1.15;
      const lift = g0 * fall2 * 0.7;
      const tx = (-ry / r) * dir, ty = (rx / r) * dir;
      const nx = -rx / r, ny = -ry / r;
      // Hold the orbit with the centripetal force it needs (capped).
      const vtx = (l.vx * cellPx) * tx + (l.vy * cellPx) * ty;
      const centrip = Math.min((vtx * vtx) / Math.max(r, 12) / cellPx, 170);
      const pull = suck + centrip;
      l.vx += (tx * tang + nx * pull) * dt;
      l.vy += (ty * tang + ny * pull - lift) * dt;
      if (l.vy < -48) l.vy = -48; // the updraft tops out: a coherent column
      l.rotV += (Math.random() * 2 - 1) * tang * 0.4 * dt;
    }
  }

  // −sin(2r) restores the leaf broadside; turbulence scales with airspeed.
  const airspeed = Math.hypot(l.vx, l.vy);
  const restore = -Math.sin(2 * l.rot) * (0.9 + airspeed * 0.45);
  const stir = (noise1D(l.rotSeed + now * 0.0005) - 0.5) * l.torque * Math.max(0.35, airspeed * 0.12);
  l.rotV += (restore + stir) * dt;
  l.rotV *= Math.exp(-l.rotDamp * dt);
  l.rot += l.rotV * dt;
  // The sprite is single-sided: swap its face as it rolls through edge-on.
  const cosSign = Math.cos(l.rot) < 0;
  if (cosSign !== l.cosSign) {
    l.flip = -l.flip;
    l.cosSign = cosSign;
  }

  if (l.x < -MARGIN) l.x += W_TOTAL + MARGIN * 2;
  else if (l.x > W_TOTAL + MARGIN) l.x -= W_TOTAL + MARGIN * 2;

  if (l.cfg.ground > 0) {
    const top = groundTopAt(l);
    if (l.y + l.dh / (2 * CELL.h) >= top) beginSettle(l);
    else if (l.y > ROWS + 1) resetLeaf(l, undefined, l.cfg);
  } else if (l.y > ROWS + 1) {
    resetLeaf(l, undefined, l.cfg);
  }
}

function leafPxRect(l) {
  // The glow halo extends past the sprite, so the dirty rect covers it too.
  const glowR = l.glow > 0.01 ? Math.max(l.dw, l.dh) * (0.9 + l.glow * 0.7) : 0;
  const r = Math.hypot(l.dw, l.dh) / 2 + 2 + glowR;
  const cx = l.x * CELL.w, cy = l.y * CELL.h;
  return [cx - r, cy - r, r * 2, r * 2];
}

function leafScreenPos(l) {
  const s = (metas[l.cfg.key] && metas[l.cfg.key].shift) || 0;
  return {
    x: l.cfg.restLeft - s * CELL.w + l.x * CELL.w,
    y: l.cfg.restTop + l.y * CELL.h,
  };
}

function glowGradient(ctx, rad, glow, cfg) {
  const radQ = Math.max(1, Math.round(rad / 6));
  const gQ = Math.max(1, Math.round(glow * 4));
  const key = radQ + ":" + gQ;
  if (!cfg.glowCache) cfg.glowCache = new Map();
  let grad = cfg.glowCache.get(key);
  if (!grad) {
    const a = cfg.alphaMul * (gQ / 4);
    grad = ctx.createRadialGradient(0, 0, 0, 0, 0, radQ * 6);
    grad.addColorStop(0, `rgba(255, 216, 138, ${(0.56 * a).toFixed(3)})`);
    grad.addColorStop(0.55, `rgba(255, 182, 96, ${(0.3 * a).toFixed(3)})`);
    grad.addColorStop(1, "rgba(255, 160, 70, 0)");
    cfg.glowCache.set(key, grad);
  }
  return grad;
}

function drawLeaf(ctx, l) {
  ctx.save();
  ctx.translate(l.x * CELL.w, l.y * CELL.h);
  ctx.rotate(l.rot);
  if (l.flip < 0) ctx.scale(-1, 1);
  if (l.squash !== 1) ctx.scale(1, l.squash);
  if (l.glow > 0.01) {
    const g = l.glow;
    const rad = Math.max(l.dw, l.dh) * (0.8 + g * 0.5);
    ctx.fillStyle = glowGradient(ctx, rad, g, l.cfg);
    ctx.fillRect(-rad, -rad, rad * 2, rad * 2);
  }
  ctx.globalAlpha = l.alpha;
  ctx.drawImage(
    leafImg,
    l.frame[0], l.frame[1], l.frame[2], l.frame[3],
    -l.dw / 2, -l.dh / 2, l.dw, l.dh
  );
  ctx.restore();
}

/* Hard ceiling on total leaves, so a long vortex can't collapse the frame rate. */
const MAX_LEAVES_TOTAL = 240;

function totalLeaves() {
  let n = 0;
  for (const c of LEAF_LAYERS) n += c.leaves.length;
  return n;
}

function renderLeaves(now) {
  if (!leafImg) return;
  if (REDUCED_MOTION) return;
  for (const cfg of LEAF_LAYERS) {
    if (!cfg.ctx || cfg.leaves.length === 0) continue;
    const dt = Math.min(0.05, cfg.lastT ? (now - cfg.lastT) / 1000 : 0.016);
    cfg.lastT = now;
    const ctx = cfg.ctx;
    for (const l of cfg.leaves) {
      if (l.prevRect) ctx.clearRect(l.prevRect[0], l.prevRect[1], l.prevRect[2], l.prevRect[3]);
    }
    const landed = [];
    for (const l of cfg.leaves) {
      const wasFalling = l.state === "fall";
      updateLeaf(l, now, dt);
      if (wasFalling && l.state === "settle") landed.push(l);
      drawLeaf(ctx, l);
      l.prevRect = leafPxRect(l);
    }
    for (const _ of landed) {
      // Never exceed the global budget; if this layer's floor is full, retire
      // the oldest resting leaf to make room.
      if (totalLeaves() >= MAX_LEAVES_TOTAL) continue;
      if (cfg.leaves.length >= cfg.count + cfg.maxSettled) {
        const i = cfg.leaves.findIndex((l) => l.state === "rest" || l.state === "fade");
        if (i >= 0) {
          if (cfg.leaves[i].piled) deposit(cfg.leaves[i], -1);
          cfg.leaves.splice(i, 1);
        } else {
          continue;
        }
      }
      const lf = {};
      resetLeaf(lf, undefined, cfg);
      cfg.leaves.push(lf);
    }
    for (let i = cfg.leaves.length - 1; i >= 0; i--) {
      if (cfg.leaves[i].dead) {
        if (cfg.leaves[i].piled) deposit(cfg.leaves[i], -1);
        cfg.leaves.splice(i, 1);
      }
    }
  }
  // Safety net: force the oldest airborne leaves to fade if still over budget.
  let excess = totalLeaves() - MAX_LEAVES_TOTAL;
  if (excess > 0) {
    for (const cfg of LEAF_LAYERS) {
      for (let i = 0; i < cfg.leaves.length && excess > 0; i++) {
        const l = cfg.leaves[i];
        if (l.state === "fall") {
          l.state = "fade";
          l.fadeDur = 0.6;
          l.fadeAlpha = 1;
          l.airFade = true;
          excess--;
        }
      }
    }
  }
}

function setLeafLayerCtx(key, ctx) {
  leafLayer(key).ctx = ctx;
}

function setLeafRest(key, left, top) {
  const cfg = leafLayer(key);
  cfg.restLeft = left;
  cfg.restTop = top;
}

function prefillLeaves(key) {
  const cfg = leafLayer(key);
  cfg.leaves = [];
  for (let i = 0; i < cfg.count; i++) {
    const lf = {};
    resetLeaf(lf, (i / cfg.count) * ROWS, cfg);
    cfg.leaves.push(lf);
  }
}

/* Drifts are emergent: a per-column height field grows wherever leaves land. */
const PILE_BUMP = 1.5; // cells of height each leaf adds at its column
const PILE_RADIUS = 3; // columns the bump spreads over (soft mound)
const MAX_PILE = 9;    // cap so a drift can never tower unrealistically

function deposit(l, sign) {
  const h = l.cfg.height;
  if (!h) return;
  const ix = clamp(Math.round(l.x), 0, h.length - 1);
  for (let dx = -PILE_RADIUS; dx <= PILE_RADIUS; dx++) {
    const j = ix + dx;
    if (j < 0 || j >= h.length) continue;
    const w = Math.exp(-0.5 * (dx / 1.6) * (dx / 1.6));
    h[j] = clamp(h[j] + sign * PILE_BUMP * w, 0, MAX_PILE);
  }
}

function groundTopAt(l) {
  const h = l.cfg.height;
  if (!h || !h.length) return l.cfg.ground;
  const ix = clamp(Math.round(l.x), 0, h.length - 1);
  return l.cfg.ground - h[ix];
}

function makePiles(n, sigmaCells) {
  const piles = [];
  const lo = MARGIN + 6, hi = W_TOTAL - MARGIN - 6;
  const span = Math.max(1, hi - lo);
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5 + (hash(i * 3.3 + 1.7) - 0.5) * 0.8) / n;
    const cx = lo + span * t;
    const sigma = sigmaCells * (0.8 + hash(i * 7.1 + 2.3) * 0.5);
    piles.push({ cx, sigma });
  }
  return piles;
}

function initLeafGrounds() {
  const near = leafLayer("leaves-near");
  near.ground = ROWS - spriteLand.height;
  near.height = new Float32Array(W_TOTAL);
  near.piles = makePiles(3, 16);

  const mid = leafLayer("leaves-mid");
  mid.ground = ROWS - 10 - Math.round(spriteLand.height * 0.85) + 3;
  mid.height = new Float32Array(W_TOTAL);
  mid.piles = makePiles(3, 13);

  const far = leafLayer("leaves-far");
  far.ground = Math.floor(ROWS * 0.5) + 8;
  far.height = new Float32Array(W_TOTAL);
  far.piles = makePiles(3, 11);
}
