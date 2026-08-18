"use strict";

const CROW_FLY_LARGE = [ // row 5: large near-crow wing-flap cycle
  [6, 251, 35, 26],
  [54, 251, 35, 26],
  [102, 251, 35, 26],
  [150, 251, 35, 26],
  [198, 251, 35, 26],
];
const CROW_PERCH_POSES = [ // row 4: resting poses for perched near crows
  [6, 202, 35, 25],
  [198, 202, 35, 25],
  [246, 202, 35, 25],
  [294, 202, 35, 25],
];
const CROW_FLY_SMALL = [ // row 0: distant small-crow wing-flap cycle
  [8, 8, 30, 26], [56, 8, 30, 26], [104, 8, 30, 26], [152, 8, 30, 26],
  [200, 8, 30, 26], [248, 8, 30, 26], [296, 8, 30, 26],
];
const CROW_SMALL_GLIDE = [152, 58, 30, 26]; // row 1: small-crow glide pose
const CROW_FLY_MED = [ // row 3: distant medium-crow wing-flap cycle
  [9, 148, 30, 30], [57, 148, 30, 30], [105, 148, 30, 30], [153, 148, 30, 30],
  [201, 148, 30, 30], [249, 148, 30, 30], [297, 148, 30, 30],
];
const CROW_GLIDE_MED = [ // row 2: distant medium-crow glide poses
  [6, 117, 30, 18],
  [203, 109, 26, 21],
];
const LARGE_GLIDE_FRAME = 1; // level-wing pose (row 5) held while a near crow glides

const FLAP_LIFT = {
  flap: 0.06,    // nose-up while flapping
  bob: 0.035,    // per-wingbeat pitch bob
  glide: -0.06,  // gentle glide nose-down
  dive: -0.14,   // swoop dive (nose well down)
  pullup: 0.12,  // swoop pull-up (nose up)
  stall: 0.2,    // landing flare/stall
};
const NEAR_FLAP_MS = [600, 1000];
const NEAR_GLIDE_MS = [500, 1000];

let crowImg = null;
let nearFrames = null;
let nearPerchFrames = null;
let farFrames = null;

const MAX_NEAR_BIRDS = 6;
const MAX_FAR_BIRDS = 6;
let nearBirdsCtx = null;
let farBirdsCtx = null;
let nearBirds = [];
let farBirds = [];
let perchPoints = [];
let nextNearFlocksAt = 0;
let lastNearBirdT = 0;
let nextFarFlocksAt = 0;
let lastFarBirdT = 0;
let mouseX = -9999, mouseY = -9999;
let birdsRestLeft = 0;
let birdsRestTop = 0;

function drawCrow(ctx, b, now, img, bottom) {
  const px = b.x * CELL.w;
  const py = (b.y + (b.bob ? Math.sin(b.bob + now * 0.003) * 0.7 : 0)) * CELL.h;
  ctx.save();
  ctx.translate(px, py);
  // Body pitch (radians; positive = nose up). Applied BEFORE the horizontal
  // mirror so a left- and right-flying crow pitch identically on screen.
  if (b.pitch) ctx.rotate(-b.pitch);
  if (b.dir < 0) ctx.scale(-1, 1);
  const dy = bottom ? -b.dh : -b.dh / 2;
  ctx.drawImage(img, -b.dw / 2, dy, b.dw, b.dh);
  ctx.restore();
}

function spawnNearFlyer() {
  const fromLeft = Math.random() < 0.5;
  const scale = 0.8 + Math.random() * 0.4;
  const cw = CROW_FLY_LARGE[0][2], ch = CROW_FLY_LARGE[0][3];
  const dw = (cw * CELL.w) / 4.5 * scale;
  nearBirds.push({
    type: "fly",
    x: fromLeft ? -20 : W_TOTAL + 20,
    y: 5 + Math.random() * (ROWS * 0.4),
    dir: fromLeft ? 1 : -1,
    speed: 26 + Math.random() * 10,
    minSpeed: 20 + Math.random() * 8,
    maxSpeed: 52 + Math.random() * 16,
    diveMax: 60 + Math.random() * 16,
    accel: 16 + Math.random() * 8,
    diveAccel: 12 + Math.random() * 6,
    pullDecel: 10 + Math.random() * 6,
    climb: 1.2 + Math.random() * 1.0,
    sinkFast: 2.4 + Math.random() * 1.6,
    sinkSlow: 0.8 + Math.random() * 0.8,
    phase: "flap",
    phaseEnd: performance.now() + 400 + Math.random() * 500,
    glideT: 0,
    glideDur: 0.6,
    frame: Math.random() * CROW_FLY_LARGE.length,
    flap: 9 + Math.random() * 4,
    bob: Math.random() * Math.PI * 2,
    pitch: 0,
    dw,
    dh: (dw * ch) / cw,
  });
}

