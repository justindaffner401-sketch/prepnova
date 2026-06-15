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
- **AI questions:** via `/api/generate-questions` (key server-side). Model split (`modelForMode`): **Haiku** (`claude-haiku-4-5-20251001`) for MCQ (Math/Science); **Sonnet** (`claude-sonnet-4-6`) for the passage-heavy sections (ACT English/Reading, SAT R&W) for better prose/coherence. A 2nd-model **verification pass** (OpenAI, `api/_verify.js`) re-solves each generated question and drops disagreements — active only when `OPENAI_API_KEY` is set in Vercel; no-ops otherwise.
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
- **Math figures:** math questions may carry an optional `figure` (`MATH_FIGURE_SCHEMA`, sanitized by `sanitizeMathFigure`) — geometry shapes (polygons/circles + labels) or coordinate plots (curves + axes). Rendered by `src/components/MathFigure.jsx` (one math plane, y flipped up). `buildMathPrompt` asks for one only when a question needs a diagram. `ChartFigure.jsx` renders categorical bar/line charts for Reading graph passages.
- `api/` — Vercel serverless: `generate-questions.js` (Pro-gated, rate-limited), `create-checkout-session.js`, `create-portal-session.js`, `stripe-webhook.js`.

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

**DONE — AI verification pass:** a 2nd model (OpenAI, `api/_verify.js`) re-solves each generated question and drops disagreements. Server-side only; MCQ sets over-generate (8) so a full 5 survives; passage sets drop disputed questions, unwrap their underlines, and renumber. Activates when `OPENAI_API_KEY` is set in Vercel (optional `OPENAI_VERIFY_MODEL`, default `gpt-4o-mini`); no-ops without the key. **Owner: add `OPENAI_API_KEY` in Vercel → Settings → Environment Variables to turn it on.**

## Conventions / gotchas

- Owner is non-technical: explain in plain language; he drives Stripe/Vercel/Namecheap dashboards (give all steps at once — he prefers consolidated messages).
- AI calls Claude from the browser only for the local-key dev path; production uses the serverless proxy. Never ship a real key in a `VITE_` var.
- Vercel holds only LIVE Stripe keys; testing in Stripe sandbox needs a preview env with test keys or a real-card + refund.
- Owner's own account shows Pro from earlier test-mode setup.
