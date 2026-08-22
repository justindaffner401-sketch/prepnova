/**
 * CampVoice configuration.
 *
 * FOUNDER NOTE: this is the one file to edit when you want to change pricing,
 * the free-trial length, the support email, or which Claude model writes the
 * content. Everything else in the app reads from here, so you never have to
 * hunt for a number hidden in a component.
 *
 * Anything that can differ between your laptop and the live site is read from
 * an environment variable with a sensible default.
 */

function parseInt(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function envInt(name: string, fallback: number): number {
  return parseInt(process.env[name], fallback);
}

function envBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  return raw === "true" || raw === "1";
}

/** Brand + contact details shown across the marketing site and the app. */
export const brand = {
  name: "CampVoice",
  tagline: "Your camp's voice, ready whenever you need it.",
  description:
    "CampVoice learns how your camp communicates, then helps your team create parent emails, prospective-family follow-ups, social content, staff communications, newsletters, and more—in minutes.",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@campvoice.com",
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "https://www.campvoice.com").replace(/\/$/, ""),
} as const;

/**
 * Pricing. The dollar amounts here are what the marketing site displays.
 * The actual charge is whatever the Stripe Price says — so if you change a
 * number here, change the matching Price in Stripe too (see README).
 */
export const pricing = {
  planName: "CampVoice Pro",
  monthly: {
    interval: "month" as const,
    // Read with a literal key: Next.js inlines NEXT_PUBLIC_ values by exact
    // text match, so a computed lookup would not survive into a client bundle.
    amount: parseInt(process.env.NEXT_PUBLIC_PRICE_MONTHLY, 79),
    label: "$79",
    suffix: "/month",
    stripePriceIdEnv: "STRIPE_PRICE_MONTHLY",
  },
  annual: {
    interval: "year" as const,
    amount: parseInt(process.env.NEXT_PUBLIC_PRICE_ANNUAL, 699),
    label: "$699",
    suffix: "/year",
    stripePriceIdEnv: "STRIPE_PRICE_ANNUAL",
  },
  features: [
    "Complete Camp DNA profile",
    "Unlimited reasonable content generation (fair-use protected)",
    "Parent + current-family communications",
    "Prospective-family and enrollment communications",
    "Staff recruitment and pre-camp communications",
    "Social posts, reel scripts, and newsletters",
    "Alumni and fundraising communications",
    "Full content history and search",
    "Multiple tone options",
    "One-click editing and regeneration tools",
  ],
} as const;

/** Savings shown on the pricing page, computed rather than hard-coded. */
export function annualSavings() {
  const monthlyTotal = pricing.monthly.amount * 12;
  const saved = monthlyTotal - pricing.annual.amount;
  const percent = Math.round((saved / monthlyTotal) * 100);
  return { monthlyTotal, saved, percent };
}

/** Free-trial behaviour. Both values are configurable from the environment. */
export const trial = {
  days: envInt("TRIAL_DAYS", 14),
  /** When false, Stripe Checkout starts the trial without collecting a card. */
  requireCard: envBool("TRIAL_REQUIRE_CARD", false),
} as const;

/**
 * AI model configuration.
 *
 * `generation` writes the actual communications. `utility` handles the
 * structured work (building the Camp DNA summary, weekly suggestions).
 * Both default to Claude's most capable model. If you ever want to trade a
 * little quality for a lower bill, set AI_UTILITY_MODEL=claude-haiku-4-5 —
 * no code change needed.
 */
export const ai = {
  provider: process.env.AI_PROVIDER || "anthropic",
  generationModel: process.env.AI_GENERATION_MODEL || "claude-opus-5",
  utilityModel: process.env.AI_UTILITY_MODEL || "claude-opus-5",
  maxOutputTokens: envInt("AI_MAX_OUTPUT_TOKENS", 2000),
  /** Hard ceiling on characters of camp context sent in one request. */
  maxContextChars: envInt("AI_MAX_CONTEXT_CHARS", 24000),
} as const;

/**
 * Fair-use limits. These protect you from a runaway bill; they are not a
 * product feature and are set high enough that a normal camp never sees them.
 */
export const limits = {
  generationsPerDay: envInt("LIMIT_GENERATIONS_PER_DAY", 120),
  generationsPerMinute: envInt("LIMIT_GENERATIONS_PER_MINUTE", 8),
  uploadsPerDay: envInt("LIMIT_UPLOADS_PER_DAY", 50),
  maxUploadBytes: envInt("LIMIT_MAX_UPLOAD_BYTES", 8 * 1024 * 1024),
  maxPastedChars: envInt("LIMIT_MAX_PASTED_CHARS", 60000),
  maxSourceDocuments: envInt("LIMIT_MAX_SOURCE_DOCUMENTS", 100),
} as const;

/** Approximate Anthropic pricing, USD per million tokens, for internal cost estimates only. */
export const tokenCostUsdPerMillion: Record<string, { input: number; output: number }> = {
  "claude-opus-5": { input: 5, output: 25 },
  "claude-sonnet-5": { input: 3, output: 15 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-haiku-4-5": { input: 1, output: 5 },
};

export function estimateCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const rate = tokenCostUsdPerMillion[model] ?? { input: 5, output: 25 };
  return (inputTokens * rate.input + outputTokens * rate.output) / 1_000_000;
}

/** Analytics provider is pluggable; "none" disables tracking entirely. */
export const analytics = {
  provider: (process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER || "none") as "none" | "console" | "vercel",
} as const;
