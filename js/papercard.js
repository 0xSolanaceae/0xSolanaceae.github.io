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
const cardName = document.getElementById("papercard-name");
const cardLinks = document.getElementById("papercard-links");
const noteLayer = document.getElementById("layer-paper"); // the note in the scene

/* The card is the note the visitor pinned. The transition grows it out of the
 * note's own nail, at the note's size and lean, and straightens it on the way —
 * so the surface they touched is the surface that arrives, and the exit runs the
 * same path back. It is one spring on one progress value, which is what makes it
 * interruptible: reversing retargets the same spring and keeps its velocity.
 *
 * The response is the press, not the release: the note starts becoming the card
 * under the hand, and letting go only decides whether it stays. */
let cardPhase = "closed"; // closed | pressing | open | closing
let cardGeom = null;
let cardRaf = 0;
let cardLast = 0;
let lastFocus = null;
let hoveringNote = false;

const cardSpring = makeSpring({
  damping: 1, response: 0.35, restDistance: 0.002, restVelocity: 0.02,
});
const CARD_NAIL_ROWS = 1.05; // where renderCardPaper pins the sheet, in tatter rows
const CARD_ARRIVE = 5;       // progress at which the sheet is fully there (and the note fully gone)
const HAPTIC_COMMIT = 8;     // ms — a note committing to being read

function setNoteHover(on) {
  if (on === hoveringNote) return;
  hoveringNote = on;
  stage.classList.toggle("note-hover", on);
}

/* Where the note is on screen, and how the sheet must be placed to start there
 * and end centred. Read fresh on every press: the note moves with the parallax,
 * so a captured rectangle goes stale immediately. */
function measureCard() {
  const base = card.getBoundingClientRect();
  const sw = cardSheet.offsetWidth;
  const sh = cardSheet.offsetHeight;
  const layer = LAYER_ELS.paper.getBoundingClientRect();
  const u = Math.max(8, sh / PAPER_TATTER_ROWS);
  // transform-origin is the nail, so scaling and straightening pivot on the one
  // point the note and the card are both pinned by.
  const ox = sw / 2;
  const oy = u * CARD_NAIL_ROWS;
  const nailX = layer.left + PAPER_INFO.nx - base.left;
  const nailY = layer.top + PAPER_INFO.ny - base.top;
  return {
    ox,
    oy,
    fromX: nailX - ox,           // puts the sheet's nail on the note's nail
    fromY: nailY - oy,
    toX: (base.width - sw) / 2,  // centres the sheet
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
      // Reduced motion: the fade carries the transition and the surface does not
      // travel. Same arrival, nothing to make anyone dizzy.
      cardSheet.style.transform = `translate(${g.toX}px, ${g.toY}px)`;
      cardSheet.style.filter = "none";
    } else {
      const s = g.scale + (1 - g.scale) * t;
      const rot = g.tilt * (1 - t);
      const tx = g.fromX + (g.toX - g.fromX) * t;
      const ty = g.fromY + (g.toY - g.fromY) * t;
      cardSheet.style.transform = `translate(${tx}px, ${ty}px) rotate(${rot}rad) scale(${s})`;
      // Materialize: the blur closes as the sheet grows, so it reads as a
      // surface arriving rather than a picture pasted over the scene.
      const blur = (1 - t) * 6;
      cardSheet.style.filter = blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : "none";
    }
  }
  // The hand-over: the note in the scene and the sheet are the same object in
  // two places, so the note lets go exactly as fast as the sheet takes hold.
  // The sheet starts at the note's own footprint, which is what makes the swap
  // invisible — and why a bright note never shows through the sheet's early,
  // half-there frames and reads as two pieces of paper.
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
  // At rest there is nothing to composite for, so the hint goes away.
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
  cardSheet.focus({ preventScroll: true }); // announce the note without scrolling the stage
  haptic(HAPTIC_COMMIT);
  aimCard(1);
}

function closeCard() {
  if (cardPhase === "closed" || cardPhase === "closing") return;
  // The dialog stops being a dialog the moment it starts leaving, but it keeps
  // swallowing pointer events until it is gone — otherwise a tap aimed at the
  // scrim lands on the scene the card grew out of.
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
  const slack = 10; // a little extra reach, since parallax makes the note a moving target
  return Math.abs(rx) <= PAPER_INFO.w / 2 + slack && Math.abs(ry) <= PAPER_INFO.h / 2 + slack;
}

function makeItem(text, href, downloadName) {
  const li = document.createElement("li");
  const el = document.createElement("a");
  el.href = href;
  if (downloadName) el.setAttribute("download", downloadName);
  else { el.target = "_blank"; el.rel = "noopener"; }
  el.className = "papercard-link";

  const val = document.createElement("span");
  val.className = "papercard-val";
  val.textContent = text;

  el.append(val);
  li.appendChild(el);
  return li;
}

function buildCard() {
  cardName.textContent = PAPERCARD_DATA.name;
  cardLinks.append(
    makeItem("github.com/" + PAPERCARD_DATA.github, "https://github.com/" + PAPERCARD_DATA.github),
    makeItem("discord/" + PAPERCARD_DATA.discord, PAPERCARD_DATA.discordUrl),
    makeItem(PAPERCARD_DATA.email, "mailto:" + PAPERCARD_DATA.email),
    makeItem(PAPERCARD_DATA.pgpFile, PAPERCARD_DATA.pgpFile, PAPERCARD_DATA.pgpFile),
  );
}

/* Draw the torn parchment behind the card content (reuses paper.js). */
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

  const u = Math.max(8, h / PAPER_TATTER_ROWS);
  const margin = u * 0.5;
  const dw = Math.max(24, w - margin * 2);
  const dh = Math.max(24, h - margin * 2);
  const edges = PAPER_EDGES || makeSheetEdges(dw, dh, u, seededRand(PAPER_SEED));
  // Soften the tears so the bigger sheet isn't gouged out.
  const soft = { top: [], right: [], bottom: [], left: [] };
  for (const key of Object.keys(edges)) {
    soft[key] = edges[key].map(([t, o]) => [t, o * 0.3]);
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
    // Following the hand while the gesture is still a tap; travelling hands the
    // gesture to the pan and takes the note back with it.
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
  // A gesture that never travelled is a tap, wherever the scene drifted to under
  // a still hand — the parallax easing is not a change of mind. Once it travels
  // it is a drag, and a drag never opens the note.
  if (PTR.dragged) closeCard();
  else commitCard();
});

/* The hand leaving the page mid-press is also a release that never arrives, so
   the note goes back rather than waiting for one. */
onPointer("leave", () => {
  setNoteHover(false);
  if (cardPhase === "pressing") closeCard();
});

cardBackdrop.addEventListener("click", closeCard);

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (cardPhase === "pressing" || cardPhase === "open") closeCard();
});

/* A resize re-places the sheet rather than restarting it: the same progress
 * value is applied to the new geometry, so an in-flight transition continues
 * where it was. */
window.addEventListener("resize", () => {
  if (cardPhase === "closed") return;
  cardGeom = measureCard();
  cardSheet.style.transformOrigin = `${cardGeom.ox}px ${cardGeom.oy}px`;
  applyCard(cardSpring.value);
});

/* The parchment is drawn to fit the sheet behind it, so it is redrawn whenever
 * that box changes — a resize, a webfont landing late, or a reader's larger text
 * asking the content for more paper. */
if (typeof ResizeObserver === "function") {
  new ResizeObserver(() => renderCardPaper()).observe(cardSheet);
}

buildCard();