function spawnPercher() {
  const p = perchPoints[Math.floor(Math.random() * perchPoints.length)];
  const fromLeft = p.x > MARGIN + W / 2 ? Math.random() < 0.5 : true;
  const scale = 0.75 + Math.random() * 0.4;
  const cw = CROW_FLY_LARGE[0][2], ch = CROW_FLY_LARGE[0][3];
  const dw = (cw * CELL.w) / 4.5 * scale;
  const x0 = fromLeft ? -20 : W_TOTAL + 20;
  const y0 = 12 + Math.random() * Math.max(4, p.y - 18);
  nearBirds.push({
    type: "percher",
    phase: "approach",
    x: x0, y: y0, tx: p.x, ty: p.y, p,
    dir: fromLeft ? 1 : -1,
    speed: 36 + Math.random() * 20,
    dw,
    dh: (dw * ch) / cw,
    perchUntil: 0,
    hops: 0,
    bob: 0,
    pitch: 0,
    frame: Math.random() * CROW_FLY_LARGE.length,
    flap: 7,
    // which resting pose from the sheet (row 4) this crow sits in
    perchIdx: Math.floor(Math.random() * CROW_PERCH_POSES.length),
  });
}

function spawnNearFlocks(now) {
  if (now < nextNearFlocksAt) return;
  const room = MAX_NEAR_BIRDS - nearBirds.length;
  if (room <= 0) { nextNearFlocksAt = now + 6000; return; }
  const n = Math.min(room, 1 + Math.floor(Math.random() * 2));
  for (let i = 0; i < n; i++) {
    // Most arrivals land on a branch; only occasionally does one fly across.
    if (perchPoints.length && Math.random() < 0.85) spawnPercher();
    else spawnNearFlyer();
  }
  nextNearFlocksAt = now + (5000 + Math.random() * 4000);
}

function updateFlyer(b, now, dt) {
  if (b.phase === "flap") {
    b.speed = Math.min(b.maxSpeed, b.speed + b.accel * dt);
    b.x += b.dir * b.speed * dt;
    b.y -= b.climb * dt;
    b.frame += dt * b.flap;
    if (now >= b.phaseEnd) {
      b.phase = "glide";
      b.glideT = 0;
      b.glideDur = NEAR_GLIDE_MS[0] + Math.random() * (NEAR_GLIDE_MS[1] - NEAR_GLIDE_MS[0]);
      b.phaseEnd = now + b.glideDur;
    }
    const wingPhase = (b.frame % CROW_FLY_LARGE.length) / CROW_FLY_LARGE.length;
    const target = FLAP_LIFT.flap + Math.sin(wingPhase * Math.PI * 2) * FLAP_LIFT.bob;
    b.pitch += (target - b.pitch) * Math.min(1, dt * 10);
  } else {
    b.glideT = Math.min(1, b.glideT + dt / b.glideDur);
    if (b.glideT < 0.5) {
      b.speed = Math.min(b.diveMax, b.speed + b.diveAccel * dt);
      b.y += b.sinkFast * dt;
      b.pitch += (FLAP_LIFT.dive - b.pitch) * Math.min(1, dt * 6);
    } else {
      b.speed = Math.max(b.minSpeed, b.speed - b.pullDecel * dt);
      b.y += b.sinkSlow * dt;
      b.pitch += (FLAP_LIFT.pullup - b.pitch) * Math.min(1, dt * 6);
    }
    b.x += b.dir * b.speed * dt;
    if (now >= b.phaseEnd || b.speed <= b.minSpeed + 0.5) {
      b.phase = "flap";
      b.phaseEnd = now + NEAR_FLAP_MS[0] + Math.random() * (NEAR_FLAP_MS[1] - NEAR_FLAP_MS[0]);
    }
  }
  b.y = clamp(b.y, 2, ROWS * 0.55);
}

