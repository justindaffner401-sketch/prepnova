# PrepNova — Your Score. Elevated.

AI-powered ACT & SAT prep platform (prepnovaai.com). React + Vite + Tailwind CSS v4,
with practice questions generated live by Claude (`claude-haiku-4-5-20251001`).

## Quick start

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Adding a Claude API key

Practice mode generates questions with the Claude API. Two ways to provide a key:

1. **In the app** — on the practice setup screen, paste a key into the
   "Add your Anthropic API key" field. It's stored in `localStorage` on this
   device only and sent only to `api.anthropic.com`.
2. **Via env file** — copy `.env.example` to `.env.local` and set
   `VITE_ANTHROPIC_API_KEY=sk-ant-...`, then restart the dev server.

No key? The app falls back to a built-in sample question bank so every flow
is still usable.

> **Security note:** the direct browser call (`dangerouslyAllowBrowser`) is a
> local-development convenience only. In production, visitors are served by
> the serverless proxy in `api/generate-questions.js`, which keeps the key
> server-side — never ship a real key in `VITE_ANTHROPIC_API_KEY`.

## Deploying (Vercel)

The repo is deploy-ready for Vercel:

1. Push to GitHub.
2. On [vercel.com](https://vercel.com): **Add New → Project**, import the repo.
   Vercel auto-detects Vite (build `npm run build`, output `dist`).
3. Before (or after) the first deploy, add an environment variable:
   **Settings → Environment Variables → `ANTHROPIC_API_KEY`** = your key.
4. Deploy. Visitors get AI-generated questions via `/api/generate-questions`
   with no key in the browser. `vercel.json` handles SPA routing so deep links
   like `/progress` work.
5. Custom domain: **Settings → Domains** → add `prepnovaai.com` and follow the
   DNS instructions.

## What's inside

| Route | Screen |
|---|---|
| `/` | Landing page — hero ("Your Score. Elevated."), features, pricing comparison (tutors $45–200/hr, Princeton Review $949+, Kaplan $699+, PrepNova $29/mo), signup CTA |
| `/select` | Subject selector — pick ACT or SAT, then Math / English / Reading / Science |
| `/practice` | Practice mode — 5 Claude-generated MCQs, 60-second timer per question, detailed explanation after every answer |
| `/progress` | Score tracker — sessions saved to `localStorage`, charted over time with per-subject averages |

## Tech notes

- **Stack:** React 19, Vite 7, Tailwind CSS v4 (`@tailwindcss/vite`), React Router 7, `@anthropic-ai/sdk`
- **Question generation** uses Claude structured outputs
  (`output_config.format` with a JSON schema), so responses are guaranteed
  valid JSON — lengths (5 questions × 4 choices) are validated client-side.
- **No backend** — results, last selection, and the optional API key live in
  `localStorage`.

## Scripts

| Command | Action |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
