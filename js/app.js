/* ============================================
   AGMIEX — Main App Orchestrator
   ============================================ */

import { initNavigation } from './navigation.js';
import { initForms } from './forms.js';
import { initPremiumAnimations, initLoadingScreen } from './premium-animations.js';
import { initAnimations } from './animations.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize core system utilities immediately
  initNavigation();
  initForms();

  // 2. Start the premium loading screen overlay
  initLoadingScreen(() => {
    // 3. Trigger premium Three.js, GSAP & ScrollTrigger animations once site enters
    initPremiumAnimations();
    // 4. Trigger lightweight fallback scroll reveals/counters if GSAP is absent
    initAnimations();
  });

  console.log('%c AGMIEX %c Enterprise Systems ', 
    'background: #0f172a; color: white; padding: 4px 8px; border-radius: 4px 0 0 4px; font-weight: bold;',
    'background: #e2e8f0; color: #0f172a; padding: 4px 8px; border-radius: 0 4px 4px 0;'
  );
});