function crowScreenX(b) {
  const s = (metas["birds-near"] && metas["birds-near"].shift) || 0;
  return birdsRestLeft - s * CELL.w + b.x * CELL.w;
}

function isHovering(b) {
  const sx = crowScreenX(b);
  const sy = birdsRestTop + b.y * CELL.h - b.dh / 2;
  const r = Math.max(30, b.dw * 0.9);
  return Math.hypot(mouseX - sx, mouseY - sy) < r;
}

function scarePercher(b) {
  b.phase = "depart";
  const sx = crowScreenX(b);
  b.dir = mouseX < sx ? 1 : -1;
  b.speed = 4;
  b.accel = 32 + Math.random() * 20;
  b.maxSpeed = 44 + Math.random() * 16;
  b.vy = -(16 + Math.random() * 12);
  b.departT = 0;
}

function departPercher(b) {
  b.phase = "depart";
  b.dir = Math.random() < 0.5 ? 1 : -1;
  b.speed = 4;
  b.accel = 24 + Math.random() * 16;
  b.maxSpeed = 40 + Math.random() * 16;
  b.vy = -(10 + Math.random() * 10);
  b.departT = 0;
}

function pickHopTarget(b) {
  let best = null;
  let bestScore = Infinity;
  for (const p of perchPoints) {
    const dx = Math.abs(p.x - b.x);
    const dy = Math.abs(p.y - b.y);
    if (dx < 6 || dx > 32 || dy > 14) continue;
    if (p.x === b.p.x && p.y === b.p.y) continue;
    const score = dx + dy;
    if (score < bestScore) { bestScore = score; best = p; }
  }
  return best;
}

function startHop(b, target) {
  b.phase = "hop";
  b.hopFrom = { x: b.x, y: b.y };
  b.hopTo = { x: target.x, y: target.y };
  b.dir = target.x >= b.x ? 1 : -1;
  const dist = Math.hypot(target.x - b.x, target.y - b.y);
  b.hopT = 0;
  b.hopDur = clamp(dist / 18, 0.55, 1.8); // quick flap, scaled to distance
  b.hopArc = clamp(dist * 0.45, 2.4, 9.0); // peak arc height (cells)
}

function updateHopper(b, now, dt) {
  b.hopT += dt;
  const t = Math.min(1, b.hopT / b.hopDur);
  const lineY = b.hopFrom.y + (b.hopTo.y - b.hopFrom.y) * t;
  b.x = b.hopFrom.x + (b.hopTo.x - b.hopFrom.x) * t;
  b.y = lineY - Math.sin(t * Math.PI) * b.hopArc;
  b.frame += dt * b.flap;
  b.pitch = t < 0.5
    ? Math.sin(t * Math.PI) * 0.1
    : -Math.sin((t - 0.5) * Math.PI * 2) * 0.06;
  if (t >= 1) {
    b.x = b.hopTo.x; b.y = b.hopTo.y;
    b.p = b.hopTo;
    b.phase = "perched";
    b.perchUntil = now + (8000 + Math.random() * 8000);
    b.perchIdx = Math.floor(Math.random() * CROW_PERCH_POSES.length);
    b.pitch = 0;
  }
}

function updatePercher(b, now, dt, hovered) {
  if (b.phase === "approach") {
    const dx = b.tx - b.x, dy = b.ty - b.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.7) {
      b.x = b.tx; b.y = b.ty;
      b.phase = "perched";
      b.perchUntil = now + (8000 + Math.random() * 8000);
      b.pitch = 0;
    } else {
      const speed = Math.min(b.speed, Math.max(0.8, dist * 6));
      const step = Math.min(speed * dt, dist);
      b.x += (dx / dist) * step;
      b.y += (dy / dist) * step;
      b.frame += dt * (dist < 6 ? b.flap * 1.6 : b.flap);
      const flare = dist < 7;
      const target = flare ? FLAP_LIFT.stall * (1 - dist / 7) : -0.04;
      b.pitch += (target - b.pitch) * Math.min(1, dt * (flare ? 12 : 4));
    }
  } else if (b.phase === "perched") {
    b.pitch += (0 - b.pitch) * Math.min(1, dt * 8);
    if (hovered) scarePercher(b);
    else if (now >= b.perchUntil) {
      // Sometimes hop to a nearby branch instead of flying off.
      if ((b.hops || 0) < 2 && Math.random() < 0.55) {
        const t = pickHopTarget(b);
        if (t) { b.hops = (b.hops || 0) + 1; startHop(b, t); }
        else departPercher(b);
      } else {
        departPercher(b);
      }
    }
  } else if (b.phase === "hop") {
    updateHopper(b, now, dt);
  } else if (b.phase === "depart") {
    b.departT = (b.departT || 0) + dt;
    b.speed = Math.min(b.maxSpeed, b.speed + b.accel * dt);
    b.x += b.dir * b.speed * dt;
    b.y += b.vy * dt;
    b.vy += 5.0 * dt;
    if (b.vy > 0) b.vy = 0;
    b.frame += dt * b.flap;
    b.pitch += (Math.max(0, 0.14 - b.departT * 0.25) - b.pitch) * Math.min(1, dt * 8);
  }
}

