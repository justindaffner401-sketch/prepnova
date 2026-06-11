// Shared between the browser client (src/lib/claude.js) and the serverless
// proxy (api/generate-questions.js) — keep this file free of browser- or
// Node-only APIs.

export const MODEL = "claude-haiku-4-5-20251001";

export const VALID_TESTS = ["ACT", "SAT"];
export const VALID_SUBJECTS = ["Math", "English", "Reading", "Science"];

export const SYSTEM_PROMPT =
  "You are PrepNova's question engine — an expert ACT and SAT tutor who writes realistic, test-accurate multiple-choice practice questions with explanations that genuinely teach the underlying concept.";

// Structured-output schema: the API guarantees the response text is valid JSON
// matching this shape. Array lengths (exactly 5 questions, exactly 4 choices)
// can't be expressed in the supported schema subset, so they're validated below.
export const QUESTIONS_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          choices: { type: "array", items: { type: "string" } },
          answerIndex: { type: "integer", enum: [0, 1, 2, 3] },
          explanation: { type: "string" },
        },
        required: ["question", "choices", "answerIndex", "explanation"],
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
- Exactly 4 answer choices per question.
- Spread the correct answer across different positions — do not put it in the same position more than twice.
- Explanations must teach: 2-4 sentences covering why the correct answer is right AND why the most tempting wrong choice fails. Refer to choices by their content, never by letter or position.
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
  const cleaned = questions.filter(
    (q) =>
      q &&
      typeof q.question === "string" &&
      q.question.trim() &&
      Array.isArray(q.choices) &&
      q.choices.length === 4 &&
      q.choices.every((c) => typeof c === "string" && c.trim()) &&
      Number.isInteger(q.answerIndex) &&
      q.answerIndex >= 0 &&
      q.answerIndex <= 3 &&
      typeof q.explanation === "string" &&
      q.explanation.trim(),
  );

  if (cleaned.length < 5) {
    throw new Error("Claude didn't return a complete set of questions. Try again.");
  }
  return cleaned.slice(0, 5);
}
