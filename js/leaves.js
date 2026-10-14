"use strict";

const LEAF_FRAMES = [
  [5, 5, 7, 6],
  [23, 4, 4, 8],
  [38, 7, 6, 5],
  [52, 7, 7, 5],
  [67, 6, 6, 5],
];

const MAX_GLOW = 1.0;

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

function approachAngle(a, b, k) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * k;
}

const REST_BREEZE_DRAG = 0.3;
const REST_CURSOR_DRAG = 0.45;
const REST_DRAG_RATE = 5;
const REST_MAX_SPEED = 6;
const REST_LIFT_SPEED = 60;
const REST_SCOUR = 6;
const REST_LIFT_TIME = 0.4;
const REST_UPDRAFT_RATE = 8;
const REST_TOPPLE_RATE = 5;
const REST_SEAT_RATE = 10;

function beginSettle(l) {
  l.state = "settle";
  l.settleT = 0;
  l.settleDur = 0.35 + Math.random() * 0.3;
  l.restSquash = 0.3 + Math.random() * 0.35;
  l.restTilt = (Math.random() - 0.5) * 0.9;
  l.settleX = l.x + (Math.random() * 2 - 1) * 1.6;
  l.restOffset = (0.3 + Math.random() * 1.0) - (l.dh * l.restSquash) / (2 * CELL.h);
  l.restY = Math.max(groundTopAt(l) + l.restOffset, l.y);
  l.restLife = (6 + Math.random() * 12) * l.cfg.restMul;
  l.fadeAlpha = 1;
  l.dead = false;
  l.groundVx = 0;
  l.vy = 0;
  deposit(l, 1);
  l.pileX = l.x;
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
  l.state = "fall";
  l.squash = 1;
  l.dead = false;
  l.prevRect = undefined;
  l.airLife = 5 + Math.random() * 3;
  l.airLifeMax = l.airLife;
  l.piled = false;
  l.airFade = false;
  l.groundVx = 0;
  l.restOffset = 0;
  l.pileX = undefined;
  l.liftT = 0;
  l.liftVy = 0;
}

function liftLeaf(l, scour) {
  l.state = "fall";
  if (l.piled) unDeposit(l);
  l.piled = false;
  l.vx = l.groundVx;
  l.liftT = REST_LIFT_TIME * (0.6 + 0.4 * scour);
  l.liftVy = -REST_SCOUR * (0.35 + scour);
  l.rotV += (Math.random() < 0.5 ? -1 : 1) * (2.5 + 4 * scour);
  l.rot = l.restTilt;
  l.squash = 1;
}

