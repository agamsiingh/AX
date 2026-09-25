-- ═══════════════════════════════════════════════════════════════════════════
-- AGMIEX — Row Level Security for the website forms  (REVIEW, then run manually
-- in the Supabase SQL editor; nothing in the website applies this automatically)
--
-- The site submits with the publishable (anon) key and only ever INSERTs:
--   contact form  → public.contact_submissions   (name, email, phone, subject, message)
--   newsletter    → public.newsletter_subscribers (email)
--   ₹99 demo form → public.demo_requests          (full_name, business_name, email,
--                                                   phone, whatsapp, budget_range, requirements)
-- These policies let anonymous visitors insert rows but never read, update or
-- delete them. Read submissions from the Supabase dashboard or a server-side key.
--
-- ⚠ Enabling RLS blocks any existing tool that reads these tables with the anon
--   key. Check for such tools before running this.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.contact_submissions    enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.demo_requests          enable row level security;

drop policy if exists "Website can submit contact form" on public.contact_submissions;
create policy "Website can submit contact form"
  on public.contact_submissions for insert to anon
  with check (
    char_length(coalesce(name, '')) between 1 and 150
    and char_length(coalesce(email, '')) between 3 and 254
    and char_length(coalesce(message, '')) <= 5000
  );

drop policy if exists "Website can subscribe to newsletter" on public.newsletter_subscribers;
create policy "Website can subscribe to newsletter"
  on public.newsletter_subscribers for insert to anon
  with check (char_length(coalesce(email, '')) between 3 and 254);

drop policy if exists "Website can submit demo requests" on public.demo_requests;
create policy "Website can submit demo requests"
  on public.demo_requests for insert to anon
  with check (
    status = 'pending'
    and is_deposit_paid = false
    and char_length(requirements) <= 5000
  );

-- Optional: stop duplicate newsletter sign-ups (the site already treats a
-- duplicate as "you're subscribed"). Fails if duplicates already exist.
-- create unique index if not exists newsletter_subscribers_email_key
--   on public.newsletter_subscribers (lower(email));
