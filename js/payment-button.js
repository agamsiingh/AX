/**
 * PaymentButton Controller (Vanilla JS / Live Razorpay Integration)
 * 
 * Manages clicks on ".payment-btn" elements across the homepage and /book-demo pages.
 * Connects directly to the live Razorpay Payment Page: https://rzp.io/rzp/GdtBvmmE
 */
const RAZORPAY_PAYMENT_URL = "https://rzp.io/rzp/GdtBvmmE";

document.addEventListener("DOMContentLoaded", () => {
  // 1. Ensure backup modal container exists in document.body in case popups are blocked
  let modalOverlay = document.getElementById("rzp-placeholder-modal");
  if (!modalOverlay) {
    modalOverlay = document.createElement("div");
    modalOverlay.id = "rzp-placeholder-modal";
    modalOverlay.className = "rzp-modal-overlay";
    modalOverlay.innerHTML = `
      <div class="rzp-modal-box">
        <div class="rzp-modal-icon">₹</div>
        <h3 class="rzp-modal-title">Razorpay Checkout</h3>
        <p class="rzp-modal-text">
          Click below to complete your <strong>₹99 Demo Deposit</strong> securely on Razorpay.
        </p>
        <div class="rzp-modal-summary">
          <div><strong>Amount:</strong> ₹99 (100% Adjustable Deposit)</div>
          <div><strong>Gateway:</strong> Razorpay Secure Checkout</div>
          <div><strong>Link:</strong> <a href="${RAZORPAY_PAYMENT_URL}" target="_blank" style="color: #60a5fa; text-decoration: underline;">rzp.io/rzp/GdtBvmmE</a></div>
        </div>
        <a href="${RAZORPAY_PAYMENT_URL}" target="_blank" class="rzp-modal-close-btn" style="text-decoration: none; display: inline-block; text-align: center;">
          Open Razorpay Payment Page →
        </a>
      </div>
    `;
    document.body.appendChild(modalOverlay);

    // Close on overlay click
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.classList.remove("active");
      }
    });

    // Close on Esc key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modalOverlay.classList.contains("active")) {
        modalOverlay.classList.remove("active");
      }
    });
  }

  // 2. Attach click listeners to all .payment-btn elements
  const attachPaymentListeners = () => {
    const buttons = document.querySelectorAll(".payment-btn");
    buttons.forEach((btn) => {
      if (btn.dataset.rzpAttached) return;
      btn.dataset.rzpAttached = "true";

      // Ensure button has data-url or href set
      if (!btn.getAttribute("href") && btn.tagName.toLowerCase() === "a") {
        btn.setAttribute("href", RAZORPAY_PAYMENT_URL);
        btn.setAttribute("target", "_blank");
      }

      btn.addEventListener("click", (e) => {
        // If it's a button element or handled link
        const targetUrl = btn.getAttribute("href") || btn.getAttribute("data-url") || RAZORPAY_PAYMENT_URL;
        
        try {
          window.open(targetUrl, "_blank", "noopener,noreferrer");
        } catch (err) {
          console.warn("Popup blocked, showing modal link fallback:", err);
          const overlay = document.getElementById("rzp-placeholder-modal");
          if (overlay) {
            overlay.classList.add("active");
          }
        }
      });
    });
  };

  attachPaymentListeners();
});
