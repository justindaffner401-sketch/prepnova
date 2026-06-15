// Shared between the browser client (src/lib/claude.js) and the serverless
// proxy (api/generate-questions.js) — keep this file free of browser- or
// Node-only APIs.

// Haiku handles the fast MCQ path (Math/Science). The passage-heavy sections
// (ACT English/Reading, SAT Reading & Writing) use a stronger model for better
// prose and question coherence — the verification pass guards correctness.
export const MODEL = "claude-haiku-4-5-20251001";
export const PASSAGE_MODEL = "claude-sonnet-4-6";

// Pick the generation model for a given mode ("mcq" | "passage" | "reading" | "writing").
export function modelForMode(mode) {
  return mode && mode !== "mcq" ? PASSAGE_MODEL : MODEL;
}

export const VALID_TESTS = ["ACT", "SAT"];
export const VALID_SUBJECTS = ["Math", "English", "Reading", "Science"];

// Which (test, subject) pairs use the ACT English passage format (underlined
// spans + grouped questions) instead of the 5 standalone MCQs.
export function isPassageMode(test, subject) {
  return test === "ACT" && subject === "English";
}

// ACT Reading uses the whole-passage comprehension format (no underlines; a
// pinned passage with questions about it).
export function isReadingMode(test, subject) {
  return test === "ACT" && subject === "Reading";
}

