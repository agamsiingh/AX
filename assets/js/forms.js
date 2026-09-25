/* ═══════════════════════════════════════════
   AGMIEX — Forms: validation, loading/success/error states, Supabase inserts
   Forms opt in with form[data-form="contact" | "newsletter" | "demo"].
   ═══════════════════════════════════════════ */

import { CONFIG, whatsappLink, mailtoLink } from './config.js';
import { insertRow } from './supabase.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_PREFILL = 1200; // keep WhatsApp/mailto URLs well within browser limits

const ERROR_COPY = {
  offline: 'You seem to be offline. Check your connection and try again — your details are still in the form.',
  timeout: 'The request took too long to complete. Please try again in a moment.',
  default: 'Something went wrong on our side. Please try again, or reach us directly using the options below.',
};

/* ─── Validation ─── */

function fieldError(field) {
  const value = field.value.trim();
  const label = field.dataset.label || 'this field';

  if (field.required && !value) return `Please enter ${label}.`;
  if (!value) return '';
  if (field.type === 'email' && !EMAIL_RE.test(value)) return 'Please enter a valid email address, e.g. name@company.com.';
  if (field.minLength > 0 && value.length < field.minLength) {
    return `Please add a little more detail (at least ${field.minLength} characters).`;
  }
  if (field.maxLength > 0 && value.length > field.maxLength) {
    return `Please keep this under ${field.maxLength} characters.`;
  }
  if (field.pattern && !new RegExp(`^(?:${field.pattern})$`).test(value)) {
    return field.dataset.patternMessage || 'Please check the format.';
  }
  return '';
}

function showFieldError(field, message) {
  const errorEl = document.getElementById(`${field.id}-error`);
  if (message) field.setAttribute('aria-invalid', 'true');
  else field.removeAttribute('aria-invalid');
  if (errorEl) errorEl.textContent = message;
}

function validateField(field) {
  const message = fieldError(field);
  showFieldError(field, message);
  return !message;
}

function readForm(form) {
  const data = {};
  new FormData(form).forEach((value, key) => {
    data[key] = typeof value === 'string' ? value.trim() : value;
  });
  return data;
}

function truncate(text, max = MAX_PREFILL) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/* ─── Generic controller ─── */

/**
 * @param {HTMLFormElement} form
 * @param {{ submit: (data: object) => Promise<void>, success: (data: object) => void, failure: (err: Error, data: object) => void }} handlers
 */
function enhanceForm(form, handlers) {
  const fields = [...form.querySelectorAll('.input')];
  const submitBtn = form.querySelector('[type="submit"]');
  const honeypot = form.querySelector('.hp-field input');
  let attempted = false;
  let busy = false;

  form.noValidate = true;

  fields.forEach((field) => {
    field.addEventListener('blur', () => {
      if (attempted || field.value.trim()) validateField(field);
    });
    field.addEventListener('input', () => {
      if (attempted || field.getAttribute('aria-invalid') === 'true') validateField(field);
    });
  });

  const setBusy = (state) => {
    busy = state;
    form.setAttribute('aria-busy', String(state));
    if (submitBtn) {
      submitBtn.disabled = state;
      if (state) submitBtn.setAttribute('aria-busy', 'true');
      else submitBtn.removeAttribute('aria-busy');
    }
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy) return;
    attempted = true;

    const invalid = fields.filter((field) => !validateField(field));
    if (invalid.length) {
      invalid[0].focus();
      return;
    }

    const data = readForm(form);
    delete data.website;
    setBusy(true);
    try {
      // Bots fill the hidden honeypot field; pretend success without storing anything.
      if (!honeypot || !honeypot.value) await handlers.submit(data);
      handlers.success(data);
    } catch (err) {
      console.warn('[AGMIEX] Form submission failed:', err);
      handlers.failure(err, data);
    } finally {
      setBusy(false);
    }
  });

  return {
    reset() {
      attempted = false;
      form.reset();
      fields.forEach((field) => showFieldError(field, ''));
    },
  };
}

/* ─── Shared UI helpers ─── */

