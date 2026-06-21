/* ============================================
   AGMIEX Supabase Client Configuration
   ============================================ */

const SUPABASE_URL = 'https://enymspckgosfeqbjlkab.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Rtrb16q9dXQcDlG5zbETXg_eP21EANh';

// The CDN script exposes window.supabase with a createClient method
let supabaseClient = null;

if (window.supabase && window.supabase.createClient) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
  console.error('Supabase library not loaded correctly. Check script tag imports.');
}

export const supabase = supabaseClient;
