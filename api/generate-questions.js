// Vercel serverless function: generates practice questions with the Claude
// API using a server-side key, so visitors never see it.
// Configure ANTHROPIC_API_KEY in Vercel → Project → Settings → Environment Variables.

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import {
  MODEL,
  PASSAGE_MODEL,
  PASSAGE_SCHEMA,
  QUESTIONS_SCHEMA,
  SAT_WRITING_SCHEMA,
  SYSTEM_PROMPT,
  VALID_SUBJECTS,
  VALID_TESTS,
  buildPassagePrompt,
  buildPrompt,
  buildWritingPrompt,
  chooseReadingVariant,
  isPassageMode,
  isReadingMode,
  isWritingMode,
  readingPromptFor,
  readingSchemaFor,
  validatePassageSet,
  validateQuestions,
  validateReadingFor,
  validateWritingSet,
} from "../src/lib/questionSpec.js";
import { isEntitled } from "../src/lib/entitlement.js";
import {
  verifierEnabled,
  verifyMcq,
  verifyPassage,
  verifyReading,
  verifyWriting,
} from "./_verify.js";

/* ---------------- Rate limiting ----------------
 * In-memory, per warm function instance. Counters aren't shared across
 * instances/regions and reset on cold starts, so this is abuse-blunting, not
 * a hard guarantee — pair it with a spend limit in the Anthropic console
 * (Settings → Limits). Every request counts, including invalid ones.
 */
const RATE_LIMIT = 15; // requests per IP per window
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const hits = new Map(); // ip -> array of request timestamps

function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) return fwd.split(",")[0].trim();
  return req.headers["x-real-ip"] || req.socket?.remoteAddress || "unknown";
}

function isRateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    // Drop fully-expired entries so the map can't grow without bound.
    for (const [key, stamps] of hits) {
      if (stamps.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }
  return false;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  if (isRateLimited(clientIp(req))) {
    return res.status(429).json({
      error:
        "You've hit the practice limit for this hour. Take a breather and come back soon — or run the built-in sample set.",
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({
      error:
        "AI generation isn't configured on this deployment yet. Site owner: set ANTHROPIC_API_KEY in Vercel → Project → Settings → Environment Variables, then redeploy.",
    });
  }

  /* ---------------- Subscription gate ----------------
   * Active only once SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are configured;
   * until then the endpoint stays open (free-beta behavior). The sample
   * question set in the client never hits this endpoint and stays free.
   */
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!token) {
      return res.status(401).json({
        error: "Sign in to generate AI questions — the sample set is free without an account.",
      });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) {
      return res.status(401).json({ error: "Your session expired — sign in again." });
    }
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (!isEntitled(sub)) {
      return res.status(402).json({
        error:
          "AI question generation is part of PrepNova Pro ($29/mo). Upgrade on your account page — the sample set stays free.",
      });
    }
  }

  const { test, subject, mode } = req.body ?? {};
  if (!VALID_TESTS.includes(test) || !VALID_SUBJECTS.includes(subject)) {
    return res.status(400).json({ error: "Invalid test or subject." });
  }
  // Honor an explicit passage request, but also fall back to the format the
  // subject is configured for so an older client can't ask for MCQs on a
  // passage-only section.
  const writing = mode === "writing" || isWritingMode(test, subject);
  const reading = !writing && (mode === "reading" || isReadingMode(test, subject));
  const passage = !writing && !reading && (mode === "passage" || isPassageMode(test, subject));
  // When the verifier is on, over-generate standalone MCQs so dropping the
  // occasional disputed question still leaves a full set of 5.
  const mcqCount = verifierEnabled() ? 8 : 5;

  // Reading randomly picks a passage variant (single / paired / graph).
  const readingVariant = reading ? chooseReadingVariant() : null;
  const content = writing
    ? buildWritingPrompt(test, subject)
    : reading
      ? readingPromptFor(readingVariant, test, subject)
      : passage
        ? buildPassagePrompt(test, subject)
        : buildPrompt(test, subject, mcqCount);
  const schema = writing
    ? SAT_WRITING_SCHEMA
    : reading
      ? readingSchemaFor(readingVariant)
      : passage
        ? PASSAGE_SCHEMA
        : QUESTIONS_SCHEMA;
  // Passage-heavy sections use the stronger model; MCQ stays on Haiku.
  const model = writing || reading || passage ? PASSAGE_MODEL : MODEL;

  // The 90s timeout bounds each attempt well inside Vercel's function limit;
  // 8000 tokens covers an over-generated MCQ set or a full passage.
  const client = new Anthropic({ maxRetries: 1, timeout: 90_000 }); // reads ANTHROPIC_API_KEY from env

  try {
    const response = await client.messages.create({
      model,
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
      output_config: { format: { type: "json_schema", schema } },
    });

    if (response.stop_reason === "refusal") {
      return res.status(502).json({ error: "Claude declined this request. Try again." });
    }
    if (response.stop_reason === "max_tokens") {
      return res.status(502).json({ error: "The response was cut off. Try again." });
    }

    const text = response.content.find((block) => block.type === "text")?.text ?? "";
    if (writing) {
      const { verified, writing: set } = await verifyWriting(validateWritingSet(text));
      return res.status(200).json({ writing: set, verified });
    }
    if (reading) {
      const { verified, reading: set } = await verifyReading(
        validateReadingFor(readingVariant, text),
      );
      return res.status(200).json({ reading: set, verified });
    }
    if (passage) {
      // verifyPassage drops disputed questions (and falls back to the
      // unverified set if that would gut the passage). `verified` is true only
      // when the returned set reflects the verifier's judgment.
      const { verified, passage: set } = await verifyPassage(validatePassageSet(text));
      return res.status(200).json({ passage: set, verified });
    }

    const { verified, questions } = await verifyMcq(validateQuestions(text));
    return res.status(200).json({ questions: questions.slice(0, 5), verified });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return res
        .status(429)
        .json({ error: "Rate limit reached. Wait a few seconds and try again." });
    }
    if (err instanceof Anthropic.AuthenticationError) {
      return res.status(502).json({
        error: "The server's API key was rejected — the site owner needs to update it.",
      });
    }
    if (err instanceof Anthropic.APIError) {
      if (err.status === 529 || err.status >= 500) {
        return res
          .status(502)
          .json({ error: "Claude is briefly overloaded. Try again in a moment." });
      }
      return res.status(502).json({ error: "Couldn't generate questions. Try again." });
    }
    // validateQuestions() failures carry a user-friendly message.
    return res
      .status(502)
      .json({ error: err?.message || "Couldn't generate questions. Try again." });
  }
}
