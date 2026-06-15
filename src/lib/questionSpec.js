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
  return `Write ONE realistic ACT English passage with questions, modeled exactly on the real ACT English test.

HOW THE REAL SECTION WORKS: a passage is printed with certain portions UNDERLINED and numbered. Most questions ask the student to choose the best version of an underlined portion ("NO CHANGE" or a replacement). A few questions are about the passage as a WHOLE and are NOT tied to any underline.

Output a JSON object with "title", "segments", and "questions".

PASSAGE ("title" + "segments"):
- Write a coherent 380-460 word passage — a first-person narrative, a biographical/history piece, or a popular-science/culture piece (the usual ACT subjects).
- Break the FULL passage into ordered "segments" that, read in order, reproduce the passage exactly with no gaps or overlaps.
- Plain-text segment: { "text": "...", "underline": false, "ref": 0 }.
- Underlined segment: { "text": "<the underlined words>", "underline": true, "ref": N } where N is its number.
- Number the underlines 1, 2, 3, … in reading order with NO gaps. Use 8 to 11 underlines.
- Underlined spans are SHORT — a word, phrase, or single clause — the exact text a question asks about. Deliberately write some underlined spans with an error (a grammar/punctuation mistake, a redundancy, or an awkward choice) so the question can fix it; write others correctly so "NO CHANGE" is sometimes right.

QUESTIONS: write one question per underline PLUS exactly 1-2 whole-passage questions (see TYPE E/F). Use this realistic mix of types:

TYPE A — Grammar/usage (most common). No prompt needed. Tests punctuation (commas, semicolons, apostrophes, colons), subject-verb agreement, pronoun case/agreement, verb tense/form, modifiers, and sentence boundaries (fixing comma splices, run-ons, fragments). Set "prompt": "". First choice text is "NO CHANGE"; the other three are replacement texts. One choice may be "DELETE the underlined portion." when removing it is grammatical.

TYPE B — Redundancy/conciseness. No prompt ("prompt": ""). The underlined span repeats an idea already stated. The correct answer is the most concise version — often "DELETE the underlined portion." or "OMIT the underlined portion." First choice "NO CHANGE". Include at least ONE of these.

TYPE C — Rhetorical/strategy (tied to an underline). Write a real "prompt" using authentic ACT phrasing, e.g.: "Which choice most effectively introduces the main focus of the essay?", "Which choice best concludes the sentence/paragraph?", "Which choice most effectively maintains the essay's tone?", or "The writer wants to [specific goal]. Which choice best accomplishes that goal?". First choice "NO CHANGE"; others are replacement texts. Include 1-2 of these.

TYPE D — Add/delete a sentence (tied to an underline). "prompt" like: "The writer is considering deleting the underlined portion. Should it be kept or deleted?". The four choices are full sentences beginning "Kept, because…", "Kept, because…", "Deleted, because…", "Deleted, because…". (Optional — include at most one.)

TYPE E — Whole-essay purpose (REQUIRED, exactly one, listed LAST). Set "ref": 0 (NOT tied to an underline). "prompt": "Suppose the writer's primary purpose had been to [a specific purpose]. Would this essay accomplish that purpose?". The four choices begin "Yes, because…", "Yes, because…", "No, because…", "No, because…", with exactly one correct based on what the essay actually does.

TYPE F — Whole-essay addition (OPTIONAL, ref: 0). "prompt": "The writer is considering adding the following sentence: '[sentence]'. Should the writer make this addition?". Choices begin "Yes, because…" / "No, because…".

RULES FOR EVERY QUESTION:
- "ref": for a question tied to an underline, match that underline's number. For a whole-passage question (TYPE E/F), use "ref": 0.
- "choices": exactly 4 objects { "text": "...", "correct": true|false }. ACTUALLY SOLVE each one: mark exactly ONE choice "correct": true and verify it is genuinely best.
- For underline questions, the first choice's text must be "NO CHANGE" (except TYPE D/E/F, which use the Kept/Deleted or Yes/No wording).
- Spread the correct answer across positions — "NO CHANGE"/"Yes" should NOT always be correct.
- "explanation": 2-4 sentences defending the correct choice and naming why the most tempting wrong choice fails. Refer to choices by their content, never by letter/position.
- Plain text only: no markdown, no LaTeX.`;
}

