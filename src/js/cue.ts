(() => {
  const LIMIT = 40;
  const cue = document.querySelector<HTMLElement>('.scroll-cue');

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

  const jump = (e: Event) => {
    const href = (e.currentTarget as Element).getAttribute('href')!;
    const target = document.querySelector<HTMLElement>(href);
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