// SAT "English" is the digital Reading & Writing section: a series of
// independent short-text items (one passage + one question each).
export function isWritingMode(test, subject) {
  return test === "SAT" && subject === "English";
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

export function buildPrompt(test, subject, count = 5) {
  return `Write exactly ${count} multiple-choice practice questions for ${test} ${subject} prep.

Rules:
- Match the style, topics, and difficulty of real ${test} ${subject} questions. Mix difficulty across easy, medium, and hard, including at least one hard question.
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
  // Return all valid questions (capped). Over-generation + the verification
  // pass may trim this; callers slice to the 5 they actually show.
  return cleaned.slice(0, 12);
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
  return `Write ONE realistic passage with questions, modeled EXACTLY on the current digital ACT English test.

HOW THE REAL SECTION WORKS: a passage is printed with certain portions UNDERLINED and numbered. EVERY question has an explicit question stem (the digital ACT never just shows answer choices — it always asks a specific question). Most questions refer to an underlined portion; a few are about the passage as a whole.

Output a JSON object with "title", "segments", and "questions".

MAKE THE PASSAGE WORTH READING:
- Pick a SPECIFIC, concrete subject with a real story or idea — a particular person, place, discovery, craft, performance, event, or object. AVOID generic, overused topics (volunteering, a sports season, "my grandmother taught me," a vague life lesson, a trip that changed me).
- Vary the type from passage to passage: a profile of a little-known innovator or artist; the surprising history of an everyday object; a first-person account of an unusual job, hobby, or skill; a piece on a striking natural phenomenon; a slice of cultural or scientific history. Aim for something a curious 11th grader would genuinely find interesting.
- Use concrete details, real information, and a clear voice; the prose should have some life, not read like filler.

PASSAGE ("title" + "segments"):
- Write a coherent 380-460 word passage in the type you chose above.
- Break the FULL passage into ordered "segments" that, read in order, reproduce the passage exactly with no gaps or overlaps.
- Plain-text segment: { "text": "...", "underline": false, "ref": 0 }.
- Underlined segment: { "text": "<the underlined words>", "underline": true, "ref": N } where N is its number.
- Number the underlines 1, 2, 3, … in reading order with NO gaps. Use 8 to 11 underlines.
- Underlined spans are SHORT — a word, phrase, or single clause. For grammar/redundancy questions, deliberately write the underlined span with the error the question fixes; for "NO CHANGE"-correct questions, write it correctly.

EVERY QUESTION MUST HAVE A STEM. Use these EXACT stems by type (copy the wording, filling in brackets):

TYPE A — Grammar/usage/punctuation (the majority). Stem EXACTLY: "Which choice makes the sentence most grammatically acceptable?" Tests punctuation (commas, semicolons, apostrophes, colons), subject-verb agreement, pronoun case/agreement, verb tense/form, modifiers, and sentence boundaries (comma splices, run-ons, fragments). First choice text "NO CHANGE"; the other three are full replacement texts for the underlined span. One choice may be "DELETE the underlined portion." when removing it is grammatical.

TYPE B — Redundancy/conciseness. Stem EXACTLY: "Which choice is least redundant in context?" The underlined span repeats an idea already stated nearby; the correct answer removes the repetition — frequently "DELETE the underlined portion." First choice "NO CHANGE". Include at least ONE of these.

TYPE C — Rhetorical/detail (tied to an underline). Stem begins EXACTLY "Given that all the choices are accurate, which one " then a specific goal, e.g.: "...best introduces the paragraph?", "...most effectively concludes the essay?", "...sets up a contrast regarding [specific thing]?", or "...most clearly uses specific details to support the [specific claim]?". ALL FOUR choices must be factually plausible sentences (no grammar errors); exactly one best serves the stated goal. First choice "NO CHANGE". Include 2-3 of these.

TYPE D — Whole-essay purpose (REQUIRED — exactly one, "ref": 0, listed LAST). Stem EXACTLY: "Suppose the writer's primary purpose had been to [a specific purpose]. Would this essay accomplish that purpose?" The four choices begin "Yes, because…", "Yes, because…", "No, because…", "No, because…", exactly one correct based on what the essay actually does.

DO NOT create questions that ask the student to REORDER sentences, choose a "sequence of sentences," or place a sentence "at Point A/B/C/D" — those are not supported here.

RULES FOR EVERY QUESTION:
- "ref": for an underline question, match that underline's number. For the whole-essay question, use "ref": 0.
- "prompt": the exact stem for that type (never empty).
- "choices": exactly 4 objects { "text": "...", "correct": true|false }. ACTUALLY SOLVE each one and mark exactly ONE "correct": true.
- For TYPE A/B/C the first choice text is "NO CHANGE". For TYPE D use the Yes/No wording.
- COHERENCE CHECK: read the full sentence with the correct choice substituted in — it must be smooth and correct. The three wrong choices must each be CLEARLY worse (a real grammar error, an added redundancy, or a poorer fit for the goal), never a second defensible answer.
- TEMPTING DISTRACTORS: make the wrong choices reflect common student mistakes — a comma that looks reasonable but splices, a near-synonym with the wrong connotation, a tense that almost fits, a transition that sounds plausible but signals the wrong relationship. They should be wrong on inspection, not obviously throwaway.
- Spread the correct answer across positions — "NO CHANGE"/"Yes" must NOT always be correct.
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

  // Assemble candidates (span questions carry their underline ref; standalone
  // carry ref 0) and let renumberPassage order + renumber them like the test.
  const candidates = [
    ...[...spanByRef.entries()].map(([ref, q]) => ({ ...q, ref })),
    ...standalone.map((q) => ({ ...q, ref: 0 })),
  ];
  const { segments: finalSegments, questions: finalQuestions } = renumberPassage(
    segments,
    candidates,
  );
  if (finalQuestions.length < 5) {
    throw new Error("Claude didn't return a complete passage set. Try again.");
  }

  return {
    title: typeof parsed?.title === "string" ? parsed.title.trim() : "",
    segments: finalSegments,
    questions: finalQuestions,
  };
}

// Order a passage's questions like the real test — underline-tied questions in
// reading order, then whole-passage questions — and renumber underlines and
// questions to a clean contiguous 1..K. Shared by validatePassageSet and the
// post-verification rebuild. Each question carries `ref` (>0 = underline
// number, 0 = whole-passage). Underline segments with no surviving question are
// dropped; to KEEP such text, unwrap the segment to plain text before calling.
export function renumberPassage(segments, questions) {
  const underlineOrder = segments.filter((s) => s.underline).map((s) => s.ref);
  const spanByRef = new Map();
  const standalone = [];
  for (const q of questions) {
    if (q.ref > 0 && underlineOrder.includes(q.ref)) {
      if (!spanByRef.has(q.ref)) spanByRef.set(q.ref, q);
    } else if (q.ref === 0) {
      standalone.push(q);
    }
  }
  const orderedSpanRefs = underlineOrder.filter((r) => spanByRef.has(r));
  const ordered = [
    ...orderedSpanRefs.map((r) => ({ oldRef: r, q: spanByRef.get(r) })),
    ...standalone.map((q) => ({ oldRef: 0, q })),
  ];
  const renumber = new Map();
  const finalQuestions = ordered.map(({ oldRef, q }, i) => {
    const number = i + 1;
    if (oldRef > 0) renumber.set(oldRef, number);
    return { ...q, ref: oldRef > 0 ? number : 0 };
  });
  const finalSegments = segments
    .filter((s) => !s.underline || renumber.has(s.ref))
    .map((s) => (s.underline ? { ...s, ref: renumber.get(s.ref) } : s));
  return { segments: finalSegments, questions: finalQuestions };
}

/* ===================================================================
 * ACT Reading — whole-passage comprehension format.
 *
 * No underlines: a single passage (numbered paragraphs) with standalone
 * comprehension questions about it (main idea, inference, detail,
 * vocabulary-in-context, function, tone). Mirrors the real ACT Reading
 * section. Paired-passage (A/B) and graph variants are deferred.
 * =================================================================== */

export const READING_GENRES = [
  "Literary Narrative",
  "Social Science",
  "Humanities",
  "Natural Science",
];

export const READING_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    genre: { type: "string" },
    paragraphs: { type: "array", items: { type: "string" } },
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
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
        required: ["prompt", "choices", "explanation"],
        additionalProperties: false,
      },
    },
  },
  required: ["title", "genre", "paragraphs", "questions"],
  additionalProperties: false,
};

