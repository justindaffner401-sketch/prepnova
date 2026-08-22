# Maintaining CampVoice

This is the "what will need attention, and what to do about it" document. It assumes
you are not a software engineer, and that you will be working with an AI coding
assistant when something needs changing.

---

## The short version

Five things will eventually need your attention:

1. **Anthropic changes something about their models.** Roughly once or twice a year.
2. **Stripe changes their API.** Rare, and they give long notice.
3. **Supabase changes something.** Rare. They email you first.
4. **Security updates to the code libraries.** Every month or two.
5. **Your own costs drift.** Worth a glance monthly.

Nothing here is urgent-at-3am work. Set aside an hour a month and you are fine.

---

## Your monthly hour

Do these five things once a month, in this order.

### 1. Check the money

- **Anthropic console → Usage.** Is spending roughly what you expected per customer?
  A sudden jump usually means one camp is generating a lot, which the app already
  limits, or that you changed a model.
- **Stripe → Dashboard.** Failed payments? Anyone stuck on `past_due`?
- **Supabase → Settings → Usage.** Approaching a plan limit?
- **Vercel → Usage.** Same question.

### 2. Check for errors

Open **Vercel → your project → Logs** and filter to the last 30 days. You are looking
for anything with `"level":"error"`. A handful is normal. A pattern is not.

Then open CampVoice's own **Admin** page (you need `is_admin` set on your profile).
It shows recent AI failures, generation counts and estimated cost per camp.

### 3. Check that AI generation still works

Sign in as a real camp (or the demo camp) and generate one piece of content. This takes
ninety seconds and catches almost everything: an expired API key, an out-of-credit
account, a model that was retired.

### 4. Check that payments still work

In Stripe → **Developers → Webhooks**, open your endpoint. Every recent delivery should
show a green 200. Red entries mean the app did not record a payment — see
"Payments stopped recording" below.

### 5. Update dependencies

```bash
cd campvoice
npm audit
```

If it reports vulnerabilities:

```bash
npm audit fix          # safe, automatic fixes only
npm run verify         # MUST pass before you deploy
```

If `npm audit fix` cannot fix something, or `npm run verify` fails afterwards, stop and
get help. A known vulnerability in a library you do not use is much less dangerous than
a broken deploy.

---

## Updating safely: the rule

**Never deploy anything that has not passed `npm run verify` on your own machine.**

```bash
cd campvoice
npm run verify
```

That runs the type checker, the linter, all the tests, and a full production build.
If all four pass, deploying is low risk. If any fails, deploying is a coin flip.

For a bigger change, use a preview first: push to a branch instead of your main branch,
and Vercel gives you a temporary URL to test on. Merge only when it works.

---

## The five things that will need attention

### 1. Anthropic changes a model

**How you will find out:** an email from Anthropic, or generation starts failing with
an error mentioning a model name.

**What to do:** set `AI_GENERATION_MODEL` in Vercel to the new model name and redeploy.
No code change. Then generate a few pieces of content and *read them* — different
models have different voices, and the writing rules in `src/lib/ai/system-prompt.ts`
may need to be a little more explicit for a new one.

**Do not** let a model change quietly downgrade your quality. The model that writes the
content is the product.

### 2. Stripe changes their API

**How you will find out:** an email from Stripe, months ahead.

**What to do:** the API version CampVoice uses is pinned in `src/lib/stripe/client.ts`
(look for `apiVersion`). Upgrading means changing that string, running
`npm run verify`, and testing a full subscription in Stripe's Test mode before
deploying. Stripe's own migration notes tell you what changed.

### 3. Supabase changes something

**How you will find out:** an email from Supabase.

**What to do:** usually nothing. If they deprecate a client library, update it with
`npm install @supabase/supabase-js@latest @supabase/ssr@latest`, then
`npm run verify`, then test signing in, signing out, and a password reset.

### 4. Security updates

Covered in the monthly hour above. If you get a GitHub security alert, treat it the
same way: `npm audit fix`, `npm run verify`, deploy.

### 5. Your costs drift

The main lever is the AI. If cost per customer is higher than you want:

- Set `AI_UTILITY_MODEL=claude-haiku-4-5`. This moves the background work — building
  Camp DNA, weekly suggestions — to a cheaper model, and customers will not notice.
- Lower `LIMIT_GENERATIONS_PER_DAY` if one camp is genuinely generating hundreds a day.
- Do **not** downgrade `AI_GENERATION_MODEL` to save money without reading the output
  carefully first. That is the thing people pay for.

---

## What errors to watch for

These are worth acting on. Anything else is usually noise.

| In the logs | What it means | What to do |
|---|---|---|
| `ai.generate_text` with `not_configured` | The Anthropic key is missing or wrong. | Check `ANTHROPIC_API_KEY` in Vercel. |
| `ai.generate_text` with `rate_limited` | Anthropic is throttling you. | Usually self-resolves. If constant, raise your rate limit with Anthropic. |
| `stripe.webhook_bad_signature` | Something is POSTing to your webhook that is not Stripe, **or** your signing secret is wrong. | Check `STRIPE_WEBHOOK_SECRET` matches the endpoint in Stripe. Occasional entries are internet noise and are harmless — the request was rejected. |
| `stripe.sync_unmatched_subscription` | A Stripe subscription arrived that we could not match to a camp. | Rare. Look up the subscription in Stripe and check its metadata has an `organization_id`. |
| `usage.daily_limit_check_failed` | The database was briefly unreachable when checking limits. | Harmless in ones and twos — the app allows the request rather than blocking a customer. A pattern means a database problem. |
| `api.upload_storage_failed` | Supabase Storage rejected a file. | Check the storage bucket exists and that you are not over your plan's storage limit. |

