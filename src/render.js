var element = document.querySelector('.morph-section');
AsciiMorph(element, {x: 70, y: 30});

const mobileSections = {
  welcome: [
    "",
    "<span class='title-text mobile-text'>SOLANACEAE</span>",
    "",
    "<span class='center-item mobile-text'>═══════════════</span>",
    "",
    "<span class='center-item mobile-text'>┌─────────────┐</span>",
    "<span class='center-item mobile-text'>│  security   │</span>",
    "<span class='center-item mobile-text'>│  engineer   │</span>",
    "<span class='center-item mobile-text'>└─────────────┘</span>",
    "",
  ],
  
  pgp: [
    "<span class='center-item mobile-text'>┌─────────────┐</span>",
    "<span class='center-item mobile-text'>│     PGP     │</span>",
    "<span class='center-item mobile-text'>└─────────────┘</span>",
    "<span class='center-item mobile-text'>░░░▒▒▓▓▓▓▓▓▓▒▒░░░</span>",
    "<span class='center-item mobile-text pgp-link'>[VIEW KEY]</span>",
    "<span class='center-item mobile-text'>░░░▒▒▓▓▓▓▓▓▓▒▒░░░</span>",
    "",
  ],
  
  projects: [
    "<span class='center-item mobile-text'>┌─────────────┐</span>",
    "<span class='center-item mobile-text'>│  PROJECTS   │</span>",
    "<span class='center-item mobile-text'>└─────────────┘</span>",
    "<span class='center-item mobile-text'>░░░▒▒▓▓▓▓▓▓▓▒▒░░░</span>",
    "<span class='center-item mobile-text'><a href='https://github.com/0xSolanaceae/proXXy' target='_blank'>://proXXy</a></span>",
    "<span class='center-item mobile-text'><a href='https://github.com/0xSolanaceae/discord-imhex' target='_blank'>://discord-imhex</a></span>",
    "<span class='center-item mobile-text'><a href='https://github.com/0xSolanaceae/TypeLapse' target='_blank'>://TypeLapse</a></span>",
    "<span class='center-item mobile-text'>░░░▒▒▓▓▓▓▓▓▓▒▒░░░</span>",
    "",
  ],
  
  contact: [
    "<span class='center-item mobile-text'>┌─────────────┐</span>",
    "<span class='center-item mobile-text'>│   CONTACT   │</span>",
    "<span class='center-item mobile-text'>└─────────────┘</span>",
    "<span class='center-item mobile-text'>░░░▒▒▓▓▓▓▓▓▓▒▒░░░</span>",
    "<span class='center-item mobile-text'><a href='mailto:solanaceae@duck.com'>solanaceae@duck.com</a></span>",
    "<span class='center-item mobile-text'><a href='https://discordapp.com/users/1098339239432835162' target='_blank'>discord://0x_Solanaceae</a></span>",
    "<span class='center-item mobile-text'><a href='https://github.com/0xSolanaceae' target='_blank'>github.com/0xSolanaceae</a></span>",
    "<span class='center-item mobile-text'>░░░▒▒▓▓▓▓▓▓▓▒▒░░░</span>",
    "",
  ],
};

