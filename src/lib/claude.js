import Anthropic from "@anthropic-ai/sdk";
import {
  MODEL,
  QUESTIONS_SCHEMA,
  SYSTEM_PROMPT,
  buildPrompt,
  validateQuestions,
} from "./questionSpec.js";
import { supabase } from "./supabase.js";

export { MODEL };

/**
 * Generate 5 multiple-choice questions.
 *
 * Two paths:
 *  - apiKey provided (pasted in-app or VITE_ANTHROPIC_API_KEY): call the
 *    Claude API directly from the browser. Used for local development.
 *  - no apiKey: call this site's /api/generate-questions serverless proxy,
 *    which holds the key server-side. Used by visitors in production.
 *
 * Throws an Error with a user-friendly message on failure.
 */
export async function generateQuestions({ test, subject, apiKey, signal }) {
  return apiKey
    ? generateDirect({ test, subject, apiKey, signal })
    : generateViaProxy({ test, subject, signal });
}

/* ---------------- Server proxy path ---------------- */

async function generateViaProxy({ test, subject, signal }) {
  const headers = { "content-type": "application/json" };
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      headers.authorization = `Bearer ${data.session.access_token}`;
    }
  }

  let res;
  try {
    res = await fetch("/api/generate-questions", {
      method: "POST",
      headers,
      body: JSON.stringify({ test, subject }),
      signal,
    });
  } catch (err) {
    if (err?.name === "AbortError") throw err;
    throw new Error(
      "Couldn't reach the question server. Check your internet connection and try again.",
    );
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // Non-JSON response (e.g. the plain Vite dev server returning HTML).
  }

  if (!res.ok) {
    if (res.status === 404 || res.status === 405) {
      throw new Error(
        "This server has no question endpoint (running the plain Vite dev server?). Add an API key on the setup screen instead.",
      );
    }
    throw new Error(data?.error || "The question server returned an error. Try again.");
  }

  const questions = Array.isArray(data?.questions) ? data.questions : [];
  if (questions.length < 5) {
    throw new Error("The server didn't return a complete set of questions. Try again.");
  }
  return questions.slice(0, 5);
}

/* ---------------- Direct browser path ---------------- */

async function generateDirect({ test, subject, apiKey, signal }) {
  const client = new Anthropic({
    apiKey,
    // Required for direct browser calls. The key stays on this device; the
    // production deployment uses the serverless proxy above instead.
    dangerouslyAllowBrowser: true,
    maxRetries: 1,
    timeout: 90_000,
  });

  let response;
  try {
    response = await client.messages.create(
      {
        model: MODEL,
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildPrompt(test, subject) }],
        output_config: {
          format: { type: "json_schema", schema: QUESTIONS_SCHEMA },
        },
      },
      { signal },
    );
  } catch (err) {
    if (err instanceof Anthropic.APIUserAbortError) throw err;
    throw new Error(friendlyError(err));
  }

  if (response.stop_reason === "refusal") {
    throw new Error("Claude declined this request. Try generating again.");
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("The response was cut off before finishing. Try again.");
  }

  const text = response.content.find((block) => block.type === "text")?.text ?? "";
  return validateQuestions(text);
}

function friendlyError(err) {
  if (err instanceof Anthropic.AuthenticationError) {
    return "That API key was rejected. Double-check it and try again.";
  }
  if (err instanceof Anthropic.PermissionDeniedError) {
    return "This API key doesn't have permission to use the Claude API.";
  }
  if (err instanceof Anthropic.RateLimitError) {
    return "Rate limit reached. Wait a few seconds and try again.";
  }
  if (err instanceof Anthropic.BadRequestError) {
    return `The request was rejected: ${err.message}`;
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return "Couldn't reach the Claude API. Check your internet connection and try again.";
  }
  if (err instanceof Anthropic.APIError) {
    if (err.status === 529) {
      return "Claude is briefly overloaded. Give it a moment and try again.";
    }
    if (err.status >= 500) {
      return "The Claude API hit a temporary server error. Try again in a moment.";
    }
    return err.message || "Something went wrong calling the Claude API.";
  }
  return "Something unexpected went wrong. Try again.";
}
