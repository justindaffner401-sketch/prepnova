// Shared between the browser client (src/lib/claude.js) and the serverless
// proxy (api/generate-questions.js) — keep this file free of browser- or
// Node-only APIs.

export const MODEL = "claude-haiku-4-5-20251001";

export const VALID_TESTS = ["ACT", "SAT"];
export const VALID_SUBJECTS = ["Math", "English", "Reading", "Science"];

// Which (test, subject) pairs use the passage-based exam-replica format
// instead of the 5 standalone MCQs. Slice 1: ACT English only.
export function isPassageMode(test, subject) {
  return test === "ACT" && subject === "English";
}

export const SYSTEM_PROMPT =
  "You are PrepNova's question engine — an expert ACT and SAT tutor who writes realistic, test-accurate multiple-choice practice questions with explanations that genuinely teach the underlying concept.";

// Structured-output schema. Each choice carries its OWN `correct` flag rather
// than a separate answerIndex the model has to count — this keeps the marked
// answer and the explanation from drifting apart (LLMs reliably mark the right
// choice inline, but frequently miscount a separate index). Lengths (5
// questions, 4 choices, exactly one correct) are enforced in validateQuestions.
export const QUESTIONS_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          choices: {
            type: "array",
            items: {
              type: "object",
              properties: {
                text: { type: "string" },
                correct: { type: "boolean" },
              },
              required: ["text", "correct"],
              additionalProperties: false,
            },
          },
          explanation: { type: "string" },
        },
        required: ["question", "choices", "explanation"],
        additionalProperties: false,
      },
    },
  },
  required: ["questions"],
  additionalProperties: false,
};

export function buildPrompt(test, subject) {
  return `Write exactly 5 multiple-choice practice questions for ${test} ${subject} prep.

Rules:
- Match the style, topics, and difficulty of real ${test} ${subject} questions. Mix difficulty: roughly 2 easy, 2 medium, 1 hard.
- Every question must be fully self-contained. For Reading, embed a short 2-4 sentence passage inside the question text. For Science, describe the experiment, table, or data trend in plain prose inside the question text.
- Exactly 4 answer choices per question. Each choice is an object { "text": "...", "correct": true|false }.
- ACTUALLY SOLVE each problem before writing the choices. Mark exactly ONE choice with "correct": true (the verified right answer) and the other three with "correct": false. Double-check that the choice you mark correct is genuinely the right answer.
- Spread the correct answer across different positions — don't always make the first choice correct.
- The explanation must defend the choice you marked correct: 2-4 sentences on why that choice is right AND why the most tempting wrong choice fails. Refer to choices by their content (the actual values/words), never by letter or position. The explanation and the choice marked correct must agree.
- Keep it tight: each question text under 120 words (including any passage), each explanation under 80 words.
- Plain text only: no markdown, no LaTeX. Write math like "3x + 5 = 20" and exponents like "x^2".`;
}

export function validateQuestions(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Claude returned something unreadable. Try generating again.");
  }

  const questions = Array.isArray(parsed?.questions) ? parsed.questions : [];
  const cleaned = [];

  for (const q of questions) {
    if (!q || typeof q.question !== "string" || !q.question.trim()) continue;
    if (typeof q.explanation !== "string" || !q.explanation.trim()) continue;
    if (!Array.isArray(q.choices) || q.choices.length !== 4) continue;

    const texts = q.choices.map((c) => c?.text);
    if (!texts.every((t) => typeof t === "string" && t.trim())) continue;

    // Exactly one choice must be flagged correct — this is the safeguard that
    // prevents a mismatched/ambiguous answer from ever reaching a student.
    const correctIndexes = q.choices
      .map((c, i) => (c?.correct === true ? i : -1))
      .filter((i) => i !== -1);
    if (correctIndexes.length !== 1) continue;

    cleaned.push({
      question: q.question,
      choices: texts,
      answerIndex: correctIndexes[0],
      explanation: q.explanation,
    });
  }

  if (cleaned.length < 5) {
    throw new Error("Claude didn't return a complete set of questions. Try again.");
  }
  return cleaned.slice(0, 5);
}

/* ===================================================================
 * Passage-based format (exam replica) — slice 1: ACT English.
 *
 * A passage is rendered as a sequence of `segments`. Most segments are plain
 * text; some are UNDERLINED spans carrying a number (`ref`). Each underlined
 * span has exactly one question whose `ref` matches; the student picks the
 * best replacement for the underlined text ("NO CHANGE" is the usual first
 * choice). This mirrors the real digital ACT English section.
 * =================================================================== */

// Structured-output schema for one ACT English passage + its questions.
// Segments use a uniform shape (no discriminated unions) so structured output
// stays reliable: `underline:false, ref:0` for plain text, `underline:true`
// with a positive `ref` for an underlined span.
export const PASSAGE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    segments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          underline: { type: "boolean" },
          ref: { type: "integer" },
        },
        required: ["text", "underline", "ref"],
        additionalProperties: false,
      },
    },
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          ref: { type: "integer" },
          prompt: { type: "string" },
          choices: {
            type: "array",
            items: {
              type: "object",
              properties: {
                text: { type: "string" },
                correct: { type: "boolean" },
              },
              required: ["text", "correct"],
              additionalProperties: false,
            },
          },
          explanation: { type: "string" },
        },
        required: ["ref", "prompt", "choices", "explanation"],
        additionalProperties: false,
      },
    },
  },
  required: ["title", "segments", "questions"],
  additionalProperties: false,
};

