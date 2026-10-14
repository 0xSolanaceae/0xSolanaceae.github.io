"use strict";

function buildForestInstances(sprites, landTop, scaleMul = 1, spacingMul = 1, seed = 0, opts = {}) {
  const instances = [];
  const baseSpacing = 68;
  const pad = 440;
  let x = -pad;
  let i = 0;
  let prevSpriteIdx = -1;
  while (x < W_TOTAL + pad) {
    const sizeN = perlin1D(x * 0.018 + 11.3 + seed * 7.17, 2);
    const jitterN = perlin1D(x * 0.05 + 57.1 + seed * 13.51, 2);
    let scale = (1.6 + (sizeN - 0.5) * 0.7) * scaleMul;
    let spacing = baseSpacing * (0.75 + sizeN * 0.5) * spacingMul;
    if (opts.clearing) {
      const d = Math.abs(x - opts.clearing.x) / opts.clearing.half;
      if (d < 1) {
        const s = 1 - d * d * (3 - 2 * d);
        scale *= 1 - 0.42 * s;
        spacing *= 1 + 1.25 * s;
      }
    }
    scale = Math.round(scale * 20) / 20;
    let spriteIdx = Math.floor(hash(i * 7.13 + 3.1 + seed * 5.29) * sprites.length) % sprites.length;
    if (spriteIdx === prevSpriteIdx) spriteIdx = (spriteIdx + 1) % sprites.length;
    prevSpriteIdx = spriteIdx;
    const sprite = sprites[spriteIdx];
    const mirror = hash(i * 2.7 + 9.4 + seed * 3.11) < 0.5;
    const xJitter = (jitterN - 0.5) * spacing * 0.5;
    instances.push({ sprite, x: x + xJitter, scale, mirror, baseY: landTop });
    x += spacing;
    i++;
  }
  return instances;
}

function buildNear(sprite) {
  const w = W_TOTAL, h = ROWS;
  const LAND_BACK = 0;
  const mask = Array.from({ length: h }, () => new Uint8Array(w));
  const stamp = (spr, mirror, x, y) => {
    const cells = mirror ? spr.cellsM : spr.cells;
    for (let i = 0; i < cells.length; i++) {
      const cx = cells[i][0], cy = cells[i][1], code = cells[i][2];
      const gx = x + cx, gy = y + cy;
      if (gx < 0 || gx >= w || gy < 0 || gy >= h) continue;
      if (code > 0) mask[gy][gx] |= code;
    }
  };
  const period = Math.max(4, Math.round(sprite.width * 0.32));
  let i = 0;
  for (let x = -sprite.width; x <= w + sprite.width; x += period) {
    const mirror = hash(i * 3.7 + 4.2) < 0.5;
    const yJitter = Math.round((hash(i * 5.1 + 8.8) - 0.5) * 4);
    const xJitter = Math.round((hash(i * 8.3 + 1.7) - 0.5) * period * 0.7);
    stamp(sprite, mirror, x + xJitter, h - sprite.height - LAND_BACK + yJitter);
    i++;
  }
  for (let x = 0; x < w; x++) {
    let top = -1;
    for (let y = 0; y < h; y++) {
      if (mask[y][x] !== 0) { top = y; break; }
    }
    if (top === -1) continue;
    for (let y = top + 1; y < h - LAND_BACK; y++) {
      if (mask[y][x] === 0) mask[y][x] = 0xff;
    }
  }
  return { mask, period };
}

function buildLandBandInstances(sprite, scale, bottomRow, seed) {
  const instances = [];
  const pad = 480;
  const period = Math.max(4, Math.round(sprite.width * scale * 0.32));
  let x = -pad;
  let i = 0;
  while (x < W_TOTAL + pad) {
    const mirror = hash(i * 3.7 + 4.2 + seed * 7.31) < 0.5;
    const xJitter = (hash(i * 8.3 + 1.7 + seed * 3.17) - 0.5) * period * 0.7;
    const yJitter = (hash(i * 5.1 + 8.8 + seed * 5.77) - 0.5) * 1.6;
    instances.push({
      sprite,
      x: x + xJitter,
      scale,
      mirror,
      baseY: bottomRow + yJitter,
    });
    x += period;
    i++;
  }
  return instances;
}

function measureCell() {
  const cs = getComputedStyle(LAYER_ELS["mid-far"]);
  const probe = document.createElement("span");
  probe.textContent = "X";
  probe.style.cssText =
    "position:absolute;left:-9999px;top:0;visibility:hidden;white-space:pre;" +
    `font-family:${cs.fontFamily};font-size:${cs.fontSize};line-height:1;`;
  stage.appendChild(probe);
  const w = probe.getBoundingClientRect().width;
  const h = probe.getBoundingClientRect().height;
  stage.removeChild(probe);
  return { w, h: h || parseFloat(cs.fontSize) };
}

