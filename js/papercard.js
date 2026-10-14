"use strict";

const PAPERCARD_DATA = {
  name: "solanaceae",
  github: "0xSolanaceae",
  discord: "0x_Solanaceae",
  discordUrl: "https://discord.com/users/1098339239432835162",
  email: "solanaceae@duck.com",
  pgpFile: "pgp.asc",
};

const card = document.getElementById("papercard");
const cardSheet = document.getElementById("papercard-sheet");
const cardPaper = document.getElementById("papercard-paper");
const cardBackdrop = document.getElementById("papercard-backdrop");
const cardLinks = document.getElementById("papercard-links");
const cardVeilTop = document.getElementById("papercard-veil-top");
const cardVeilBottom = document.getElementById("papercard-veil-bottom");
const noteLayer = document.getElementById("layer-paper");

let cardPhase = "closed";
let cardGeom = null;
let cardRaf = 0;
let cardLast = 0;
let lastFocus = null;
let hoveringNote = false;
const cardSpring = makeSpring({
  damping: 1, response: 0.35, restDistance: 0.002, restVelocity: 0.02,
});
const CARD_NAIL_ROWS = 1.05;
const CARD_MAX_H = 0.74;  // share of the viewport's height the note may take
const CARD_MAX_W = 0.84;
const CARD_LINE = 1.6;    // line-height of the writing, matched in the stylesheet
const CARD_ARRIVE = 5;       // progress at which the sheet is fully there (and the note fully gone)
const HAPTIC_COMMIT = 8;

/* The note is a slip of paper, not a panel: it keeps the proportions of the one
 * pinned in the tree — same eleven columns, same twelve rows — and only its size
 * follows the viewport.
 *
 * The writing is sized off the paper too, so that exactly PAPER_TEXT_ROWS lines
 * fill the writing box at every size. That is what lets the sheet be a page of
 * writing: the same 14 lines of text sit on it whether the note is 64px wide in
 * the tree or 416px on screen, and the tree's own ink is drawn to the same
 * count. */
function sizeCardSheet() {
  if (!CELL.w || !CELL.h) return;
  const ratio = (PAPER_W_CELLS * CELL.w) / (PAPER_NOTE_ROWS * CELL.h);
  const maxW = Math.min(window.innerWidth * CARD_MAX_W, 26 * 16);
  const maxH = window.innerHeight * CARD_MAX_H;
  let w = maxH * ratio;
  if (w > maxW) w = maxW;
  w = Math.round(w);
  const h = Math.round(w / ratio);
  cardSheet.style.width = w + "px";
  cardSheet.style.height = h + "px";
  const writeBox = h * (1 - PAPER_WRITE_TOP - PAPER_WRITE_BOTTOM);
  cardSheet.style.setProperty("--card-fs", (writeBox / (PAPER_TEXT_ROWS * CARD_LINE)).toFixed(2) + "px");
  // The writing box's margins, in px, from the same fractions the tree's ink uses.
  // Percent padding would resolve against the sheet's width, which is not what a
  // top and bottom margin mean here.
  cardSheet.style.setProperty("--card-pad-top", (h * PAPER_WRITE_TOP).toFixed(2) + "px");
  cardSheet.style.setProperty("--card-pad-bottom", (h * PAPER_WRITE_BOTTOM).toFixed(2) + "px");
  cardSheet.style.setProperty("--card-pad-x", (w * PAPER_WRITE_INSET_X).toFixed(2) + "px");
}

function setNoteHover(on) {
  if (on === hoveringNote) return;
  hoveringNote = on;
  stage.classList.toggle("note-hover", on);
}

function measureCard() {
  const base = card.getBoundingClientRect();
  const sw = cardSheet.offsetWidth;
  const sh = cardSheet.offsetHeight;
  const layer = LAYER_ELS.paper.getBoundingClientRect();
  const u = Math.max(8, sh / PAPER_NOTE_ROWS);
  const ox = sw / 2;
  const oy = u * CARD_NAIL_ROWS;
  const nailX = layer.left + PAPER_INFO.nx - base.left;
  const nailY = layer.top + PAPER_INFO.ny - base.top;
  return {
    ox,
    oy,
    fromX: nailX - ox,
    fromY: nailY - oy,
    toX: (base.width - sw) / 2,
    toY: (base.height - sh) / 2,
    scale: Math.max(0.06, PAPER_INFO.w / sw),
    tilt: REDUCED_MOTION ? 0 : PAPER_INFO.tilt,
    flat: REDUCED_MOTION,
  };
}

