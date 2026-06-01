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
			[[0,-1,'*',0.32],[-1,0,'-',0.22],[0,0,'+',0.30],[1,0,'-',0.22],
			 [0,1,'|',0.22],[0,2,'|',0.16]],

			// 1 — 5-petal flower
			[[0,-1,'.',0.18],[-1,-1,"'",0.18],[1,-1,"'",0.18],
			 [-1,0,'(',0.24],[0,0,'$bloom',0.34],[1,0,')',0.24],
			 [0,1,'|',0.24],[0,2,'|',0.18],[0,3,'|',0.12]],

			// 2 — berry sprig
			[[-1,-1,'o',0.28],[0,-1,'O',0.32],[1,-1,'o',0.28],
			 [0,0,'+',0.24],[0,1,'|',0.22],[0,2,'|',0.16],[-1,2,',',0.14]],

			// 3 — fern frond (right-facing)
			[[0,0,'<',0.24],[1,0,'-',0.22],[2,0,'=',0.20],[3,0,'-',0.18],[4,0,'~',0.15],
			 [1,-1,"'",0.18],[2,-1,"'",0.15],[3,-1,'.',0.12],
			 [1,1,',',0.18],[2,1,',',0.15],[3,1,'.',0.12]],

			// 4 — fern frond (left-facing)
			[[0,0,'>',0.24],[-1,0,'-',0.22],[-2,0,'=',0.20],[-3,0,'-',0.18],[-4,0,'~',0.15],
			 [-1,-1,"'",0.18],[-2,-1,"'",0.15],[-3,-1,'.',0.12],
			 [-1,1,',',0.18],[-2,1,',',0.15],[-3,1,'.',0.12]],

			// 5 — curl tendril (spiral)
			[[0,0,'(',0.24],[1,0,'_',0.22],[2,0,')',0.24],
			 [2,1,"'",0.18],[1,1,'`',0.18],[0,1,'.',0.15],
			 [-1,1,',',0.14],[-1,0,'/',0.12]],

			// 6 — drooping vine with bloom
			[[0,0,'|',0.22],[0,1,'|',0.20],[0,2,'|',0.18],
			 [0,3,"'",0.15],[1,3,'.',0.14],[1,4,',',0.14],
			 [2,4,'`',0.16],[2,5,'.',0.16],[3,5,'$bloom',0.30]],

			// 7 — star bloom (radiating)
			[[0,-2,'.',0.15],[-2,0,'.',0.15],[2,0,'.',0.15],[0,2,'.',0.15],
			 [-1,-1,'\\',0.20],[1,-1,'/',0.20],[-1,1,'/',0.20],[1,1,'\\',0.20],
			 [0,0,'$bloom',0.36]],

			// 8 — calligraphic S-flourish
			[[0,0,'.',0.15],[1,0,'`',0.18],[2,-1,"'",0.20],[3,-1,'.',0.20],
			 [4,0,',',0.20],[5,0,'.',0.18],[6,1,'`',0.18],[7,1,"'",0.15],
			 [8,2,'.',0.15]],

			// 9 — ivy cluster (compact)
			[[0,0,'`',0.18],[1,0,"'",0.20],[2,-1,'.',0.18],
			 [0,1,',',0.18],[1,1,'`',0.20],[2,1,"'",0.18],
			 [1,-1,'$berry',0.26],[3,0,'$berry',0.28]],

			// 10 — crescent moon (rare)
			[[0,-1,'(',0.22],[0,0,'(',0.24],[0,1,'(',0.22],[-1,0,'.',0.14]]
		];

		const config = {
			cellW: 14,
			cellH: 20,
			maxSpecimens: 4,
			maxPetals: 4,
			tickMs: 120,
			washAlpha: 0.010,
			specimenSpawnChance: 0.035,
			petalSpawnChance: 0.018,
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