export function buildReadingPrompt(test, subject) {
  if (test !== "ACT" || subject !== "Reading") {
    throw new Error(`Reading mode is not configured for ${test} ${subject}.`);
  }
  return `Write ONE realistic ACT Reading passage with comprehension questions, modeled exactly on the real ACT Reading test.

HOW THE REAL SECTION WORKS: the student reads a full passage, then answers questions ABOUT it. Questions are not tied to underlined words; they ask about meaning, purpose, inferences, details, vocabulary in context, the function of a paragraph, and tone.

Output a JSON object with "title", "genre", "paragraphs", and "questions".

PASSAGE:
- Pick ONE genre and put it in "genre": exactly one of "Literary Narrative", "Social Science", "Humanities", or "Natural Science".
- Write a coherent 600-800 word passage in that genre and split it into "paragraphs" (an array of 5-8 paragraph strings, in order). Literary Narrative should read like a short story excerpt; the others like nonfiction.
- The reader sees the paragraphs NUMBERED 1, 2, 3, … in order. Questions may refer to a paragraph by its number.

QUESTIONS (write 9, all about the passage):
- Use authentic ACT Reading stems and a realistic mix of these types:
  - Main idea/purpose: "The main purpose of the passage is to:" or "The main idea of the [Nth] paragraph is that:".
  - Detail: "According to the passage, ...".
  - Inference: "It can reasonably be inferred from the passage that ...".
  - Vocabulary-in-context: "As it is used in the [Nth] paragraph, the word \"X\" most nearly means:". X MUST be a word that actually appears in that paragraph.
  - Function: "The [Nth] paragraph primarily serves to:" or "The author most likely includes [a quoted detail] in order to:".
  - Tone/attitude: "The author's attitude toward [X] can best be described as:".
- Refer to paragraphs by NUMBER (e.g., "the third paragraph") and QUOTE exact words/phrases from the passage. Do NOT use bare line numbers.
- Every question is answerable strictly from the passage. "choices": exactly 4 objects { "text": "...", "correct": true|false }; mark exactly ONE correct and verify it against the passage. The three wrong choices must be clearly unsupported by the passage (not a second defensible reading).
- Spread the correct answer across positions.
- "explanation": 2-4 sentences pointing to the part of the passage that justifies the correct choice and naming why the most tempting wrong choice isn't supported. Refer to choices by their content, never by letter/position.
- Plain text only: no markdown, no LaTeX.`;
}

