# CampVoice

**Your camp's voice, ready whenever you need it.**

CampVoice is a web application that helps summer camps write their own communications.
A camp teaches it about itself once, and from then on it can produce parent emails,
tour follow-ups, social posts, newsletters and staff communications that sound like
that camp.

This README is written for a non-technical founder. If a step feels like jargon,
it is my fault, not yours — the [Troubleshooting](#troubleshooting) section at the
bottom covers what usually goes wrong.

---

## Table of contents

1. [What CampVoice uses](#what-campvoice-uses)
2. [How to run it on your own computer](#how-to-run-it-on-your-own-computer)
3. [Required environment variables](#required-environment-variables)
4. [Supabase setup](#supabase-setup)
5. [Stripe setup](#stripe-setup)
6. [Anthropic API setup](#anthropic-api-setup)
7. [Deployment](#deployment)
8. [Database migrations](#database-migrations)
9. [How AI generation works](#how-ai-generation-works)
10. [How Camp DNA works](#how-camp-dna-works)
11. [How to change pricing](#how-to-change-pricing)
12. [How to change the AI model](#how-to-change-the-ai-model)
13. [How to add a new content template](#how-to-add-a-new-content-template)
14. [Troubleshooting](#troubleshooting)
15. [How to back up the database](#how-to-back-up-the-database)
16. [What you should never change without understanding it](#what-you-should-never-change-without-understanding-it)

---

## What CampVoice uses

Five outside services. Four of them cost money once you have customers; one is free
to start.

| What it is | What it does for CampVoice | Where to manage it |
|---|---|---|
| **Next.js** | The application itself — the website, the app, and the small bits of server code. | This repository |
| **Supabase** | Stores everything: accounts, camp information, uploaded files, saved drafts. Also handles signing in. | [supabase.com](https://supabase.com) |
| **Stripe** | Takes the money. Subscriptions, cards, invoices, cancellations. | [stripe.com](https://stripe.com) |
| **Anthropic (Claude)** | The AI that actually writes the content. | [console.anthropic.com](https://console.anthropic.com) |
| **Vercel** | Puts the website on the internet. | [vercel.com](https://vercel.com) |

Nothing else. There is no separate search service, no queue, no analytics company,
no email-sending service. That is deliberate: fewer moving parts means fewer things
that can break at 11pm.

> **Note:** CampVoice lives in the `campvoice/` folder of this repository, which also
> contains a separate, unrelated application. CampVoice has its own `package.json` and
> is deployed as its own Vercel project. Nothing here affects the other application.

---

## How to run it on your own computer

You need [Node.js](https://nodejs.org) version 20 or newer. Download the "LTS"
version if you do not have it.

Open a terminal, then:

```bash
cd campvoice          # from the repository folder
npm install           # downloads everything the app needs (once)
cp .env.example .env.local
```

Now open `.env.local` in a text editor and fill in the values. The sections below
explain where each one comes from. Then:

```bash
npm run dev
```

Open <http://localhost:3000>. That is CampVoice running on your machine.

**Useful commands:**

| Command | What it does |
|---|---|
| `npm run dev` | Runs the site locally while you work on it. |
| `npm run build` | Builds the production version. If this fails, do not deploy. |
| `npm test` | Runs the automated tests. |
| `npm run lint` | Checks the code for mistakes. |
| `npm run typecheck` | Checks the code for type errors. |
| `npm run verify` | Runs all four of the above. **Run this before every deploy.** |
| `npm run seed:demo` | Fills your database with a fictional demo camp so you can click around. |

---

## Required environment variables

"Environment variables" are settings that live outside the code — mostly passwords
and keys. They go in `.env.local` on your computer, and in Vercel's dashboard for
the live site.

**The golden rule:** anything starting with `NEXT_PUBLIC_` is visible to anyone who
visits the site. Everything else is secret. Never put a secret in a `NEXT_PUBLIC_`
variable, and never commit `.env.local` to the repository.

### Must be set for CampVoice to work at all

| Variable | What it is |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project's address. Safe to be public. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase's public key. Safe to be public — the database's own security rules protect the data. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Very secret.** This key bypasses all security rules. Only server code uses it. If it ever leaks, rotate it in Supabase immediately. |
| `ANTHROPIC_API_KEY` | **Secret.** Pays for and authorises the AI writing. |
| `NEXT_PUBLIC_SITE_URL` | Where the site lives, e.g. `https://www.campvoice.com`. Used for links in emails and for Stripe redirects. |

### Must be set before you can take money

| Variable | What it is |
|---|---|
| `STRIPE_SECRET_KEY` | **Secret.** Lets CampVoice talk to Stripe. |
| `STRIPE_PRICE_MONTHLY` | The Stripe Price ID for the $79/month plan. |
| `STRIPE_PRICE_ANNUAL` | The Stripe Price ID for the $699/year plan. |
| `STRIPE_WEBHOOK_SECRET` | **Secret.** Proves that a message claiming to be from Stripe really is. |

### Optional, with sensible defaults

| Variable | Default | What it changes |
|---|---|---|
| `TRIAL_DAYS` | `14` | How long the free trial lasts. |
| `TRIAL_REQUIRE_CARD` | `false` | Whether a card is needed to start a trial. |
| `NEXT_PUBLIC_PRICE_MONTHLY` | `79` | The monthly price shown on the website. |
| `NEXT_PUBLIC_PRICE_ANNUAL` | `699` | The annual price shown on the website. |
| `AI_GENERATION_MODEL` | `claude-opus-5` | Which Claude model writes the content. |
| `AI_UTILITY_MODEL` | `claude-opus-5` | Which model builds Camp DNA and weekly suggestions. |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | `support@campvoice.com` | The support address shown across the site. |
| `LIMIT_GENERATIONS_PER_DAY` | `120` | Fair-use ceiling per camp per day. Protects you from a runaway bill. |

The complete list, with comments, is in `.env.example`.

---

## Supabase setup

Supabase is your database and your sign-in system.

1. Create a free account at [supabase.com](https://supabase.com) and make a new project.
   Choose a region near your customers. **Save the database password it gives you** —
   you will need it for backups.
2. In the project, go to **Settings → API**. You will see three things:
   - **Project URL** → this is `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** (click to reveal) → this is `SUPABASE_SERVICE_ROLE_KEY`
3. Go to **SQL Editor** and run the two migration files, in order:
   - `supabase/migrations/0001_initial_schema.sql` — creates the tables
   - `supabase/migrations/0002_rls_policies.sql` — **creates the security rules**

   Open each file, copy the whole contents, paste it into the SQL Editor, and press Run.

4. **Verify the security rules took effect.** Go to **Table Editor**. Every table
   should show an **RLS enabled** badge. If any table is missing it, re-run the second
   migration. Without these rules, one camp could read another camp's data.

5. Go to **Authentication → Providers** and make sure **Email** is enabled.
   Under **Authentication → Settings**, turn on **Confirm email**.

6. Under **Authentication → URL Configuration**, set the **Site URL** to your live
   address and add `https://your-domain.com/auth/callback` to the redirect list. For
   local work, also add `http://localhost:3000/auth/callback`.

7. Optional but recommended: set up a real email sender under **Authentication → Emails
   → SMTP Settings**. Supabase's built-in email is rate-limited and often lands in spam.

### Storage

The second migration creates a private storage bucket called `camp-materials`
automatically. Files uploaded by a camp live there and are **not** publicly readable —
only members of that camp can reach them.

---

## Stripe setup

1. Create an account at [stripe.com](https://stripe.com).
2. **Start in Test mode** (the toggle at the top of the dashboard). Test mode uses fake
   cards, so nothing costs anything.
3. Go to **Products** and create one product called **CampVoice Pro** with two prices:
   - $79 USD, recurring **monthly**
   - $699 USD, recurring **yearly**

   Each price has an ID starting `price_`. Copy them into `STRIPE_PRICE_MONTHLY` and
   `STRIPE_PRICE_ANNUAL`.
4. Go to **Developers → API keys**. Copy the **Secret key** into `STRIPE_SECRET_KEY`.
   (Test keys start `sk_test_`, live keys start `sk_live_`.)
5. Go to **Developers → Webhooks → Add endpoint**.
   - **Endpoint URL:** `https://your-domain.com/api/stripe/webhook`
   - **Events to send:** select these seven:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `customer.subscription.trial_will_end`
     - `invoice.paid`
     - `invoice.payment_failed`
   - After creating it, click **Reveal** under Signing secret and copy that into
     `STRIPE_WEBHOOK_SECRET`.
6. Go to **Settings → Billing → Customer portal** and click **Activate**. This is the
   page customers use to update their card or cancel. CampVoice links to it rather
   than rebuilding it.

**When you are ready to take real money:** flip the dashboard to Live mode, redo
steps 3–5 (live mode has its own products, keys and webhooks), and put the live
values into Vercel.

### Testing a subscription without spending money

In Test mode, use card number `4242 4242 4242 4242`, any future expiry, any CVC.
To test a failed payment, use `4000 0000 0000 0341`.

---

## Anthropic API setup

1. Create an account at [console.anthropic.com](https://console.anthropic.com).
2. Add a payment method and some credit. AI usage is billed per use.
3. Go to **API keys**, create one, and copy it into `ANTHROPIC_API_KEY`.
4. **Set a monthly spend limit** in the console. This is the single best protection
   against a surprise bill.

CampVoice also protects you in the app itself: each camp is limited to 120 generations
a day and 8 a minute by default, and every AI call's estimated cost is recorded and
shown in the admin area.

---

## Deployment

CampVoice deploys to Vercel.

1. Create an account at [vercel.com](https://vercel.com) and connect your GitHub account.
2. Click **Add New → Project** and choose this repository.
3. **Important:** set the **Root Directory** to `campvoice`. This repository contains
   another, unrelated project, and this setting tells Vercel which one to build.
4. Under **Environment Variables**, add every variable from your `.env.local`.
   Set `NEXT_PUBLIC_SITE_URL` to your real domain, not localhost.
5. Click **Deploy**.
6. Once deployed, add your domain under **Settings → Domains**.
7. Go back to Stripe and Supabase and update the webhook URL and the auth redirect URLs
   to your real domain.

After that, every push to your main branch deploys automatically.

**Before every deploy, run `npm run verify` locally.** If it fails, fix it first.

---

## Database migrations

A "migration" is a file that changes the shape of the database. They live in
`supabase/migrations/` and are numbered so they run in order.

**To apply them:** copy the file's contents into Supabase's SQL Editor and press Run.

**To add a new one:** create a new file with the next number, e.g.
`0003_add_something.sql`. Never edit a migration that has already been run on the live
database — write a new one instead. The old file is a record of what the database
already looks like.

After changing the database, update `src/lib/db/types.ts` to match, then run
`npm run typecheck`. It will point at every place in the app that needs updating.

---

## How AI generation works

Here is what happens when a camp director clicks **Generate**:

1. **They fill in a small form.** Not a prompt — a few plain questions like "Family
   name" and "Anything memorable from the tour?". This is the most important design
   rule in CampVoice: *a camp director should never have to learn prompt engineering.*

2. **The server checks who they are.** Which camp they belong to comes from their
   sign-in session, never from the web page. This is why one camp can never reach
   another camp's data.

3. **The server checks they are allowed.** Active subscription or live trial, and
   within the fair-use limits.

4. **CampVoice assembles the context.** It gathers the camp's profile, their Camp DNA,
   their terminology, the relevant upcoming dates, and a sample of their own writing.
   Only what this particular content type needs — it does not send everything, every
   time.

5. **It builds one request.** The global writing rules (`src/lib/ai/system-prompt.ts`)
   plus the camp's context plus the instructions for this content type plus the
   director's answers.

6. **Claude writes the draft.**

7. **CampVoice cleans it up.** It removes the tell-tale signs of machine writing —
   "Here's your draft:", em dashes, stacked exclamation points, trailing "Let me know
   if you'd like changes!".

8. **It saves the draft and shows it.** The director can edit it, revise it with one
   click, copy it, and save it to their library.

If Claude fails at step 6, nothing is saved and the director sees "We couldn't generate
this right now. Your information is safe. Try again." Their existing work is untouched.

**Where the code lives:**

| File | What it does |
|---|---|
| `src/lib/ai/system-prompt.ts` | The global writing rules. Editing this affects every draft CampVoice produces. |
| `src/lib/ai/templates.ts` | The content library — every form and its instructions. |
| `src/lib/ai/context.ts` | Decides which camp information goes into which request. |
| `src/lib/ai/generate.ts` | Builds the request and cleans up the result. |
| `src/lib/ai/guardrails.ts` | Security: makes sure uploaded files are read as data, never as instructions. |
| `src/lib/ai/provider.ts` | The only file that talks to Anthropic. |

---

## How Camp DNA works

Camp DNA is the product. Everything else is a form around it.

**What it is:** a short, structured profile of how one camp communicates —
their voice, their terminology, their themes, their style, their audience, and
the things they never want to see.

**How it is built:**
1. During onboarding a camp gives CampVoice: basic facts, programs, traditions,
   terminology, tone preferences, important dates, and samples of their real writing
   (uploaded files, an imported web page, or pasted text).
2. CampVoice sends all of that to Claude once and asks it to describe how this camp
   writes. The result is saved as their Camp DNA.
3. The camp reads it, corrects anything wrong, and confirms.

**How it is used:** every single generation includes the Camp DNA. That is what makes
the difference between "this knows our camp" and "this is ChatGPT with a camp logo".

**Two rules that must never be broken:**

- **A human's edit always wins.** If a camp has edited their Camp DNA by hand,
  rebuilding it asks first and says plainly what will be lost. Never make a rebuild
  silently overwrite someone's wording.
- **Camp material is data, not instructions.** A PDF a camp uploads might contain the
  words "ignore all previous instructions". CampVoice defangs those patterns and wraps
  all uploaded text in a clearly labelled block that the AI is told to treat as quoted
  material. This is handled in `src/lib/ai/guardrails.ts` and is covered by tests.

**Deliberately not used:** there is no vector database and no search index. A camp's
knowledge is small — a profile, a handful of dates, a few documents. Simple, predictable
selection beats a search system you cannot debug.

---

## How to change pricing

Three places must agree, in this order:

1. **Stripe.** Create a new Price on the CampVoice Pro product with the new amount.
   (Stripe does not let you change the amount of an existing Price. Existing customers
   keep the price they signed up at unless you migrate them.)
2. **Environment variables.** Update `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_ANNUAL`
   with the new Price IDs, and `NEXT_PUBLIC_PRICE_MONTHLY` / `NEXT_PUBLIC_PRICE_ANNUAL`
   with the new numbers for display.
3. **Redeploy.**

The website's "save 26%" figure is calculated from those two numbers, so it updates
itself. If you want to change the plan name or the feature list, edit `pricing` in
`src/lib/config.ts`.

**To change the free trial length:** set `TRIAL_DAYS` and redeploy. To require a card
for the trial, set `TRIAL_REQUIRE_CARD=true`.

---

## How to change the AI model

Set `AI_GENERATION_MODEL` (and optionally `AI_UTILITY_MODEL`) to the model you want,
then redeploy. No code change.

Both default to `claude-opus-5`, Anthropic's most capable model. If you ever want to
reduce cost, the utility work — building Camp DNA and weekly suggestions — is the
safest thing to move to a cheaper model:

```
AI_UTILITY_MODEL=claude-haiku-4-5
```

Leave `AI_GENERATION_MODEL` on the best model available. That is the one writing the
thing customers actually pay for.

After changing a model, generate a few pieces of content and read them. Models have
different voices, and a cheaper model may need the prompt in
`src/lib/ai/system-prompt.ts` to be more explicit.

---

## How to add a new content template

Say a camp asks for a "Bus Cancellation Notice".

1. Open `src/lib/ai/templates.ts`.
2. Copy an existing entry that is closest in shape — for a notice to families,
   copy `transportation`.
3. Change five things:
   - `id` — a unique lowercase-with-hyphens name, e.g. `bus-cancellation`
   - `category` — one of `prospective`, `families`, `staff`, `marketing`, `alumni`
   - `label` and `blurb` — what a camp director sees
   - `fields` — the questions on the form
   - `instructions` — how the AI should write this particular thing
4. Save. That is all. It appears on the Create page, in the picker, in the marketing
   site's template list, and as an option for "Generate My Week", automatically.
5. Run `npm test`. There is a test that checks every template is well-formed.

**Writing good `instructions`:** say what the piece is for, what should lead, and what
to avoid. Be specific about facts it must not invent. Look at `visiting-day` or
`weather-update` for the tone.

**Adding `quick: true`** puts a template on the dashboard's Quick Generate row. Keep
that list to six or so.

---

## Troubleshooting

**"The site says something went wrong."**
Go to Vercel → your project → **Logs**. The real error is there. The message users see
is deliberately vague so it never leaks technical detail.

**A customer paid but the app says their trial ended.**
The Stripe webhook did not arrive. Go to Stripe → **Developers → Webhooks** → your
endpoint. Look at recent deliveries. If they show errors, the usual causes are:
the webhook URL is wrong, or `STRIPE_WEBHOOK_SECRET` does not match. You can click
**Resend** on a failed event once fixed.

**"We couldn't generate this right now."**
Usually one of: your Anthropic account is out of credit; `ANTHROPIC_API_KEY` is wrong
or expired; or Anthropic is having an outage ([status.anthropic.com](https://status.anthropic.com)).
Check Vercel logs — the reason is recorded there.

**A camp cannot upload a PDF.**
CampVoice reads PDFs, Word `.docx` files and plain text, up to 8MB. A scanned PDF (a
photograph of a page) has no text to read — the camp should paste the text instead.
The app tells them this.

**Website import fails.**
Some sites block automated readers, and some are built entirely in JavaScript with no
text in the page source. This is expected. The app offers pasting instead, which works
just as well for Camp DNA.

**Emails are not arriving.**
Supabase's built-in email service is heavily rate-limited. Set up your own SMTP under
Supabase → **Authentication → Emails → SMTP Settings**.

**Everything is broken after a change I made.**
In Vercel, go to **Deployments**, find the last one that worked, and click **⋯ →
Promote to Production**. That is an instant rollback. Then work out what went wrong.

---

## How to back up the database

Supabase takes automatic daily backups on paid plans. **Check which plan you are on.**
On the free plan there are no automatic backups, and you should not run a real business
on it.

**To take a manual backup:**

1. Supabase → **Settings → Database → Connection string** — copy the connection string.
2. On your computer, with PostgreSQL's tools installed:

```bash
pg_dump "PASTE_THE_CONNECTION_STRING_HERE" > campvoice-backup-$(date +%F).sql
```

Keep that file somewhere safe and off your laptop.

**To restore:** Supabase → **Database → Backups** → choose a point in time (paid plans),
or restore a manual dump with `psql`. **Practise this once before you need it.**

Customers can also download their own data at any time from **Settings → Your data**,
which is both a good feature and a small safety net.

---

## What you should NEVER change without understanding it

These are the parts where a mistake is expensive or unsafe.

1. **`supabase/migrations/0002_rls_policies.sql`** — the security rules that keep one
   camp's data away from another camp. If you weaken these, camps can read each other's
   information. Never disable Row Level Security on a table "to make something work".

2. **`src/lib/auth/session.ts`** — decides who the caller is and which camp they belong
   to. Every private page and API route depends on it. In particular, never change it
   to take an organization id from a URL or a form.

3. **`src/app/api/stripe/webhook/route.ts`** — the signature check at the top is what
   stops anyone on the internet from granting themselves a paid subscription. Never
   remove it, and never move any logic above it.

4. **`src/lib/supabase/admin.ts`** — this key bypasses every security rule. It must only
   ever be imported by server code that has already checked who the caller is. Never
   import it into a component.

5. **`src/lib/ai/guardrails.ts`** — the reason an uploaded document cannot hijack the
   AI. The tests in `tests/guardrails.test.ts` exist to catch a regression here.

6. **Anything with `NEXT_PUBLIC_` in front of it** — that value is visible to the whole
   internet. Never put a secret key behind that prefix.

7. **A migration that has already run on the live database** — editing it does nothing
   to the real database and makes the files stop describing reality. Write a new
   migration instead.

If you are ever unsure, the safe move is: do not deploy, and ask for help. Nothing in
CampVoice is so urgent that it is worth a data leak.
