(() => {
  const LIMIT = 40;
  const cue = document.querySelector('.scroll-cue');

  const dismiss = () => {
    if (!cue) return;
    if (document.activeElement === cue) cue.blur();
    cue.classList.add('is-gone');
    cue.setAttribute('aria-hidden', 'true');
    cue.setAttribute('tabindex', '-1');
  };

  const clean = () => {
    if (history.replaceState) history.replaceState(null, '', location.pathname + location.search);
  };

  const jump = (e) => {
    const target = document.querySelector(e.currentTarget.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    dismiss();
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    clean();
  };

  if (cue) {
    if (window.scrollY > LIMIT) dismiss();

    window.addEventListener('scroll', () => {
      if (window.scrollY > LIMIT) dismiss();
    }, { passive: true });
  }

  document.querySelectorAll('a[href="#contact"]').forEach((a) => {
    a.addEventListener('click', jump);
  });
})();
