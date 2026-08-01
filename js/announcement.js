/* ═══════════════════════════════════════════
   AGMIEX — Announcement Bar Countdown Timer
   Lightweight, performant, no dependencies
   ═══════════════════════════════════════════ */

(function () {
  'use strict';

  // ✏️ EDITABLE — Set the offer end date here (YYYY-MM-DDTHH:MM:SS format)
  // The countdown will count down to this date/time in the user's local timezone
  const OFFER_END_DATE = '2026-08-31T23:59:59';

  // DOM references
  const bar       = document.getElementById('announcement-bar');
  const closeBtn  = document.getElementById('announcement-close');
  const daysEl    = document.getElementById('countdown-days');
  const hoursEl   = document.getElementById('countdown-hours');
  const minutesEl = document.getElementById('countdown-minutes');
  const secondsEl = document.getElementById('countdown-seconds');

  if (!bar || !daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  const endTime = new Date(OFFER_END_DATE).getTime();
  let intervalId = null;

  /** Pad a number with a leading zero */
  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  /** Add a brief scale animation on value change */
  function tickAnim(el) {
    el.classList.add('tick');
    setTimeout(function () { el.classList.remove('tick'); }, 150);
  }

  /** Update the countdown display */
  function updateCountdown() {
    const now  = Date.now();
    const diff = endTime - now;

    if (diff <= 0) {
      // Offer expired — hide the bar
      daysEl.textContent    = '00';
      hoursEl.textContent   = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';
      clearInterval(intervalId);
      bar.classList.add('announcement-bar--hidden');
      updateNavbarOffset();
      return;
    }

    const days    = Math.floor(diff / 86400000);
    const hours   = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    const newDays = pad(days);
    const newHrs  = pad(hours);
    const newMin  = pad(minutes);
    const newSec  = pad(seconds);

    // Only update and animate when value changes
    if (daysEl.textContent !== newDays) {
      daysEl.textContent = newDays;
      tickAnim(daysEl);
    }
    if (hoursEl.textContent !== newHrs) {
      hoursEl.textContent = newHrs;
      tickAnim(hoursEl);
    }
    if (minutesEl.textContent !== newMin) {
      minutesEl.textContent = newMin;
      tickAnim(minutesEl);
    }
    if (secondsEl.textContent !== newSec) {
      secondsEl.textContent = newSec;
      tickAnim(secondsEl);
    }
  }

  /** Sync sticky navbar offset with announcement bar height */
  function updateNavbarOffset() {
    if (!bar || bar.classList.contains('announcement-bar--hidden')) {
      document.documentElement.style.setProperty('--navbar-offset', '0px');
    } else {
      document.documentElement.style.setProperty('--navbar-offset', bar.offsetHeight + 'px');
    }
  }

  // Dismiss button — hide bar and remember in session
  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      bar.classList.add('announcement-bar--hidden');
      clearInterval(intervalId);
      updateNavbarOffset();
      try {
        sessionStorage.setItem('agmiex_launch_offer_30pct_dismissed', '1');
      } catch (e) { /* storage not available */ }
    });
  }

  // Check if already dismissed this session
  try {
    if (sessionStorage.getItem('agmiex_launch_offer_30pct_dismissed') === '1') {
      bar.classList.add('announcement-bar--hidden');
      updateNavbarOffset();
      return;
    }
  } catch (e) { /* storage not available */ }

  // Initial render + start interval
  updateCountdown();
  updateNavbarOffset();
  window.addEventListener('resize', updateNavbarOffset);
  intervalId = setInterval(updateCountdown, 1000);
})();

