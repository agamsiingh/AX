/* ═══════════════════════════════════════════
   AGMIEX — Main JavaScript
   Theme toggle, carousels, accordions, menu
   ═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // ─── THEME TOGGLE ───
  const themeToggle = document.getElementById('theme-toggle');
  
  // Check default theme preference
  const savedTheme = localStorage.getItem('theme');
  const userPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else if (userPrefersDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    });
  }

  // ─── MOBILE MENU TOGGLE ───
  const navToggle = document.getElementById('nav-toggle');
  const menuMobile = document.getElementById('menu-mobile');

  if (navToggle && menuMobile) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      menuMobile.classList.toggle('active');
    });

    // Close menu when clicking outside or on links
    menuMobile.querySelectorAll('.navbar__menu-link').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        menuMobile.classList.remove('active');
      });
    });
  }

  // ─── FAQ ACCORDION ───
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-item__trigger');
    const content = item.querySelector('.faq-item__content');

    if (trigger && content) {
      trigger.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Close all other items
        faqItems.forEach(other => {
          if (other !== item) {
            other.classList.remove('active');
            const otherContent = other.querySelector('.faq-item__content');
            if (otherContent) otherContent.style.maxHeight = '0';
          }
        });

        // Toggle current item
        if (isActive) {
          item.classList.remove('active');
          content.style.maxHeight = '0';
        } else {
          item.classList.add('active');
          content.style.maxHeight = content.scrollHeight + 'px';
        }
      });
    }
  });

  // ─── CAROUSEL SYSTEM ───
  function setupCarousel(wrapperId, prevId, nextId, dotsId) {
    const wrapper = document.getElementById(wrapperId);
    const prevBtn = document.getElementById(prevId);
    const nextBtn = document.getElementById(nextId);
    const dotsContainer = document.getElementById(dotsId);

    if (!wrapper) return;

    const cards = wrapper.children;
    if (cards.length === 0) return;

    const totalDots = Math.min(cards.length, 10);

    // Create dot elements
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      for (let i = 0; i < totalDots; i++) {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Slide ${i + 1}`);
        dot.dataset.index = i;
        dotsContainer.appendChild(dot);
      }
    }

    // Scroll to index
    function scrollToCard(index) {
      const card = cards[index];
      if (card) {
        wrapper.scrollTo({
          left: card.offsetLeft - wrapper.offsetLeft,
          behavior: 'smooth'
        });
      }
    }

    // Arrow controls
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const cardWidth = cards[0].offsetWidth + 24; // Width + gap
        wrapper.scrollBy({ left: -cardWidth, behavior: 'smooth' });
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const cardWidth = cards[0].offsetWidth + 24; // Width + gap
        wrapper.scrollBy({ left: cardWidth, behavior: 'smooth' });
      });
    }

    // Dots click events
    if (dotsContainer) {
      dotsContainer.addEventListener('click', (e) => {
        const dot = e.target.closest('.carousel-dot');
        if (!dot) return;
        scrollToCard(parseInt(dot.dataset.index));
      });
    }

    // Update active dot indicators
    let scrollTimeout;
    wrapper.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const wrapperRect = wrapper.getBoundingClientRect();
        const viewCenter = wrapperRect.left + wrapperRect.width / 2;
        let closestIndex = 0;
        let closestDistance = Infinity;

        Array.from(cards).forEach((card, i) => {
          if (i >= totalDots) return;
          const cardRect = card.getBoundingClientRect();
          const cardCenter = cardRect.left + cardRect.width / 2;
          const distance = Math.abs(cardCenter - viewCenter);
          
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = i;
          }
        });

        if (dotsContainer) {
          dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === closestIndex);
          });
        }
      }, 50);
    }, { passive: true });
  }

  setupCarousel('testimonials-wrapper', 'testimonials-prev', 'testimonials-next', 'testimonials-dots');
  setupCarousel('clients-wrapper', 'clients-prev', 'clients-next', 'clients-dots');

  // ─── SCROLL REVEAL ───
  const revealElements = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -30px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('visible'));
  }

  // ─── SUPABASE INITIALIZATION ───
  const supabaseUrl = 'https://enymspckgosfeqbjlkab.supabase.co';
  const supabaseKey = 'sb_publishable_Rtrb16q9dXQcDlG5zbETXg_eP21EANh';
  let supabaseClient = null;

  if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
  }

  // ─── CONTACT FORM SUBMISSION ───
  const contactForm = document.getElementById('contact-us-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = contactForm.querySelector('.contact-form__btn');
      const originalText = submitBtn.textContent;
      
      // Gather inputs
      const name = document.getElementById('contact-name').value;
      const phone = document.getElementById('contact-phone').value;
      const email = document.getElementById('contact-email').value;
      const subject = document.getElementById('contact-subject').value;
      const message = document.getElementById('contact-message').value;

      // Premium loading feedback
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      let success = true;

      if (supabaseClient) {
        try {
          const { error } = await supabaseClient
            .from('contact_submissions')
            .insert([
              { name, phone, email, subject, message }
            ]);

          if (error) {
            console.error('Supabase insert error:', error);
            success = false;
          }
        } catch (err) {
          console.error('Failed to submit to Supabase:', err);
          success = false;
        }
      } else {
        console.warn('Supabase SDK not loaded, executing UI mock fallback');
      }

      if (success) {
        submitBtn.textContent = 'Message Sent! ✔';
        submitBtn.style.backgroundColor = '#10b981';
        submitBtn.style.color = '#ffffff';
        contactForm.reset();
      } else {
        submitBtn.textContent = 'Failed to Send ✖';
        submitBtn.style.backgroundColor = '#ef4444';
        submitBtn.style.color = '#ffffff';
      }

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        submitBtn.style.backgroundColor = '';
        submitBtn.style.color = '';
      }, 3000);
    });
  }

});