function downsampledAlpha(cols, rows, ...sources) {
  const c = document.createElement("canvas");
  c.width = cols;
  c.height = rows;
  const ctx = c.getContext("2d");
  for (const src of sources) ctx.drawImage(src, 0, 0, cols, rows);
  const data = ctx.getImageData(0, 0, cols, rows).data;
  const alpha = new Uint8Array(cols * rows);
  for (let i = 0; i < cols * rows; i++) alpha[i] = data[i * 4 + 3];
  return alpha;
}

let lastLayout = "";

function buildAll() {
  const cell = measureCell();
  const rect = stage.getBoundingClientRect();
  if (!cell.w || !rect.width) {
    requestAnimationFrame(buildAll);
    return;
  }
  spriteCanvasCache.clear();

  const cellZoom = Math.min(
    1,
    Math.max(
      rect.width / (cell.w * MIN_COLS),
      rect.height / (cell.h * MAX_ROWS)
    )
  );
  cell.w *= cellZoom;
  cell.h *= cellZoom;

  W = Math.max(36, Math.floor(rect.width / cell.w) - 1);
  ROWS = Math.max(MIN_ROWS, Math.min(MAX_ROWS, Math.floor(rect.height / cell.h)));

  if (Math.floor(rect.height / cell.h) > ROWS) {
    const zoom = rect.height / (ROWS * cell.h);
    cell.w *= zoom;
    cell.h *= zoom;
    W = Math.max(36, Math.floor(rect.width / cell.w) - 1);
  }
  W_TOTAL = W + MARGIN * 2;
  CELL.w = cell.w;
  CELL.h = cell.h;

  const layout = `${CELL.w}|${CELL.h}|${W}|${ROWS}|${REDUCED_MOTION ? "still" : "full"}`;
  if (layout === lastLayout) return;
  lastLayout = layout;

  for (const key of Object.keys(LAYER_ELS)) {
    LAYER_ELS[key].style.setProperty("--base", MARGIN);
    LAYER_ELS[key].style.setProperty("--cw", `${CELL.w}px`);
  }

  const TREE_SINK = 4;

  const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);

  const nearEl = LAYER_ELS["birds-near"];
  const nW = Math.max(1, Math.round(W_TOTAL * CELL.w * dpr));
  const nH = Math.max(1, Math.round(ROWS * CELL.h * dpr));
  nearEl.width = nW;
  nearEl.height = nH;
  nearEl.style.width = `${W_TOTAL * CELL.w}px`;
  nearEl.style.height = `${ROWS * CELL.h}px`;
  nearBirdsCtx = nearEl.getContext("2d");
  nearBirdsCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  nearBirds = [];
  nextNearFlocksAt = performance.now() + 4000;
  lastNearBirdT = performance.now();
  metas["birds-near"] = { el: nearEl, shift: 0, lastS: undefined };
  nearEl.style.transform = `translate3d(${-MARGIN * CELL.w}px, ${(-ROWS / 2) * CELL.h}px, 0)`;
  const birdsRect = nearEl.getBoundingClientRect();
  birdsRestLeft = birdsRect.left;
  birdsRestTop = birdsRect.top;

  const farEl = LAYER_ELS["birds-far"];
  const fW = Math.max(1, Math.round(W_TOTAL * CELL.w * dpr));
  const fH = Math.max(1, Math.round(ROWS * CELL.h * dpr));
  farEl.width = fW;
  farEl.height = fH;
  farEl.style.width = `${W_TOTAL * CELL.w}px`;
  farEl.style.height = `${ROWS * CELL.h}px`;
  farBirdsCtx = farEl.getContext("2d");
  farBirdsCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  farBirds = [];
  nextFarFlocksAt = performance.now() + 5000;
  lastFarBirdT = performance.now();
  metas["birds-far"] = { el: farEl, shift: 0, lastS: undefined };

  initLeafGrounds();

  for (const key of ["leaves-far", "leaves-mid", "leaves-near"]) {
    const leavesEl = LAYER_ELS[key];
    const leafW = Math.max(1, Math.round(W_TOTAL * CELL.w * dpr));
    const leafH = Math.max(1, Math.round(ROWS * CELL.h * dpr));
    leavesEl.width = leafW;
    leavesEl.height = leafH;
    leavesEl.style.width = `${W_TOTAL * CELL.w}px`;
    leavesEl.style.height = `${ROWS * CELL.h}px`;
    const ctx = leavesEl.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    leavesEl.style.transform = `translate3d(${-MARGIN * CELL.w}px, ${(-ROWS / 2) * CELL.h}px, 0)`;
    metas[key] = { el: leavesEl, shift: 0, lastS: undefined };
    setLeafLayerCtx(key, ctx);
    const rest = leavesEl.getBoundingClientRect();
    setLeafRest(key, rest.left, rest.top);
    if (!REDUCED_MOTION) prefillLeaves(key);
  }

  const LAND_DOWN = 8;
  const landBands = [
    { key: "land-mid",  scale: 0.62, bottomRow: ROWS - 26 + LAND_DOWN, seed: 22 },
    { key: "land-near", scale: 0.85, bottomRow: ROWS - 18 + LAND_DOWN, seed: 33 },
  ];
  for (const band of landBands) {
    const insts = buildLandBandInstances(spriteLand, band.scale, band.bottomRow, band.seed);
    metas[band.key] = { el: LAYER_ELS[band.key] };
    renderForestCanvas(
      LAYER_ELS[band.key], insts,
      getComputedStyle(LAYER_ELS[band.key]).color, cell.w, cell.h, dpr, W_TOTAL, ROWS
    );
  }

  const backHorizon = Math.floor(ROWS * 0.5);
  const forestBack = buildForestInstances(spriteTrees, backHorizon + TREE_SINK, 0.45, 0.3, 3);
  const FAR_GROUND_SCALE = 0.58;
  const farLand = [];
  const ridgeBottom = ROWS - 26;
  const ridgeStep = Math.max(3, Math.round(spriteLand.height * FAR_GROUND_SCALE * 0.55));
  for (let baseY = backHorizon + TREE_SINK + 1; baseY <= ridgeBottom; baseY += ridgeStep) {
    for (const inst of buildLandBandInstances(spriteLand, FAR_GROUND_SCALE, Math.min(baseY, ridgeBottom), 100 + baseY)) {
      farLand.push(inst);
    }
  }
  const farBottom = Math.min(ROWS, ridgeBottom + 4);
  let farTop = backHorizon + TREE_SINK;
  for (const i of forestBack) farTop = Math.min(farTop, i.baseY - i.sprite.height * i.scale);
  for (const i of farLand) farTop = Math.min(farTop, i.baseY - spriteLand.height * FAR_GROUND_SCALE);
  farTop = Math.max(0, Math.floor(farTop) - 4);
  const farRows = Math.max(1, farBottom - farTop);
  metas.far = { el: LAYER_ELS.far, yOff: farTop };
  const farColor = getComputedStyle(LAYER_ELS.far).color;
  renderForestCanvas(
    LAYER_ELS.far,
    farLand.map((i) => ({ ...i, baseY: i.baseY - farTop })),
    farColor, cell.w, cell.h, dpr, W_TOTAL, farRows
  );
  renderForestCanvas(
    LAYER_ELS.far,
    forestBack.map((i) => ({ ...i, baseY: i.baseY - farTop })),
    farColor, cell.w, cell.h, dpr, W_TOTAL, farRows, 1, 0, 0, false
  );

  const farGround = Math.floor(ROWS * 0.66);
  const clearing = { x: MARGIN + W * 0.36, half: Math.max(20, W * 0.2) };

  const forestFar = buildForestInstances(spriteTrees, farGround + LAND_DOWN + TREE_SINK, 0.62 * 1.3, 0.7, 1, { clearing });
  metas["mid-far"] = { el: LAYER_ELS["mid-far"] };
  renderForestCanvas(
    LAYER_ELS["mid-far"], forestFar,
    getComputedStyle(LAYER_ELS["mid-far"]).color, cell.w, cell.h, dpr, W_TOTAL, ROWS
  );

  const forestMid = buildForestInstances(spriteTrees, landBands[0].bottomRow + TREE_SINK, 0.66 * 1.3, 0.85, 2, {
    clearing: { x: clearing.x, half: clearing.half * 0.8 },
  });
  metas["mid-near"] = { el: LAYER_ELS["mid-near"] };
  renderForestCanvas(
    LAYER_ELS["mid-near"], forestMid,
    getComputedStyle(LAYER_ELS["mid-near"]).color, cell.w, cell.h, dpr, W_TOTAL, ROWS
  );

  perchPoints = [];

  const TRUNK_CENTER = 51;
  const trunkScale = (sprite, rows, maxWidthFrac) =>
    Math.min(
      (ROWS * rows) / sprite.height,
      (rect.width * maxWidthFrac) / (sprite.width * CELL.w)
    );
  const placeTrunk = (sprite, frac, scale) => MARGIN + W * frac - TRUNK_CENTER * scale;
  const heroScale = trunkScale(trunkA, 0.95, 0.85);
  const midScale = trunkScale(trunkB, 0.52, 0.47);
  const sideScale = trunkScale(trunkA, 0.575, 0.51);
  const foreInstances = [
    { sprite: trunkA, x: placeTrunk(trunkA, 0.72, heroScale), scale: heroScale, mirror: false, baseY: ROWS - 18 },
    { sprite: trunkB, x: placeTrunk(trunkB, 0.99, midScale), scale: midScale, mirror: true, baseY: ROWS - 20 },
    { sprite: trunkA, x: placeTrunk(trunkA, 0.10, sideScale), scale: sideScale, mirror: true, baseY: ROWS - 20 },
  ];
  metas.fore = { el: LAYER_ELS.fore };
  const foreBase = foreInstances.map((i) => ({ ...i, sprite: i.sprite.solid }));
  renderForestCanvas(LAYER_ELS.fore, foreBase, "#241207", cell.w, cell.h, dpr, W_TOTAL, ROWS, 1, 0, 0, true);
  renderForestCanvas(
    LAYER_ELS.fore, foreInstances,
    getComputedStyle(LAYER_ELS.fore).color, cell.w, cell.h, dpr, W_TOTAL, ROWS, 0.42, 0, 0, false
  );

  metas.paper = { el: LAYER_ELS.paper };
  const paperTrunk = foreInstances[0];
  const paperAnchorX = paperTrunk.x + TRUNK_CENTER * paperTrunk.scale;
  const paperTrunkTop = paperTrunk.baseY - paperTrunk.sprite.height * paperTrunk.scale;
  const paperHalfRows = PAPER_NOTE_ROWS / 2;
  const paperAnchorY = clamp(
    paperTrunk.baseY - ROWS * 0.4,
    paperTrunkTop + paperHalfRows + 0.6,
    paperTrunk.baseY - paperHalfRows + 0.4
  );
  renderNailedPaper(LAYER_ELS.paper, cell.w, cell.h, dpr, W_TOTAL, ROWS, paperAnchorX, paperAnchorY);

  perchPoints = [];
  {
    const DOT_COLS = W_TOTAL * 2;
    const DOT_ROWS = ROWS * 4;
    const nearDots = downsampledAlpha(DOT_COLS, DOT_ROWS, LAYER_ELS["mid-near"]);
    const occAlpha = downsampledAlpha(W_TOTAL, ROWS, LAYER_ELS.fore);
    const SOLID = 128;
    const RUN = 6;
    const RUN_BELOW = 4;
    const MIN_PERCH_DOT_Y = 26;
    const LEDGE_SCAN_DOTS = 24;
    const LEDGE_FIRST_DOT = 4;
    const solid = (dx, dy) => dx >= 0 && dx < DOT_COLS && dy >= 0 && dy < DOT_ROWS && nearDots[dy * DOT_COLS + dx] >= SOLID;
    const runAt = (dx, dy) => {
      let n = 0;
      for (let k = dx - 4; k <= dx + 4; k++) if (solid(k, dy)) n++;
      return n;
    };
    const dx0 = Math.max(0, (MARGIN - 8) * 2);
    const dx1 = Math.min(DOT_COLS - 1, (MARGIN + W + 8) * 2);
    for (let dx = dx0; dx <= dx1; dx += 2) {
      let topDot = -1;
      for (let dy = 0; dy < DOT_ROWS; dy++) {
        if (nearDots[dy * DOT_COLS + dx] > 0) { topDot = dy; break; }
      }
      if (topDot < 0) continue;
      let ledge = -1;
      const scanEnd = Math.min(DOT_ROWS - 13, topDot + LEDGE_SCAN_DOTS);
      for (let dy = Math.max(topDot + LEDGE_FIRST_DOT, MIN_PERCH_DOT_Y); dy <= scanEnd; dy++) {
        if (runAt(dx, dy) < RUN) continue;
        if (runAt(dx, dy + 2) < RUN_BELOW) continue;
        ledge = dy;
        break;
      }
      if (ledge < 0) continue;
      const cx = Math.round(dx / 2);
      const cy = Math.round(ledge / 4);
      const ox0 = Math.max(0, cx - 4);
      const ox1 = Math.min(W_TOTAL - 1, cx + 4);
      const oy0 = Math.max(0, cy - 8);
      const oy1 = Math.min(ROWS - 1, cy + 2);
      let covered = false;
      for (let y = oy0; y <= oy1 && !covered; y++) {
        for (let x = ox0; x <= ox1; x++) {
          if (occAlpha[y * W_TOTAL + x] > 0) { covered = true; break; }
        }
      }
      if (!covered) perchPoints.push({ x: cx, y: ledge / 4 });
    }
  }

  const nearResult = buildNear(spriteLand);
  metas.near = { el: LAYER_ELS.near };
  renderCanvasLayer(
    LAYER_ELS.near, nearResult.mask,
    getComputedStyle(LAYER_ELS.near).color, cell.w, cell.h, dpr, 1
  );

  writeTransforms();
  ensureTicking();
}