function birdPxRect(b) {
  const cx = b.x * CELL.w;
  const cy = b.y * CELL.h;
  const halfW = b.dw / 2 + Math.max(6, b.dw * 0.5);
  const top = cy - b.dh - 6;
  return [cx - halfW, top, halfW * 2, b.dh * 2 + 12];
}

function renderBirdsNear(now) {
  if (!nearFrames || !nearBirdsCtx) return;
  if (REDUCED_MOTION) return;
  const dt = Math.min(0.05, lastNearBirdT ? (now - lastNearBirdT) / 1000 : 0.016);
  lastNearBirdT = now;
  if (now >= nextNearFlocksAt) spawnNearFlocks(now);

  if (nearBirds.length === 0) return;

  const ctx = nearBirdsCtx;
  for (const b of nearBirds) {
    if (b.prevRect) ctx.clearRect(b.prevRect[0], b.prevRect[1], b.prevRect[2], b.prevRect[3]);
  }

  for (let i = nearBirds.length - 1; i >= 0; i--) {
    const b = nearBirds[i];
    if (b.type === "percher") {
      const hovered = b.phase === "perched" && isHovering(b);
      updatePercher(b, now, dt, hovered);
      const off = b.x < -20 || b.x > W_TOTAL + 20 || b.y < -20;
      if (b.phase === "depart" && off) { nearBirds.splice(i, 1); continue; }
      // Approaching/departing crows are bottom-anchored so the crow settles
      // onto the branch without a visible snap.
      if (b.phase === "perched") drawCrow(ctx, b, now, nearPerchFrames[b.perchIdx], true);
      else drawCrow(ctx, b, now, nearFrames[Math.floor(b.frame) % nearFrames.length], true);
    } else {
      updateFlyer(b, now, dt);
      if (b.x < -20 || b.x > W_TOTAL + 20) { nearBirds.splice(i, 1); continue; }
      const img = b.phase === "glide"
        ? nearFrames[LARGE_GLIDE_FRAME]
        : nearFrames[Math.floor(b.frame) % nearFrames.length];
      drawCrow(ctx, b, now, img, false);
    }
    b.prevRect = birdPxRect(b);
  }
}

function spawnFarCrow() {
  const fromLeft = Math.random() < 0.5;
  const small = Math.random() < 0.6; // mostly the tiny row-0 crows
  const cw = small ? CROW_FLY_SMALL[0][2] : CROW_FLY_MED[0][2];
  const ch = small ? CROW_FLY_SMALL[0][3] : CROW_FLY_MED[0][3];
  const dw = (small ? 2.2 : 3.0) + Math.random() * 0.8; // cells wide (far smaller than near)
  farBirds.push({
    x: fromLeft ? -20 : W_TOTAL + 20,
    y: 3 + Math.random() * (ROWS * 0.35),
    dir: fromLeft ? 1 : -1,
    speed: small ? 18 + Math.random() * 6 : 16 + Math.random() * 6,
    minSpeed: small ? 10 + Math.random() * 4 : 9 + Math.random() * 4,
    maxSpeed: small ? 34 + Math.random() * 10 : 26 + Math.random() * 8,
    diveMax: small ? 42 + Math.random() * 10 : 32 + Math.random() * 8,
    accel: small ? 22 + Math.random() * 10 : 14 + Math.random() * 8,
    diveAccel: small ? 14 + Math.random() * 6 : 10 + Math.random() * 6,
    pullDecel: small ? 14 + Math.random() * 6 : 10 + Math.random() * 4,
    climb: small ? 1.4 + Math.random() * 0.8 : 1.0 + Math.random() * 0.6,
    sinkFast: small ? 2.8 + Math.random() * 1.2 : 1.8 + Math.random() * 1.0,
    sinkSlow: small ? 1.0 + Math.random() * 0.8 : 0.8 + Math.random() * 0.6,
    small,
    glide: false,
    glideT: 0,
    glideDur: 0.6,
    stateEnd: performance.now() + 600 + Math.random() * 600,
    frame: Math.random() * (small ? CROW_FLY_SMALL.length : CROW_FLY_MED.length),
    flap: small ? 15 + Math.random() * 4 : 10 + Math.random() * 3,
    bob: Math.random() * Math.PI * 2,
    pitch: 0,
    dw,
    dh: (dw * ch) / cw,
  });
}