function applyCard(p) {
  const g = cardGeom;
  const t = clamp(p, 0, 1);
  if (g) {
    if (g.flat) {
      cardSheet.style.transform = `translate(${g.toX}px, ${g.toY}px)`;
      cardSheet.style.filter = "none";
    } else {
      const s = g.scale + (1 - g.scale) * t;
      const rot = g.tilt * (1 - t);
      const tx = g.fromX + (g.toX - g.fromX) * t;
      const ty = g.fromY + (g.toY - g.fromY) * t;
      cardSheet.style.transform = `translate(${tx}px, ${ty}px) rotate(${rot}rad) scale(${s})`;
      const blur = (1 - t) * 6;
      cardSheet.style.filter = blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : "none";
    }
  }
  const arrive = clamp(p * CARD_ARRIVE, 0, 1);
  cardSheet.style.opacity = arrive;
  noteLayer.style.opacity = arrive >= 1 ? "0" : String(1 - arrive);
  cardBackdrop.style.opacity = t;
}

function cardTick(now) {
  cardRaf = 0;
  const dt = cardLast ? Math.min(0.05, (now - cardLast) / 1000) : 1 / 60;
  cardLast = now;
  const running = stepSpring(cardSpring, dt);
  applyCard(cardSpring.value);
  if (running) {
    cardRaf = requestAnimationFrame(cardTick);
    return;
  }
  cardLast = 0;
  cardSheet.style.willChange = "";
  if (cardPhase === "closing") finishClose();
}

function aimCard(target) {
  springTo(cardSpring, target);
  cardSheet.style.willChange = "transform, opacity, filter";
  if (!cardRaf) cardRaf = requestAnimationFrame(cardTick);
}

function beginCard() {
  cardPhase = "pressing";
  lastFocus = document.activeElement;
  sizeCardSheet();
  renderCardPaper();
  cardGeom = measureCard();
  cardSheet.style.transformOrigin = `${cardGeom.ox}px ${cardGeom.oy}px`;
  card.classList.add("showing");
  card.setAttribute("aria-hidden", "false");
  applyCard(cardSpring.value);
  aimCard(1);
}

function commitCard() {
  cardPhase = "open";
  card.classList.add("open");
  cardSheet.focus({ preventScroll: true });
  haptic(HAPTIC_COMMIT);
  aimCard(1);
}

function closeCard() {
  if (cardPhase === "closed" || cardPhase === "closing") return;
  cardPhase = "closing";
  card.setAttribute("aria-hidden", "true");
  aimCard(0);
  if (lastFocus && lastFocus !== document.body && typeof lastFocus.focus === "function") lastFocus.focus();
  else cardSheet.blur();
  lastFocus = null;
}

function finishClose() {
  cardPhase = "closed";
  card.classList.remove("showing", "open");
  cardSheet.style.transform = "";
  cardSheet.style.opacity = "";
  cardSheet.style.filter = "none";
  cardBackdrop.style.opacity = "";
  noteLayer.style.opacity = "";
  cardGeom = null;
}

function paperCenter() {
  const r = LAYER_ELS.paper.getBoundingClientRect();
  return { x: r.left + PAPER_INFO.cx, y: r.top + PAPER_INFO.cy };
}

function hitPaper(px, py) {
  const p = paperCenter();
  const dx = px - p.x;
  const dy = py - p.y;
  const c = Math.cos(-PAPER_INFO.tilt);
  const s = Math.sin(-PAPER_INFO.tilt);
  const rx = dx * c - dy * s;
  const ry = dx * s + dy * c;
  const slack = 10;
  return Math.abs(rx) <= PAPER_INFO.w / 2 + slack && Math.abs(ry) <= PAPER_INFO.h / 2 + slack;
}

/* Filler for the sheet: the note is one page of writing, and the four ways to
 * reach someone are the lines on it that matter. Written out here rather than
 * generated, so the page is the same page every time it is opened.
 *
 * The account is longer than the sheet holds. It is set as far as it fits at a
 * legible size, the way a page of writing actually runs out of room. */
const PAPERCARD_VEIL_TOP =
  "Although the convoy incident was the first Creature encounter to be properly " +
  "recorded, legends of a mysterious beast inhabiting the region preceded it. Natives " +
  "of the area warned never to enter The Forest so as not to anger the monster that " +
  "roamed it.";

const PAPERCARD_VEIL_BOTTOM =
  "Abstract sketches drawn by these early inhabitants depicting an unidentified " +
  "creature have been recovered throughout the area. An example of this is shown above.";

