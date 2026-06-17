-- PrepNova — Supabase Row Level Security
-- =============================================================================
-- This project has no migration tooling, so apply this by hand:
--   Supabase dashboard → SQL Editor → paste this file → Run.
-- It is idempotent (safe to run more than once).
--
-- WHY THIS MATTERS: the browser reads the `subscriptions` table directly with
-- the PUBLIC anon key (see src/lib/useAuth.js). The client filters by user_id,
-- but a client-side filter is NOT a security boundary — without RLS, anyone
-- with the (public) anon key could read every row. RLS is what actually scopes
-- each user to their own row.
--
-- The Stripe webhook and the billing API routes write to this table using the
-- SERVICE ROLE key, which BYPASSES RLS — so we intentionally do NOT add any
-- client insert/update/delete policies. Writes stay server-only; the browser
-- gets read-only access to its own row.
-- =============================================================================

-- The only user-data table in this app today.
alter table public.subscriptions enable row level security;

-- A signed-in user may read ONLY their own subscription row.
drop policy if exists "Users can read their own subscription" on public.subscriptions;
create policy "Users can read their own subscription"
  on public.subscriptions
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Intentionally NO insert/update/delete policies for authenticated/anon:
-- all writes happen server-side via the service-role key (Stripe webhook +
-- billing endpoints), which bypasses RLS. With RLS enabled and no write policy,
-- the browser cannot insert/update/delete subscription rows.

-- =============================================================================
-- AFTER RUNNING, VERIFY IN THE DASHBOARD:
--   • Table Editor → subscriptions → "RLS enabled" badge is ON.
--   • Authentication → Policies → only the single SELECT policy above exists.
--   • If you later add tables that store user data (results, notes, etc.),
--     enable RLS on them too and add matching auth.uid() = <owner_col> policies.
-- NOTE: this app currently stores practice results/progress in the browser
--   (localStorage), NOT in Supabase, so there is no results table to secure yet.
-- =============================================================================
