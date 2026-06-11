import { createClient } from "@supabase/supabase-js";

// Public values — safe to ship in the client bundle. Set in Vercel (and
// optionally .env.local for dev) as VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Null when Supabase isn't configured — the app degrades gracefully. */
export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export const authEnabled = Boolean(supabase);
