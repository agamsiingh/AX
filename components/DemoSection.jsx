"use client";

import React, { useState, useEffect } from "react";

/**
 * DemoSection Component (Production-Ready Next.js / React)
 * 
 * Features:
 * - 🔥 Only 1 Slot Left Scarcity Badge
 * - ~~₹10,000~~ -> ₹99 Heavy Discount Cut Price
 * - 30-Second Countdown Timer for high-converting urgency
 * - 4 Feature Cards & CTA
 */
export default function DemoSection() {
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedSec = timeLeft < 10 ? `0${timeLeft}` : `${timeLeft}`;

  return (
    <section className="demo-banner-section" id="book-demo-offer">
      <div className="demo-banner-container">
        <div className="demo-banner-card reveal">
          <div className="demo-banner-glow" />

          {/* Header */}
          <div className="demo-banner-header">
            <span className="demo-banner-badge">
              <span className="demo-banner-badge-dot" />
              Special Trial Sprint — Try Before You Build
            </span>
            <h2 className="demo-banner-heading">
              Book Your Personalized Website Demo for Just <span>₹99</span>
            </h2>
            <p className="demo-banner-subheading">
              See a custom homepage design for your business before investing in a full project. The ₹99 will be adjusted if you proceed.
            </p>

            {/* URGENCY & SCARCITY BAR (ONLY 1 LEFT, ₹10,000 CUT PRICE, 30S TIMER) */}
            <div className="demo-urgency-wrapper">
              <div className="scarcity-badge-pulse">
                <span className="scarcity-dot" />
                🔥 Only 1 Slot Left Today!
              </div>

              <div className="price-strikethrough-box">
                <span className="price-old">₹10,000</span>
                <span className="price-new-heavy">₹99</span>
                <span className="discount-pill-tag">Heavy 99% Discount</span>
              </div>

              <div className="timer-box-30s">
                <span>⏱️ Offer Expires In:</span>
                <span className="timer-digits-30s">00:{formattedSec}</span>
              </div>
            </div>
          </div>

          {/* 4 Feature Cards */}
          <div className="demo-feature-grid">
            <div className="demo-feature-card">
              <div className="demo-feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </div>
              <h3 className="demo-feature-title">Personalized Design</h3>
              <p className="demo-feature-desc">Custom homepage concept crafted specifically for your brand & industry.</p>
            </div>

            <div className="demo-feature-card">
              <div className="demo-feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <h3 className="demo-feature-title">24–48 Hour Delivery</h3>
              <p className="demo-feature-desc">Receive your interactive design mockup within 2 business days.</p>
            </div>

            <div className="demo-feature-card">
              <div className="demo-feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
              </div>
              <h3 className="demo-feature-title">Mobile Responsive</h3>
              <p className="demo-feature-desc">Flawless layout optimization across smartphones, tablets, and desktops.</p>
            </div>

            <div className="demo-feature-card">
              <div className="demo-feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <h3 className="demo-feature-title">₹99 Adjustable</h3>
              <p class="demo-feature-desc">100% of your ₹99 deposit is subtracted from your full project invoice.</p>
            </div>
          </div>

          {/* CTA Row */}
          <div className="demo-banner-cta-row">
            <a href="/book-demo" className="demo-banner-cta-btn">
              <span>Book Demo Now</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </a>
            <div className="demo-banner-guarantee">
              <span className="check-pill">✓ Zero Full Obligation</span>
              <span className="check-pill">✓ Direct Founder Consultation</span>
              <span className="check-pill">✓ 100% Adjustable against Project</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