function showPanel(panel) {
  if (!panel) return;
  panel.hidden = false;
  const heading = panel.querySelector('[data-focus]');
  if (heading) {
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }
  panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showError(form, err, links) {
  const alert = form.querySelector('[data-form-error]');
  if (!alert) return;
  const message = alert.querySelector('[data-error-message]');
  if (message) message.textContent = ERROR_COPY[err && err.kind] || ERROR_COPY.default;
  Object.entries(links).forEach(([name, href]) => {
    const link = alert.querySelector(`[data-error-link="${name}"]`);
    if (link) link.href = href;
  });
  alert.hidden = false;
}

function hideError(form) {
  const alert = form.querySelector('[data-form-error]');
  if (alert) alert.hidden = true;
}

/* ─── Contact form ─── */

function initContactForm(form) {
  const card = form.closest('[data-form-card]') || form.parentElement;
  const successPanel = card.querySelector('[data-form-success]');

  const controller = enhanceForm(form, {
    async submit(data) {
      hideError(form);
      const service = data.service || 'General enquiry';
      const details = [
        data.message,
        '',
        '—',
        `Service: ${service}`,
        `Budget: ${data.budget || 'Not specified'}`,
        'Source: agmiex.com contact form',
      ].join('\n');
      await insertRow(CONFIG.tables.contact, {
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        subject: `Project enquiry — ${service}`,
        message: details,
      });
    },
    success() {
      form.hidden = true;
      showPanel(successPanel);
    },
    failure(err, data) {
      const summary = truncate(
        `Hi AGMIEX, I'm ${data.name}. I'm interested in: ${data.service || 'a project'}` +
          `${data.budget ? ` (budget ${data.budget})` : ''}.\n\n${data.message}\n\nEmail: ${data.email}` +
          `${data.phone ? `\nPhone: ${data.phone}` : ''}`,
      );
      showError(form, err, {
        whatsapp: whatsappLink(summary),
        email: mailtoLink(`Project enquiry — ${data.service || 'General'}`, summary),
      });
    },
  });

  card.querySelector('[data-form-reset]')?.addEventListener('click', () => {
    controller.reset();
    hideError(form);
    if (successPanel) successPanel.hidden = true;
    form.hidden = false;
    form.querySelector('.input')?.focus();
  });
}

/* ─── Newsletter ─── */

function initNewsletterForm(form) {
  const status = form.parentElement.querySelector('[data-form-status]');
  const setStatus = (text, tone) => {
    if (!status) return;
    status.textContent = text;
    if (tone) status.dataset.tone = tone;
    else delete status.dataset.tone;
  };

  const controller = enhanceForm(form, {
    async submit(data) {
      setStatus('Subscribing…');
      try {
        await insertRow(CONFIG.tables.newsletter, { email: data.email.toLowerCase() });
      } catch (err) {
        if (err.kind !== 'duplicate') throw err;
      }
    },
    success() {
      controller.reset();
      setStatus('Thanks — you’re on the list. We’ll only email when we have something useful to share.', 'success');
    },
    failure(err) {
      setStatus(
        err.kind === 'offline'
          ? 'You seem to be offline. Please try again once you’re connected.'
          : 'We couldn’t subscribe you right now. Please try again later.',
        'error',
      );
    },
  });

  form.addEventListener('input', () => {
    if (status && status.dataset.tone) setStatus('');
  });
}

/* ─── ₹99 website demo request ─── */

function initDemoForm(form) {
  const card = form.closest('[data-form-card]') || form.parentElement;
  const successPanel = card.querySelector('[data-form-success]');

  // "WhatsApp number is the same as my phone number"
  const mirror = form.querySelector('[data-mirror-source]');
  if (mirror) {
    const source = form.querySelector(`#${mirror.dataset.mirrorSource}`);
    const target = form.querySelector(`#${mirror.dataset.mirrorTarget}`);
    const sync = () => {
      if (!mirror.checked || !source || !target) return;
      target.value = source.value;
      if (target.getAttribute('aria-invalid') === 'true') validateField(target);
    };
    mirror.addEventListener('change', () => {
      if (target) target.readOnly = mirror.checked;
      sync();
    });
    source?.addEventListener('input', sync);
  }

  enhanceForm(form, {
    async submit(data) {
      hideError(form);
      await insertRow(CONFIG.tables.demo, {
        full_name: data.name,
        business_name: data.business,
        email: data.email,
        phone: data.phone,
        whatsapp: data.whatsapp,
        budget_range: data.budget || 'Not specified',
        requirements: data.requirements,
      });
    },
    success() {
      form.hidden = true;
      showPanel(successPanel);
    },
    failure(err, data) {
      const summary = truncate(
        `Hi AGMIEX, I'd like to book the ₹99 website demo.\n\nName: ${data.name}\nBusiness: ${data.business}` +
          `\nEmail: ${data.email}\nPhone: ${data.phone}\nWhatsApp: ${data.whatsapp}` +
          `\nBudget: ${data.budget || 'Not specified'}\n\nRequirements: ${data.requirements}`,
      );
      showError(form, err, {
        whatsapp: whatsappLink(summary),
        payment: CONFIG.razorpayDemoUrl,
      });
    },
  });
}

/* ─── Entry ─── */

const INITIALISERS = {
  contact: initContactForm,
  newsletter: initNewsletterForm,
  demo: initDemoForm,
};

export function initForms() {
  document.querySelectorAll('form[data-form]').forEach((form) => {
    const init = INITIALISERS[form.dataset.form];
    if (init) init(form);
  });
}
