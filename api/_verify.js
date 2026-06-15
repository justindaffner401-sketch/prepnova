// Second-model verification pass (server-only).
//
// After Claude generates questions, a DIFFERENT model (OpenAI) independently
// re-solves each one. Any question whose verified answer disagrees with the
// answer we marked correct is dropped — a cheap, high-signal guard against the
// occasional wrong key from the generator. Cross-family (Claude → OpenAI) makes
// the second opinion genuinely independent.
//
// Everything here gracefully no-ops if OPENAI_API_KEY is unset or the verifier
// errors/times out: verification must never break question generation. The key
// lives only in the serverless environment (set it in Vercel → Project →
// Settings → Environment Variables); it is never sent to the browser.

import { readingContextText, renumberPassage } from "../src/lib/questionSpec.js";

const VERIFY_MODEL = process.env.OPENAI_VERIFY_MODEL || "gpt-4o-mini";
const VERIFY_TIMEOUT_MS = 30_000;

export function verifierEnabled() {
  return Boolean(process.env.OPENAI_API_KEY);
}

const SYSTEM =
  "You are a meticulous ACT/SAT answer-key checker. You solve multiple-choice questions independently and report only the single best choice for each. You respond with JSON only.";

// Call the verifier with a user message and return a Map of question id ->
// chosen 0-based choice index. Returns null (skip verification) on any problem.
async function callVerifier(userContent) {
  if (!process.env.OPENAI_API_KEY) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);
  let res;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: VERIFY_MODEL,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userContent },
        ],
      }),
      signal: controller.signal,
    });
  } catch {
    return null; // network error / timeout — skip verification
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) return null;
  let data;
  try {
    data = await res.json();
  } catch {
    return null;
  }
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string") return null;
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  const answers = Array.isArray(parsed?.answers) ? parsed.answers : [];
  const map = new Map();
  for (const a of answers) {
    if (Number.isInteger(a?.id) && Number.isInteger(a?.choice)) map.set(a.id, a.choice);
  }
  return map.size ? map : null;
}

// Keep a question only if the verifier didn't cover it, returned an
// out-of-range pick (no usable signal), or AGREES with our marked answer.
function agrees(map, id, question) {
  if (!map.has(id)) return true;
  const v = map.get(id);
  if (!Number.isInteger(v) || v < 0 || v >= question.choices.length) return true;
  return v === question.answerIndex;
}

/* ---------------- Standalone MCQ sets (Math / Reading / Science) ---------------- */

// Returns { verified, questions }. `verified` is true only when the verifier
// actually ran AND the returned set is the one it approved.
export async function verifyMcq(questions) {
  if (!verifierEnabled() || questions.length === 0) return { verified: false, questions };
  const items = questions.map((q, i) => ({ id: i, question: q.question, choices: q.choices }));
  const user = `For each multiple-choice question below, solve it independently and choose the single best answer.

Return ONLY JSON shaped exactly like {"answers":[{"id":0,"choice":2}]} — one entry per id, where "choice" is the 0-based index of the correct choice.

QUESTIONS:
${JSON.stringify(items)}`;
  const map = await callVerifier(user);
  if (!map) return { verified: false, questions };
  const kept = questions.filter((q, i) => agrees(map, i, q));
  // Only trust the verified set if a full 5 survived; otherwise keep the
  // original so the student isn't left short (and don't claim it's verified).
  if (kept.length >= 5) return { verified: true, questions: kept };
  return { verified: false, questions };
}

/* ---------------- Passage sets (ACT English) ---------------- */

// Re-render the passage with its underlines marked << N: text >> so the
// verifier can locate what each underline question is asking about.
function markedPassage(segments) {
  return segments
    .map((s) => (s.underline ? `<< ${s.ref}: ${s.text} >>` : s.text))
    .join("");
}