export function validateReadingSet(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Claude returned something unreadable. Try generating again.");
  }

  const paragraphs = (Array.isArray(parsed?.paragraphs) ? parsed.paragraphs : [])
    .filter((p) => typeof p === "string" && p.trim())
    .map((p) => p.trim());
  if (paragraphs.length < 3) {
    throw new Error("The passage didn't come back complete. Try again.");
  }

  const rawQuestions = Array.isArray(parsed?.questions) ? parsed.questions : [];
  const cleaned = [];
  for (const q of rawQuestions) {
    if (!q || typeof q.prompt !== "string" || !q.prompt.trim()) continue;
    if (typeof q.explanation !== "string" || !q.explanation.trim()) continue;
    if (!Array.isArray(q.choices) || q.choices.length !== 4) continue;
    const texts = q.choices.map((c) => c?.text);
    if (!texts.every((t) => typeof t === "string" && t.trim())) continue;
    const correctIndexes = q.choices
      .map((c, i) => (c?.correct === true ? i : -1))
      .filter((i) => i !== -1);
    if (correctIndexes.length !== 1) continue;
    cleaned.push({
      prompt: q.prompt.trim(),
      choices: texts,
      answerIndex: correctIndexes[0],
      explanation: q.explanation,
    });
  }

  if (cleaned.length < 5) {
    throw new Error("Claude didn't return a complete set of questions. Try again.");
  }

  const genre = READING_GENRES.includes(parsed?.genre) ? parsed.genre : "Reading";
  return {
    format: "single",
    title: typeof parsed?.title === "string" ? parsed.title.trim() : "",
    genre,
    paragraphs,
    questions: cleaned.slice(0, 12),
  };
}

// Shared helper to normalize a reading question { prompt, choices, explanation }
// (+ optional scope for paired passages). Returns null if invalid.
function normalizeReadingQuestion(q, withScope) {
  if (!q || typeof q.prompt !== "string" || !q.prompt.trim()) return null;
  if (typeof q.explanation !== "string" || !q.explanation.trim()) return null;
  if (!Array.isArray(q.choices) || q.choices.length !== 4) return null;
  const texts = q.choices.map((c) => c?.text);
  if (!texts.every((t) => typeof t === "string" && t.trim())) return null;
  const correctIndexes = q.choices
    .map((c, i) => (c?.correct === true ? i : -1))
    .filter((i) => i !== -1);
  if (correctIndexes.length !== 1) return null;
  const out = {
    prompt: q.prompt.trim(),
    choices: texts,
    answerIndex: correctIndexes[0],
    explanation: q.explanation,
  };
  if (withScope) {
    out.scope = ["A", "B", "both"].includes(q.scope) ? q.scope : "both";
  }
  return out;
}

/* ---------------- Paired A/B Reading ---------------- */

export const READING_PAIRED_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    genre: { type: "string" },
    passageA: {
      type: "object",
      properties: {
        label: { type: "string" },
        paragraphs: { type: "array", items: { type: "string" } },
      },
      required: ["label", "paragraphs"],
      additionalProperties: false,
    },
    passageB: {
      type: "object",
      properties: {
        label: { type: "string" },
        paragraphs: { type: "array", items: { type: "string" } },
      },
      required: ["label", "paragraphs"],
      additionalProperties: false,
    },
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          scope: { type: "string" },
          prompt: { type: "string" },
          choices: {
            type: "array",
            items: {
              type: "object",
              properties: { text: { type: "string" }, correct: { type: "boolean" } },
              required: ["text", "correct"],
              additionalProperties: false,
            },
          },
          explanation: { type: "string" },
        },
        required: ["scope", "prompt", "choices", "explanation"],
        additionalProperties: false,
      },
    },
  },
  required: ["title", "genre", "passageA", "passageB", "questions"],
  additionalProperties: false,
};

