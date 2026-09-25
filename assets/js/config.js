/* ═══════════════════════════════════════════
   AGMIEX — Site configuration (single source of truth for the front end)
   ═══════════════════════════════════════════ */

export const CONFIG = Object.freeze({
  supabaseUrl: 'https://enymspckgosfeqbjlkab.supabase.co',
  // Publishable (client-safe) key. Table access is enforced by Supabase Row Level Security.
  supabaseKey: 'sb_publishable_Rtrb16q9dXQcDlG5zbETXg_eP21EANh',
  tables: Object.freeze({
    contact: 'contact_submissions',
    newsletter: 'newsletter_subscribers',
    demo: 'demo_requests',
  }),
  whatsappNumber: '918534855501',
  email: 'agamsbusiness@gmail.com',
  razorpayDemoUrl: 'https://rzp.io/rzp/GdtBvmmE',
  requestTimeoutMs: 15000,
});

export function whatsappLink(text) {
  const base = `https://wa.me/${CONFIG.whatsappNumber}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function mailtoLink(subject, body) {
  const params = new URLSearchParams();
  if (subject) params.set('subject', subject);
  if (body) params.set('body', body);
  const query = params.toString().replace(/\+/g, '%20');
  return `mailto:${CONFIG.email}${query ? `?${query}` : ''}`;
}
