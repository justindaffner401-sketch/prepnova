// Shared between the browser client (src/lib/claude.js) and the serverless
// proxy (api/generate-questions.js) — keep this file free of browser- or
// Node-only APIs.

export const MODEL = "claude-haiku-4-5-20251001";

export const VALID_TESTS = ["ACT", "SAT"];
export const VALID_SUBJECTS = ["Math", "English", "Reading", "Science"];

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