// Validate and normalize a passage set. Returns
// { title, segments:[{text, underline, ref}], questions:[{ref, prompt,
// choices:[string], answerIndex, explanation}] }.
//
// Questions are ordered like the real test: underline-tied ("span") questions
// first, in the reading order of their underline, followed by whole-passage
// ("standalone", ref 0) questions. Span questions and their underlines are
// renumbered to a clean contiguous 1..K so the UI labels always line up;
// standalone questions keep ref 0.
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

  // Underline numbers in reading order (the order they appear in the passage).
  const underlineRefs = segments.filter((s) => s.underline).map((s) => s.ref);
  const refSet = new Set(underlineRefs);
  if (refSet.size !== underlineRefs.length) {
    throw new Error("The passage had duplicate underline numbers. Try again.");
  }
  if (refSet.size < 4) {
    throw new Error("The passage didn't come back complete. Try again.");
  }

  // A question is valid if it has 4 non-empty choices with exactly one correct
  // and a non-empty explanation.
  function normalize(q) {
    if (!q) return null;
    if (typeof q.explanation !== "string" || !q.explanation.trim()) return null;
    if (!Array.isArray(q.choices) || q.choices.length !== 4) return null;
    const texts = q.choices.map((c) => c?.text);
    if (!texts.every((t) => typeof t === "string" && t.trim())) return null;
    const correctIndexes = q.choices
      .map((c, i) => (c?.correct === true ? i : -1))
      .filter((i) => i !== -1);
    if (correctIndexes.length !== 1) return null;
    return {
      prompt: typeof q.prompt === "string" ? q.prompt.trim() : "",
      choices: texts,
      answerIndex: correctIndexes[0],
      explanation: q.explanation,
    };
  }

  const rawQuestions = Array.isArray(parsed?.questions) ? parsed.questions : [];
  const spanByRef = new Map(); // underline ref -> question
  const standalone = []; // whole-passage questions (ref 0), in model order
  for (const q of rawQuestions) {
    const norm = normalize(q);
    if (!norm) continue;
    if (Number.isInteger(q.ref) && refSet.has(q.ref)) {
      if (!spanByRef.has(q.ref)) spanByRef.set(q.ref, norm); // first wins per ref
    } else if (norm.prompt) {
      // Not tied to a (valid) underline — treat as a whole-passage question,
      // but only if it actually has a prompt to stand on.
      standalone.push(norm);
    }
  }

  // Span questions in reading order, then standalone questions appended.
  const orderedSpanRefs = underlineRefs.filter((r) => spanByRef.has(r));
  const ordered = [
    ...orderedSpanRefs.map((r) => ({ oldRef: r, q: spanByRef.get(r) })),
    ...standalone.map((q) => ({ oldRef: 0, q })),
  ];
  if (ordered.length < 5) {
    throw new Error("Claude didn't return a complete passage set. Try again.");
  }

  // Assign display numbers 1..N and remember how each underline was renumbered.
  const renumber = new Map(); // old underline ref -> new display number
  const finalQuestions = ordered.map(({ oldRef, q }, i) => {
    const number = i + 1;
    if (oldRef > 0) renumber.set(oldRef, number);
    return { ...q, ref: oldRef > 0 ? number : 0 };
  });

  // Keep only underlines that have a matching valid question; relabel them.
  const finalSegments = segments
    .filter((s) => !s.underline || renumber.has(s.ref))
    .map((s) => (s.underline ? { ...s, ref: renumber.get(s.ref) } : s));

  return {
    title: typeof parsed?.title === "string" ? parsed.title.trim() : "",
    segments: finalSegments,
    questions: finalQuestions,
  };
}
