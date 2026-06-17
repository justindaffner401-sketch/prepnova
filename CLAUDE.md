# PrepNova — project context for Claude Code

AI-powered ACT & SAT prep web app. **Live and taking real payments at https://www.prepnovaai.com.**
Owner: Justin (GitHub `justindaffner401-sketch`). This file is the single source of truth so any
machine (Mac or Windows) can pick up the project — read it first.

## Stack & where everything lives (all cloud — not tied to any one computer)

- **Code:** GitHub `justindaffner401-sketch/prepnova`. Pushing to `main` auto-deploys.
- **Hosting:** Vercel (project `prepnova`, org `jdaff-s-projects`). Auto-deploys from GitHub `main`.
- **Auth + DB:** Supabase (project ref `roufybwqayzhldgfdbgo`). `subscriptions` table; email confirm ON; SMTP via Resend.
- **Payments:** Stripe (LIVE). Monthly $29 (7-day trial), 1-Year $250/yr recurring, Lifetime $600 one-time.
- **Email:** Resend (domain prepnovaai.com verified) → Supabase custom SMTP.
- **AI questions:** via `/api/generate-questions` (key server-side). Model split (`modelForMode`): **Haiku** (`claude-haiku-4-5-20251001`) for MCQ (Math/Science); **Sonnet** (`claude-sonnet-4-6`) for the passage-heavy sections (ACT English/Reading, SAT R&W) for better prose/coherence. A 2nd-model **verification pass** (OpenAI, `api/_verify.js`) re-solves each generated question and drops disagreements. **`OPENAI_API_KEY` IS set in Vercel — verification is LIVE in production.** (optional `OPENAI_VERIFY_MODEL`, default `gpt-4o-mini`).
- **Stack:** Vite 7 + React 19 + Tailwind v4 (`@theme` tokens in `src/index.css`) + React Router 7.

## Run / deploy

```
npm install
npm run dev        # local dev (port 5173)
npm run build      # production build
git push           # → Vercel auto-deploys to prepnovaai.com
```

No local env vars needed just to run the UI; the serverless `/api/*` functions need the Vercel env
vars (Stripe/Supabase/Anthropic) which are set in the Vercel dashboard, not in the repo.

## Architecture / key files

- `src/pages/Landing.jsx` — landing (hero, Why Us cost comparison `src/components/WhyUs.jsx`, 3-tier pricing).
- `src/pages/SubjectSelect.jsx` — pick test then subject. `SUBJECTS_BY_TEST`: ACT=English/Math/Reading/Science, SAT=Math/English. Fires `PortalTransition` on start.
- `src/components/PortalTransition.jsx` + portal CSS in `src/index.css` — ~5s colorful portal animation.
- `src/pages/Practice.jsx` — practice session shell (intro/loading/error/results). For most subjects: 5 MCQs, 60s timer, explanations, `CalculatorWidget` (Desmos) on Math. **For ACT English it branches into passage mode** (`isPassageMode`) and renders `PassageRunner` instead.
- `src/components/PassageRunner.jsx` — exam-replica runner: pinned passage with numbered **underlined spans**, answer-as-you-go question panel, count-up timer, click-a-span-to-navigate. Two-column on `lg`, stacked on mobile.
- `src/pages/Progress.jsx` — localStorage score tracker + SVG chart.
- `src/pages/Account.jsx` — auth (Supabase), plan selector, Stripe checkout. `src/pages/ResetPassword.jsx`.
- `src/lib/questionSpec.js` — SHARED by client + server. MCQ path: `buildPrompt`, `QUESTIONS_SCHEMA`, `validateQuestions`. Passage path: `buildPassagePrompt`, `PASSAGE_SCHEMA`, `validatePassageSet`, `isPassageMode`. **Each choice has `{text, correct}` (no separate answerIndex) — this prevents the answer/explanation mismatch.** Passage segments are uniform `{text, underline, ref}` (no discriminated unions, for reliable structured output); the validator renumbers underlines/questions to a clean 1..N.
- `src/lib/entitlement.js` — `isEntitled(sub)` shared by client (`useAuth`) + server gate.
- `src/lib/claude.js` — browser-direct generation (dev/local key path).
- `src/lib/demoQuestions.js` — free sample questions (shuffled; answers verified correct).
- **Math generation (ACT vs SAT differ):** `buildPrompt` routes `subject==="Math"` to **`buildMathPrompt(test, count)`** — ACT = broad coverage incl. plane geometry + trig, **FIVE** answer choices (A–E); SAT = algebra + advanced math + data analysis, light geometry, **four** choices. `validateQuestions` accepts 4 OR 5 choices; the MCQ runner letters go A–E. Reading/Science keep the generic `buildPrompt`.
- **Math figures:** math questions may carry an optional `figure` (`MATH_FIGURE_SCHEMA`, sanitized by `sanitizeMathFigure`, `mathFigureToText` for the verifier) — geometry shapes (polygons/circles + labels) or coordinate plots (curves + axes). Rendered by `src/components/MathFigure.jsx` (one math plane, y flipped up). `buildMathPrompt` asks for one only when a question needs a diagram. `ChartFigure.jsx` renders categorical bar/line charts for Reading graph passages.
- `api/` — Vercel serverless: `generate-questions.js` (Pro-gated, rate-limited), `create-checkout-session.js`, `create-portal-session.js`, `stripe-webhook.js`.

