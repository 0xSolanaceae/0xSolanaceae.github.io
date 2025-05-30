let currentSection = 'welcome';
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
    
    if (currentSection === 'ai') {
      element.classList.add('ai-section');
    } else {
      element.classList.remove('ai-section');
    }
    
    const sections = isMobileView ? mobileSections : portfolioSections;
    AsciiMorph.render(sections[currentSection]);
  }
  
  if (prevMobileState !== isMobileView && document.querySelector('.pgp-key-container').classList.contains('visible')) {
    showPgpKey();
  }
  
  return isMobileView;
}

function updateCanvasDimensions() {
  const isAiSection = currentSection === 'ai';
  const dimensions = isMobileView ? 
    (isAiSection ? {x: 30, y: 40} : {x: 30, y: 20}) : 
    {x: 70, y: 30};
  
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

buttonLabels.forEach((label, index) => {
  const btn = document.createElement('pre');
  btn.className = 'nav-button';
  if (index === 4) {
    btn.className = 'nav-button glitch-button';
    btn.innerHTML = `[${label}]`;
  } else {
    btn.innerHTML = `[${label}]`;
  }
  btn.onclick = () => navigateToSection(index);
  navButtons.appendChild(btn);
});

const glitchButton = document.querySelector('.glitch-button');
let glitchTimer = null;

navButtons.addEventListener('mouseenter', () => {
  if (glitchButton) {
    const flickerChance = Math.random();
    if (flickerChance > 0.7) {
      glitchButton.classList.add('force-visible');
      setTimeout(() => {
        glitchButton.classList.remove('force-visible');
      }, 150 + Math.random() * 300);
    }
  }
});

navButtons.addEventListener('mouseleave', () => {
  if (glitchButton) {
    glitchButton.classList.remove('force-visible');
  }
});

function randomGlitchAppearance() {
  if (glitchButton && !document.querySelector('.pgp-key-container').classList.contains('visible')) {
    const rand = Math.random();
    if (rand > 0.75) { 
      glitchButton.classList.add('force-visible');
      setTimeout(() => {
        glitchButton.classList.remove('force-visible');
      }, Math.random() * 500 + 200);
    }
  }
  
  setTimeout(randomGlitchAppearance, Math.random() * 5000 + 3000);
}

setTimeout(randomGlitchAppearance, 5000);

function navigateToSection(index) {
  currentIndex = index;
  const sectionKey = sectionsOrder[index];
  
  element.classList.add('morph-transition');
  
  element.classList.remove('ai-section');
  
  document.body.classList.remove('ai-active-body');
  
  if (sectionKey === 'ai') {
    element.classList.add('ai-section');
    document.body.classList.add('ai-active-body');
  }
  
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
      
      if (i === 4) {
        btn.classList.add('ai-active');
        btn.classList.add('force-visible');
      }
    } else {
      btn.classList.remove('active');
      btn.style.color = '#3c3836';
      
      if (i === 4) {
        btn.classList.remove('ai-active');
        if (currentIndex !== 4) {
          btn.classList.remove('force-visible');
        }
      }
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
    const style = document.createElement('style');
    style.textContent = `
      .box-line {
        letter-spacing: -0.5px;
        white-space: nowrap;
        display: inline-block;
        width: auto !important;
        font-family: 'Courier New', monospace;
      }
      .box-content {
        display: inline-block;
        padding: 0 8px;
        width: auto !important;
        white-space: nowrap;
        line-height: 1.2;
        font-family: 'Courier New', monospace;
      }
      @media (max-width: 480px) {
        .box-line {
          letter-spacing: -1px;
        }
      }
    `;
    document.head.appendChild(style);
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
