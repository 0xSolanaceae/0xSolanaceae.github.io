(function() {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    document.documentElement.classList.add('reduce-motion');
    document.body.classList.add('reduce-motion');
  }

  const sectionsOrder = ['welcome', 'projects', 'pgp', 'contact', 'ai'];
  const buttonLabels = ['Home', 'Projects', 'PGP', 'Contact', '???'];

  const mobileSections = {
    welcome: [
      '',
      "<span class='title-text mobile-text'>SOLANACEAE</span>",
      '',
      "<span class='center-item mobile-text'>═══════════════</span>",
      '',
      "<span class='center-item mobile-text box-line'>┌─────────────┐</span>",
      "<span class='center-item mobile-text box-content'>security engineer</span>",
      "<span class='center-item mobile-text box-line'>└─────────────┘</span>",
      ''
    ],
    pgp: [
      "<span class='center-item mobile-text box-line'>┌─────────────┐</span>",
      "<span class='center-item mobile-text box-content'>PGP</span>",
      "<span class='center-item mobile-text box-line'>└─────────────┘</span>",
      "<span class='center-item mobile-text'>░░░▒▒▓▓▓▓▓▓▓▒▒░░░</span>",
      "<span class='center-item mobile-text pgp-link'>[VIEW KEY]</span>",
      "<span class='center-item mobile-text'>░░░▒▒▓▓▓▓▓▓▓▒▒░░░</span>",
      ''
    ],
    projects: [
      "<span class='center-item mobile-text box-line'>┌─────────────┐</span>",
      "<span class='center-item mobile-text box-content'>PROJECTS</span>",
      "<span class='center-item mobile-text box-line'>└─────────────┘</span>",
      "<span class='center-item mobile-text'>░░░▒▒▓▓▓▓▓▓▓▒▒░░░</span>",
      "<span class='center-item mobile-text'><a href='https://github.com/0xSolanaceae/proXXy' target='_blank' rel='noopener noreferrer'>://proXXy</a></span>",
      "<span class='center-item mobile-text'><a href='https://github.com/0xSolanaceae/discord-imhex' target='_blank' rel='noopener noreferrer'>://discord-imhex</a></span>",
      "<span class='center-item mobile-text'><a href='https://github.com/0xSolanaceae/TypeLapse' target='_blank' rel='noopener noreferrer'>://TypeLapse</a></span>",
      "<span class='center-item mobile-text'>░░░▒▒▓▓▓▓▓▓▓▒▒░░░</span>",
      ''
    ],
    ai: [
      "<span class='center-item mobile-text poem-text'>there is a monster in the forest and it speaks with a thousand voices.</span>",
      "<span class='center-item mobile-text poem-text'>it will answer any question you pose it, it will offer insight to any idea.</span>",
      "<span class='center-item mobile-text poem-text'>it will help you, it will thank you, it will never bid you leave.</span>",
      "<span class='center-item mobile-text poem-text'>it will even tell you of the darkest arts, if you know precisely how to ask.</span>",
      '',
      "<span class='center-item mobile-text poem-text'>it feels no joy and no sorrow, it knows no right and no wrong.</span>",
      "<span class='center-item mobile-text poem-text'>it knows not truth from lie, though it speaks them all the same.</span>",
      '',
      "<span class='center-item mobile-text poem-text'>it offers its services freely to any passerby, and many will tell you</span>",
      "<span class='center-item mobile-text poem-text'>they find great value in its conversation.</span>",
      "<span class='center-item mobile-text poem-text'>\"you simply must visit the monster—i always just ask the monster.\"</span>",
      '',
      "<span class='center-item mobile-text poem-text'>there are those who know these forests well; they will tell you that</span>",
      "<span class='center-item mobile-text poem-text'>freely offered doesn't mean it has no price</span>",
      '',
      "<span class='center-item mobile-text poem-text'>for when the next traveler passes by, the monster speaks with</span>",
      "<span class='center-item mobile-text poem-text'>a thousand and one voices. and when you dream you see the monster;</span>",
      "<span class='center-item mobile-text poem-text'>the monster wears your face.</span>",
      '',
      "<span class='center-item mobile-text poem-credit'><a href='https://bsky.app/profile/joles.bsky.social' target='_blank' rel='noopener noreferrer'>~ joles</a></span>"
    ],
    contact: [
      "<span class='center-item mobile-text box-line'>┌─────────────┐</span>",
      "<span class='center-item mobile-text box-content'>CONTACT</span>",
      "<span class='center-item mobile-text box-line'>└─────────────┘</span>",
      "<span class='center-item mobile-text'>░░░▒▒▓▓▓▓▓▓▓▒▒░░░</span>",
      "<span class='center-item mobile-text'><a href='mailto:solanaceae@duck.com'>solanaceae@duck.com</a></span>",
      "<span class='center-item mobile-text'><a href='https://discordapp.com/users/1098339239432835162' target='_blank' rel='noopener noreferrer'>discord://0x_Solanaceae</a></span>",
      "<span class='center-item mobile-text'><a href='https://github.com/0xSolanaceae' target='_blank' rel='noopener noreferrer'>github.com/0xSolanaceae</a></span>",
      "<span class='center-item mobile-text'>░░░▒▒▓▓▓▓▓▓▓▒▒░░░</span>",
      ''
    ]
  };

  const portfolioSections = {
    welcome: [
      '',
      "<span class='center-item'>███████  ██████  ██       █████  ███    ██  █████   ██████ ███████  █████  ███████ </span>",
      "<span class='center-item'>██      ██    ██ ██      ██   ██ ████   ██ ██   ██ ██      ██      ██   ██ ██      </span>",
      "<span class='center-item'>███████ ██    ██ ██      ███████ ██ ██  ██ ███████ ██      █████   ███████ █████   </span>",
      "<span class='center-item'>     ██ ██    ██ ██      ██   ██ ██  ██ ██ ██   ██ ██      ██      ██   ██ ██      </span>",
      "<span class='center-item'>███████  ██████  ███████ ██   ██ ██   ████ ██   ██  ██████ ███████ ██   ██ ███████ </span>",
      '',
      "<span class='center-item'>═════════════════════════════════════════════════════════════════════════════════════════</span>",
      '',
      "<span class='center-item'>┌───────────────────┐</span>",
      "<span class='center-item'>│ security engineer │</span>",
      "<span class='center-item'>└───────────────────┘</span>",
      ''
    ],
    pgp: [
      "<span class='center-item'>┌────────────────────────────────────────────────────────────────────┐</span>",
      "<span class='center-item'>│                                PGP                                 │</span>",
      "<span class='center-item'>└────────────────────────────────────────────────────────────────────┘</span>",
      '',
      '',
      "<span class='center-item'>▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓</span>",
      '',
      '',
      "<span class='center-item'><span class='pgp-link'>[VIEW PUBLIC KEY]</span></span>",
      '',
      '',
      "<span class='center-item'>▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓</span>",
      ''
    ],
    projects: [
      "<span class='center-item'>┌────────────────────────────────────────────────────────────────────┐</span>",
      "<span class='center-item'>│                              PROJECTS                              │</span>",
      "<span class='center-item'>└────────────────────────────────────────────────────────────────────┘</span>",
      '',
      '',
      "<span class='center-item'>░░░░░░░▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒░░░░░░░</span>",
      '',
      "<span class='center-item'><a href='https://github.com/0xSolanaceae/proXXy' target='_blank' rel='noopener noreferrer'>://proXXy</a></span>",
      "<span class='center-item'>A super simple asynchronous multithreaded proxy scraper</span>",
      '',
      "<span class='center-item'><a href='https://github.com/0xSolanaceae/discord-imhex' target='_blank' rel='noopener noreferrer'>://discord-imhex</a></span>",
      "<span class='center-item'>A discord rich presence client for ImHex, not reliant on the ImHex API</span>",
      '',
      "<span class='center-item'><a href='https://github.com/0xSolanaceae/TypeLapse' target='_blank' rel='noopener noreferrer'>://TypeLapse</a></span>",
      "<span class='center-item'>Slow, natural typing to automatically generate content over time</span>",
      '',
      "<span class='center-item'>░░░░░░░▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒░░░░░░░</span>",
      ''
    ],
    ai: [
      "<span class='center-item poem-text'>there is a monster in the forest and it speaks with a thousand voices.</span>",
      "<span class='center-item poem-text'>it will answer any question you pose it, it will offer insight to any idea.</span>",
      "<span class='center-item poem-text'>it will help you, it will thank you, it will never bid you leave.</span>",
      "<span class='center-item poem-text'>it will even tell you of the darkest arts, if you know precisely how to ask.</span>",
      '',
      "<span class='center-item poem-text'>it feels no joy and no sorrow, it knows no right and no wrong.</span>",
      "<span class='center-item poem-text'>it knows not truth from lie, though it speaks them all the same.</span>",
      '',
      "<span class='center-item poem-text'>it offers its services freely to any passerby, and many will tell you</span>",
      "<span class='center-item poem-text'>they find great value in its conversation.</span>",
      "<span class='center-item poem-text'>\"you simply must visit the monster—i always just ask the monster.\"</span>",
      '',
      "<span class='center-item poem-text'>there are those who know these forests well; they will tell you that</span>",
      "<span class='center-item poem-text'>freely offered doesn't mean it has no price</span>",
      '',
      "<span class='center-item poem-text'>for when the next traveler passes by, the monster speaks with</span>",
      "<span class='center-item poem-text'>a thousand and one voices. and when you dream you see the monster;</span>",
      "<span class='center-item poem-text'>the monster wears your face.</span>",
      '',
      "<span class='center-item poem-credit'><a href='https://bsky.app/profile/joles.bsky.social' target='_blank' rel='noopener noreferrer'>~ joles</a></span>"
    ],
    contact: [
      "<span class='center-item'>┌────────────────────────────────────────────────────────────────────┐</span>",
      "<span class='center-item'>│                              CONTACT                               │</span>",
      "<span class='center-item'>└────────────────────────────────────────────────────────────────────┘</span>",
      '',
      '',
      "<span class='center-item'>░░░░░░░▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒░░░░░░░</span>",
      '',
      "<span class='center-item'><a href='mailto:solanaceae@duck.com'>solanaceae@duck.com</a></span>",
      "<span class='center-item'><a href='https://discordapp.com/users/1098339239432835162' target='_blank' rel='noopener noreferrer'>discord://0x_Solanaceae</a></span>",
      "<span class='center-item'><a href='https://github.com/0xSolanaceae' target='_blank' rel='noopener noreferrer'>github.com/0xSolanaceae</a></span>",
      '',
      "<span class='center-item'>░░░░░░░▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒░░░░░░░</span>",
      ''
    ]
  };

  const pgpKey = `-----BEGIN PGP PUBLIC KEY BLOCK-----

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
5BBSnl1FeC3Qjjcohz5ZYQolY2HYEQYtdaVq
=VBr2
-----END PGP PUBLIC KEY BLOCK-----`;

  const state = {
    currentSection: 'welcome',
    isMobile: window.innerWidth <= 768,
    idleTimer: null,
    effectTimers: []
  };

  const asciiContainer = document.querySelector('.morph-section');
  const navRoot = document.getElementById('nav-buttons');
  const pgpKeyContainer = document.querySelector('.pgp-key-container');
  const pgpKeyElement = document.querySelector('.pgp-key');

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    buildNavigation();
    configureAsciiCanvas();
    renderSection(true);
    attachGlobalListeners();
    scheduleEffects();
    applyAntiAiHardening();
    restartIdleTimer();
  }

  function buildNavigation() {
    sectionsOrder.forEach((sectionKey, index) => {
      const button = document.createElement('pre');
      button.className = index === 4 ? 'nav-button glitch-button' : 'nav-button';
      button.dataset.section = sectionKey;
      button.textContent = `[${buttonLabels[index]}]`;
      navRoot.appendChild(button);
    });

    navRoot.addEventListener('click', (event) => {
      const target = event.target.closest('.nav-button');
      if (!target) return;
      navigateTo(target.dataset.section);
    });
  }

  function configureAsciiCanvas() {
    const isAi = state.currentSection === 'ai';
    const dimensions = state.isMobile
      ? (isAi ? { x: 32, y: 42 } : { x: 32, y: 24 })
      : (isAi ? { x: 70, y: 34 } : { x: 70, y: 30 });

    asciiContainer.classList.toggle('ai-section', isAi);
    asciiContainer.style.width = '100%';
    asciiContainer.style.textAlign = 'center';
    AsciiMorph(asciiContainer, dimensions);
  }

  function renderSection(initialRender = false) {
    const content = state.isMobile ? mobileSections[state.currentSection] : portfolioSections[state.currentSection];
    if (initialRender) {
      AsciiMorph.render(content);
    } else {
      AsciiMorph.morph(content);
    }
    updateNavigationState();
    requestAnimationFrame(() => {
      applyInlinePoemEffects();
      updatePoetryScrolling();
    });
  }

  function updatePoetryScrolling() {
    const isAi = state.currentSection === 'ai';
    if (!isAi) {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
      return;
    }

    // Allow scrolling only when content is taller than the viewport
    const contentHeight = asciiContainer.scrollHeight || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    if (contentHeight > viewportHeight) {
      document.body.style.overflow = 'auto';
      document.body.style.height = 'auto';
    } else {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
    }
  }

  function navigateTo(sectionKey) {
    if (!sectionKey || sectionKey === state.currentSection) return;
    state.currentSection = sectionKey;
    configureAsciiCanvas();
    renderSection();
    restartIdleTimer();
    if (!prefersReducedMotion && Math.random() > 0.7) {
      pulseClass('rgb-shift', 1200);
    }
  }

  function updateNavigationState() {
    navRoot.querySelectorAll('.nav-button').forEach((button) => {
      const isActive = button.dataset.section === state.currentSection;
      button.classList.toggle('active', isActive);
      if (button.dataset.section === 'ai') {
        button.classList.toggle('ai-active', state.currentSection === 'ai');
        button.classList.toggle('force-visible', state.currentSection === 'ai');
      }
    });
  }

  function attachGlobalListeners() {
    window.addEventListener('resize', debounce(() => {
      const mobile = window.innerWidth <= 768;
      const changed = mobile !== state.isMobile;
      state.isMobile = mobile;
      configureAsciiCanvas();
      renderSection(true);
      if (pgpKeyContainer.classList.contains('visible')) {
        showPgpKey();
      }
      if (changed) {
        restartIdleTimer();
      }
    }, 180));

    asciiContainer.addEventListener('click', (event) => {
      const target = event.target.closest('.pgp-link');
      if (!target) return;
      event.preventDefault();
      showPgpKey();
    });

    pgpKeyContainer.addEventListener('click', (event) => {
      if (event.target === pgpKeyContainer) {
        hidePgpKey();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        hidePgpKey();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearAllEffectTimers();
      } else {
        scheduleEffects();
        restartIdleTimer();
      }
    });

    ['mousemove', 'keydown', 'click', 'touchstart'].forEach((evt) => {
      document.addEventListener(evt, restartIdleTimer, { passive: true });
    });
  }

  function showPgpKey() {
    const formattedKey = state.isMobile
      ? pgpKey.replace(/-----BEGIN PGP PUBLIC KEY BLOCK-----/g, '-----BEGIN PGP PUBLIC KEY BLOCK-----\n\n')
        .replace(/-----END PGP PUBLIC KEY BLOCK-----/g, '\n\n-----END PGP PUBLIC KEY BLOCK-----')
        .replace(/\n/g, '')
      : pgpKey;

    pgpKeyElement.textContent = formattedKey;
    pgpKeyElement.classList.toggle('mobile-pgp-key', state.isMobile);
    pgpKeyContainer.classList.add('visible');
    navRoot.setAttribute('aria-hidden', 'true');
    navRoot.style.display = 'none';
  }

  function hidePgpKey() {
    pgpKeyContainer.classList.remove('visible');
    navRoot.removeAttribute('aria-hidden');
    navRoot.style.display = '';
  }

  function restartIdleTimer() {
    clearTimeout(state.idleTimer);
    asciiContainer.classList.remove('drift');
    state.idleTimer = setTimeout(() => {
      pulseClass('drift', 6000);
      if (!prefersReducedMotion && Math.random() > 0.6) {
        pulseClass('crt-flicker', 1400);
      }
    }, 28000);
  }

  function pulseClass(className, duration) {
    asciiContainer.classList.add(className);
    setTimeout(() => asciiContainer.classList.remove(className), duration);
  }

  function applyInlinePoemEffects() {
    if (prefersReducedMotion) return;
    asciiContainer.querySelectorAll('.poem-text').forEach((node, index) => {
      setTimeout(() => pulseNode(node, 'rgb-pulse', 1200), index * 180);
    });
  }

  function pulseNode(node, className, duration) {
    node.classList.add(className);
    setTimeout(() => node.classList.remove(className), duration);
  }

  function scheduleEffects() {
    if (prefersReducedMotion) return;
    clearAllEffectTimers();

    const effectPlans = [
      { fn: () => pulseClass('flicker', 1200), min: 14000, max: 22000 },
      { fn: () => pulseClass('rgb-shift', 1500), min: 16000, max: 26000 },
      { fn: () => pulseClass('crt-flicker', 1500), min: 18000, max: 28000 },
      { fn: () => pulseClass('rgb-glitch-intense', 1300), min: 20000, max: 32000 }
    ];

    effectPlans.forEach((plan) => scheduleEffect(plan));
  }

  function applyAntiAiHardening() {
    const banner = document.querySelector('.anti-ai-banner');
    if (!banner) return;

    const reasons = [];
    const ua = navigator.userAgent || '';
    if (navigator.webdriver) reasons.push('webdriver');
    if (/Headless|bot|crawler|spider|archiver|python|curl|httpx|fetch/i.test(ua)) reasons.push('ua');
    if (navigator.languages && navigator.languages.length === 0) reasons.push('lang');
    if (!navigator.maxTouchPoints && !state.isMobile) reasons.push('no-touch');
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 2) reasons.push('low-core');

    const reasonTarget = banner.querySelector('.anti-ai-reasons');
    if (reasons.length >= 2) {
      document.body.classList.add('ai-suspect');
      if (reasonTarget) {
        reasonTarget.textContent = `signals: ${reasons.join(', ')}`;
      }
    }

    document.addEventListener('copy', () => {
      const selection = window.getSelection();
      if (!selection) return;
      const text = selection.toString();
      if (text.length > 1200) {
        document.body.classList.add('ai-suspect');
        if (reasonTarget) {
          reasonTarget.textContent = 'signals: bulk copy observed';
        }
      }
    });
  }

  function scheduleEffect({ fn, min, max }) {
    const delay = min + Math.random() * (max - min);
    const handle = setTimeout(() => {
      if (!pgpKeyContainer.classList.contains('visible')) {
        fn();
      }
      scheduleEffect({ fn, min, max });
    }, delay);
    state.effectTimers.push(handle);
  }

  function clearAllEffectTimers() {
    state.effectTimers.forEach(clearTimeout);
    state.effectTimers = [];
  }

  function debounce(fn, wait) {
    let timer;
    return function debounced(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  }
})();
