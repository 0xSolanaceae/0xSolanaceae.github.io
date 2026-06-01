/* ambient — quiet ascii botanical art
 * --------------------------------------------------------------
 * a calm, painterly background composed of two layers:
 *
 *   1. specimens   pre-composed botanical sketches (flowers, berry
 *                  sprigs, ferns, tendrils, flourishes) inked one
 *                  cell per tick at random anchors. low alpha so
 *                  they never compete with foreground text.
 *   2. petals      slow drifting particles that fall across the
 *                  page, leaving a faint trail.
 *
 * older marks are washed back to paper by a translucent fill so
 * the canvas never saturates. respects prefers-reduced-motion.
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
			bloom: ['*', '+', 'o', 'O', '@', '&', '%'],
			berry: ['o', 'O', '@'],
			petal: ['.', ',', "'", '`', '~']
		};

		/* pre-composed botanical specimens. each is a list of cell
		 * offsets [dx, dy, glyph, alpha]. drawn one cell per tick at
		 * a random anchor. tokens '$bloom' / '$berry' resolve at draw time.
		 * alpha values intentionally low so the art reads as background. */
		const SPECIMENS = [
			// 0 — small bloom
			[[0,-1,'*',0.45],[-1,0,'-',0.32],[0,0,'+',0.42],[1,0,'-',0.32],
			 [0,1,'|',0.34],[0,2,'|',0.24]],

			// 1 — 5-petal flower
			[[0,-1,'.',0.28],[-1,-1,"'",0.28],[1,-1,"'",0.28],
			 [-1,0,'(',0.36],[0,0,'$bloom',0.5],[1,0,')',0.36],
			 [0,1,'|',0.36],[0,2,'|',0.28],[0,3,'|',0.2]],

			// 2 — berry sprig
			[[-1,-1,'o',0.42],[0,-1,'O',0.48],[1,-1,'o',0.42],
			 [0,0,'+',0.36],[0,1,'|',0.34],[0,2,'|',0.24],[-1,2,',',0.22]],

			// 3 — fern frond (right-facing)
			[[0,0,'<',0.36],[1,0,'-',0.34],[2,0,'=',0.3],[3,0,'-',0.28],[4,0,'~',0.24],
			 [1,-1,"'",0.28],[2,-1,"'",0.24],[3,-1,'.',0.2],
			 [1,1,',',0.28],[2,1,',',0.24],[3,1,'.',0.2]],

			// 4 — fern frond (left-facing)
			[[0,0,'>',0.36],[-1,0,'-',0.34],[-2,0,'=',0.3],[-3,0,'-',0.28],[-4,0,'~',0.24],
			 [-1,-1,"'",0.28],[-2,-1,"'",0.24],[-3,-1,'.',0.2],
			 [-1,1,',',0.28],[-2,1,',',0.24],[-3,1,'.',0.2]],

			// 5 — curl tendril (spiral)
			[[0,0,'(',0.36],[1,0,'_',0.34],[2,0,')',0.36],
			 [2,1,"'",0.28],[1,1,'`',0.28],[0,1,'.',0.24],
			 [-1,1,',',0.22],[-1,0,'/',0.2]],

			// 6 — drooping vine with bloom
			[[0,0,'|',0.34],[0,1,'|',0.3],[0,2,'|',0.28],
			 [0,3,"'",0.24],[1,3,'.',0.22],[1,4,',',0.22],
			 [2,4,'`',0.24],[2,5,'.',0.24],[3,5,'$bloom',0.45]],

			// 7 — star bloom (radiating)
			[[0,-2,'.',0.24],[-2,0,'.',0.24],[2,0,'.',0.24],[0,2,'.',0.24],
			 [-1,-1,'\\',0.3],[1,-1,'/',0.3],[-1,1,'/',0.3],[1,1,'\\',0.3],
			 [0,0,'$bloom',0.55]],

			// 8 — calligraphic S-flourish
			[[0,0,'.',0.24],[1,0,'`',0.28],[2,-1,"'",0.3],[3,-1,'.',0.3],
			 [4,0,',',0.3],[5,0,'.',0.28],[6,1,'`',0.28],[7,1,"'",0.24],
			 [8,2,'.',0.24]],

			// 9 — ivy cluster (compact)
			[[0,0,'`',0.28],[1,0,"'",0.3],[2,-1,'.',0.28],
			 [0,1,',',0.28],[1,1,'`',0.3],[2,1,"'",0.28],
			 [1,-1,'$berry',0.4],[3,0,'$berry',0.42]],

			// 10 — crescent moon (rare)
			[[0,-1,'(',0.34],[0,0,'(',0.36],[0,1,'(',0.34],[-1,0,'.',0.22]]
		];

		const config = {
			cellW: 14,
			cellH: 20,
			maxSpecimens: 5,
			maxPetals: 5,
			tickMs: 110,
			washAlpha: 0.014,
			specimenSpawnChance: 0.045,
			petalSpawnChance: 0.022,
			berryColor: 'rgba(91, 58, 94, ALPHA)',
			mossColor:  'rgba(107, 122, 58, ALPHA)',
			goldColor:  'rgba(184, 139, 30, ALPHA)'
		};

		let cols = 0, rows = 0;
		let specimens = [];
		let petals = [];
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

			specimens = [];
			petals = [];
			for (let i = 0; i < 2; i++) spawnSpecimen();
			for (let i = 0; i < 3; i++) spawnPetal(true);
		}

		/* ---------------------------------------------------- specimens */

		function spawnSpecimen() {
			if (specimens.length >= config.maxSpecimens) return;
			const tmpl = pick(SPECIMENS);
			const ax = randInt(5, Math.max(6, cols - 5));
			const ay = randInt(4, Math.max(5, rows - 4));
			specimens.push({
				ax, ay,
				palette: pickPalette(),
				cells: tmpl.slice(),
				index: 0
			});
		}

		function stepSpecimen(s) {
			if (s.index >= s.cells.length) return;
			const cell = s.cells[s.index++];
			const dx = cell[0], dy = cell[1], gToken = cell[2], alpha = cell[3];
			let glyph = gToken;
			if      (gToken === '$bloom') glyph = pick(GLYPHS.bloom);
			else if (gToken === '$berry') glyph = pick(GLYPHS.berry);
			drawGlyph(s.ax + dx, s.ay + dy, glyph, s.palette, alpha != null ? alpha : 0.32);
		}

		/* ------------------------------------------------------ petals */

		function spawnPetal(initial) {
			if (petals.length >= config.maxPetals) return;
			petals.push({
				fx: initial ? Math.random() * cols : randRange(-2, cols + 2),
				fy: initial ? Math.random() * rows : -1,
				vx: randRange(-0.12, 0.12),
				vy: randRange(0.06, 0.18),
				wobble: randRange(0, Math.PI * 2),
				wobbleRate: randRange(0.03, 0.08),
				palette: Math.random() < 0.5 ? 'berry' : 'gold',
				glyph: pick(GLYPHS.petal),
				life: randInt(90, 220),
				age: 0
			});
		}

		function stepPetal(p) {
			p.wobble += p.wobbleRate;
			const wob = Math.sin(p.wobble) * 0.06;
			p.fx += p.vx + wob;
			p.fy += p.vy;
			p.age++;

			const cx = Math.round(p.fx);
			const cy = Math.round(p.fy);
			const fade = 0.16 + 0.18 * (1 - p.age / p.life);
			drawGlyph(cx, cy, p.glyph, p.palette, Math.max(0.05, fade));
		}

		function isPetalAlive(p) {
			return p.age < p.life && p.fy < rows + 2 && p.fx > -3 && p.fx < cols + 3;
		}

		/* ------------------------------------------------------ ticker */

		function tick(timestamp) {
			if (!running) return;
			if (!lastTick) lastTick = timestamp;
			const elapsed = timestamp - lastTick;

			if (elapsed >= config.tickMs) {
				lastTick = timestamp;
				washCanvas();

				for (let i = specimens.length - 1; i >= 0; i--) {
					stepSpecimen(specimens[i]);
					if (specimens[i].index >= specimens[i].cells.length) {
						specimens.splice(i, 1);
					}
				}

				for (let i = petals.length - 1; i >= 0; i--) {
					stepPetal(petals[i]);
					if (!isPetalAlive(petals[i])) petals.splice(i, 1);
				}

				if (specimens.length < config.maxSpecimens && Math.random() < config.specimenSpawnChance) {
					spawnSpecimen();
				}
				if (petals.length < config.maxPetals && Math.random() < config.petalSpawnChance) {
					spawnPetal(false);
				}
			}

			requestAnimationFrame(tick);
		}

		function washCanvas() {
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
			let base;
			if      (palette === 'moss') base = config.mossColor;
			else if (palette === 'gold') base = config.goldColor;
			else                          base = config.berryColor;
			ctx.fillStyle = base.replace('ALPHA', alpha.toFixed(2));
			ctx.fillText(glyph, px, py);
		}

		function pickPalette() {
			const r = Math.random();
			if (r < 0.08) return 'gold';
			if (r < 0.55) return 'moss';
			return 'berry';
		}

		function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
		function randInt(min, max) { return Math.floor(min + Math.random() * (max - min)); }
		function randRange(min, max) { return min + Math.random() * (max - min); }

		function debounce(fn, wait) {
			let t;
			return function () {
				const args = arguments, self = this;
				clearTimeout(t);
				t = setTimeout(() => fn.apply(self, args), wait);
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
