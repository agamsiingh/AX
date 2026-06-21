/* ============================================
   AGMIEX Forms & Booking Scheduler Module
   ============================================ */

import { supabase } from './supabase-client.js';

export function initForms() {
  // Contact Form
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', handleContactForm);
  }

  // Newsletter Form
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', handleNewsletter);
  }

  // Interactive Booking Calendar Scheduler
  initScheduler();
}

function handleContactForm(e) {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);
  const fields = Object.fromEntries(data.entries());

  let isValid = true;
  const required = form.querySelectorAll('[required]');
  required.forEach(field => {
    if (!field.value.trim()) {
      isValid = false;
      field.style.borderColor = 'var(--accent-pink)';
      field.addEventListener('input', () => {
        field.style.borderColor = '';
      }, { once: true });
    }
  });

  const emailField = form.querySelector('[type="email"]');
  if (emailField && emailField.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value)) {
    isValid = false;
    emailField.style.borderColor = 'var(--accent-pink)';
  }

  if (!isValid) {
    showToast('Please fill in all required fields correctly.', 'error');
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Submitting...';
  submitBtn.disabled = true;

  if (!supabase) {
    showToast('Submission failed: database client not initialized.', 'error');
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
    return;
  }

  supabase
    .from('contact_inquiries')
    .insert([
      {
        name: fields.name || '',
        email: fields.email || '',
        company: fields.company || '',
        budget: fields.budget || '',
        service: fields.service || '',
        message: fields.message || ''
      }
    ])
    .then(({ error }) => {
      if (error) {
        console.error('Supabase Contact Insert Error:', error);
        showToast(`Error: ${error.message || 'Submission failed'}`, 'error');
      } else {
        showToast('Inquiry submitted successfully! A consulting lead will contact you soon.', 'success');
        form.reset();
      }
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    })
    .catch(err => {
      console.error('Contact catch error:', err);
      showToast('Network error: submission failed.', 'error');
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    });
}

function handleNewsletter(e) {
  e.preventDefault();
  const input = e.target.querySelector('input');
  if (!input.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
    showToast('Please enter a valid email address.', 'error');
    return;
  }

  const btn = e.target.querySelector('button');
  const originalText = btn.textContent;
  btn.textContent = '...';
  btn.disabled = true;

  if (!supabase) {
    showToast('Subscription failed: database client not initialized.', 'error');
    btn.textContent = originalText;
    btn.disabled = false;
    return;
  }

  supabase
    .from('newsletter_subscribers')
    .insert([{ email: input.value }])
    .then(({ error }) => {
      if (error) {
        console.error('Supabase Newsletter Insert Error:', error);
        showToast(`Error: ${error.message || 'Subscription failed'}`, 'error');
      } else {
        showToast('Subscribed successfully! 🎉', 'success');
        input.value = '';
      }
      btn.textContent = originalText;
      btn.disabled = false;
    })
    .catch(err => {
      console.error('Newsletter catch error:', err);
      showToast('Network error: subscription failed.', 'error');
      btn.textContent = originalText;
      btn.disabled = false;
    });
}

function initScheduler() {
  const calendarGrid = document.getElementById('calendar-grid');
  const slotsGrid = document.getElementById('slots-grid');
  const bookingForm = document.getElementById('booking-details-form');

  if (!calendarGrid || !bookingForm) return;

  // Build calendar days for June 2026 (Starts on Monday June 1st)
  for (let day = 1; day <= 30; day++) {
    const span = document.createElement('span');
    span.className = 'scheduler__day';
    span.textContent = day;

    // Disable weekends for corporate consultation scheduling (Sat = 6, Sun = 7)
    const dayOfWeek = day % 7;
    if (dayOfWeek === 6 || dayOfWeek === 0) {
      span.classList.add('scheduler__day--disabled');
    } else {
      span.classList.add('scheduler__day--active');
      span.addEventListener('click', () => {
        document.querySelectorAll('.scheduler__day--selected').forEach(el => {
          el.classList.remove('scheduler__day--selected');
        });
        span.classList.add('scheduler__day--selected');
        document.getElementById('selected-date').value = `2026-06-${day.toString().padStart(2, '0')}`;
      });
    }
    calendarGrid.appendChild(span);
  }

  // Handle time slots selection
  const slots = document.querySelectorAll('.scheduler__slot');
  slots.forEach(slot => {
    slot.addEventListener('click', () => {
      document.querySelectorAll('.scheduler__slot--selected').forEach(el => {
        el.classList.remove('scheduler__slot--selected');
      });
      slot.classList.add('scheduler__slot--selected');
      document.getElementById('selected-time').value = slot.textContent.trim();
    });
  });

  // Handle Booking submission
  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const date = document.getElementById('selected-date').value;
    const time = document.getElementById('selected-time').value;
    const email = document.getElementById('booking-email').value;

    if (!date) {
      showToast('Please select a consultation date from the calendar.', 'error');
      return;
    }
    if (!time) {
      showToast('Please select a strategy time slot.', 'error');
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Please enter a valid work email.', 'error');
      return;
    }

    const submitBtn = bookingForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Scheduling...';
    submitBtn.disabled = true;

    if (!supabase) {
      showToast('Booking failed: database client not initialized.', 'error');
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      return;
    }

    supabase
      .from('consultations')
      .insert([{ date, time, email }])
      .then(({ error }) => {
        if (error) {
          console.error('Supabase Booking Insert Error:', error);
          showToast(`Error: ${error.message || 'Scheduling failed'}`, 'error');
        } else {
          showToast(`Consultation confirmed for ${date} at ${time}! Details sent to ${email}.`, 'success');
          bookingForm.reset();
          document.querySelectorAll('.scheduler__day--selected').forEach(el => el.classList.remove('scheduler__day--selected'));
          document.querySelectorAll('.scheduler__slot--selected').forEach(el => el.classList.remove('scheduler__slot--selected'));
          document.getElementById('selected-date').value = '';
          document.getElementById('selected-time').value = '';
        }
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      })
      .catch(err => {
        console.error('Booking catch error:', err);
        showToast('Network error: booking failed.', 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      });
  });
}

function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : '!'}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100px)';
    toast.style.transition = 'all 0.3s var(--ease-out)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
