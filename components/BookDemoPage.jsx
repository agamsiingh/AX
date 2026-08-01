"use client";

import React, { useState } from "react";
import PaymentButton from "./PaymentButton";

/**
 * BookDemoPage Component (Production-Ready Next.js / React)
 * 
 * Full dedicated page for "/book-demo"
 * Includes: Hero, How It Works (5-step timeline), What's Included, Demo Request Form, FAQ, Trust Badges, Final CTA.
 */
export default function BookDemoPage() {
  const [formData, setFormData] = useState({
    name: "",
    business: "",
    email: "",
    phone: "",
    whatsapp: "",
    budget: "< ₹50,000",
    requirements: "",
  });

  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  const steps = [
    {
      num: "01",
      title: "Submit Request Form",
      desc: "Tell us about your business, target audience, and preferred design style.",
    },
    {
      num: "02",
      title: "Discovery & Alignment",
      desc: "Our founder reviews your requirements to align on your revenue & brand goals.",
    },
    {
      num: "03",
      title: "Custom Homepage Crafting",
      desc: "We design a tailored, high-converting homepage mockup in 24–48 hours.",
    },
    {
      num: "04",
      title: "Interactive Demo Review",
      desc: "Walk through the live design preview and request feedback or refinements.",
    },
    {
      num: "05",
      title: "Full Project Kickoff",
      desc: "Love the design? We proceed to full build and deduct ₹99 from your invoice.",
    },
  ];

  const includedItems = [
    {
      title: "Custom Brand-Tailored Layout",
      desc: "Unique homepage design built around your industry's conversion psychology.",
    },
    {
      title: "Responsive Smartphone Mockup",
      desc: "Preview exactly how your customers will experience your site on mobile devices.",
    },
    {
      title: "High-Converting Hero & CTA Structure",
      desc: "Optimized copywriting & visual hierarchy designed to maximize leads and sales.",
    },
    {
      title: "Curated Color Palette & Modern Fonts",
      desc: "Executive aesthetics using Google typography and polished glassmorphism.",
    },
    {
      title: "Direct Founder Consultation",
      desc: "One-on-one architecture review with Agam Singh to discuss your product roadmap.",
    },
    {
      title: "100% Fee Adjustment Guarantee",
      desc: "Your ₹99 deposit is fully credited toward your final project invoice with zero loss.",
    },
  ];

  const faqs = [
    {
      q: "Why is the website demo priced at ₹99?",
      a: "We charge ₹99 to filter out non-serious inquiries while keeping the barrier virtually risk-free for ambitious entrepreneurs. Plus, 100% of the ₹99 is credited to your final invoice when we build your project.",
    },
    {
      q: "How long does it take to receive my demo?",
      a: "Our typical turnaround time is 24 to 48 hours after you submit your requirements form and complete the ₹99 deposit.",
    },
    {
      q: "What happens after I see the demo?",
      a: "If you love the design, we finalize the full scope of work, deduct ₹99 from your invoice, and begin development. If you decide not to proceed, there is zero obligation to continue.",
    },
    {
      q: "Is the ₹99 truly adjustable against the full project?",
      a: "Yes, absolutely! Whether your final project is ₹50,000 or ₹5,00,000, the exact ₹99 fee is subtracted from your contract total.",
    },
  ];

  return (
    <div className="demo-page-wrapper">
      {/* Hero Section */}
      <section className="demo-hero-section">
        <div className="container">
          <div className="demo-hero-content">
            <span className="section-badge">Risk-Free Trial Offer</span>
            <h1 className="demo-hero-title">
              See Your Custom Homepage Before Investing in a Full Build
            </h1>
            <p className="demo-hero-subtitle">
              Book a personalized, conversion-focused website demo for just{" "}
              <span className="highlight-price">₹99</span>. Delivered in 24–48 hours, fully adjustable when you proceed.
            </p>
            <div className="demo-hero-trust-row">
              <span>✔ 100% Adjustable Fee</span>
              <span>✔ 24–48 Hour Turnaround</span>
              <span>✔ No Full Obligation</span>
              <span>✔ Direct Founder Supervision</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works — 5 Step Timeline */}
      <section className="demo-timeline-section">
        <div className="container">
          <div className="section-header-center">
            <span className="section-badge">How It Works</span>
            <h2 className="section-title">Your 5-Step Path to a Premium Website</h2>
          </div>
          <div className="timeline-grid-5">
            {steps.map((step, idx) => (
              <div key={idx} className="timeline-card">
                <div className="timeline-step-num">{step.num}</div>
                <h3 className="timeline-step-title">{step.title}</h3>
                <p className="timeline-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included Grid */}
      <section className="demo-included-section">
        <div className="container">
          <div className="section-header-center">
            <span className="section-badge">What You Receive</span>
            <h2 className="section-title">Everything Included in Your ₹99 Demo</h2>
          </div>
          <div className="included-grid">
            {includedItems.map((item, idx) => (
              <div key={idx} className="included-card">
                <div className="included-check">✓</div>
                <div>
                  <h3 className="included-title">{item.title}</h3>
                  <p className="included-desc">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Request Form */}
      <section className="demo-form-section" id="request-form">
        <div className="container">
          <div className="demo-form-card">
            <div className="demo-form-header">
              <h2 className="demo-form-title">Submit Your Demo Requirements</h2>
              <p className="demo-form-subtitle">
                Fill in the details below so our engineering team can architect a homepage tailored to your business goals.
              </p>
            </div>

            {formSubmitted ? (
              <div className="demo-form-success">
                <div className="success-icon">✓</div>
                <h3>Requirements Received!</h3>
                <p>
                  Thank you! Proceed below to complete your ₹99 refundable/adjustable deposit to kick off your 24–48 hour design sprint.
                </p>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="demo-form-grid">
                <div className="form-group">
                  <label>Your Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Business / Company Name *</label>
                  <input
                    type="text"
                    name="business"
                    required
                    placeholder="e.g. Apex Tech Solutions"
                    value={formData.business}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>WhatsApp Number (For instant delivery) *</label>
                  <input
                    type="tel"
                    name="whatsapp"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.whatsapp}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Expected Project Budget</label>
                  <select name="budget" value={formData.budget} onChange={handleChange}>
                    <option value="< ₹50,000">&lt; ₹50,000</option>
                    <option value="₹50,000 - ₹1,00,000">₹50,000 — ₹1,00,000</option>
                    <option value="₹1,00,000 - ₹3,00,000">₹1,00,000 — ₹3,00,000</option>
                    <option value="₹3,00,000+">₹3,00,000+ (Enterprise)</option>
                  </select>
                </div>
                <div className="form-group form-group--full">
                  <label>Project Requirements & Vision *</label>
                  <textarea
                    name="requirements"
                    rows={4}
                    required
                    placeholder="Describe your target customers, key services, preferred colors, or reference websites you admire..."
                    value={formData.requirements}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group form-group--full" style={{ textAlign: "center" }}>
                  <button type="submit" className="demo-form-submit-btn">
                    Save Requirements & Continue to Payment
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="demo-faq-section">
        <div className="container">
          <div className="section-header-center">
            <span className="section-badge">Questions?</span>
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>
          <div className="demo-faq-list">
            {faqs.map((faq, idx) => (
              <details key={idx} className="demo-faq-item">
                <summary className="demo-faq-q">
                  <span>{faq.q}</span>
                  <span className="demo-faq-chevron">+</span>
                </summary>
                <div className="demo-faq-a">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="demo-trust-bar">
        <div className="container">
          <div className="trust-badges-row">
            <div className="trust-badge-item">
              <span className="check-icon">✓</span>
              <span>100% Adjustable Fee</span>
            </div>
            <div className="trust-badge-item">
              <span className="check-icon">✓</span>
              <span>24–48 Hour Turnaround</span>
            </div>
            <div className="trust-badge-item">
              <span className="check-icon">✓</span>
              <span>No Full Obligation</span>
            </div>
            <div className="trust-badge-item">
              <span className="check-icon">✓</span>
              <span>Direct Founder Supervision</span>
            </div>
            <div className="trust-badge-item">
              <span className="check-icon">✓</span>
              <span>Secure Payments</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA with Reusable PaymentButton */}
      <section className="demo-final-cta-section">
        <div className="container">
          <div className="demo-final-cta-card">
            <div className="demo-final-glow" />
            <h2 className="demo-final-title">
              Ready to See Your Brand's New Revenue-Driven Homepage?
            </h2>
            <p className="demo-final-subtitle">
              Secure your 24–48 hour design slot today. Your ₹99 deposit is fully credited toward your full development build.
            </p>
            <div className="demo-final-btn-wrapper">
              <PaymentButton amount={99} label="Proceed to Payment ₹99" />
            </div>
            <div className="demo-final-guarantee">
              <span>🔒 256-Bit Encrypted Sandbox Checkout</span> •{" "}
              <span>⚡ Immediate Sprint Kickoff</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
