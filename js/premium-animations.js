/* ============================================
   AGMIEX Premium Animations Engine
   Using Three.js, GSAP, and ScrollTrigger
   ============================================ */

export function initPremiumAnimations() {
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isReducedMotion) {
    console.log('Reduced motion active. Premium animations disabled.');
    // Enable simple fallback for chart bars
    document.querySelectorAll('.dashboard-mockup__chart-bar').forEach(bar => {
      const height = bar.getAttribute('data-height') || '50px';
      bar.style.height = height;
    });
    return;
  }

  // 1. Initialize GSAP and ScrollTrigger
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    initGSAPScrollTriggerReveals();
    initMagneticCTAs();
    initFAQAccordion();
    initTestimonialCarousel();
    initTimelineScrollTrigger();
    initFloatingParallax();
    
    // Core custom animations
    initSectionReveals();
    initPageTransitions();
    initDataFlowParticles();
  } else {
    console.warn('GSAP or ScrollTrigger libraries not loaded.');
    // Fallbacks
    initFAQAccordionFallback();
    initTestimonialCarouselFallback();
  }

  // 2. Initialize Three.js 3D Wave Grid Scene
  if (window.THREE) {
    initHero3DScene();
  } else {
    console.warn('Three.js library not loaded. Falling back to basic grid.');
  }

  // 3. Initialize Interactive Features
  initCursorGlow();
  initStripeGridSpotlight();
  initDashboard3DDepth();
  initCardGlows();
}

/**
 * 1. GSAP ScrollTrigger Reveals & Counters
 */
function initGSAPScrollTriggerReveals() {
  // Staggered reveals for cards and items
  document.querySelectorAll('.stagger-children').forEach(parent => {
    const children = parent.querySelectorAll('.reveal');
    if (children.length > 0) {
      gsap.fromTo(children, 
        { opacity: 0, y: 30, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: {
            trigger: parent,
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );
    }
  });

  // Blur scroll reveals
  gsap.utils.toArray('.reveal--blur').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, filter: 'blur(10px)', y: 40, scale: 0.98 },
      {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        scale: 1,
        duration: 1.2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      }
    );
  });

  // Individual scroll reveals
  gsap.utils.toArray('.reveal:not(.stagger-children .reveal)').forEach(el => {
    let xOffset = 0;
    if (el.classList.contains('reveal--left')) xOffset = -30;
    if (el.classList.contains('reveal--right')) xOffset = 30;

    gsap.fromTo(el,
      { opacity: 0, y: 25, x: xOffset },
      {
        opacity: 1,
        y: 0,
        x: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      }
    );
  });

  // Numerical Counter Animations
  gsap.utils.toArray('[data-counter]').forEach(el => {
    const target = parseInt(el.getAttribute('data-counter'), 10);
    const suffix = el.getAttribute('data-suffix') || '';
    const prefix = el.getAttribute('data-prefix') || '';
    const obj = { val: 0 };

    gsap.to(obj, {
      val: target,
      duration: 2.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 90%'
      },
      onUpdate: () => {
        el.textContent = prefix + Math.round(obj.val).toLocaleString() + suffix;
      }
    });
  });

  // Chart Bar reveal
  const chartBars = document.querySelectorAll('.dashboard-mockup__chart-bar');
  if (chartBars.length > 0) {
    gsap.utils.toArray('.dashboard-mockup__chart').forEach(chart => {
      gsap.fromTo(chartBars,
        { height: '0px' },
        {
          height: (i, target) => target.getAttribute('data-height') || '40px',
          duration: 1.5,
          ease: 'power4.out',
          stagger: 0.1,
          scrollTrigger: {
            trigger: chart,
            start: 'top 85%'
          }
        }
      );
    });
  }
}

/**
 * 2. Magnetic CTA Buttons
 */
function initMagneticCTAs() {
  const ctas = document.querySelectorAll('.btn--primary, .btn--secondary, .navbar__logo, .whatsapp-float');
  ctas.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      gsap.to(btn, {
        x: x * 0.35,
        y: y * 0.35,
        scale: 1.03,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    });

    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: 'elastic.out(1.1, 0.4)',
        overwrite: 'auto'
      });
    });
  });
}

/**
 * 3. Three.js 3D constellated wave grid (Vercel / Apple inspired)
 */