export function buildReadingPairedPrompt(test, subject) {
  if (test !== "ACT" || subject !== "Reading") {
    throw new Error(`Reading mode is not configured for ${test} ${subject}.`);
  }
  return `Write a PAIRED ACT Reading passage set — TWO short passages (Passage A and Passage B) on a shared topic, with comprehension questions about each and about both. This mirrors the real ACT Reading paired passage.

Output a JSON object with "title", "genre", "passageA", "passageB", and "questions".

- "genre": one of "Literary Narrative", "Social Science", "Humanities", "Natural Science" (both passages share it).
- "passageA" and "passageB": each { "label": "...", "paragraphs": [ ... ] }. The label is a brief source line (e.g., "Passage A is adapted from an essay by a marine biologist."). Each passage is 150-230 words in 2-3 paragraphs. The two should address the SAME subject from different angles, sources, or opinions so they can be compared.

QUESTIONS (write 8). Each has a "scope": "A" (about Passage A only), "B" (about Passage B only), or "both" (comparing the two). Include roughly 3 about A, 3 about B, and 2 about both.
- Use authentic ACT stems: "According to Passage A, ...", "It can reasonably be inferred from Passage B that ...", "As it is used in Passage A, the word \"X\" most nearly means:", and for "both": "Compared to Passage A, Passage B ...", "Both passages ...", or "The author of Passage A would most likely regard [an idea in Passage B] as ...".
- "choices": exactly 4 objects { "text": "...", "correct": true|false }; mark exactly ONE correct and verify it against the relevant passage(s). Wrong choices must be clearly unsupported. Spread correct answers across positions.
- "explanation": 2-4 sentences pointing to the text that justifies the answer. Refer to choices by content, never by letter/position.
- Plain text only.`;
}

export function validatePairedReading(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Claude returned something unreadable. Try generating again.");
  }
  const readPassage = (p) => {
    const paragraphs = (Array.isArray(p?.paragraphs) ? p.paragraphs : [])
      .filter((s) => typeof s === "string" && s.trim())
      .map((s) => s.trim());
    return { label: typeof p?.label === "string" ? p.label.trim() : "", paragraphs };
  };
  const passageA = readPassage(parsed?.passageA);
  const passageB = readPassage(parsed?.passageB);
  if (passageA.paragraphs.length < 1 || passageB.paragraphs.length < 1) {
    throw new Error("The passages didn't come back complete. Try again.");
  }
  const cleaned = [];
  for (const q of Array.isArray(parsed?.questions) ? parsed.questions : []) {
    const norm = normalizeReadingQuestion(q, true);
    if (norm) cleaned.push(norm);
  }
  if (cleaned.length < 5) {
    throw new Error("Claude didn't return a complete set of questions. Try again.");
  }
  const genre = READING_GENRES.includes(parsed?.genre) ? parsed.genre : "Reading";
  return {
    format: "paired",
    title: typeof parsed?.title === "string" ? parsed.title.trim() : "",
    genre,
    passageA,
    passageB,
    questions: cleaned.slice(0, 12),
  };
}

/* ---------------- Graph/figure Reading ---------------- */