---

## Common situations

### AI generation stopped working

1. Check [status.anthropic.com](https://status.anthropic.com). If it is them, wait.
2. Check your Anthropic account has credit.
3. Check `ANTHROPIC_API_KEY` in Vercel has not expired.
4. Check Vercel logs for the specific reason.

Customers see a friendly message throughout, and nothing they have saved is lost.

### Payments stopped recording

Symptom: someone pays but the app still says their trial ended.

1. Stripe → **Developers → Webhooks** → your endpoint → recent deliveries.
2. Red entries with a 400 mean the signature check failed: `STRIPE_WEBHOOK_SECRET` in
   Vercel does not match this endpoint's signing secret. Fix it and redeploy.
3. Red entries with a 500 mean our code failed. Check Vercel logs.
4. Once fixed, click **Resend** on the failed events. Stripe also retries automatically
   for up to three days.

**As an immediate fix for one customer** while you investigate: in Supabase → Table
Editor → `subscriptions`, you can set that camp's `status` to `active` by hand. Undo it
once the webhook is working, so Stripe stays the authority.

### A customer says the AI got a fact wrong

This is usually a Camp DNA problem rather than a bug. Ask them to open **Camp DNA** and
check what CampVoice believes about them. Most "it said the wrong thing" reports come
from an out-of-date date, missing terminology, or a Camp DNA built before they uploaded
their real writing. **Rebuild Camp DNA** after adding material usually fixes it.

If it invented something that was never provided — a date, a program, a price — that
*is* a bug worth reporting, because the system prompt forbids it explicitly.

### A customer wants their account deleted

Account deletion is handled by a person on purpose, so it cannot happen by accident.

1. Confirm the request came from the email address on the account.
2. Offer them the export first (**Settings → Your data → Download my data**).
3. In Supabase → **Authentication → Users**, delete the user. Everything belonging to
   their camp is removed automatically by the database's cascade rules.
4. Confirm to them in writing when it is done.

---

## How to roll back a deployment

This is the most useful thing in this document.

1. Vercel → your project → **Deployments**.
2. Find the last deployment that worked.
3. Click **⋯ → Promote to Production**.

That is it. The site is back within about thirty seconds. Do this first and diagnose
afterwards — there is no prize for debugging while customers are affected.

**One caveat:** rolling back the *code* does not roll back the *database*. If the
broken deploy included a migration that changed the database, you will also need to
undo that. This is why migrations should only ever add things, never remove or rename
them, until you are sure the change is good.

---

## How to inspect logs

- **Vercel → your project → Logs.** Everything the server printed. Filter by time, or
  search for `"level":"error"`. Each entry is a single line of JSON, which is ugly to
  read but easy to search.
- **Supabase → Logs.** Database queries and auth events. Useful for "why can this user
  not sign in".
- **Stripe → Developers → Events.** Every event Stripe generated and whether we
  accepted it.

CampVoice deliberately never shows technical detail to a customer, so the logs are the
only place it exists. Get comfortable with the Vercel one.

---

## How to verify payments are working

Once a month, or after any billing change:

1. In Stripe, switch to **Test mode**.
2. Create a fresh CampVoice account on a preview deployment.
3. Subscribe with the test card `4242 4242 4242 4242`.
4. Check that CampVoice shows the plan as active within a few seconds.
5. Open **Settings → Billing → Manage billing** and confirm the Stripe portal opens.
6. Cancel in the portal, and confirm CampVoice shows the plan ending.

That covers every path that matters. It takes about five minutes.

---

## How to verify AI generation is working

1. Sign in as the demo camp (`npm run seed:demo` creates it locally).
2. Generate a Tour Follow-Up.
3. Check three things:
   - Does it use the camp's own terminology? (Camp Evergreen says "bunks", not "cabins".)
   - Did it avoid inventing anything you did not tell it?
   - Does it sound like a person?
4. Click **Make Shorter** and confirm the revision keeps the same facts.

If the answer to any of those is no, the place to look is
`src/lib/ai/system-prompt.ts` and the camp's Camp DNA — not the model.

---

## How to restore from a backup

**Before you need this, do it once as a drill.** A backup you have never restored is a
hope, not a backup.

**On a paid Supabase plan:** Supabase → **Database → Backups** → choose a point in time
→ restore. Supabase handles it.

**From a manual dump:**

```bash
psql "YOUR_CONNECTION_STRING" < campvoice-backup-2026-08-22.sql
```

**After any restore:**

1. Sign in and check a camp's data looks right.
2. Check the `subscriptions` table matches Stripe. If the restore went back in time,
   some subscriptions may be stale — in Stripe, resend recent webhook events to bring
   them back in line.
3. Tell affected customers what happened and what, if anything, they lost.

---

## When to get help

Get help rather than guessing if:

- You are about to change anything in `supabase/migrations/`
- You are about to change anything in `src/lib/auth/` or `src/lib/supabase/admin.ts`
- `npm run verify` fails and you do not understand why
- A customer reports seeing another camp's data (**treat this as an emergency**)
- You suspect a key has leaked (rotate it immediately in the relevant dashboard, then
  update it in Vercel and redeploy)

The rest of it — copy, pricing, templates, models — you can change yourself, and the
README explains how.