function initHero3DScene() {
  const container = document.getElementById('hero-three-canvas');
  if (!container) return;

  const width = container.offsetWidth;
  const height = container.offsetHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
  camera.position.set(0, 8, 30);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  let rows = 40;
  let cols = 40;
  if (window.innerWidth <= 480) {
    rows = 20;
    cols = 20;
  } else if (window.innerWidth <= 768) {
    rows = 28;
    cols = 28;
  }
  const count = rows * cols;

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  let index = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (r - rows / 2) * 1.55;
      const z = (c - cols / 2) * 1.55;

      positions[index * 3] = x;
      positions[index * 3 + 1] = 0;
      positions[index * 3 + 2] = z;

      const dist = Math.sqrt(x * x + z * z) / 35;
      const blend = Math.min(1, Math.max(0, dist));
      
      colors[index * 3] = (79 * (1 - blend) + 14 * blend) / 255;
      colors[index * 3 + 1] = (70 * (1 - blend) + 165 * blend) / 255;
      colors[index * 3 + 2] = (229 * (1 - blend) + 233 * blend) / 255;

      index++;
    }
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.18,
    vertexColors: true,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  let mouseX = 0, mouseY = 0;
  let targetX = 0, targetY = 0;

  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX - window.innerWidth / 2);
    mouseY = (e.clientY - window.innerHeight / 2);
  });

  window.addEventListener('resize', () => {
    const w = container.offsetWidth;
    const h = container.offsetHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  let isVisible = true;
  const observer = new IntersectionObserver((entries) => {
    isVisible = entries[0].isIntersecting;
  }, { threshold: 0.05 });
  observer.observe(container);

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    if (!isVisible) return;

    const time = clock.getElapsedTime() * 0.45;

    const pos = geometry.attributes.position.array;
    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = pos[idx * 3];
        const z = pos[idx * 3 + 2];

        const y = Math.sin(x * 0.15 + time) * Math.cos(z * 0.15 + time) * 2.8
                + Math.sin((x + z) * 0.06 + time * 1.2) * 1.2;

        pos[idx * 3 + 1] = y;
        idx++;
      }
    }
    geometry.attributes.position.needsUpdate = true;

    targetX += (mouseX - targetX) * 0.04;
    targetY += (mouseY - targetY) * 0.04;

    points.rotation.y = time * 0.03 + targetX * 0.0005;
    points.rotation.x = -0.45 + targetY * 0.0003;

    renderer.render(scene, camera);
  }

  animate();
}

/**
 * 4. Interactive Stripe/Vercel Grid Spotlight Background
 */
function initStripeGridSpotlight() {
  const services = document.getElementById('services');
  const interactiveGrid = services?.querySelector('.interactive-grid-background');
  if (services && interactiveGrid) {
    services.addEventListener('mousemove', (e) => {
      const rect = services.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      interactiveGrid.style.setProperty('--grid-spotlight-x', `${x}px`);
      interactiveGrid.style.setProperty('--grid-spotlight-y', `${y}px`);
    });
  }

  const caseSection = document.getElementById('case-studies');
  const spotlightOverlay = caseSection?.querySelector('.spotlight-overlay');
  if (caseSection && spotlightOverlay) {
    caseSection.addEventListener('mousemove', (e) => {
      const rect = caseSection.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      spotlightOverlay.style.setProperty('--spotlight-x', `${x}px`);
      spotlightOverlay.style.setProperty('--spotlight-y', `${y}px`);
    });
  }
}

/**
 * 5. Advanced Layered 3D Tilt Cards (Apple Parallax Depth)
 */
function initDashboard3DDepth() {
  const card = document.querySelector('.hero__visual.tilt-card');
  if (!card) return;

  const imgWrapper = card.querySelector('.hero__image-wrapper');
  const mockup = card.querySelector('.dashboard-mockup');

  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((centerY - y) / centerY) * 10;
    const rotateY = ((x - centerX) / centerX) * 10;

    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

    if (imgWrapper) {
      imgWrapper.style.transform = `translateZ(15px) scale(0.98)`;
    }
    if (mockup) {
      const moveX = (x - centerX) * 0.08;
      const moveY = (y - centerY) * 0.08;
      mockup.style.transform = `translate3d(${moveX}px, ${moveY}px, 60px) rotateX(${rotateX * 0.25}deg) rotateY(${rotateY * 0.25}deg)`;
    }
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'rotateX(0deg) rotateY(0deg)';
    if (imgWrapper) {
      imgWrapper.style.transform = 'translateZ(10px) scale(1)';
    }
    if (mockup) {
      mockup.style.transform = 'translateZ(50px)';
    }
  });
}

/**
 * 6. Global Cursor Glow & Hover Target Micro-interactions
 */
