"use strict";

const EMPTY = "\u2800"; // empty-cell glyph used throughout the art assets

const stage = document.getElementById("stage");
const LAYER_ELS = {
  far: document.getElementById("layer-far"),
  "birds-far": document.getElementById("layer-birds-far"),
  "mid-far": document.getElementById("layer-mid-far"),
  "land-mid": document.getElementById("layer-land-mid"),
  "mid-near": document.getElementById("layer-mid-near"),
  "land-near": document.getElementById("layer-land-near"),
  "birds-near": document.getElementById("layer-birds-near"),
  "leaves-far": document.getElementById("layer-leaves-far"),
  "leaves-mid": document.getElementById("layer-leaves-mid"),
  "leaves-near": document.getElementById("layer-leaves-near"),
  fore: document.getElementById("layer-fore"),
  paper: document.getElementById("layer-paper"),
  near: document.getElementById("layer-near"),
};

/* Parallax depth per layer (1 = nearest / fastest). */
const LAYERS = [
  { key: "far",        depth: 0.25, tiled: true },
  { key: "birds-far",  depth: 0.3,  tiled: true },
  { key: "leaves-far", depth: 0.4,  tiled: true },
  { key: "mid-far",    depth: 0.4,  tiled: true },
  { key: "land-mid",   depth: 0.48, tiled: true },
  { key: "mid-near",   depth: 0.55, tiled: true },
  { key: "birds-near", depth: 0.55, tiled: true },
  { key: "leaves-mid", depth: 0.6,  tiled: true },
  { key: "land-near",  depth: 0.62, tiled: true },
  { key: "fore",       depth: 0.78, tiled: true },
  { key: "paper",      depth: 0.78, tiled: true },
  { key: "leaves-near", depth: 0.78, tiled: true },
  { key: "near",       depth: 1.0,  tiled: true },
];

const SPRITE_UPSCALE = 2;
const MAX_SHIFT_X = 16 * SPRITE_UPSCALE;

let W = 0;
let ROWS = 0;
let W_TOTAL = 0;
const CELL = { w: 0, h: 0 };
// Parallax only slides MAX_SHIFT_X cells, so each side needs that much bleed.
const MARGIN = MAX_SHIFT_X + 8; // bleed cells on each side of the viewport
const DPR_CAP = 1;

const metas = {};

const REDUCED_MOTION =
  typeof matchMedia !== "undefined" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;
