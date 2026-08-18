"use strict";

let spriteLand = null;
let spriteTrees = null;
let trunkA = null;
let trunkB = null;
const loading = document.getElementById("loading");

/* Records whether the webfont arrived in time; if not, build with fallback
 * metrics and re-measure once the face lands. */
let fontReadyFlag = false;
function fontLoadedPromise() {
  if (!document.fonts || !document.fonts.load) return Promise.resolve(true);
  return document.fonts
    .load('16px "Noto Sans Mono"')
    .then((faces) => {
      fontReadyFlag = faces.length > 0;
      return fontReadyFlag;
    })
    .catch(() => false);
}

async function init() {
  const firstPaint = new Promise((r) => {
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        r();
      }
    };
    requestAnimationFrame(() => requestAnimationFrame(finish));
    setTimeout(finish, 150);
  });

  const fontPromise = fontLoadedPromise();

  try {
    const [
      land, tree1, tree2, tree3,
      t1, t1Solid, t2, t2Solid,
      crow, leaf,
    ] = await Promise.all([
      loadSprite("assets/land.txt"),
      loadSprite("assets/tree1.txt"),
      loadSprite("assets/tree2.txt"),
      loadSprite("assets/tree3.txt"),
      loadSprite("assets/trunk1.txt"),
      loadSprite("assets/trunk1_solid.txt"),
      loadSprite("assets/trunk2.txt"),
      loadSprite("assets/trunk2_solid.txt"),
      loadImage("assets/Crow.png"),
      loadImage("assets/ELR_FallLeaf.png"),
    ]);
    spriteLand = land;
    spriteTrees = [tree1, tree2, tree3];
    trunkA = { ...t1, solid: t1Solid };
    trunkB = { ...t2, solid: t2Solid };
    crowImg = crow;
    leafImg = leaf;
    const nearColor = getComputedStyle(LAYER_ELS["birds-near"]).color;
    nearFrames = CROW_FLY_LARGE.map((r) => tintSprite(crowImg, r, nearColor, 0.95));
    nearPerchFrames = CROW_PERCH_POSES.map((r) => tintSprite(crowImg, r, nearColor, 0.95));
    const farColor = getComputedStyle(LAYER_ELS["birds-far"]).color;
    farFrames = {
      small: CROW_FLY_SMALL.map((r) => tintSprite(crowImg, r, farColor, 0.85)),
      smallGlide: tintSprite(crowImg, CROW_SMALL_GLIDE, farColor, 0.85),
      med: CROW_FLY_MED.map((r) => tintSprite(crowImg, r, farColor, 0.85)),
      medGlide: CROW_GLIDE_MED.map((r) => tintSprite(crowImg, r, farColor, 0.85)),
    };
  } catch (err) {
    console.error("Could not load assets:", err);
    loading.classList.add("hidden");
    return;
  }

  // Never hold first paint open on the webfont: build with fallback metrics
  // if it hasn't arrived within the budget, and re-measure when it lands.
  await Promise.all([
    firstPaint,
    Promise.race([fontPromise, new Promise((r) => setTimeout(r, 150))]),
  ]);

  const builtWithRealFont = fontReadyFlag; // snapshot BEFORE the build
  buildAll();
  loading.classList.add("hidden");
  window.addEventListener("resize", debounce(buildAll, 150));
  ensureTicking();

  if (!builtWithRealFont) {
    fontPromise.then((ok) => {
      if (ok) buildAll();
    });
  }
}

init();
