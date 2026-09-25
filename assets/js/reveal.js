/* ═══════════════════════════════════════════
   AGMIEX — Scroll reveal
   Elements with [data-reveal] fade in once. Content stays visible without JS
   (the hidden state is gated on html.js) and with reduced motion.
   ═══════════════════════════════════════════ */

export function initReveal() {
  const items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  // Stagger siblings inside a [data-reveal-group].
  document.querySelectorAll('[data-reveal-group]').forEach((group) => {
    group.querySelectorAll(':scope > [data-reveal]').forEach((el, index) => {
      el.style.setProperty('--reveal-delay', `${Math.min(index, 6) * 70}ms`);
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );

  items.forEach((el) => observer.observe(el));
}