export function buildPassagePrompt(test, subject) {
  // Slice 1 only supports ACT English; guard so a future caller can't silently
  // get the wrong prompt.
  if (test !== "ACT" || subject !== "English") {
    throw new Error(`Passage mode is not configured for ${test} ${subject}.`);
  }
  return `Write ONE realistic ACT English passage with grammar/style/rhetoric questions, exactly like the real digital ACT.

How the real section works: the passage is printed with certain portions UNDERLINED and numbered. Each numbered underline has a question; the student chooses the best version of that underlined portion ("NO CHANGE" or a replacement).

Output a JSON object with "title", "segments", and "questions".

PASSAGE ("title" + "segments"):
- Write a coherent 350-450 word passage (a personal essay, history, or popular-science piece — the usual ACT subjects).
- Break the FULL passage into ordered "segments" that, read in order, reproduce the passage exactly with no gaps or overlaps.
- A plain-text segment is { "text": "...", "underline": false, "ref": 0 }.
- An underlined segment is { "text": "<the underlined words>", "underline": true, "ref": N } where N is its number.
- Number the underlines 1, 2, 3, … in reading order with NO gaps. Use 6 to 9 underlines.
- Underlined spans should be short (a few words or one clause) — the exact text a question asks you to fix or improve.

QUESTIONS (one per underline):
- Exactly one question per underlined ref, and its "ref" must match that underline's number.
- Cover a realistic mix: subject-verb agreement, pronouns, verb tense, punctuation (commas/semicolons/apostrophes), conciseness/redundancy, transitions/word choice, and at least one rhetorical question (e.g. "Which choice most effectively…").
- "prompt": for a plain grammar fix, use "" (empty) — the underlined text itself is the question. For a rhetorical/strategy question, write the actual question (e.g. "Which choice best emphasizes the writer's surprise?").
- "choices": exactly 4 objects { "text": "...", "correct": true|false }. For grammar-fix questions the first choice's text must be "NO CHANGE". The other choices are full replacement texts for the underlined span (NOT "NO CHANGE").
- ACTUALLY SOLVE each one: mark exactly ONE choice "correct": true and verify it is genuinely best. Spread the correct answer across positions (don't always pick "NO CHANGE").
- "explanation": 2-4 sentences defending the correct choice and naming why the most tempting wrong choice fails. Refer to choices by their content, never by letter/position.
- Plain text only: no markdown, no LaTeX.`;
}

// Validate and normalize a passage set. Returns
// { title, segments:[{text, underline, ref}], questions:[{ref, prompt,
// choices:[string], answerIndex, explanation}] } with questions sorted by ref.
export function validatePassageSet(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Claude returned something unreadable. Try generating again.");
  }

  const rawSegments = Array.isArray(parsed?.segments) ? parsed.segments : [];
  const segments = [];
  for (const s of rawSegments) {
    if (!s || typeof s.text !== "string" || !s.text) continue;
    const underline = s.underline === true;
    const ref = underline && Number.isInteger(s.ref) && s.ref > 0 ? s.ref : 0;
    if (underline && ref === 0) continue; // underlined but unnumbered — drop
    segments.push({ text: s.text, underline, ref });
  }

  const underlineRefs = segments.filter((s) => s.underline).map((s) => s.ref);
  const refSet = new Set(underlineRefs);
  if (refSet.size !== underlineRefs.length) {
    throw new Error("The passage had duplicate underline numbers. Try again.");
  }
  if (refSet.size < 5) {
    throw new Error("The passage didn't come back complete. Try again.");
  }

  const rawQuestions = Array.isArray(parsed?.questions) ? parsed.questions : [];
  const byRef = new Map();
  for (const q of rawQuestions) {
    if (!q || !Number.isInteger(q.ref) || !refSet.has(q.ref)) continue;
    if (typeof q.explanation !== "string" || !q.explanation.trim()) continue;
    if (!Array.isArray(q.choices) || q.choices.length !== 4) continue;

    const texts = q.choices.map((c) => c?.text);
    if (!texts.every((t) => typeof t === "string" && t.trim())) continue;

    const correctIndexes = q.choices
      .map((c, i) => (c?.correct === true ? i : -1))
      .filter((i) => i !== -1);
    if (correctIndexes.length !== 1) continue;

    if (byRef.has(q.ref)) continue; // first valid question wins for a ref
    byRef.set(q.ref, {
      ref: q.ref,
      prompt: typeof q.prompt === "string" ? q.prompt.trim() : "",
      choices: texts,
      answerIndex: correctIndexes[0],
      explanation: q.explanation,
    });
  }

  // Keep only underlines that have a matching valid question, renumber both
  // sides to a clean contiguous 1..N so the UI labels always line up.
  const orderedRefs = underlineRefs.filter((r) => byRef.has(r)).sort((a, b) => a - b);
  if (orderedRefs.length < 5) {
    throw new Error("Claude didn't return a complete passage set. Try again.");
  }

  const renumber = new Map(orderedRefs.map((r, i) => [r, i + 1]));
  const finalSegments = segments
    .filter((s) => !s.underline || renumber.has(s.ref))
    .map((s) => (s.underline ? { ...s, ref: renumber.get(s.ref) } : s));
  const finalQuestions = orderedRefs.map((r) => ({
    ...byRef.get(r),
    ref: renumber.get(r),
  }));

  return {
    title: typeof parsed?.title === "string" ? parsed.title.trim() : "",
    segments: finalSegments,
    questions: finalQuestions,
  };
}
