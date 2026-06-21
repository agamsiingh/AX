/* ============================================
   AGMIEX Navigation Module
   Theme Toggle & Responsive Header Logic
   ============================================ */

export function initNavigation() {
  const navbar = document.querySelector('.navbar');
  const toggle = document.querySelector('.navbar__toggle');
  const links = document.querySelector('.navbar__links');
  const navLinks = document.querySelectorAll('.navbar__link');

  // 1. Sticky Nav Scroll Behavior
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('navbar--scrolled');
    } else {
      navbar.classList.remove('navbar--scrolled');
    }
  }, { passive: true });

  // 2. Mobile Hamburger Toggle Menu
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('navbar__toggle--active');
      links.classList.toggle('navbar__links--open');
      document.body.style.overflow = links.classList.contains('navbar__links--open') ? 'hidden' : '';
    });
  }

  // Close menu when links are clicked
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      toggle?.classList.remove('navbar__toggle--active');
      links?.classList.remove('navbar__links--open');
      document.body.style.overflow = '';
    });
  });

  // 3. Section Tracker (Active Nav Highlighting)
  const sections = document.querySelectorAll('section[id]');
  const observerOptions = {
    root: null,
    rootMargin: '-30% 0px -50% 0px',
    threshold: 0
  };

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.toggle(
            'navbar__link--active',
            link.getAttribute('href') === `#${id}`
          );
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => sectionObserver.observe(section));

  // 4. Mode Theme Toggle (Dark & Light support)
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const defaultTheme = savedTheme || (prefersDark ? 'dark' : 'light');

    // Apply default loaded theme
    document.documentElement.setAttribute('data-theme', defaultTheme);

    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const targetTheme = currentTheme === 'dark' ? 'light' : 'dark';

      document.documentElement.setAttribute('data-theme', targetTheme);
      localStorage.setItem('theme', targetTheme);
    });
  }
}