/* One line, written the way it would be on paper: a label, then the thing itself. */
function makeItem(key, text, href, downloadName) {
  const li = document.createElement("li");
  const el = document.createElement("a");
  el.href = href;
  if (downloadName) el.setAttribute("download", downloadName);
  else { el.target = "_blank"; el.rel = "noopener"; }
  el.className = "papercard-link";

  const name = document.createElement("span");
  name.className = "papercard-key";
  name.textContent = key;

  const val = document.createElement("span");
  val.className = "papercard-val";
  val.textContent = text;

  el.append(name, " ", val);
  li.appendChild(el);
  return li;
}

function buildCard() {
  card.setAttribute("aria-label", PAPERCARD_DATA.name);
  cardVeilTop.textContent = PAPERCARD_VEIL_TOP;
  cardVeilBottom.textContent = PAPERCARD_VEIL_BOTTOM;
  cardLinks.append(
    makeItem("github:", PAPERCARD_DATA.github, "https://github.com/" + PAPERCARD_DATA.github),
    makeItem("discord:", PAPERCARD_DATA.discord, PAPERCARD_DATA.discordUrl),
    makeItem("email:", PAPERCARD_DATA.email, "mailto:" + PAPERCARD_DATA.email),
    makeItem("pgp:", "public key", PAPERCARD_DATA.pgpFile, PAPERCARD_DATA.pgpFile),
  );
}

function renderCardPaper() {
  const w = cardSheet.offsetWidth;
  const h = cardSheet.offsetHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cw = Math.max(1, Math.round(w * dpr));
  const ch = Math.max(1, Math.round(h * dpr));
  if (cardPaper.width !== cw) cardPaper.width = cw;
  if (cardPaper.height !== ch) cardPaper.height = ch;
  cardPaper.style.width = w + "px";
  cardPaper.style.height = h + "px";

  const ctx = cardPaper.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  // The note in the tree's own torn outline, at a gentler amplitude: a tear is a
  // fine thing on a slip this size, and the note's proportion of a much smaller
  // one would read as a saw blade scaled up to here.
  const u = Math.max(8, h / PAPER_NOTE_ROWS);
  const margin = u * 0.5;
  const dw = Math.max(24, w - margin * 2);
  const dh = Math.max(24, h - margin * 2);
  const edges = PAPER_EDGES || makeSheetEdges(dw, dh, u, seededRand(PAPER_SEED));
  const soft = { top: [], right: [], bottom: [], left: [] };
  for (const key of Object.keys(edges)) {
    soft[key] = edges[key].map(([t, o]) => [t, o * 0.42]);
  }
  const sheet = buildSheetPath(dw, dh, u, soft);
  const rng = seededRand(PAPER_SEED);

  ctx.save();
  ctx.translate(margin, margin);

  ctx.save();
  ctx.filter = "blur(" + Math.max(1, u * 0.18).toFixed(1) + "px)";
  ctx.fillStyle = "rgba(10, 6, 2, 0.5)";
  ctx.translate(u * 0.18, u * 0.28);
  ctx.fill(sheet);
  ctx.restore();

  paintPaperSheet(ctx, sheet, dw, dh, u, rng);
  drawNail(ctx, dw * 0.5, u * 0.55, u);

  ctx.restore();
}

onPointer("press", () => {
  if (cardPhase !== "closed" || !PAPER_INFO) return;
  if (!hitPaper(PTR.x0, PTR.y0)) return;
  beginCard();
});

onPointer("move", () => {
  if (cardPhase === "pressing") {
    aimCard(PTR.dragged || !hitPaper(PTR.x, PTR.y) ? 0 : 1);
    return;
  }
  if (cardPhase !== "closed" || !PAPER_INFO) {
    setNoteHover(false);
    return;
  }
  setNoteHover(hitPaper(PTR.x, PTR.y));
});

onPointer("release", () => {
  if (cardPhase !== "pressing") return;
  if (PTR.dragged) closeCard();
  else commitCard();
});

onPointer("leave", () => {
  setNoteHover(false);
  if (cardPhase === "pressing") closeCard();
});

cardBackdrop.addEventListener("click", closeCard);

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (cardPhase === "pressing" || cardPhase === "open") closeCard();
});

window.addEventListener("resize", () => {
  if (cardPhase === "closed") return;
  sizeCardSheet();
  cardGeom = measureCard();
  cardSheet.style.transformOrigin = `${cardGeom.ox}px ${cardGeom.oy}px`;
  applyCard(cardSpring.value);
});

if (typeof ResizeObserver === "function") {
  new ResizeObserver(() => renderCardPaper()).observe(cardSheet);
}

buildCard();