export const READING_GRAPH_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    genre: { type: "string" },
    paragraphs: { type: "array", items: { type: "string" } },
    figure: {
      type: "object",
      properties: {
        caption: { type: "string" },
        type: { type: "string" },
        xLabel: { type: "string" },
        yLabel: { type: "string" },
        series: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              points: {
                type: "array",
                items: {
                  type: "object",
                  properties: { x: { type: "string" }, y: { type: "number" } },
                  required: ["x", "y"],
                  additionalProperties: false,
                },
              },
            },
            required: ["name", "points"],
            additionalProperties: false,
          },
        },
      },
      required: ["caption", "type", "xLabel", "yLabel", "series"],
      additionalProperties: false,
    },
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          prompt: { type: "string" },
          choices: {
            type: "array",
            items: {
              type: "object",
              properties: { text: { type: "string" }, correct: { type: "boolean" } },
              required: ["text", "correct"],
              additionalProperties: false,
            },
          },
          explanation: { type: "string" },
        },
        required: ["prompt", "choices", "explanation"],
        additionalProperties: false,
      },
    },
  },
  required: ["title", "genre", "paragraphs", "figure", "questions"],
  additionalProperties: false,
};

export function buildReadingGraphPrompt(test, subject) {
  if (test !== "ACT" || subject !== "Reading") {
    throw new Error(`Reading mode is not configured for ${test} ${subject}.`);
  }
  return `Write an ACT Reading passage ACCOMPANIED BY A GRAPH, like the real ACT Reading passage that includes a visual. Some questions are about the passage and some about the graph.

Output a JSON object with "title", "genre", "paragraphs", "figure", and "questions".

- "genre": "Social Science" or "Natural Science" (these fit data-driven passages best).
- "paragraphs": an array of 4-6 paragraph strings (a 400-600 word passage) that discusses a topic involving measurable data.
- "figure": a simple graph the passage refers to:
  - "caption": e.g., "Figure 1: Average monthly rainfall in Region X".
  - "type": "bar" or "line".
  - "xLabel", "yLabel": axis labels.
  - "series": 1-2 data series. Each { "name": "...", "points": [ { "x": "category or label", "y": number } ] } with 4-7 points. Keep numbers clean and realistic; the data MUST be consistent with what the passage says.

QUESTIONS (write 8): most about the passage, plus 2-3 about the figure.
- Passage questions use normal ACT stems (main idea, inference, detail, vocabulary, function, tone).
- Figure questions use stems like "According to Figure 1, ...", "Based on the figure, which statement is best supported?", or "The figure most strongly supports the passage's claim that ...". These MUST be answerable from the figure data.
- "choices": exactly 4 objects { "text": "...", "correct": true|false }; mark exactly ONE correct and verify it (against the passage or the figure data). Wrong choices clearly unsupported. Spread correct answers across positions.
- "explanation": 2-4 sentences citing the passage or the specific figure data. Refer to choices by content, never by letter/position.
- Plain text only.`;
}

export function validateGraphReading(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Claude returned something unreadable. Try generating again.");
  }
  const paragraphs = (Array.isArray(parsed?.paragraphs) ? parsed.paragraphs : [])
    .filter((p) => typeof p === "string" && p.trim())
    .map((p) => p.trim());
  if (paragraphs.length < 3) {
    throw new Error("The passage didn't come back complete. Try again.");
  }

  const f = parsed?.figure || {};
  const type = f.type === "line" ? "line" : "bar";
  const series = (Array.isArray(f.series) ? f.series : [])
    .map((s) => ({
      name: typeof s?.name === "string" ? s.name : "",
      points: (Array.isArray(s?.points) ? s.points : [])
        .filter((p) => typeof p?.x === "string" && Number.isFinite(p?.y))
        .map((p) => ({ x: p.x, y: p.y })),
    }))
    .filter((s) => s.points.length >= 2)
    .slice(0, 2);
  if (series.length === 0) {
    throw new Error("The figure didn't come back complete. Try again.");
  }
  const figure = {
    caption: typeof f.caption === "string" ? f.caption.trim() : "Figure 1",
    type,
    xLabel: typeof f.xLabel === "string" ? f.xLabel.trim() : "",
    yLabel: typeof f.yLabel === "string" ? f.yLabel.trim() : "",
    series,
  };

  const cleaned = [];
  for (const q of Array.isArray(parsed?.questions) ? parsed.questions : []) {
    const norm = normalizeReadingQuestion(q, false);
    if (norm) cleaned.push(norm);
  }
  if (cleaned.length < 5) {
    throw new Error("Claude didn't return a complete set of questions. Try again.");
  }
  const genre = READING_GENRES.includes(parsed?.genre) ? parsed.genre : "Reading";
  return {
    format: "graph",
    title: typeof parsed?.title === "string" ? parsed.title.trim() : "",
    genre,
    paragraphs,
    figure,
    questions: cleaned.slice(0, 12),
  };
}

