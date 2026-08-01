/**
 * 30-Second Countdown Timer & Urgency Controller
 * AGMIEX — Website Demo Special Offer
 */
document.addEventListener("DOMContentLoaded", () => {
  const TIMER_SECONDS = 30;

  const initCountdown = () => {
    const timerElements = document.querySelectorAll(".demo-30s-timer");
    if (!timerElements.length) return;

    let timeLeft = TIMER_SECONDS;

    const updateDisplay = () => {
      const formattedSec = timeLeft < 10 ? `0${timeLeft}` : `${timeLeft}`;
      const displayString = `00:${formattedSec}`;

      timerElements.forEach((el) => {
        el.textContent = displayString;
      });
    };

    updateDisplay();

    const interval = setInterval(() => {
      timeLeft -= 1;
      if (timeLeft < 0) {
        // Reset back to 30 seconds for perpetual high conversion urgency
        timeLeft = TIMER_SECONDS;
      }
      updateDisplay();
    }, 1000);
  };

  initCountdown();
});
