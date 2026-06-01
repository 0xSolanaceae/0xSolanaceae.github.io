/* app — page controller
 * --------------------------------------------------------------
 * wires together: the sigil rail (nav), the AsciiMorph centerpiece,
 * the PGP modal, and a quiet effect scheduler. all content lives in
 * sections.js; all glyph growth lives in ambient.js.
 *
 * no build step: loaded as a classic script after sections.js and
 * ascii-morph.js, which expose window.SiteSections and AsciiMorph.
 */

(function () {
	'use strict';

	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	if (prefersReducedMotion) {
		document.documentElement.classList.add('reduce-motion');
	}

	const { mobile, desktop, order, rail: railItems, pgpKey } = window.SiteSections;

	const state = {
		current: 'welcome',
		isMobile: window.innerWidth <= 768,
		idleTimer: null,
		effectTimers: []
	};

	const dom = {
		asciiContainer: document.querySelector('.morph-section'),
		railRoot:       document.querySelector('.rail'),
		pgpOverlay:     document.querySelector('.pgp-key-container'),
		pgpKey:         document.querySelector('.pgp-key-text')
	};

	document.addEventListener('DOMContentLoaded', init);

	function init() {
		buildRail();
		configureCanvas();
		renderSection(true);
		bindGlobalEvents();
		scheduleEffects();
		restartIdleTimer();
	}

	/* ---------------------------------------------------------- rail */

	function buildRail() {
		const frag = document.createDocumentFragment();

		// top botanical cap mark
		const capTop = document.createElement('span');
		capTop.className = 'rail-cap';
		capTop.setAttribute('aria-hidden', 'true');
		frag.appendChild(capTop);

		railItems.forEach((item) => {
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'rail-item' + (item.shade ? ' rail-item--shade' : '');
			btn.dataset.section = item.key;
			btn.setAttribute('aria-label', item.label);
			btn.innerHTML =
				`<span class="rail-glyph" aria-hidden="true">${item.glyph}</span>` +
				`<span class="rail-label">${item.label}</span>`;
			frag.appendChild(btn);
		});

		// bottom botanical cap mark
		const capBot = document.createElement('span');
		capBot.className = 'rail-cap';
		capBot.setAttribute('aria-hidden', 'true');
		frag.appendChild(capBot);

		dom.railRoot.appendChild(frag);

		dom.railRoot.addEventListener('click', (e) => {
			const target = e.target.closest('.rail-item');
			if (!target) return;
			navigate(target.dataset.section);
		});
	}

	function updateRailState() {
		dom.railRoot.querySelectorAll('.rail-item').forEach((btn) => {
			btn.classList.toggle('is-active', btn.dataset.section === state.current);
		});
	}

	/* ---------------------------------------------------- ascii canvas */

	function configureCanvas() {
		const isAi = state.current === 'ai';
		const dim = state.isMobile
			? (isAi ? { x: 32, y: 42 } : { x: 32, y: 24 })
			: (isAi ? { x: 70, y: 34 } : { x: 70, y: 30 });

		dom.asciiContainer.classList.toggle('ai-section', isAi);
		dom.asciiContainer.style.width = '100%';
		dom.asciiContainer.style.textAlign = 'center';
		AsciiMorph(dom.asciiContainer, dim);
	}

	function renderSection(initial) {
		const data = state.isMobile ? mobile[state.current] : desktop[state.current];
		if (initial) {
			AsciiMorph.render(data);
		} else {
			AsciiMorph.morph(data);
		}
		updateRailState();
		document.body.classList.toggle('ai-active', state.current === 'ai');

		requestAnimationFrame(() => {
			animatePoemLines();
			updateScrollMode();
			pulseClass(dom.asciiContainer, 'ink-bleed', 520);
		});
	}

	function updateScrollMode() {
		const isAi = state.current === 'ai';
		if (!isAi) {
			document.body.style.overflow = 'hidden';
			document.body.style.height = '100vh';
			return;
		}
		const contentH = dom.asciiContainer.scrollHeight || 0;
		const viewportH = window.innerHeight || document.documentElement.clientHeight || 0;
		if (contentH > viewportH) {
			document.body.style.overflow = 'auto';
			document.body.style.height = 'auto';
		} else {
			document.body.style.overflow = 'hidden';
			document.body.style.height = '100vh';
		}
	}

	function navigate(key) {
		if (!key || key === state.current || !order.includes(key)) return;
		state.current = key;
		configureCanvas();
		renderSection(false);
		restartIdleTimer();
	}

	/* ------------------------------------------------------ pgp modal */

	function showPgpKey() {
		dom.pgpKey.textContent = pgpKey;
		dom.pgpOverlay.classList.add('visible');
		dom.pgpOverlay.setAttribute('aria-hidden', 'false');
	}

	function hidePgpKey() {
		dom.pgpOverlay.classList.remove('visible');
		dom.pgpOverlay.setAttribute('aria-hidden', 'true');
	}

	/* -------------------------------------------------------- effects */

	function pulseClass(node, cls, ms) {
		node.classList.add(cls);
		setTimeout(() => node.classList.remove(cls), ms);
	}

	function animatePoemLines() {
		if (prefersReducedMotion) return;
		dom.asciiContainer.querySelectorAll('.poem-text').forEach((node, i) => {
			setTimeout(() => pulseClass(node, 'breath', 1400), i * 160);
		});
	}

	function scheduleEffects() {
		if (prefersReducedMotion) return;
		clearEffectTimers();

		// a much quieter rotation of cues than the old CRT storm
		const cues = [
			{ run: () => pulseClass(dom.asciiContainer, 'flicker', 1400), min: 22000, max: 42000 },
			{ run: () => pulseClass(dom.asciiContainer, 'breath',  3000), min: 26000, max: 50000 }
		];
		cues.forEach(schedule);
	}

	function schedule(cue) {
		const delay = cue.min + Math.random() * (cue.max - cue.min);
		const id = setTimeout(() => {
			if (!dom.pgpOverlay.classList.contains('visible')) cue.run();
			schedule(cue);
		}, delay);
		state.effectTimers.push(id);
	}

	function clearEffectTimers() {
		state.effectTimers.forEach(clearTimeout);
		state.effectTimers = [];
	}

	function restartIdleTimer() {
		clearTimeout(state.idleTimer);
		dom.asciiContainer.classList.remove('drift');
		state.idleTimer = setTimeout(() => {
			pulseClass(dom.asciiContainer, 'drift', 8000);
		}, 32000);
	}

	/* -------------------------------------------------------- events */

	function bindGlobalEvents() {
		window.addEventListener('resize', debounce(() => {
			const wasMobile = state.isMobile;
			state.isMobile = window.innerWidth <= 768;
			configureCanvas();
			renderSection(true);
			if (dom.pgpOverlay.classList.contains('visible')) showPgpKey();
			if (wasMobile !== state.isMobile) restartIdleTimer();
		}, 180));

		dom.asciiContainer.addEventListener('click', (e) => {
			const target = e.target.closest('.pgp-link');
			if (!target) return;
			e.preventDefault();
			showPgpKey();
		});

		dom.pgpOverlay.addEventListener('click', (e) => {
			if (e.target === dom.pgpOverlay) hidePgpKey();
		});

		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') hidePgpKey();
		});

		document.addEventListener('visibilitychange', () => {
			if (document.hidden) {
				clearEffectTimers();
			} else {
				scheduleEffects();
				restartIdleTimer();
			}
		});

		['mousemove', 'keydown', 'click', 'touchstart'].forEach((evt) => {
			document.addEventListener(evt, restartIdleTimer, { passive: true });
		});
	}

	function debounce(fn, wait) {
		let t;
		return function (...args) {
			clearTimeout(t);
			t = setTimeout(() => fn.apply(this, args), wait);
		};
	}
})();