/* ---------------- Reading variant selection + verification context ---------------- */

export const READING_VARIANTS = ["single", "paired", "graph"];

// Randomly choose which Reading passage type to generate, roughly matching the
// real test's mix (more single passages than special variants).
export function chooseReadingVariant() {
  const r = Math.random();
  if (r < 0.4) return "single";
  if (r < 0.7) return "paired";
  return "graph";
}

export function readingPromptFor(variant, test, subject) {
  if (variant === "paired") return buildReadingPairedPrompt(test, subject);
  if (variant === "graph") return buildReadingGraphPrompt(test, subject);
  return buildReadingPrompt(test, subject);
}

export function readingSchemaFor(variant) {
  if (variant === "paired") return READING_PAIRED_SCHEMA;
  if (variant === "graph") return READING_GRAPH_SCHEMA;
  return READING_SCHEMA;
}

export function validateReadingFor(variant, text) {
  if (variant === "paired") return validatePairedReading(text);
  if (variant === "graph") return validateGraphReading(text);
  return validateReadingSet(text);
}

// Plain-text context for the verifier, covering whichever Reading format.
export function readingContextText(set) {
  if (set.format === "paired") {
    const a = set.passageA.paragraphs.map((p, i) => `[A${i + 1}] ${p}`).join("\n\n");
    const b = set.passageB.paragraphs.map((p, i) => `[B${i + 1}] ${p}`).join("\n\n");
    return `Passage A — ${set.passageA.label}\n${a}\n\nPassage B — ${set.passageB.label}\n${b}`;
  }
  const paras = set.paragraphs.map((p, i) => `[${i + 1}] ${p}`).join("\n\n");
  if (set.format === "graph") {
    const fig = set.figure;
    const data = fig.series
      .map((s) => `${s.name}: ${s.points.map((p) => `${p.x}=${p.y}`).join(", ")}`)
      .join("; ");
    return `${paras}\n\n${fig.caption} (${fig.type} chart; x=${fig.xLabel}, y=${fig.yLabel}). Data — ${data}`;
  }
  return paras;
}

/* ===================================================================
 * SAT Reading & Writing — independent short-text items.
 *
 * The digital SAT R&W section presents one short passage (~25-150 words) with
 * ONE question, one item per screen. Items are self-contained and span several
 * domains (words in context, transitions, boundaries/grammar, command of
 * evidence, inferences, rhetorical synthesis). Choices are A-D (no F/G/H/J).
 * =================================================================== */

export const SAT_WRITING_CATEGORIES = [
  "Words in Context",
  "Text Structure & Purpose",
  "Central Ideas & Details",
  "Command of Evidence",
  "Inferences",
  "Boundaries",
  "Form, Structure & Sense",
  "Transitions",
  "Rhetorical Synthesis",
];

export const SAT_WRITING_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          category: { type: "string" },
          text: { type: "string" },
          prompt: { type: "string" },
          choices: {
            type: "array",
            items: {
              type: "object",
              properties: { text: { type: "string" }, correct: { type: "boolean" } },
              required: ["text", "correct"],
              additionalProperties: false,
            },
          },
          explanation: { type: "string" },
        },
        required: ["category", "text", "prompt", "choices", "explanation"],
        additionalProperties: false,
      },
    },
  },
  required: ["questions"],
  additionalProperties: false,
};