const portfolioSections = {
  welcome: [
    "",
    "<span class='center-item'>███████  ██████  ██       █████  ███    ██  █████   ██████ ███████  █████  ███████ </span>",
    "<span class='center-item'>██      ██    ██ ██      ██   ██ ████   ██ ██   ██ ██      ██      ██   ██ ██      </span>",
    "<span class='center-item'>███████ ██    ██ ██      ███████ ██ ██  ██ ███████ ██      █████   ███████ █████   </span>",
    "<span class='center-item'>     ██ ██    ██ ██      ██   ██ ██  ██ ██ ██   ██ ██      ██      ██   ██ ██      </span>",
    "<span class='center-item'>███████  ██████  ███████ ██   ██ ██   ████ ██   ██  ██████ ███████ ██   ██ ███████ </span>",
    "",
    "<span class='center-item'>═════════════════════════════════════════════════════════════════════════════════════════</span>",
    "",
    "<span class='center-item'>┌───────────────────┐</span>",
    "<span class='center-item'>│ security engineer │</span>",
    "<span class='center-item'>└───────────────────┘</span>",
    "",
  ],

  pgp: [
    "<span class='center-item'>┌────────────────────────────────────────────────────────────────────┐</span>",
    "<span class='center-item'>│                                PGP                                 │</span>",
    "<span class='center-item'>└────────────────────────────────────────────────────────────────────┘</span>",
    "",
    "",
    "<span class='center-item'>▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓</span>",
    "",
    "",
    "<span class='center-item'><span class='pgp-link'>[VIEW PUBLIC KEY]</span></span>",
    "",
    "",
    "<span class='center-item'>▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓</span>",
    "",
  ],

  projects: [
    "<span class='center-item'>┌────────────────────────────────────────────────────────────────────┐</span>",
    "<span class='center-item'>│                              PROJECTS                              │</span>",
    "<span class='center-item'>└────────────────────────────────────────────────────────────────────┘</span>",
    "",
    "",
    "<span class='center-item'>░░░░░░░▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒░░░░░░░</span>",
    "",
    "<span class='center-item'><a href='https://github.com/0xSolanaceae/proXXy' target='_blank'>://proXXy</a></span>",
    "<span class='center-item'>A super simple asynchronous multithreaded proxy scraper</span>",
    "",
    "<span class='center-item'><a href='https://github.com/0xSolanaceae/discord-imhex' target='_blank'>://discord-imhex</a></span>",
    "<span class='center-item'>A discord rich presence client for ImHex, not reliant on the ImHex API</span>",
    "",
    "<span class='center-item'><a href='https://github.com/0xSolanaceae/TypeLapse' target='_blank'>://TypeLapse</a></span>",
    "<span class='center-item'>Simulates slow, natural typing to automatically generate content in Google Docs over time</span>",
    "",
    "<span class='center-item'>░░░░░░░▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒░░░░░░░</span>",
    "",
  ],

  contact: [
    "<span class='center-item'>┌────────────────────────────────────────────────────────────────────┐</span>",
    "<span class='center-item'>│                              CONTACT                               │</span>",
    "<span class='center-item'>└────────────────────────────────────────────────────────────────────┘</span>",
    "",
    "",
    "<span class='center-item'>░░░░░░░▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒░░░░░░░</span>",
    "",
    "<span class='center-item'><a href='mailto:solanaceae@duck.com'>solanaceae@duck.com</a></span>",
    "<span class='center-item'><a href='https://discordapp.com/users/1098339239432835162' target='_blank'>discord://0x_Solanaceae</a></span>",
    "<span class='center-item'><a href='https://github.com/0xSolanaceae' target='_blank'>github.com/0xSolanaceae</a></span>",
    "",
    "<span class='center-item'>░░░░░░░▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒░░░░░░░</span>",
    "",
  ],
};

const pgpKey = `-----BEGIN PGP PUBLIC KEY BLOCK-----

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
5BBSnl1FeC3Qjjcohz5ZYQolY2HYEQYtdaVq
=VBr2
-----END PGP PUBLIC KEY BLOCK-----
`;

let currentSection = 'welcome';
const sectionsOrder = ['welcome', 'projects', 'pgp', 'contact'];
let currentIndex = 0;
let idleTimer = null;
let idleState = false;
let lastScrollPosition = 0;
let hasPgpKeyBeenViewed = false;
let isMobileView = false;

function checkMobileView() {
  const width = window.innerWidth;
  const prevMobileState = isMobileView;
  
  isMobileView = width <= 768;
  
  if (prevMobileState !== isMobileView && currentSection) {
    updateCanvasDimensions();
    
    const sections = isMobileView ? mobileSections : portfolioSections;
    AsciiMorph.render(sections[currentSection]);
  }
  
  if (prevMobileState !== isMobileView && document.querySelector('.pgp-key-container').classList.contains('visible')) {
    showPgpKey();
  }
  
  return isMobileView;
}

function updateCanvasDimensions() {
  const dimensions = isMobileView ? {x: 30, y: 20} : {x: 70, y: 30};
  
  element.style.textAlign = 'center';
  element.style.width = '100%';
  
  AsciiMorph(element, dimensions);
  
  if (isMobileView) {
    element.classList.add('mobile-centered');
    document.body.classList.add('mobile-view');
  } else {
    element.classList.remove('mobile-centered');
    document.body.classList.remove('mobile-view');
  }
}

const navButtons = document.getElementById('nav-buttons');
const buttonLabels = ['Home', 'Projects', 'PGP', 'Contact'];

buttonLabels.forEach((label, index) => {
  const btn = document.createElement('pre');
  btn.className = 'nav-button';
  btn.innerHTML = `[${label}]`;
  btn.onclick = () => navigateToSection(index);
  navButtons.appendChild(btn);
});

function navigateToSection(index) {
  currentIndex = index;
  const sectionKey = sectionsOrder[index];
  
  element.classList.add('morph-transition');
  
  const sections = isMobileView ? mobileSections : portfolioSections;
  
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  AsciiMorph.morph(sections[sectionKey]);
  
  currentSection = sectionKey;
  updateButtonStates();
  resetIdleTimer();
  
  setTimeout(() => {
    element.classList.remove('morph-transition');
  }, 1000);
}

function updateButtonStates() {
  document.querySelectorAll('.nav-button').forEach((btn, i) => {
    if (i === currentIndex) {
      btn.classList.add('active');
      btn.style.color = '#d65d0e';
    } else {
      btn.classList.remove('active');
      btn.style.color = '#3c3836';
    }
  });
}

