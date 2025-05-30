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
    const flickerChance = Math.random();    if (flickerChance > 0.6) {
      glitchButton.classList.add('force-visible');
      
      if (flickerChance > 0.85) {
        element.classList.add('crt-flicker');
        setTimeout(() => {
          element.classList.remove('crt-flicker');
        }, 1500);
      }
      
      if (flickerChance > 0.8) {
        setTimeout(() => {
          element.classList.add('rgb-shift-fast');
          setTimeout(() => {
            element.classList.remove('rgb-shift-fast');
          }, 1000);
        }, 500);
      }
      
      setTimeout(() => {
        glitchButton.classList.remove('force-visible');
      }, 150 + Math.random() * 200);
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
    const rand = Math.random();    if (rand > 0.75) {
      glitchButton.classList.add('force-visible');
      
      const effectChance = Math.random();
      if (effectChance > 0.8) {
        applyRandomGlitchEffect();
      }
      
      setTimeout(() => {
        glitchButton.classList.remove('force-visible');
      }, Math.random() * 300 + 150);
    }
  }
  
  setTimeout(randomGlitchAppearance, Math.random() * 10000 + 5000);
}

function applyRandomGlitchEffect() {
  const effects = [
    'crt-flicker', 
    'crt-flicker-intense', 
    'crt-flicker-extreme',
    'rgb-shift', 
    'rgb-shift-fast', 
    'rgb-shift-extreme',
    'rgb-glitch-intense', 
    'chromatic-aberration',
    'crt-rgb-combo',
    'crt-rgb-combo-fast',
    'ultimate-glitch',
    'ultimate-crt-glitch',
    'rapid-flicker',
    'glitch-storm',
    'tv-static',
    'flicker-vintage',
    'flicker-digital-glitch',
    'phosphor-glow',
    'vhs-tracking',
    'crt-curvature'
  ];
    const randomEffect = effects[Math.floor(Math.random() * effects.length)];
  element.classList.add(randomEffect);
  
  if (['crt-flicker', 'crt-flicker-intense', 'flicker-vintage'].includes(randomEffect)) {
    element.classList.add('crt-scanlines-enhanced');
  }
  
  const durations = {
    'crt-flicker': 3000,
    'crt-flicker-intense': 2000,
    'crt-flicker-extreme': 2500,
    'rgb-shift': 2500,
    'rgb-shift-fast': 1500,
    'rgb-shift-extreme': 2000,
    'rgb-glitch-intense': 2000,
    'chromatic-aberration': 1200,
    'crt-rgb-combo': 3000,
    'crt-rgb-combo-fast': 1500,
    'ultimate-glitch': 1000,
    'ultimate-crt-glitch': 1800,
    'rapid-flicker': 800,
    'glitch-storm': 1500,
    'tv-static': 600,
    'flicker-vintage': 4000,
    'flicker-digital-glitch': 2000,
    'phosphor-glow': 3000,
    'vhs-tracking': 3000,
    'crt-curvature': 2000
  };
    setTimeout(() => {
    element.classList.remove(randomEffect);
    element.classList.remove('crt-scanlines-enhanced');
  }, durations[randomEffect] || 2000);
}

function enhanceTextWithGlitchEffects() {
  const textElements = element.querySelectorAll('span');
  textElements.forEach((span, index) => {
    if (Math.random() > 0.85) {
      const delay = Math.random() * 3000;
      setTimeout(() => {
        const effects = [
          'crt-breathing', 
          'rgb-pulse', 
          'ambient-glow'
        ];
        const effectClass = effects[Math.floor(Math.random() * effects.length)];
        span.classList.add(effectClass);
        
        const effectDurations = {
          'crt-breathing': 4000,
          'rgb-pulse': 3000,
          'ambient-glow': 5000
        };
        
        setTimeout(() => {
          span.classList.remove(effectClass);
        }, effectDurations[effectClass] || 2000);      }, delay);
    }
  });
  
  if (currentSection === 'ai') {
    const poemTexts = element.querySelectorAll('.poem-text');
    poemTexts.forEach((poem, index) => {
      setTimeout(() => {
        if (Math.random() > 0.7) {
          const specialEffects = ['crt-breathing', 'rgb-pulse'];
          const effect = specialEffects[Math.floor(Math.random() * specialEffects.length)];
          poem.classList.add(effect);
          setTimeout(() => {
            poem.classList.remove(effect);
          }, 3000 + Math.random() * 2000);
        }
      }, index * 1500);
    });
  }
}

