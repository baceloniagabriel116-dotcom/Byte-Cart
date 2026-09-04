// Add your Supabase project values here, or inject them before this script.
const SUPABASE_URL = window.BYTE_CART_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = window.BYTE_CART_SUPABASE_ANON_KEY || "";

const supabaseClient = window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const isSupabaseConfigured = Boolean(supabaseClient);