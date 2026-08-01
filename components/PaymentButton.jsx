"use client";

import React, { useState } from "react";

/**
 * PaymentButton Component (Production-Ready Next.js / React)
 * 
 * Connected directly to live Razorpay Payment Page: https://rzp.io/rzp/GdtBvmmE
 */
export default function PaymentButton({
  amount = 99,
  label = "Proceed to Payment ₹99",
  paymentUrl = "https://rzp.io/rzp/GdtBvmmE",
  className = "",
  onSuccess,
  disabled = false,
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePaymentClick = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (typeof window !== "undefined") {
        window.open(paymentUrl, "_blank", "noopener,noreferrer");
      }
      if (onSuccess) {
        onSuccess({
          paymentUrl,
          amount,
          status: "redirected",
        });
      }
    }, 400);
  };

  return (
    <button
      type="button"
      onClick={handlePaymentClick}
      disabled={disabled || isLoading}
      className={`payment-btn-react ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        padding: "16px 36px",
        fontSize: "1.05rem",
        fontWeight: 700,
        color: "#ffffff",
        background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        borderRadius: "9999px",
        boxShadow: "0 10px 30px rgba(59, 130, 246, 0.4), 0 0 20px rgba(99, 102, 241, 0.2)",
        cursor: disabled || isLoading ? "not-allowed" : "pointer",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        opacity: disabled ? 0.6 : 1,
        textDecoration: "none",
      }}
    >
      {isLoading ? (
        <>
          <span
            style={{
              width: "18px",
              height: "18px",
              border: "2px solid rgba(255, 255, 255, 0.3)",
              borderTopColor: "#ffffff",
              borderRadius: "50%",
              display: "inline-block",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span>Redirecting to Razorpay...</span>
        </>
      ) : (
        <>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
