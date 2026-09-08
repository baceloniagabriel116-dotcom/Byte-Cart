const SUPABASE_URL = window.BYTE_CART_SUPABASE_URL || "https://fnsaandhkyaoqgsqupyf.supabase.co";
const SUPABASE_ANON_KEY = window.BYTE_CART_SUPABASE_ANON_KEY || "sb_publishable_qyUXs5BcODDWojx3B6veMA_1xsyWtZY";

const supabaseClient = window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const isSupabaseConfigured = Boolean(supabaseClient);