function spawnFarFlocks(now) {
  if (now < nextFarFlocksAt) return;
  const room = MAX_FAR_BIRDS - farBirds.length;
  if (room <= 0) { nextFarFlocksAt = now + 8000; return; }
  const n = Math.min(room, 1 + Math.floor(Math.random() * 3));
  for (let i = 0; i < n; i++) spawnFarCrow();
  nextFarFlocksAt = now + (12000 + Math.random() * 10000);
}

function renderBirdsFar(now) {
  if (!farFrames || !farBirdsCtx) return;
  if (REDUCED_MOTION) return;
  const dt = Math.min(0.05, lastFarBirdT ? (now - lastFarBirdT) / 1000 : 0.016);
  lastFarBirdT = now;
  if (now >= nextFarFlocksAt) spawnFarFlocks(now);

  if (farBirds.length === 0) return;

  const ctx = farBirdsCtx;
  for (const b of farBirds) {
    if (b.prevRect) ctx.clearRect(b.prevRect[0], b.prevRect[1], b.prevRect[2], b.prevRect[3]);
  }

  for (let i = farBirds.length - 1; i >= 0; i--) {
    const b = farBirds[i];
    if (now >= b.stateEnd) {
      b.glide = !b.glide;
      if (b.glide) {
        b.glideT = 0;
        b.glideDur = (b.small ? 300 + Math.random() * 500 : 500 + Math.random() * 700) / 1000;
      }
      b.stateEnd = now + (b.glide
        ? (b.small ? 300 + Math.random() * 500 : 500 + Math.random() * 700)
        : (b.small ? 600 + Math.random() * 400 : 1000 + Math.random() * 800));
    }
    let img;
    if (b.glide) {
      b.glideT = Math.min(1, b.glideT + dt / Math.max(0.05, b.glideDur));
      if (b.glideT < 0.5) {
        b.speed = Math.min(b.diveMax, b.speed + b.diveAccel * dt);
        b.y += b.sinkFast * dt;
        b.pitch += (FLAP_LIFT.dive - b.pitch) * Math.min(1, dt * 6);
      } else {
        b.speed = Math.max(b.minSpeed, b.speed - b.pullDecel * dt);
        b.y += b.sinkSlow * dt;
        b.pitch += (FLAP_LIFT.pullup - b.pitch) * Math.min(1, dt * 6);
      }
      img = b.small
        ? farFrames.smallGlide
        : farFrames.medGlide[Math.floor(now / 1000) % farFrames.medGlide.length];
    } else {
      b.speed = Math.min(b.maxSpeed, b.speed + b.accel * dt);
      b.y -= b.climb * dt;
      b.frame += dt * b.flap;
      const frames = b.small ? farFrames.small : farFrames.med;
      const wingPhase = (b.frame % frames.length) / frames.length;
      const target = FLAP_LIFT.flap + Math.sin(wingPhase * Math.PI * 2) * FLAP_LIFT.bob;
      b.pitch += (target - b.pitch) * Math.min(1, dt * 10);
      img = frames[Math.floor(b.frame) % frames.length];
    }
    b.x += b.dir * b.speed * dt;
    b.y = clamp(b.y, 2, ROWS * 0.42);
    if (b.x < -20 || b.x > W_TOTAL + 20) { farBirds.splice(i, 1); continue; }
    drawCrow(ctx, b, now, img, false);
    b.prevRect = birdPxRect(b);
  }
}
