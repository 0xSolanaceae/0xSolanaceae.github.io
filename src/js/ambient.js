/* ambient — generative ascii vines
 * --------------------------------------------------------------
 * a quiet, painterly background. seeds creep in from the page edges,
 * extend one cell at a time, occasionally branch, occasionally bloom
 * into a flower glyph, then die. older marks are slowly washed back
 * to paper by a translucent fill so the canvas never saturates.
 *
 * runs on a single 2d canvas behind everything. respects
 * prefers-reduced-motion (does nothing in that case).
 */

(function () {
	'use strict';

	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	document.addEventListener('DOMContentLoaded', () => {
		const container = document.querySelector('.ambient-container');
		if (!container || prefersReducedMotion) return;

		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d', { alpha: true });
		container.appendChild(canvas);

		const GLYPHS = {
			straight:  ['|', '!', ':', ';'],
			branch:    ['+', 'T', 'Y', 'X', '*'],
			diagonal:  ['\\', '/'],
			vine:      ['.', ',', "'", '`', ':', ';'],
			bloom:     ['*', '+', 'o', 'O', '@', '&', '%'],
			berry:     ['o', 'O', '*']
		};

		const DIRS = {
			N:  { dx:  0, dy: -1, glyphs: GLYPHS.straight },
			S:  { dx:  0, dy:  1, glyphs: GLYPHS.straight },
			E:  { dx:  1, dy:  0, glyphs: ['-', '=', '~'] },
			W:  { dx: -1, dy:  0, glyphs: ['-', '=', '~'] },
			NE: { dx:  1, dy: -1, glyphs: GLYPHS.diagonal },
			NW: { dx: -1, dy: -1, glyphs: GLYPHS.diagonal },
			SE: { dx:  1, dy:  1, glyphs: GLYPHS.diagonal },
			SW: { dx: -1, dy:  1, glyphs: GLYPHS.diagonal }
		};

		const DIR_KEYS = Object.keys(DIRS);
		const CARDINAL = ['N', 'S', 'E', 'W'];

		// turn options for each direction: mostly continue, occasionally tilt
		const TURN_MAP = {
			N:  ['N', 'N', 'N', 'NE', 'NW'],
			S:  ['S', 'S', 'S', 'SE', 'SW'],
			E:  ['E', 'E', 'E', 'NE', 'SE'],
			W:  ['W', 'W', 'W', 'NW', 'SW'],
			NE: ['NE', 'NE', 'N', 'E'],
			NW: ['NW', 'NW', 'N', 'W'],
			SE: ['SE', 'SE', 'S', 'E'],
			SW: ['SW', 'SW', 'S', 'W']
		};

		const config = {
			cellW: 14,
			cellH: 20,
			maxSeeds: 5,
			tickMs: 110,
			washAlpha: 0.018,          // how aggressively the page fades old marks
			berryColor:  'rgba(91, 58, 94, ALPHA)',   // nightshade berry
			mossColor:   'rgba(107, 122, 58, ALPHA)', // vine green
			inkColor:    'rgba(60, 56, 54, ALPHA)'    // soft ink for fine glyphs
		};

		let cols = 0, rows = 0;
		let seeds = [];
		let lastTick = 0;
		let running = true;

		function resize() {
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			const { innerWidth: w, innerHeight: h } = window;
			canvas.width = w * dpr;
			canvas.height = h * dpr;
			canvas.style.width = w + 'px';
			canvas.style.height = h + 'px';
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

			cols = Math.floor(w / config.cellW);
			rows = Math.floor(h / config.cellH);

			ctx.clearRect(0, 0, w, h);
			ctx.textBaseline = 'middle';
			ctx.textAlign = 'center';
			ctx.font = '14px "Courier New", monospace';

			seeds = [];
			for (let i = 0; i < 2; i++) spawnSeed();
		}

		function spawnSeed() {
			if (seeds.length >= config.maxSeeds) return;

			// pick an edge to root from
			const edge = pick(['top', 'bottom', 'left', 'right']);
			let x, y, dir;
			if (edge === 'top')    { x = randInt(0, cols); y = 0;          dir = pick(['S', 'SE', 'SW']); }
			else if (edge === 'bottom') { x = randInt(0, cols); y = rows - 1; dir = pick(['N', 'NE', 'NW']); }
			else if (edge === 'left')   { x = 0;          y = randInt(0, rows); dir = pick(['E', 'NE', 'SE']); }
			else                         { x = cols - 1;  y = randInt(0, rows); dir = pick(['W', 'NW', 'SW']); }

			seeds.push({
				x, y, dir,
				age: 0,
				life: randInt(45, 130),
				branchBudget: randInt(1, 3),
				palette: Math.random() < 0.55 ? 'moss' : 'berry'
			});
		}

		function stepSeed(seed) {
			// draw the current cell
			const directionInfo = DIRS[seed.dir];
			const glyph = pick(directionInfo.glyphs);
			drawGlyph(seed.x, seed.y, glyph, seed.palette, 0.22 + Math.random() * 0.18);

			// occasional joint at branch points (more visible)
			if (Math.random() < 0.08) {
				drawGlyph(seed.x, seed.y, pick(GLYPHS.branch), seed.palette, 0.45);
			}

			// occasional bloom — only past first few cells
			if (seed.age > 8 && Math.random() < 0.025) {
				drawGlyph(seed.x, seed.y, pick(GLYPHS.bloom), seed.palette, 0.7);
			}

			// branching
			if (seed.branchBudget > 0 && seed.age > 6 && Math.random() < 0.035) {
				seed.branchBudget--;
				const branchDir = pick(perpendicular(seed.dir));
				seeds.push({
					x: seed.x,
					y: seed.y,
					dir: branchDir,
					age: 0,
					life: randInt(20, 60),
					branchBudget: 0,
					palette: seed.palette
				});
			}

			// pick next direction (gentle turn)
			seed.dir = pick(TURN_MAP[seed.dir] || CARDINAL);
			const next = DIRS[seed.dir];
			seed.x += next.dx;
			seed.y += next.dy;
			seed.age++;
		}

		function isInBounds(seed) {
			return seed.x >= 0 && seed.x < cols && seed.y >= 0 && seed.y < rows;
		}

		function tick(timestamp) {
			if (!running) return;
			if (!lastTick) lastTick = timestamp;
			const elapsed = timestamp - lastTick;

			if (elapsed >= config.tickMs) {
				lastTick = timestamp;
				washCanvas();

				// step every seed
				for (let i = seeds.length - 1; i >= 0; i--) {
					const seed = seeds[i];
					stepSeed(seed);

					// retire if out of bounds or past life — leave a final bloom
					if (!isInBounds(seed) || seed.age >= seed.life) {
						if (isInBounds(seed) && Math.random() < 0.6) {
							drawGlyph(seed.x, seed.y, pick(GLYPHS.bloom), seed.palette, 0.8);
						}
						seeds.splice(i, 1);
					}
				}

				// keep the garden seeded but not crowded
				if (seeds.length < 2 || (seeds.length < config.maxSeeds && Math.random() < 0.08)) {
					spawnSeed();
				}
			}

			requestAnimationFrame(tick);
		}

		function washCanvas() {
			// translucent paper wash — old marks bleed away gradually
			ctx.save();
			ctx.globalCompositeOperation = 'destination-out';
			ctx.fillStyle = `rgba(0, 0, 0, ${config.washAlpha})`;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.restore();
		}

		function drawGlyph(col, row, glyph, palette, alpha) {
			if (col < 0 || col >= cols || row < 0 || row >= rows) return;
			const px = col * config.cellW + config.cellW / 2;
			const py = row * config.cellH + config.cellH / 2;
			const base = palette === 'moss' ? config.mossColor : config.berryColor;
			ctx.fillStyle = base.replace('ALPHA', alpha.toFixed(2));
			ctx.fillText(glyph, px, py);
		}

		function perpendicular(dir) {
			if (dir === 'N' || dir === 'S') return ['E', 'W'];
			if (dir === 'E' || dir === 'W') return ['N', 'S'];
			if (dir === 'NE' || dir === 'SW') return ['NW', 'SE'];
			if (dir === 'NW' || dir === 'SE') return ['NE', 'SW'];
			return CARDINAL;
		}

		function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
		function randInt(min, max) { return Math.floor(min + Math.random() * (max - min)); }

		function debounce(fn, wait) {
			let t;
			return function (...args) {
				clearTimeout(t);
				t = setTimeout(() => fn.apply(this, args), wait);
			};
		}

		window.addEventListener('resize', debounce(resize, 160));
		document.addEventListener('visibilitychange', () => {
			running = !document.hidden;
			if (running) {
				lastTick = 0;
				requestAnimationFrame(tick);
			}
		});

		resize();
		requestAnimationFrame(tick);
	});
})();