function initCursorGlow() {
  const glow = document.querySelector('.cursor-glow');
  if (!glow) return;

  // Disable cursor glow on touch screens to save performance
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  if (isTouch) {
    glow.style.display = 'none';
    return;
  }

  let mouseX = 0, mouseY = 0;
  let currentX = 0, currentY = 0;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Detect current section and apply color classes for premium theme accentuating
    const section = e.target.closest('section');
    if (section) {
      const id = section.getAttribute('id');
      // Reset color classes
      glow.classList.remove(
        'cursor-glow--hero', 
        'cursor-glow--services', 
        'cursor-glow--technologies', 
        'cursor-glow--case-studies', 
        'cursor-glow--about',
        'cursor-glow--booking', 
        'cursor-glow--contact'
      );
      if (id) {
        glow.classList.add(`cursor-glow--${id}`);
      }
    }
  });

  function updateCursor() {
    currentX += (mouseX - currentX) * 0.12;
    currentY += (mouseY - currentY) * 0.12;

    const absX = currentX + window.pageXOffset;
    const absY = currentY + window.pageYOffset;

    glow.style.transform = `translate3d(${absX - glow.offsetWidth / 2}px, ${absY - glow.offsetHeight / 2}px, 0)`;
    requestAnimationFrame(updateCursor);
  }
  updateCursor();

  const interactiveTargets = document.querySelectorAll('a, button, .glow-card, .btn, .faq-item__trigger, .scheduler__day, .scheduler__slot');
  interactiveTargets.forEach(target => {
    target.addEventListener('mouseenter', () => {
      glow.classList.add('cursor-glow--active');
      let text = '';
      if (target.closest('.case-card')) text = 'View Case';
      else if (target.closest('.portfolio-card')) text = 'View Project';
      else if (target.closest('.booking__card')) text = 'Select';
      else if (target.closest('.career-card')) text = 'Apply';
      else if (target.closest('.blog-card')) text = 'Read';
      else if (target.classList.contains('btn--primary') && target.closest('.hero')) text = 'Explore';
      
      if (text) {
        glow.setAttribute('data-text', text);
      }
    });

    target.addEventListener('mouseleave', () => {
      glow.classList.remove('cursor-glow--active');
      glow.removeAttribute('data-text');
    });
  });
}

/**
 * 7. Standard Glow Card (Mouse follow light ring)
 */
function initCardGlows() {
  const cards = document.querySelectorAll('.glow-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });
}

/**
 * 8. FAQ Accordion logic using GSAP
 */
function initFAQAccordion() {
  const items = document.querySelectorAll('.faq-item');
  items.forEach(item => {
    const trigger = item.querySelector('.faq-item__trigger');
    const content = item.querySelector('.faq-item__content');
    
    if (trigger && content) {
      trigger.addEventListener('click', () => {
        const isActive = item.classList.contains('faq-item--active');
        
        // Collapse all others
        items.forEach(otherItem => {
          if (otherItem !== item && otherItem.classList.contains('faq-item--active')) {
            otherItem.classList.remove('faq-item--active');
            const otherContent = otherItem.querySelector('.faq-item__content');
            gsap.to(otherContent, { height: 0, duration: 0.35, ease: 'power2.out' });
          }
        });
        
        // Toggle current
        if (isActive) {
          item.classList.remove('faq-item--active');
          gsap.to(content, { height: 0, duration: 0.35, ease: 'power2.out' });
        } else {
          item.classList.add('faq-item--active');
          gsap.to(content, { height: 'auto', duration: 0.35, ease: 'power2.out' });
        }
      });
    }
  });
}

function initFAQAccordionFallback() {
  const items = document.querySelectorAll('.faq-item');
  items.forEach(item => {
    const trigger = item.querySelector('.faq-item__trigger');
    const content = item.querySelector('.faq-item__content');
    
    if (trigger && content) {
      trigger.addEventListener('click', () => {
        const isActive = item.classList.contains('faq-item--active');
        items.forEach(otherItem => {
          otherItem.classList.remove('faq-item--active');
          const otherContent = otherItem.querySelector('.faq-item__content');
          if (otherContent) otherContent.style.maxHeight = null;
        });
        if (!isActive) {
          item.classList.add('faq-item--active');
          content.style.maxHeight = content.scrollHeight + 'px';
        }
      });
    }
  });
}

/**
 * 9. Testimonial Carousel logic
 */
function initTestimonialCarousel() {
  const track = document.querySelector('.testimonials__track');
  const slides = document.querySelectorAll('.testimonials__slide');
  const prevBtn = document.querySelector('.testimonials__nav-btn--prev');
  const nextBtn = document.querySelector('.testimonials__nav-btn--next');
  const dotsContainer = document.querySelector('.testimonials__dots');

  if (!track || slides.length === 0) return;

  let currentIndex = 0;
  const slideCount = slides.length;

  // Create dots
  if (dotsContainer) {
    dotsContainer.innerHTML = '';
    for (let i = 0; i < slideCount; i++) {
      const dot = document.createElement('button');
      dot.classList.add('testimonials__dot');
      if (i === 0) dot.classList.add('testimonials__dot--active');
      dot.addEventListener('click', () => goToSlide(i));
      dotsContainer.appendChild(dot);
    }
  }

  const dots = document.querySelectorAll('.testimonials__dot');

  function updateSlidePosition() {
    gsap.to(track, {
      xPercent: -currentIndex * 100,
      duration: 0.6,
      ease: 'power2.out'
    });
    
    dots.forEach((dot, index) => {
      if (index === currentIndex) {
        dot.classList.add('testimonials__dot--active');
      } else {
        dot.classList.remove('testimonials__dot--active');
      }
    });
  }

  function goToSlide(index) {
    currentIndex = (index + slideCount) % slideCount;
    updateSlidePosition();
    resetAutoPlay();
  }

  if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));

  let autoplayTimer = setInterval(() => {
    goToSlide(currentIndex + 1);
  }, 6000);

  function resetAutoPlay() {
    clearInterval(autoplayTimer);
    autoplayTimer = setInterval(() => {
      goToSlide(currentIndex + 1);
    }, 6000);
  }
}

