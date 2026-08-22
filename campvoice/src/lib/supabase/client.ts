"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for the browser. Uses the PUBLIC anon key only — this key is
 * safe to ship because every table is protected by Row Level Security.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
