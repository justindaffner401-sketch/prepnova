// Vercel serverless function: generates practice questions with the Claude
// API using a server-side key, so visitors never see it.
// Configure ANTHROPIC_API_KEY in Vercel → Project → Settings → Environment Variables.

import Anthropic from "@anthropic-ai/sdk";
import {
  MODEL,
  QUESTIONS_SCHEMA,
  SYSTEM_PROMPT,
  VALID_SUBJECTS,
  VALID_TESTS,
  buildPrompt,
  validateQuestions,
} from "../src/lib/questionSpec.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({
      error:
        "AI generation isn't configured on this deployment yet. Site owner: set ANTHROPIC_API_KEY in Vercel → Project → Settings → Environment Variables, then redeploy.",
    });
  }

  const { test, subject } = req.body ?? {};
  if (!VALID_TESTS.includes(test) || !VALID_SUBJECTS.includes(subject)) {
    return res.status(400).json({ error: "Invalid test or subject." });
  }

  const client = new Anthropic({ maxRetries: 2 }); // reads ANTHROPIC_API_KEY from env

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildPrompt(test, subject) }],
      output_config: {
        format: { type: "json_schema", schema: QUESTIONS_SCHEMA },
      },
    });

    if (response.stop_reason === "refusal") {
      return res.status(502).json({ error: "Claude declined this request. Try again." });
    }
    if (response.stop_reason === "max_tokens") {
      return res.status(502).json({ error: "The response was cut off. Try again." });
    }

    const text = response.content.find((block) => block.type === "text")?.text ?? "";
    return res.status(200).json({ questions: validateQuestions(text) });
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