function initTestimonialCarouselFallback() {
  const track = document.querySelector('.testimonials__track');
  const slides = document.querySelectorAll('.testimonials__slide');
  const prevBtn = document.querySelector('.testimonials__nav-btn--prev');
  const nextBtn = document.querySelector('.testimonials__nav-btn--next');

  if (!track || slides.length === 0) return;

  let currentIndex = 0;
  const slideCount = slides.length;

  function updateSlidePosition() {
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
  }

  function goToSlide(index) {
    currentIndex = (index + slideCount) % slideCount;
    updateSlidePosition();
  }

  if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));
}

/**
 * 10. Process timeline scroll-triggered step reveals
 */
function initTimelineScrollTrigger() {
  const timeline = document.querySelector('.timeline');
  if (!timeline) return;

  const steps = document.querySelectorAll('.timeline-item');
  steps.forEach(step => {
    const badge = step.querySelector('.timeline-item__badge');
    const card = step.querySelector('.timeline-card');
    
    if (badge) {
      gsap.fromTo(badge, 
        { scale: 0.8, backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', borderColor: 'var(--border-primary)' },
        {
          scale: 1,
          backgroundColor: 'var(--accent-primary)',
          color: '#ffffff',
          borderColor: 'transparent',
          scrollTrigger: {
            trigger: step,
            start: 'top 75%',
            end: 'top 55%',
            scrub: true
          }
        }
      );
    }
    
    if (card) {
      gsap.fromTo(card,
        { opacity: 0, y: 30, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: step,
            start: 'top 80%',
            toggleActions: 'play none none none'
          }
        }
      );
    }
  });
}

/**
 * 11. Floating Parallax geometric element animation
 */
