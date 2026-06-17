# PrepNova — Data & Compliance Notes

Internal reference for what data the app handles and what still needs the owner's
attention. **This is not legal advice and not a compliance certification.**
Items in **[BRACKETS]** need you (the owner) to confirm/fill in.

## Data collected & where it's stored

| Data | Where | Notes |
|---|---|---|
| Account email + password | Supabase Auth | Password stored hashed by Supabase; we never see it. |
| Subscription status, Stripe customer/subscription IDs | Supabase `subscriptions` table | No card numbers stored. |
| Practice scores / progress | **Browser localStorage only** | Never uploaded to our servers. |
| Cookie choice + auth session | Browser localStorage | Essential. |
| Test/subject for generation | Sent to our API → Anthropic/OpenAI | Not persisted as personal data. |
| Usage analytics | Vercel Web Analytics | Cookieless; loads only after consent. |
| Card / payment details | **Stripe only** | We never receive or store card data. |

## Why we collect it
Authentication, generating/verifying practice questions, processing subscriptions,
preventing abuse, and basic product analytics.

## Third-party processors
- **Supabase** — auth + database
- **Stripe** — payments
- **Vercel** — hosting + analytics
- **Anthropic** — question generation
- **OpenAI** — question verification
- **Resend** — transactional email (confirmations, password resets)

## Cookies / tracking
- **Essential:** Supabase auth session + cookie-choice flag (localStorage). Not gated.
- **Non-essential:** Vercel Web Analytics (cookieless) — gated behind consent
  (`src/lib/cookieConsent.js` + `ConsentedAnalytics.jsx`). Rejection = analytics never loads.
- No advertising, tracking pixels, or third-party marketing cookies.

## Retention & deletion
- Account/subscription data: kept while active + as needed for tax/legal. **[CONFIRM PERIOD]**
- Browser practice data: until the user clears browser storage.
- **Deletion requests:** users email **[CONTACT EMAIL]**; this is documented in the Privacy Policy.
  Manual process today (delete the Supabase auth user + their `subscriptions` row,
  and cancel any active Stripe subscription). **[CONFIRM / consider a self-serve flow later]**
- Export: no automated export today. **[CONFIRM if needed for your jurisdiction]**

## Security controls in place
- HTTPS everywhere (HSTS header).
- Security headers in `vercel.json` (nosniff, X-Frame-Options DENY, Referrer-Policy,
  Permissions-Policy, and a **report-only** CSP — see below).
- Supabase RLS on `subscriptions` (see `supabase/rls-policies.sql` — **apply manually**).
- Secrets server-only; only the public anon key + public Vite vars ship to the client.
- Rate limiting + input validation on API routes (`api/_security.js`).
- Stripe webhook signature verification.

## RLS status
- `subscriptions` — RLS policy authored in `supabase/rls-policies.sql`. **MUST be run in the
  Supabase SQL editor** and verified in the dashboard (this app has no migration runner).
- No other user-data tables exist yet (practice data is client-side).

## Environment variables involved
Public (client, `VITE_` — safe to expose): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
`VITE_DESMOS_API_KEY` (optional).
Server-only (Vercel env, **never** `VITE_`): `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` (optional),
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`,
`STRIPE_YEAR_PRICE_ID`, `STRIPE_LIFETIME_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`.
Optional rate-limit tuning: `RATE_LIMIT_GENERATE_MAX`, `RATE_LIMIT_GENERATE_WINDOW_MS`,
`RATE_LIMIT_BILLING_MAX`, `RATE_LIMIT_BILLING_WINDOW_MS`.

## Manual items to confirm
- [ ] Run `supabase/rls-policies.sql` and verify RLS is ON for `subscriptions`.
- [ ] Fill all **[BRACKETED]** placeholders in `/privacy` and `/terms`.
- [ ] After verifying the live site, flip the CSP header from
      `Content-Security-Policy-Report-Only` to `Content-Security-Policy` in `vercel.json`.
- [ ] Set up Anthropic + OpenAI billing auto-reload (so generation never breaks).
- [ ] Decide retention periods and a deletion SOP.

## Compliance items needing legal review
- Use by minors/students (COPPA, FERPA, U.S. state privacy laws, GDPR/UK-GDPR if applicable).
  **No framework compliance is claimed; have counsel review before relying on the legal pages.**