export function buildWritingPrompt(test, subject) {
  if (test !== "SAT" || subject !== "English") {
    throw new Error(`Writing mode is not configured for ${test} ${subject}.`);
  }
  return `Write 8 practice items for the digital SAT Reading & Writing section, modeled exactly on the real test.

HOW THE REAL SECTION WORKS: each item is SELF-CONTAINED — a short text (about 25-150 words) followed by ONE question with four choices (A-D). Items are independent of one another.

Output a JSON object with "questions": an array of 8 items, each { "category", "text", "prompt", "choices", "explanation" }.

Cover this realistic spread of categories (use the exact "category" label and the exact "prompt" stem shown):
1. "Words in Context" — "text" is a short passage with a blank shown as "______". prompt: "Which choice completes the text with the most logical and precise word or phrase?" Choices are single words or short phrases.
2. "Text Structure & Purpose" — a short text. prompt: "Which choice best states the main purpose of the text?" (or "...the overall structure of the text?").
3. "Central Ideas & Details" — a short text. prompt: "Which choice best states the main idea of the text?".
4. "Command of Evidence" — a short text describing a study, claim, or hypothesis. prompt: "Which finding, if true, would most directly support the [researchers'/author's] conclusion?" (or "...weaken..."). Choices are possible findings.
5. "Inferences" — a short text that ENDS with a blank "______". prompt: "Which choice most logically completes the text?" Choices are clauses that finish the logic.
6. "Boundaries" — a short text with a blank for punctuation. prompt: "Which choice completes the text so that it conforms to the conventions of Standard English?" Choices test commas, semicolons, colons, dashes, apostrophes.
7. "Transitions" — a short text with a blank "______" between two sentences. prompt: "Which choice completes the text with the most logical transition?" Choices are transition words/phrases (e.g., "However,", "For example,", "As a result,").
8. "Rhetorical Synthesis" — "text" is a set of bullet notes (one per line, each starting with "- "). prompt: "The student wants to [a specific goal]. Which choice most effectively uses relevant information from the notes to accomplish this goal?".

For EVERY item:
- "choices": exactly 4 objects { "text": "...", "correct": true|false }. ACTUALLY SOLVE it; mark exactly ONE correct and verify it. The three wrong choices must be clearly inferior (wrong meaning, wrong grammar, illogical, or off-goal), never a second defensible answer.
- Spread the correct answer across positions A-D.
- "explanation": 2-4 sentences explaining why the correct choice works and why the most tempting wrong choice fails. Refer to choices by content, never by letter/position.
- Plain text only: no markdown, no LaTeX.`;
}

export function validateWritingSet(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Claude returned something unreadable. Try generating again.");
  }
  const cleaned = [];
  for (const q of Array.isArray(parsed?.questions) ? parsed.questions : []) {
    if (!q || typeof q.text !== "string" || !q.text.trim()) continue;
    if (typeof q.prompt !== "string" || !q.prompt.trim()) continue;
    if (typeof q.explanation !== "string" || !q.explanation.trim()) continue;
    if (!Array.isArray(q.choices) || q.choices.length !== 4) continue;
    const texts = q.choices.map((c) => c?.text);
    if (!texts.every((t) => typeof t === "string" && t.trim())) continue;
    const correctIndexes = q.choices
      .map((c, i) => (c?.correct === true ? i : -1))
      .filter((i) => i !== -1);
    if (correctIndexes.length !== 1) continue;
    cleaned.push({
      category: SAT_WRITING_CATEGORIES.includes(q.category) ? q.category : "Reading & Writing",
      text: q.text.trim(),
      prompt: q.prompt.trim(),
      choices: texts,
      answerIndex: correctIndexes[0],
      explanation: q.explanation,
    });
  }
  if (cleaned.length < 5) {
    throw new Error("Claude didn't return a complete set of questions. Try again.");
  }
  return { questions: cleaned.slice(0, 12) };
}