// Returns { verified, passage }. `verified` is true only when the verifier ran
// AND the returned passage reflects its judgment (all agreed, or disputed
// questions were dropped and the rest renumbered).
export async function verifyPassage(passage) {
  if (!verifierEnabled() || passage.questions.length === 0) return { verified: false, passage };

  const items = passage.questions.map((q, i) => ({
    id: i,
    refersToUnderline: q.ref > 0 ? q.ref : null,
    question: q.prompt,
    choices: q.choices,
  }));
  const user = `Below is an ACT English passage. Underlined portions are marked << N: text >>. Each question either refers to a numbered underline ("refersToUnderline": N) or to the whole passage ("refersToUnderline": null).

For an underline question, mentally substitute each choice for that underlined portion and pick the best version by standard ACT English rules (grammar, punctuation, conciseness, and rhetorical fit). "NO CHANGE" means keep the underlined text as written; "DELETE the underlined portion." means remove it. For a whole-passage question, judge by the essay as a whole.

Return ONLY JSON shaped exactly like {"answers":[{"id":0,"choice":2}]} — one entry per id, where "choice" is the 0-based index of the single best choice.

PASSAGE:
${markedPassage(passage.segments)}

QUESTIONS:
${JSON.stringify(items)}`;

  const map = await callVerifier(user);
  if (!map) return { verified: false, passage };

  const kept = passage.questions.filter((q, i) => agrees(map, i, q));
  // All agreed → verified, nothing to change.
  if (kept.length === passage.questions.length) return { verified: true, passage };
  // So much disputed it'd gut the passage → fall back to the unverified set.
  if (kept.length < 5) return { verified: false, passage };

  // Unwrap the underlines of dropped questions to plain text (so the passage
  // still reads correctly), then re-order and renumber what remains.
  const keptSpanRefs = new Set(kept.filter((q) => q.ref > 0).map((q) => q.ref));
  const adjusted = passage.segments.map((s) =>
    s.underline && !keptSpanRefs.has(s.ref) ? { text: s.text, underline: false, ref: 0 } : s,
  );
  const { segments, questions } = renumberPassage(adjusted, kept);
  return { verified: true, passage: { ...passage, segments, questions } };
}

/* ---------------- ACT Reading (whole-passage comprehension) ---------------- */

// Returns { verified, reading }. Questions are all about the passage; disputed
// ones are dropped. Falls back to the unverified set if dropping would leave
// fewer than 5.
export async function verifyReading(reading) {
  if (!verifierEnabled() || reading.questions.length === 0) return { verified: false, reading };

  const ctx = readingContextText(reading);
  const items = reading.questions.map((q, i) => ({ id: i, question: q.prompt, choices: q.choices }));
  const user = `Below is ACT Reading material (a passage, a paired set, or a passage with a figure). Answer each comprehension question using ONLY this material.

Return ONLY JSON shaped exactly like {"answers":[{"id":0,"choice":2}]} — one entry per id, where "choice" is the 0-based index of the single best answer.

PASSAGE:
${ctx}

QUESTIONS:
${JSON.stringify(items)}`;

  const map = await callVerifier(user);
  if (!map) return { verified: false, reading };

  const kept = reading.questions.filter((q, i) => agrees(map, i, q));
  if (kept.length === reading.questions.length) return { verified: true, reading };
  if (kept.length < 5) return { verified: false, reading };
  return { verified: true, reading: { ...reading, questions: kept } };
}

/* ---------------- SAT Reading & Writing (self-contained items) ---------------- */

// Returns { verified, writing }. Each item carries its own short text, so the
// verifier gets that text with the question. Disputed items are dropped.
export async function verifyWriting(writing) {
  if (!verifierEnabled() || writing.questions.length === 0) return { verified: false, writing };

  const items = writing.questions.map((q, i) => ({
    id: i,
    text: q.text,
    question: q.prompt,
    choices: q.choices,
  }));
  const user = `Below are SAT Reading & Writing items. Each has its own short "text" (a passage, a sentence with a blank "______", or bullet notes) and a question. Solve each using only its own text, by standard SAT rules (precise word choice, grammar conventions, logic, evidence, or rhetorical goal).

Return ONLY JSON shaped exactly like {"answers":[{"id":0,"choice":2}]} — one entry per id, where "choice" is the 0-based index of the single best answer.

ITEMS:
${JSON.stringify(items)}`;

  const map = await callVerifier(user);
  if (!map) return { verified: false, writing };

  const kept = writing.questions.filter((q, i) => agrees(map, i, q));
  if (kept.length === writing.questions.length) return { verified: true, writing };
  if (kept.length < 5) return { verified: false, writing };
  return { verified: true, writing: { ...writing, questions: kept } };
}
