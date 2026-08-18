"use strict";

const PAPERCARD_DATA = {
  name: "solanaceae",
  github: "0xSolanaceae",
  discord: "0x_Solanaceae",
  discordUrl: "https://discord.com/users/1098339239432835162",
  email: "solancaeae@duck.com",
  pgpFile: "pgp.asc",
};

const card = document.getElementById("papercard");
const cardSheet = document.getElementById("papercard-sheet");
const cardPaper = document.getElementById("papercard-paper");
const cardBackdrop = document.getElementById("papercard-backdrop");
const cardName = document.getElementById("papercard-name");
const cardLinks = document.getElementById("papercard-links");

let cardOpen = false;

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

function makeItem(text, href, copyValue, downloadName) {
  const li = document.createElement("li");
  const el = href ? document.createElement("a") : document.createElement("button");
  if (href) {
    el.href = href;
    if (downloadName) el.setAttribute("download", downloadName);
    else { el.target = "_blank"; el.rel = "noopener"; }
  } else {
    el.type = "button";
  }
  el.className = "papercard-link";

  const val = document.createElement("span");
  val.className = "papercard-val";
  val.textContent = text;

  el.append(val);
  if (!href) el.addEventListener("click", () => copyText(copyValue, val));
  li.appendChild(el);
  return li;
}

function copyText(text, valEl) {
  const original = valEl.textContent;
  const done = () => {
    valEl.textContent = "copied!";
    setTimeout(() => { valEl.textContent = original; }, 1200);
  };
  const fallback = () => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); done(); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(fallback);
  } else {
    fallback();
  }
}

function buildCard() {
  cardName.textContent = PAPERCARD_DATA.name;
  cardLinks.append(
    makeItem("github.com/" + PAPERCARD_DATA.github, "https://github.com/" + PAPERCARD_DATA.github),
    makeItem("discord/" + PAPERCARD_DATA.discord, PAPERCARD_DATA.discordUrl),
    makeItem(PAPERCARD_DATA.email, "mailto:" + PAPERCARD_DATA.email),
    makeItem(PAPERCARD_DATA.pgpFile, PAPERCARD_DATA.pgpFile, null, PAPERCARD_DATA.pgpFile),
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

  const u = Math.max(8, h / PAPER_H_CELLS);
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

function openCard() {
  if (cardOpen || !PAPER_INFO) return;
  cardOpen = true;

  const base = card.getBoundingClientRect();
  const sw = cardSheet.offsetWidth;
  const sh = cardSheet.offsetHeight;
  renderCardPaper();
  const endX = (base.width - sw) / 2;
  const endY = (base.height - sh) / 2;

  cardSheet.style.transform = `translate(${endX}px, ${endY}px) scale(1)`;
  cardSheet.style.opacity = "1";
  cardBackdrop.style.opacity = "1";
  card.classList.remove("closed");
  card.classList.add("open");
  card.setAttribute("aria-hidden", "false");
}

function closeCard() {
  if (!cardOpen) return;
  cardOpen = false;
  card.setAttribute("aria-hidden", "true");
  card.classList.add("closed");
  card.classList.remove("open");
  cardSheet.style.transform = "";
  cardSheet.style.opacity = "";
  cardBackdrop.style.opacity = "0";
}

stage.addEventListener("click", (e) => {
  if (cardOpen || !PAPER_INFO) return;
  if (e.target.closest && e.target.closest("#papercard")) return;
  if (hitPaper(e.clientX, e.clientY)) openCard();
});

stage.addEventListener("pointermove", (e) => {
  if (cardOpen || !PAPER_INFO) {
    stage.style.cursor = "";
    return;
  }
  stage.style.cursor = hitPaper(e.clientX, e.clientY) ? "pointer" : "";
});

cardBackdrop.addEventListener("click", closeCard);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && cardOpen) closeCard();
});

window.addEventListener("resize", () => {
  if (!cardOpen) return;
  renderCardPaper();
  const base = card.getBoundingClientRect();
  const sw = cardSheet.offsetWidth;
  const sh = cardSheet.offsetHeight;
  cardSheet.style.transform =
    `translate(${(base.width - sw) / 2}px, ${(base.height - sh) / 2}px) scale(1)`;
});

buildCard();
