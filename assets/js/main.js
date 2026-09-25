/* ═══════════════════════════════════════════
   AGMIEX — Front-end entry (ES module, loaded with defer semantics)
   `npm run build` bundles and minifies this graph into dist/.
   ═══════════════════════════════════════════ */

import { initTheme } from './theme.js';
import { initNav } from './nav.js';
import { initReveal } from './reveal.js';
import { initAccordions } from './accordion.js';
import { initForms } from './forms.js';

const root = document.documentElement;

function initYear() {
  const year = String(new Date().getFullYear());
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = year;
  });
}

function revealEverything() {
  document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-visible'));
}

// The inline <head> script removes .js again if this module never runs, so
// progressive-enhancement styles can't leave content hidden.
root.classList.add('js');

// Each feature is isolated so one failure can't take the rest of the page down.
[initTheme, initNav, initReveal, initAccordions, initForms, initYear].forEach((init) => {
  try {
    init();
  } catch (err) {
    console.error(`[AGMIEX] ${init.name} failed:`, err);
    if (init === initReveal) revealEverything();
  }
});

root.classList.add('js-ready');
