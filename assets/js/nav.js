/* ═══════════════════════════════════════════
   AGMIEX — Header: scroll state, mobile menu, active section links
   ═══════════════════════════════════════════ */

const DESKTOP_QUERY = '(min-width: 1060px)';
const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

function initScrollState(header) {
  let ticking = false;
  const update = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
    ticking = false;
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  requestAnimationFrame(update);
}

function initMobileMenu(header) {
  const toggle = header.querySelector('[data-menu-toggle]');
  const menu = header.querySelector('[data-mobile-menu]');
  if (!toggle || !menu) return;

  const root = document.documentElement;
  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

  const setOpen = (open, { restoreFocus = true } = {}) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    header.classList.toggle('is-open', open);
    root.classList.toggle('menu-open', open);
    if (open) {
      menu.querySelector(FOCUSABLE)?.focus({ preventScroll: true });
    } else if (restoreFocus) {
      toggle.focus({ preventScroll: true });
    }
  };

  toggle.addEventListener('click', () => setOpen(!isOpen()));

  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false, { restoreFocus: false });
  });

  document.addEventListener('keydown', (event) => {
    if (!isOpen()) return;
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (event.key !== 'Tab') return;

    // Keep keyboard focus inside the open menu (toggle button + menu links).
    const items = [toggle, ...menu.querySelectorAll(FOCUSABLE)];
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.matchMedia(DESKTOP_QUERY).addEventListener?.('change', (event) => {
    if (event.matches && isOpen()) setOpen(false, { restoreFocus: false });
  });
}

function initActiveLinks(header) {
  const links = [...header.querySelectorAll('.site-nav__link[href^="#"]')];
  if (!links.length || !('IntersectionObserver' in window)) return;

  const byId = new Map();
  links.forEach((link) => {
    const section = document.getElementById(link.getAttribute('href').slice(1));
    if (section) byId.set(section.id, link);
  });

  const setActive = (id) => {
    links.forEach((link) => {
      const active = byId.get(id) === link;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );

  byId.forEach((_, id) => observer.observe(document.getElementById(id)));
}

export function initNav() {
  const header = document.querySelector('[data-header]');
  if (!header) return;
  initScrollState(header);
  initMobileMenu(header);
  initActiveLinks(header);
}