## Full-length exams (`/exam`, `src/pages/Exam.jsx`)

Section recipes/composition live in **`src/lib/sectionPlans.js`** (pure data: `SECTION_PLANS`,
`EXAM_SECTIONS` — no browser deps, so the Node build script can import them). `src/lib/section.js`
re-exports them + `assembleSection` (client-side, calls the generators with a progress bar).
`SectionRunner.jsx` sequences UNITS through the existing runners (`hideTimer` prop) under one
countdown timer with combined scoring; `McqRunner.jsx` handles Math/Science units.

Exam page offers two paths:
1. **Prebuilt library (instant, recommended):** loads `/exams/index.json` and lists ready-made
   exams; picking one fetches `/exams/<id>.json` and runs instantly (units pre-generated, no wait).
2. **Generate fresh:** one section (with a **user-selectable timer** — real/relaxed/untimed/custom)
   or a full exam (`EXAM_SECTIONS[test]` back-to-back with break screens). Pro-gated.
Per-section results saved with `source:"exam"`. Unified run-queue handles both (item carries
`units` for prebuilt, or `null` → assemble).

### Prebuilt exams (`public/exams/`, `scripts/build-exams.mjs`)
**8 exams LIVE:** `act-1..4` (~136 Q, 4 sections each) + `sat-1..4` (~38 Q, 2 sections), nearly all
verified, ACT Reading includes the paired + graph variants, ACT Math includes diagrams.
`public/exams/index.json` is the manifest (id, test, label, section summaries).
**To (re)generate:** put `ANTHROPIC_API_KEY` (+ `OPENAI_API_KEY` for verification) in `EXAM_KEYS.txt`
(git-ignored) or `.env.local`, then run **in the FOREGROUND** (background shells can't see the project):
`TEST=ACT COUNT=4 node /Users/justindaffner/Desktop/Developer/prepnova/scripts/build-exams.mjs`
(also `TEST=SAT`). It mirrors the serverless generation+verification, caches each finished section to
`public/exams/_parts/` (git-ignored) so it's resumable, skips exams whose file exists, and rebuilds
`index.json` from ALL exam files on disk (running one test never drops the other). Commit
`public/exams/*.json` + `index.json` → auto-deploys. Use a new ACT/SAT official test? Re-run to keep
the "kept current" marketing claim honest.

## Status — what's done

Built & live: landing/Why-Us/pricing, accounts + Stripe (monthly trial / yearly / lifetime), Supabase auth + Resend password reset, AI question generation (Pro-gated), Desmos calculator on Math, score tracker, Vercel Analytics, portal transition, SEO/OG tags + sitemap.

## Status — passage-based exam replica (IN PROGRESS)

Practice must look like the real digital ACT/SAT (College Board). Current format is 5 standalone MCQs;
the redesign groups questions under a shared passage.

**DONE (slice 1 — ACT English):** one passage per session with numbered underlined spans, answer-as-you-go,
pinned-passage two-column layout, AI generation (Pro-gated, via the same `/api/generate-questions` proxy with
`mode:"passage"`) + an offline sample passage (`getSamplePassage`). Verified in-browser end to end.

Spec from the owner (remaining slices):
- **ACT English:** ✅ done as above. Future polish: passage-level questions not tied to an underline (a boxed number marking a position), and multi-passage sessions (~5–6 passages × 5–10 Qs).
- **ACT Reading:** ✅ done, all three passage types. `mode:"reading"` randomly picks a variant (`chooseReadingVariant`): **single** (numbered paragraphs), **paired** A/B (two passages + scope-tagged questions), or **graph** (passage + a bar/line figure via `ChartFigure.jsx`). Authentic stems, A-D/F-J letters, pinned passage, `verifyReading`. Each variant has its own schema/prompt/validator in questionSpec.js (`READING_*`), plus offline samples in `getSampleReading` (random of the three). **Deferred:** multi-passage full sessions (one passage per session for now).
- **SAT English (Reading & Writing):** ✅ done. `mode:"writing"` (`isWritingMode` = SAT+English). A set of independent short-text items (one ~25-150 word text + one question each), one per screen, A-D choices, spanning the SAT domains (words in context, transitions, boundaries, form/sense, central ideas, command of evidence, inferences, rhetorical synthesis). `WritingRunner.jsx`, `SAT_WRITING_SCHEMA`/`buildWritingPrompt`/`validateWritingSet`, `getSampleWriting`, `verifyWriting`. **Deferred:** quantitative (table/graph) command-of-evidence items.
- Big passage + 5–10 related questions grouped; passage stays pinned while answering.
- Needs: new generation schema (passage + grouped Qs + underline spans + paired A/B + graphs) and a new Practice UI.

**Reference:** owner's 4 official ACT tests are in iCloud Drive at `College Shit/ACT Tests/` (syncs across his Apple devices). Use them to extract the FORMAT/blueprint and replicate the UI — generate ORIGINAL questions, never copy (ACT, Inc. copyright). Reading PDFs needs the `pdf` skill or a Python env (pypdf/pdfplumber); poppler/Python were absent on the original Windows PC.

**DONE — AI verification pass:** a 2nd model (OpenAI, `api/_verify.js`) re-solves each generated question and drops disagreements. Server-side only; MCQ sets over-generate (8) so a full 5 survives; passage sets drop disputed questions, unwrap their underlines, and renumber. `verifyMcq`/`verifyPassage`/`verifyReading`/`verifyWriting` each return `{verified, ...}`; the API returns a `verified` flag that the client surfaces as a **"✓ AI-verified" badge** on generated sets. **`OPENAI_API_KEY` is set in Vercel — LIVE.** (optional `OPENAI_VERIFY_MODEL`, default `gpt-4o-mini`.)

## Landing / visual design — "make it pop" (mostly DONE)

Direction pulled from the **`ui-ux-pro-max`** skill (installed, `~/.claude/skills/`): scroll-triggered
storytelling, bento grid, motion 150–300ms, transform/opacity only, respect reduced-motion.
All custom CSS utilities live in `src/index.css`; **everything is disabled under
`prefers-reduced-motion`**.

- **3D hero (DONE, live):** `src/components/Hero3D.jsx` — react-three-fiber/three/drei (deps added),
  a distorting glowing icosahedron + cyan wireframe shell + sparkles that floats and follows the
  pointer, sitting behind the frosted-glass question card. **Lazy-loaded** in `Landing.jsx`
  (`React.lazy` + Suspense) so `three` is code-split into its own chunk (~880 KB) — only the landing
  route loads it; reduced-motion → static.
- **Scroll reveals (DONE, live):** `src/lib/useReveal.js` (IntersectionObserver) + `.reveal` /
  `.reveal-stagger` CSS. Applied via a `Reveal` wrapper in `Landing.jsx` to how-it-works, features, CTA.
- **Bento features (DONE, live):** `src/components/FeatureBento.jsx` — varied-size glass tiles
  (dominant AI-verification tile w/ a mini "verified answer" visual) replacing the old uniform grid.
- **CSS utilities (DONE):** `text-gradient-anim` (animated hero title), `anim-drift` (hero orbs),
  `.btn-primary` shine sweep, `.glow-card` (hover lift + glow), `.reveal*`.
- **Marketing copy (DONE, live):** hero/features/pricing now lead with **"all questions
  double-checked by a comprehensive AI system,"** 8 full-length exams, real digital format, kept
  current. **Framing is deliberate & honest** — questions are AI-generated + AI-verified + human-
  reviewed; do NOT claim "human-created." A hero stats strip (8 exams · ∞ questions · 2× AI-checked
  · <$1/day) was added.
- **Practice-page CTA (DONE, live):** `SubjectSelect.jsx` has a "Take a full-length exam" card → `/exam`.

- **App-wide aurora background (DONE, live):** `src/components/AuroraBackground.jsx` + `.aurora-bg`
  in `src/index.css`, mounted app-wide in `App.jsx`. **Fixed the invisible-on-flat-pages bug:** the
  navy base used to be on `<body>`, but a `<body>` background paints over any negative-z-index fixed
  layer, so it hid the aurora on content pages like `/select`. Fix: navy base now lives on the
  **`<html>` canvas** (`@apply bg-navy-900`) and `<body>` is `background: transparent`. The aurora
  was then demoted to **`-z-20`** at low opacity to act as a faint nebula tint *behind* the 3D space
  scene (below).
- **App-wide live 3D space background (REMOVED for performance):** there used to be a
  react-three-fiber black-hole + starfield (`SpaceBackground.jsx`) mounted app-wide. It ran a
  continuous full-screen WebGL render loop on **every** page and pulled the ~888 KB `three` chunk on
  every route — which made the whole app feel slow/janky on typical laptops (owner reported it).
  **Removed** (along with the `focusMode` `useSyncExternalStore` signal that paused it during tests).
  Interior pages now use **only the lightweight CSS aurora**; `three` loads **only on the homepage**
  (via `Hero3D` + the hero video). The deleted component is in git history if a much lighter version
  is ever wanted. **Lesson: don't run always-on WebGL app-wide — keep heavy visuals on the marketing
  homepage, keep the study app light.**
- **Cinematic video black-hole hero (DONE, live):** `src/components/BlackHoleBackground.jsx` +
  `.blackhole-*` in `src/index.css`, mounted inside the **Landing hero** (`Landing.jsx`, hero is
  `min-h-screen`, content lifted to `z-10`). Full-bleed looping `<video>` (`autoPlay muted loop
  playsInline`, `webm`→`mp4` sources, `object-fit:cover`, `object-position:60% center`, darkened via
  `filter: brightness(0.5)`) under dark navy gradients + vignette + left-headline darkening, with a
  faint grid + starfield above the video and below content. **Reduced-motion:** the component skips
  rendering `<video>` (JS `matchMedia`) and CSS swaps in a richer static cosmic gradient; without any
  video file it falls back to an animated CSS accretion ring (`.blackhole-bg::before`). **Video asset
  is committed at `public/videos/blackhole.mp4`** (~2.8 MB, AI-generated via Higgsfield: a
  `nano_banana_pro` still used as BOTH the start & end frame of a Veo 3.1 Lite 8s/720p clip → a
  **seamless loop**; blue-cyan disk to match brand). True 15s needs a paid Higgsfield plan
  (Kling/Cinema/Seedance are plan-gated). `blackhole.webm` is optional (smaller; no ffmpeg locally to
  make one — see `public/videos/README.md`); the `.webm` source 404s harmlessly and the browser uses
  the mp4. To swap in a better clip, just replace the file(s).

## Security & compliance (hardening pass)

- **Headers:** `vercel.json` sets HSTS, `X-Content-Type-Options`, `X-Frame-Options: DENY`,
  `Referrer-Policy`, `Permissions-Policy`, and a **`Content-Security-Policy-Report-Only`** (NOT
  enforcing). **Why report-only:** enforcing it blanked the Math page — Desmos needs `'unsafe-eval'`
  + `'wasm-unsafe-eval'` + workers, which a strict CSP blocked, and the throw crashed React. The
  report-only policy now includes those directives, so before flipping the key to
  `Content-Security-Policy` you MUST verify the **Desmos calculator** + **Stripe checkout** still work.
  Safety nets added regardless: `CalculatorWidget` wraps Desmos init in try/catch (failure → its own
  error state), and an app-wide `ErrorBoundary` (`App.jsx`, keyed by route) shows a fallback instead
  of a blank screen if any component throws.
- **Rate limiting + validation:** `api/_security.js` (in-memory, per-instance, env-tunable —
  `RATE_LIMIT_GENERATE_MAX/_WINDOW_MS`, `RATE_LIMIT_BILLING_MAX/_WINDOW_MS`; recommend Upstash for a
  shared global limit). Applied to `generate-questions` (IP+user, 15/hr) and the billing endpoints
  (IP+user, 30/hr). Bodies are size-checked + unexpected fields rejected + enums allowlisted.
- **RLS (MUST be applied manually):** `supabase/rls-policies.sql` enables RLS on `public.subscriptions`
  with a `select` policy `auth.uid() = user_id` and **no** client write policies (writes are
  service-role via the webhook, which bypasses RLS). The browser reads `subscriptions` directly with
  the anon key (`useAuth.js`), so without RLS that table is readable by anyone — **run the SQL in the
  Supabase SQL editor and confirm the RLS badge is ON.** Practice results live in `localStorage`, not
  Supabase, so there's no results table to secure yet.
- **Cookie consent:** `src/lib/cookieConsent.js` + `CookieConsent.jsx` + `ConsentedAnalytics.jsx`.
  Vercel Analytics (cookieless) loads ONLY after Accept; "Cookie settings" in the footer re-opens the
  banner. Essential = Supabase auth session (not gated).
- **Legal:** `/privacy` + `/terms` (`Privacy.jsx`/`Terms.jsx`) — plain-English templates with
  `[BRACKETED]` placeholders the owner must fill; linked in the footer. No compliance framework is
  claimed; student/minor data is flagged for legal review. See `docs/data-compliance.md`.
- **A11y:** skip-to-content link (`.skip-link`) + `#main-content` target in `App.jsx`; the `<Footer/>`
  (a labelled `<nav>`) is rendered **globally in `App.jsx`** so legal links are on every page;
  Account status messages are `role="alert"`. Animations respect `prefers-reduced-motion`; aurora is static.
- **Tests:** `vitest` (`npm test`) — unit tests for the security helpers (`api/_security.test.js`:
  rate limit, body/field/enum validation) and entitlement logic (`src/lib/entitlement.test.js`).
  No DOM/integration tests yet (recommended follow-up).
- **Confirmed clean:** no hardcoded secrets, no committed `.env`, no file uploads / storage buckets,
  no `innerHTML`/`dangerouslySetInnerHTML`; API routes derive `user.id` from the verified JWT (no
  IDOR), webhook verifies signatures, service-role key is server-only.

## Conventions / gotchas

- **Project path: `/Users/justindaffner/Desktop/Developer/prepnova`** (moved from `~/Developer` mid-build). Background Bash shells run in an isolated FS that can't see it — run builds/scripts in the FOREGROUND, and use `git -C <path>` (a `cd` into the path fails in the background shell).
- **Tooling installed this session:** `ui-ux-pro-max` skill (`~/.claude/skills/ui-ux-pro-max`, has a Python BM25 search over CSV design DBs — `python3 scripts/search.py "<q>" --design-system`); `magic` MCP (21st.dev, in `~/.claude.json` user scope; its builder output didn't integrate cleanly — targets TS/shadcn/framer, so components were hand-built in-brand instead).
- `EXAM_KEYS.txt` was deleted after the build; recreate it (git-ignored) with the two keys to regenerate exams.
- Owner is non-technical: explain in plain language; he drives Stripe/Vercel/Namecheap dashboards (give all steps at once — he prefers consolidated messages).
- AI calls Claude from the browser only for the local-key dev path; production uses the serverless proxy. Never ship a real key in a `VITE_` var.
- Vercel holds only LIVE Stripe keys; testing in Stripe sandbox needs a preview env with test keys or a real-card + refund.
- Owner's own account shows Pro from earlier test-mode setup.
