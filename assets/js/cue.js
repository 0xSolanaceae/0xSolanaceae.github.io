(() => {
  const cue = document.querySelector('.scroll-cue');
  if (!cue) return;

  const LIMIT = 40;

  const dismiss = () => {
    if (document.activeElement === cue) cue.blur();
    cue.classList.add('is-gone');
    cue.setAttribute('aria-hidden', 'true');
    cue.setAttribute('tabindex', '-1');
  };

  if (window.scrollY > LIMIT) dismiss();

  window.addEventListener('scroll', () => {
    if (window.scrollY > LIMIT) dismiss();
  }, { passive: true });

  cue.addEventListener('click', (e) => {
    const target = document.querySelector(cue.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    if (history.replaceState) history.replaceState(null, '', '#contact');
  });
})();
