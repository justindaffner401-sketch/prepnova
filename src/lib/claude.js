import Anthropic from "@anthropic-ai/sdk";
import {
  MODEL,
  PASSAGE_SCHEMA,
  QUESTIONS_SCHEMA,
  SYSTEM_PROMPT,
  buildPassagePrompt,
  buildPrompt,
  validatePassageSet,
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
    ? generateDirect({ test, subject, apiKey, signal, mode: "mcq" })
    : generateViaProxy({ test, subject, signal, mode: "mcq" });
}

/**
 * Generate one passage + its grouped questions (exam-replica format).
 * Same two paths as generateQuestions. Returns the validated passage set
 * { title, segments, questions }.
 */
export async function generatePassage({ test, subject, apiKey, signal }) {
  return apiKey
    ? generateDirect({ test, subject, apiKey, signal, mode: "passage" })
    : generateViaProxy({ test, subject, signal, mode: "passage" });
}

/* ---------------- Server proxy path ---------------- */

async function generateViaProxy({ test, subject, signal, mode }) {
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
      body: JSON.stringify({ test, subject, mode }),
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

  if (mode === "passage") {
    if (!data?.passage) {
      throw new Error("The server didn't return a complete passage. Try again.");
    }
    return data.passage;
  }

  const questions = Array.isArray(data?.questions) ? data.questions : [];
  if (questions.length < 5) {
    throw new Error("The server didn't return a complete set of questions. Try again.");
  }
  return questions.slice(0, 5);
}

/* ---------------- Direct browser path ---------------- */

async function generateDirect({ test, subject, apiKey, signal, mode }) {
  const client = new Anthropic({
    apiKey,
    // Required for direct browser calls. The key stays on this device; the
    // production deployment uses the serverless proxy above instead.
    dangerouslyAllowBrowser: true,
    maxRetries: 1,
    timeout: 90_000,
  });

  const passage = mode === "passage";
  let response;
  try {
    response = await client.messages.create(
      {
        model: MODEL,
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: passage
              ? buildPassagePrompt(test, subject)
              : buildPrompt(test, subject),
          },
        ],
        output_config: {
          format: {
            type: "json_schema",
            schema: passage ? PASSAGE_SCHEMA : QUESTIONS_SCHEMA,
          },
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
  // The local-key dev path doesn't run the server-side verification pass; just
  // show the first five validated questions.
  return passage ? validatePassageSet(text) : validateQuestions(text).slice(0, 5);
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