function initFloatingParallax() {
  gsap.utils.toArray('.floating-shape').forEach(shape => {
    const speed = parseFloat(shape.getAttribute('data-speed')) || 1;
    gsap.to(shape, {
      yPercent: -30 * speed,
      ease: 'none',
      scrollTrigger: {
        trigger: shape,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    });
  });
}

/**
 * 12. Premium Loading Screen progress & fade-out controller
 */
export function initLoadingScreen(onComplete) {
  const loader = document.getElementById('loading-screen');
  if (!loader) {
    if (onComplete) onComplete();
    return;
  }

  const fill = loader.querySelector('.loading-screen__progress-fill');
  const percentageEl = loader.querySelector('.loading-screen__percentage');
  const statusEl = loader.querySelector('.loading-screen__status');

  const statusMessages = [
    'Initializing quantum architectures...',
    'Spinning database clusters...',
    'Loading AI agent schemas...',
    'Securing cloud environments...',
    'Deploying API endpoints...',
    'Verifying SOC2/ISO controls...'
  ];

  let progress = 0;
  let statusIndex = 0;
  let isWindowLoaded = false;

  // Reduced motion support
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isReducedMotion) {
    loader.classList.add('loading-screen--dismissed');
    document.body.classList.add('loaded');
    if (onComplete) onComplete();
    return;
  }

  // Update status message text periodically
  const statusTimer = setInterval(() => {
    if (isWindowLoaded) {
      clearInterval(statusTimer);
      return;
    }
    statusIndex = (statusIndex + 1) % statusMessages.length;
    if (statusEl) {
      statusEl.textContent = statusMessages[statusIndex];
    }
  }, 900);

  // Smooth progress increment loop
  function animateProgress(target, duration, callback) {
    const start = progress;
    const startTime = performance.now();

    function step(timestamp) {
      const elapsed = timestamp - startTime;
      const t = Math.min(elapsed / duration, 1);
      const easedT = 1 - Math.pow(1 - t, 3); // Ease out cubic
      progress = start + (target - start) * easedT;

      if (fill) fill.style.width = `${progress}%`;
      if (percentageEl) percentageEl.textContent = `${Math.round(progress)}%`;

      if (t < 1) {
        requestAnimationFrame(step);
      } else if (callback) {
        callback();
      }
    }
    requestAnimationFrame(step);
  }

  // Phase 1: Fast initial simulation loading up to 40%
  animateProgress(40, 900, () => {
    // Phase 2: Slow crawl up to 90%
    animateProgress(90, 8000);
  });

  // Finish loader on load
  window.addEventListener('load', () => {
    isWindowLoaded = true;
    clearInterval(statusTimer);
    if (statusEl) statusEl.textContent = 'Operational verification successful.';

    // Fast finish to 100%
    animateProgress(100, 500, () => {
      setTimeout(() => {
        // SVG Logo scale-up effect via GSAP
        const logo = loader.querySelector('.loading-screen__logo');
        if (logo && window.gsap) {
          window.gsap.to(logo, {
            scale: 1.15,
            opacity: 0,
            duration: 0.6,
            ease: 'power3.inOut'
          });
        }
        
        // Hide loader overlay
        loader.classList.add('loading-screen--dismissed');
        document.body.classList.add('loaded');

        // Let the page settle, then fire entrance animations
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 300);
      }, 150);
    });
  });
}

/**
 * 13. Section Container scale and y-shift reveals (GSAP ScrollTrigger)
 */
function initSectionReveals() {
  const sections = gsap.utils.toArray('section:not(#hero)');
  sections.forEach(sec => {
    const container = sec.querySelector('.container');
    if (container) {
      gsap.fromTo(container,
        { opacity: 0, y: 40, scale: 0.985 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sec,
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );
    }
  });
}

/**
 * 14. Premium Navigation anchor page-blur scroll transition
 */
function initPageTransitions() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const id = this.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (target) {
        // High-end camera blur transition on anchor navigate
        gsap.to('main', {
          filter: 'blur(3px)',
          opacity: 0.9,
          duration: 0.15,
          onComplete: () => {
            const offset = 70; // nav height
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({
              top: targetPosition,
              behavior: 'smooth'
            });
            gsap.to('main', {
              filter: 'blur(0px)',
              opacity: 1,
              duration: 0.4,
              delay: 0.1
            });
          }
        });
      }
    });
  });
}

/**
 * 15. Subtle background network connection data-flow particles (Canvas)
 */
function initDataFlowParticles() {
  const canvases = document.querySelectorAll('.particles-canvas');
  canvases.forEach(canvas => {
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    
    function resize() {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Particle density scaling based on device width
    let particleCount = 45;
    if (window.innerWidth <= 480) particleCount = 12;
    else if (window.innerWidth <= 768) particleCount = 22;

    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.4,
        vx: (Math.random() - 0.5) * 0.35 + 0.15, // Slight horizontal drift
        vy: (Math.random() - 0.5) * 0.35,
        opacity: Math.random() * 0.4 + 0.1
      });
    }

    let isVisible = true;
    const observer = new IntersectionObserver((entries) => {
      isVisible = entries[0].isIntersecting;
    }, { threshold: 0.01 });
    observer.observe(canvas);

    function draw() {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const theme = document.documentElement.getAttribute('data-theme') || 'dark';
      const particleColor = theme === 'dark' ? '99, 102, 241' : '37, 99, 235';

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        // Reset boundaries
        if (p.x > canvas.width) p.x = 0;
        if (p.x < 0) p.x = canvas.width;
        if (p.y > canvas.height) p.y = 0;
        if (p.y < 0) p.y = canvas.height;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${particleColor}, ${p.opacity})`;
        ctx.fill();
      });

      // Draw connecting mesh lines between close points
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
          if (dist < 90) {
            const opacity = (1 - dist / 90) * 0.09;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${particleColor}, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    }
    draw();

    // Attach cleanup
    canvas._cleanup = () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  });
}