function updateLeaf(l, now, dt) {
  let glowTarget = 0;
  if (pointerStirs()) {
    const p = leafScreenPos(l);
    const itx = interactionWindAt(p.x, p.y, now);
    glowTarget = smoothstep(30, 150, Math.hypot(itx.u, itx.v));
  }
  const gk = glowTarget > l.glow ? 9 : 2.8;
  l.glow = Math.min(MAX_GLOW, l.glow + (glowTarget - l.glow) * (1 - Math.exp(-gk * dt)));
  if (l.glow < 0.004) l.glow = 0;

  if (l.state === "settle") {
    l.vx *= Math.exp(-6 * dt);
    l.vy *= Math.exp(-6 * dt);
    l.x += l.vx * dt + (l.settleX - l.x) * (1 - Math.exp(-REST_TOPPLE_RATE * dt));
    l.y += (l.restY - l.y) * (1 - Math.exp(-6 * dt));
    l.rot = approachAngle(l.rot, l.restTilt, 1 - Math.exp(-6 * dt));
    l.squash += (l.restSquash - l.squash) * (1 - Math.exp(-6 * dt));
    l.settleT += dt;
    if (l.settleT >= l.settleDur) l.state = "rest";
    return;
  }

  if (l.state === "rest") {
    const cellPx = CELL.w || 1;
    const p = leafScreenPos(l);
    const amb = ambientWindAt(p.x, p.y, now);
    const ambSpeed = Math.hypot(amb.u, amb.v) / cellPx;
    const itx = interactionWindAt(p.x, p.y, now);
    const sp = Math.hypot(itx.u, itx.v);

    const drag = clamp(
      (amb.u / cellPx) * REST_BREEZE_DRAG + (itx.u / cellPx) * REST_CURSOR_DRAG,
      -REST_MAX_SPEED,
      REST_MAX_SPEED
    );
    l.groundVx += (drag - l.groundVx) * (1 - Math.exp(-REST_DRAG_RATE * dt));

    const seat = groundTopAt(l) + l.restOffset;
    if (l.y < seat) {
      const close = (seat - l.y) * (1 - Math.exp(-REST_SEAT_RATE * dt));
      l.y += Math.min(close, l.term * dt);
    }

    l.rot = l.restTilt + (noise1D(l.rotSeed + now * 0.0007) - 0.5) * 0.12;
    l.x += l.groundVx * dt + Math.sin(now * 0.0004 + l.rotSeed) * 0.06 * dt;

    let scour = null;
    if (pointerStirs() && windVortex > 0.22) {
      const rx = p.x - windCx, ry = p.y - windCy;
      const r2 = rx * rx + ry * ry;
      const R = l.cfg.cursorR * 1.5;
      if (r2 < R * R) scour = 1 - Math.sqrt(r2) / R;
    }
    if (scour === null && sp > REST_LIFT_SPEED) scour = Math.min(1, sp / (REST_LIFT_SPEED * 2));
    if (scour === null && l.loose && ambSpeed > 5.5 && Math.random() < (ambSpeed - 5.5) * 0.6 * dt) {
      scour = Math.min(1, (ambSpeed - 5.5) / 4);
    }
    if (scour !== null) {
      liftLeaf(l, scour);
      return;
    }

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

  const faceFrac = Math.cos(l.rot) ** 2;
  const termEff = l.term * (l.edgeFrac + (1 - l.edgeFrac) * faceFrac);
  let vyWant = termEff + fieldVy * 0.7;
  let vyRate = l.vdrag;
  if (l.liftT > 0) {
    l.liftT -= dt;
    vyWant = l.liftVy;
    vyRate = REST_UPDRAFT_RATE;
  }
  l.vy += (vyWant - l.vy) * (1 - Math.exp(-vyRate * dt));
  l.y += l.vy * dt;
  const plateDrift = Math.sin(l.rot) * Math.cos(l.rot) * l.liftK * Math.abs(l.vy);
  l.vx += (fieldVx + plateDrift - l.vx) * (1 - Math.exp(-l.drag * dt));
  l.x += l.vx * dt;

  if (pointerStirs() && windVortex > 0.18) {
    const rx = p.x - windCx, ry = p.y - windCy;
    const r2 = rx * rx + ry * ry;
    const R = l.cfg.cursorR * 1.5;
    if (r2 < R * R) {
      const r = Math.sqrt(r2) || 1;
      const fall = 1 - r / R;
      const fall2 = fall * fall;
      const dir = windSpin >= 0 ? 1 : -1;
      const cellPx = CELL.w || 1;
      const g0 = l.cfg.cursorPush * windVortex * 0.75;
      const tang = g0 * fall * 0.55;
      const suck = g0 * fall * 1.15;
      const lift = g0 * fall2 * 0.7;
      const tx = (-ry / r) * dir, ty = (rx / r) * dir;
      const nx = -rx / r, ny = -ry / r;
      const vtx = (l.vx * cellPx) * tx + (l.vy * cellPx) * ty;
      const centrip = Math.min((vtx * vtx) / Math.max(r, 12) / cellPx, 170);
      const pull = suck + centrip;
      l.vx += (tx * tang + nx * pull) * dt;
      l.vy += (ty * tang + ny * pull - lift) * dt;
      if (l.vy < -48) l.vy = -48;
      l.rotV += (Math.random() * 2 - 1) * tang * 0.4 * dt;
    }
  }

  const airspeed = Math.hypot(l.vx, l.vy);
  const restore = -Math.sin(2 * l.rot) * (0.9 + airspeed * 0.45);
  const stir = (noise1D(l.rotSeed + now * 0.0005) - 0.5) * l.torque * Math.max(0.35, airspeed * 0.12);
  l.rotV += (restore + stir) * dt;
  l.rotV *= Math.exp(-l.rotDamp * dt);
  l.rot += l.rotV * dt;
  const cosSign = Math.cos(l.rot) < 0;
  if (cosSign !== l.cosSign) {
    l.flip = -l.flip;
    l.cosSign = cosSign;
  }

  if (l.x < -MARGIN) l.x += W_TOTAL + MARGIN * 2;
  else if (l.x > W_TOTAL + MARGIN) l.x -= W_TOTAL + MARGIN * 2;

  if (l.cfg.ground > 0) {
    const top = groundTopAt(l);
    if (l.vy >= 0 && l.y + l.dh / (2 * CELL.h) >= top) beginSettle(l);
    else if (l.y > ROWS + 1) resetLeaf(l, undefined, l.cfg);
  } else if (l.y > ROWS + 1) {
    resetLeaf(l, undefined, l.cfg);
  }
}

function leafPxRect(l) {
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
      if (totalLeaves() >= MAX_LEAVES_TOTAL) continue;
      if (cfg.leaves.length >= cfg.count + cfg.maxSettled) {
        const i = cfg.leaves.findIndex((l) => l.state === "rest" || l.state === "fade");
        if (i >= 0) {
          if (cfg.leaves[i].piled) unDeposit(cfg.leaves[i]);
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
        if (cfg.leaves[i].piled) unDeposit(cfg.leaves[i]);
        cfg.leaves.splice(i, 1);
      }
    }
  }
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
  const span = cfg.ground > 0 ? cfg.ground : ROWS;
  for (let i = 0; i < cfg.count; i++) {
    const lf = {};
    resetLeaf(lf, (i / cfg.count) * span, cfg);
    cfg.leaves.push(lf);
  }
}

const PILE_BUMP = 1.5;
const PILE_RADIUS = 3;
const MAX_PILE = 9;

function depositAt(cfg, x, sign) {
  const h = cfg.height;
  if (!h) return;
  const ix = clamp(Math.round(x), 0, h.length - 1);
  for (let dx = -PILE_RADIUS; dx <= PILE_RADIUS; dx++) {
    const j = ix + dx;
    if (j < 0 || j >= h.length) continue;
    const w = Math.exp(-0.5 * (dx / 1.6) * (dx / 1.6));
    h[j] = clamp(h[j] + sign * PILE_BUMP * w, 0, MAX_PILE);
  }
}

function deposit(l, sign) {
  depositAt(l.cfg, l.x, sign);
}

function unDeposit(l) {
  depositAt(l.cfg, l.pileX === undefined ? l.x : l.pileX, -1);
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
