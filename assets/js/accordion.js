/* ═══════════════════════════════════════════
   AGMIEX — Accessible accordion (FAQ)
   Markup: .faq-item > h3 > button[aria-controls] + .faq-item__panel
   Without JS every answer stays expanded and readable.
   ═══════════════════════════════════════════ */

export function initAccordions() {
  document.querySelectorAll('[data-accordion]').forEach((list) => {
    const items = [...list.querySelectorAll('.faq-item')];

    const setOpen = (item, open) => {
      const trigger = item.querySelector('.faq-item__trigger');
      trigger.setAttribute('aria-expanded', String(open));
      item.toggleAttribute('data-open', open);
    };

    items.forEach((item) => {
      const trigger = item.querySelector('.faq-item__trigger');
      if (!trigger) return;
      setOpen(item, trigger.getAttribute('aria-expanded') === 'true');

      trigger.addEventListener('click', () => {
        const willOpen = trigger.getAttribute('aria-expanded') !== 'true';
        if (willOpen && list.hasAttribute('data-accordion-single')) {
          items.forEach((other) => other !== item && setOpen(other, false));
        }
        setOpen(item, willOpen);
      });
    });
  });
}