function navigateToSection(index) {
  currentIndex = index;
  currentSection = sectionsOrder[index];
  
  if (Math.random() > 0.8) {
    applyRandomGlitchEffect();
  }
  
  const buttons = navButtons.querySelectorAll('.nav-button');
  buttons.forEach((btn, i) => {
    if (i === index) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  if (currentSection === 'ai') {
    element.classList.add('ai-section');
  } else {
    element.classList.remove('ai-section');
  }
  
  const sections = isMobileView ? mobileSections : portfolioSections;
  AsciiMorph.morph(sections[currentSection]);
  
  setTimeout(() => {
    enhanceTextWithGlitchEffects();
  }, 500);
  
  resetIdleTimer();
}

function updateButtonStates() {
  document.querySelectorAll('.nav-button').forEach((btn, i) => {
    if (i === currentIndex) {
      btn.classList.add('active');
      
      if (i === 4) {
        btn.classList.add('ai-active');
        btn.classList.add('force-visible');
      }
    } else {
      btn.classList.remove('active');
      
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
    idleState = false;    element.classList.remove('drift');
    element.classList.remove('crt-flicker');
    element.classList.remove('crt-flicker-intense');
    element.classList.remove('rgb-shift');
    element.classList.remove('rgb-shift-fast');
    element.classList.remove('rgb-glitch-intense');
    element.classList.remove('crt-rgb-combo');
    element.classList.remove('crt-scanlines');
  }
  
  idleTimer = setTimeout(() => {
    idleState = true;
    element.classList.add('drift');
    
    const flickerChance = Math.random();
    if (flickerChance > 0.7) {
      element.classList.add('flicker');
      setTimeout(() => {
        element.classList.remove('flicker');      }, 4000);
    }    if (flickerChance > 0.9) {
      const effectType = Math.random();
      if (effectType > 0.95) {
        element.classList.add('crt-flicker');        setTimeout(() => {
          element.classList.remove('crt-flicker');
        }, 1500);
      } else {
        element.classList.add('crt-breathing');
        setTimeout(() => {
          element.classList.remove('crt-breathing');
        }, 3000);
      }
    }
    
    if (flickerChance > 0.95) {
      setTimeout(() => {
        element.classList.add('rgb-pulse');
        setTimeout(() => {
          element.classList.remove('rgb-pulse');
        }, 2000);
      }, 6000);
    }
  }, 30000);
}

document.addEventListener('mousemove', resetIdleTimer);
document.addEventListener('keydown', resetIdleTimer);
document.addEventListener('click', (e) => {
  resetIdleTimer();
  
  if (e.target.classList.contains('pgp-link') || 
      (e.target.parentElement && e.target.parentElement.classList.contains('pgp-link'))) {
    showPgpKey();
  }  
  if (e.target.classList.contains('glitch-button')) {
    element.classList.add('glitch-storm');
    setTimeout(() => {
      element.classList.remove('glitch-storm');
      element.classList.add('ultimate-crt-glitch');
      setTimeout(() => {
        element.classList.remove('ultimate-crt-glitch');
      }, 2000);    }, 1500);  }
  if (Math.random() > 0.95) {
    const quickEffects = ['rapid-flicker', 'tv-static'];
    const effect = quickEffects[Math.floor(Math.random() * quickEffects.length)];
    element.classList.add(effect);    setTimeout(() => {
      element.classList.remove(effect);
    }, 500);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    hidePgpKey();
    element.classList.add('tv-static');
    setTimeout(() => {
      element.classList.remove('tv-static');
    }, 500);
  }
  
  if (Math.random() > 0.9) {
    applyRandomGlitchEffect();
  }
});

function initializeEnhancedEffects() {
  setTimeout(() => {
    element.classList.add('ambient-glow');
    setTimeout(() => {
      element.classList.remove('ambient-glow');
    }, 3000);  }, 1000);
  setTimeout(randomGlitchAppearance, 2000);
  
  setInterval(() => {
    if (!document.querySelector('.pgp-key-container').classList.contains('visible')) {
      const burstChance = Math.random();      if (burstChance > 0.95) {
        const burstEffects = [
          'crt-breathing',
          'rgb-pulse'
        ];
        const effect = burstEffects[Math.floor(Math.random() * burstEffects.length)];
        element.classList.add(effect);
        setTimeout(() => {
          element.classList.remove(effect);
        }, 1500);
      }
    }  }, 60000);
}

let mouseMovementTimer = null;
document.addEventListener('mousemove', (e) => {
  resetIdleTimer();
    clearTimeout(mouseMovementTimer);  mouseMovementTimer = setTimeout(() => {
    if (Math.random() > 0.95) {
      const subtleEffects = ['crt-breathing', 'rgb-pulse', 'chromatic-aberration'];
      const effect = subtleEffects[Math.floor(Math.random() * subtleEffects.length)];
      element.classList.add(effect);
      setTimeout(() => {
        element.classList.remove(effect);
      }, 1500);
    }  }, 100);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    hidePgpKey();
    element.classList.add('tv-static');
    setTimeout(() => {
      element.classList.remove('tv-static');
    }, 500);
  }
  
  if (Math.random() > 0.9) {
    applyRandomGlitchEffect();
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
    const effectType = Math.random();
      if (effectType > 0.8) {
      element.classList.add('ultimate-glitch');
      setTimeout(() => {
        element.classList.remove('ultimate-glitch');
      }, 1500);    } else if (effectType > 0.6) {
      element.classList.add('crt-rgb-combo');
      setTimeout(() => {
        element.classList.remove('crt-rgb-combo');
      }, 2500);    } else if (effectType > 0.4) {
      element.classList.add('flicker-enhanced');
      setTimeout(() => {
        element.classList.remove('flicker-enhanced');
      }, 3000);    } else if (effectType > 0.2) {
      element.classList.add('rgb-shift');
      setTimeout(() => {
        element.classList.remove('rgb-shift');
      }, 2000);    } else {
      element.classList.add('flicker');
      setTimeout(() => {
        element.classList.remove('flicker');
      }, 2000);
    }
  }
  
  setTimeout(randomFlicker, Math.random() * 20000 + 15000);
}

function randomCrtEffects() {
  if (document.querySelector('.pgp-key-container').classList.contains('visible')) {
    setTimeout(randomCrtEffects, Math.random() * 8000 + 5000);
    return;
  }
  
  const rand = Math.random();  if (rand > 0.85) {
    element.classList.add('crt-scanlines');
    setTimeout(() => {
      element.classList.remove('crt-scanlines');
    }, Math.random() * 3000 + 1000);
  }
    if (rand > 0.9) {
    element.classList.add('crt-flicker-intense');
    setTimeout(() => {
      element.classList.remove('crt-flicker-intense');
    }, Math.random() * 1000 + 500);
  }
  
  setTimeout(randomCrtEffects, Math.random() * 8000 + 5000);
}

function randomRgbGlitch() {
  if (document.querySelector('.pgp-key-container').classList.contains('visible')) {
    setTimeout(randomRgbGlitch, Math.random() * 6000 + 4000);
    return;
  }
  
  const rand = Math.random();
  if (rand > 0.8) {
    const glitchType = Math.random();
      if (glitchType > 0.7) {
      element.classList.add('rgb-glitch-intense');
      setTimeout(() => {
        element.classList.remove('rgb-glitch-intense');
      }, Math.random() * 1200 + 800);    } else if (glitchType > 0.4) {
      element.classList.add('rgb-shift-fast');
      setTimeout(() => {
        element.classList.remove('rgb-shift-fast');
      }, Math.random() * 800 + 400);    } else {
      element.classList.add('flicker-rgb');
      setTimeout(() => {
        element.classList.remove('flicker-rgb');
      }, Math.random() * 2000 + 1000);
    }
  }
  
  setTimeout(randomRgbGlitch, Math.random() * 6000 + 4000);
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
  
  initializeEnhancedEffects();
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

setTimeout(() => {
  initializeEnhancedEffects();
}, 1000);