function showPgpKey() {
  const pgpKeyContainer = document.querySelector('.pgp-key-container');
  const pgpKeyElement = document.querySelector('.pgp-key');
  const navButtons = document.getElementById('nav-buttons');
  
  if (isMobileView) {
    const formattedKey = pgpKey.replace(/\n/g, '').replace(/-----BEGIN PGP PUBLIC KEY BLOCK-----/g, '-----BEGIN PGP PUBLIC KEY BLOCK-----\n\n')
      .replace(/-----END PGP PUBLIC KEY BLOCK-----/g, '\n\n-----END PGP PUBLIC KEY BLOCK-----');
    pgpKeyElement.textContent = formattedKey;
    pgpKeyElement.classList.add('mobile-pgp-key');
  } else {
    pgpKeyElement.textContent = pgpKey;
    pgpKeyElement.classList.remove('mobile-pgp-key');
  }
  
  pgpKeyContainer.classList.add('visible');
  hasPgpKeyBeenViewed = true;
  
  navButtons.style.display = 'none';
  
  pgpKeyElement.style.userSelect = 'text';
  pgpKeyElement.style.webkitUserSelect = 'text';
  pgpKeyElement.style.msUserSelect = 'text';
  
  if (isMobileView) {
    pgpKeyContainer.classList.add('mobile-view');
  } else {
    pgpKeyContainer.classList.remove('mobile-view');
  }
}

function hidePgpKey() {
  const pgpKeyContainer = document.querySelector('.pgp-key-container');
  const navButtons = document.getElementById('nav-buttons');
  
  pgpKeyContainer.classList.remove('visible');
  pgpKeyContainer.classList.remove('mobile-view');
  
  navButtons.style.display = 'block';
}

function copyPgpKey() {
  navigator.clipboard.writeText(pgpKey).then(() => {
    const copyBtn = document.querySelector('.copy-pgp-btn');
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    copyBtn.classList.add('copied');
    
    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.classList.remove('copied');
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy: ', err);
  });
}

document.querySelector('.pgp-key-container').addEventListener('click', (e) => {
  if (e.target === document.querySelector('.pgp-key-container')) {
    hidePgpKey();
  }
});

function resetIdleTimer() {
  clearTimeout(idleTimer);
  if (idleState) {
    idleState = false;
    element.classList.remove('drift');
  }
  
  idleTimer = setTimeout(() => {
    idleState = true;
    element.classList.add('drift');
    
    const flickerChance = Math.random();
    if (flickerChance > 0.7) {
      element.classList.add('flicker');
      setTimeout(() => {
        element.classList.remove('flicker');
      }, 4000);
    }
  }, 10000);
}

document.addEventListener('mousemove', resetIdleTimer);
document.addEventListener('keydown', resetIdleTimer);
document.addEventListener('click', (e) => {
  resetIdleTimer();
  
  if (e.target.classList.contains('pgp-link') || 
      (e.target.parentElement && e.target.parentElement.classList.contains('pgp-link'))) {
    showPgpKey();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    currentIndex = (currentIndex + 1) % sectionsOrder.length;
    navigateToSection(currentIndex);
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    currentIndex = (currentIndex - 1 + sectionsOrder.length) % sectionsOrder.length;
    navigateToSection(currentIndex);
  } else if (e.key === 'Escape') {
    hidePgpKey();
  }
});

function setTimeBasedEffects() {
  const now = new Date();
  const hour = now.getHours();
  
  if (hour >= 20 || hour < 6) {
    document.body.style.setProperty('--bg', '#f2e5bc');
    document.body.style.setProperty('--fg', '#504945');
  } else {
    document.body.style.setProperty('--bg', '#fbf1c7');
    document.body.style.setProperty('--fg', '#3c3836');
  }
  
  setTimeout(setTimeBasedEffects, 60 * 60 * 1000);
}

function randomFlicker() {
  if (document.querySelector('.pgp-key-container').classList.contains('visible')) {
    setTimeout(randomFlicker, Math.random() * 10000 + 15000);
    return;
  }
  
  const rand = Math.random();
  if (rand > 0.7) {
    element.classList.add('flicker');
    setTimeout(() => {
      element.classList.remove('flicker');
    }, 2000);
  }
  
  setTimeout(randomFlicker, Math.random() * 20000 + 15000);
}

function init() {
  checkMobileView();
  
  element.style.textAlign = 'center';
  element.style.width = '100%';
  
  const sections = isMobileView ? mobileSections : portfolioSections;
  AsciiMorph.render(sections.welcome);
  
  updateButtonStates();
  
  if (isMobileView) {
    element.classList.add('mobile-centered');
  }
  
  resetIdleTimer();
  
  setTimeBasedEffects();
  
  setTimeout(randomFlicker, 10000);
  
  document.querySelector('.pgp-key').textContent = pgpKey;
  
  document.addEventListener('selectstart', function(e) {
    if (!e.target.closest('.pgp-key')) {
      e.preventDefault();
    }
  });
  
  window.addEventListener('resize', debounce(function() {
    checkMobileView();
  }, 250));
}

function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(function() {
      func.apply(context, args);
    }, wait);
  };
}

init();