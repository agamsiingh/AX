/* ═══════════════════════════════════════════
   AGMIEX — Light/dark theme toggle
   The initial theme is applied by an inline script in <head> to avoid a flash.
   ═══════════════════════════════════════════ */

const STORAGE_KEY = 'theme'; // kept from the previous site so saved preferences carry over
const THEME_COLORS = { light: '#ffffff', dark: '#07090e' };

function savedTheme() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

export function initTheme() {
  const root = document.documentElement;
  const toggles = document.querySelectorAll('[data-theme-toggle]');
  const metaColor = document.querySelector('meta[name="theme-color"]');
  const media = window.matchMedia('(prefers-color-scheme: dark)');

  const apply = (theme, persist) => {
    root.dataset.theme = theme;
    toggles.forEach((btn) => btn.setAttribute('aria-pressed', String(theme === 'dark')));
    if (metaColor) metaColor.setAttribute('content', THEME_COLORS[theme]);
    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        /* storage unavailable — theme still applies for this page view */
      }
    }
  };

  apply(root.dataset.theme === 'dark' ? 'dark' : savedTheme() || (media.matches ? 'dark' : 'light'), false);

  toggles.forEach((btn) =>
    btn.addEventListener('click', () => apply(root.dataset.theme === 'dark' ? 'light' : 'dark', true)),
  );

  media.addEventListener?.('change', (event) => {
    if (!savedTheme()) apply(event.matches ? 'dark' : 'light', false);
  });
}
