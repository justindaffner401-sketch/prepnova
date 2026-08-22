import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client.
 *
 * DANGER: this client bypasses Row Level Security. Only import it from trusted
 * server code that has already checked who the caller is — never from a
 * component, and never from anything that runs in the browser.
 *
 * Used by: the Stripe webhook (no user session exists) and internal usage
 * logging.
 */
export function createAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase service-role credentials are not configured.");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
