// One-time generator for the prebuilt full-length exams.
//
// Generates + verifies complete exams and writes them as static JSON to
// public/exams/, so the app can load them instantly (no on-demand generation).
//
// Usage (keys read from the environment or .env.local — never committed):
//   ANTHROPIC_API_KEY=sk-ant-...  OPENAI_API_KEY=sk-...  node scripts/build-exams.mjs
//
// Options:
//   COUNT=4   TEST=ACT      how many exams of which test (defaults: 4 ACT)
// Re-running skips exams whose file already exists, so it is resumable.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

import {
  SYSTEM_PROMPT,
  PASSAGE_SCHEMA,
  QUESTIONS_SCHEMA,
  SAT_WRITING_SCHEMA,
  buildPassagePrompt,
  buildPrompt,
  buildWritingPrompt,
  modelForMode,
  readingPromptFor,
  readingSchemaFor,
  validatePassageSet,
  validateQuestions,
  validateReadingFor,
  validateWritingSet,
} from "../src/lib/questionSpec.js";
import { SECTION_PLANS, EXAM_SECTIONS } from "../src/lib/sectionPlans.js";
import {
  verifierEnabled,
  verifyMcq,
  verifyPassage,
  verifyReading,
  verifyWriting,
} from "../api/_verify.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "exams");

// --- load .env.local into process.env (only keys we need) ---
function loadEnvLocal() {
  const file = path.join(ROOT, ".env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const [, k, v] = m;
    if (!process.env[k] && v) process.env[k] = v.replace(/^["']|["']$/g, "");
  }
}
loadEnvLocal();

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Missing ANTHROPIC_API_KEY (set it in the environment or .env.local).");
  process.exit(1);
}

const TEST = process.env.TEST || "ACT";
const COUNT = Number(process.env.COUNT || 4);
const anthropic = new Anthropic({ maxRetries: 2, timeout: 120_000 });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function generateText(mode, { test, subject, variant, count }) {
  const content =
    mode === "passage"
      ? buildPassagePrompt(test, subject)
      : mode === "reading"
        ? readingPromptFor(variant, test, subject)
        : mode === "writing"
          ? buildWritingPrompt(test, subject)
          : buildPrompt(test, subject, count);
  const schema =
    mode === "passage"
      ? PASSAGE_SCHEMA
      : mode === "reading"
        ? readingSchemaFor(variant)
        : mode === "writing"
          ? SAT_WRITING_SCHEMA
          : QUESTIONS_SCHEMA;
  const resp = await anthropic.messages.create({
    model: modelForMode(mode),
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
    output_config: { format: { type: "json_schema", schema } },
  });
  if (resp.stop_reason === "refusal" || resp.stop_reason === "max_tokens") {
    throw new Error(`stop_reason ${resp.stop_reason}`);
  }
  return resp.content.find((b) => b.type === "text")?.text ?? "";
}

// Generate one unit (with a couple of retries) → { kind, payload, verified }.
async function generateUnit(plan, spec) {
  const base = { test: plan.test, subject: plan.subject };
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (spec.kind === "passage") {
        const text = await generateText("passage", base);
        const { verified, passage } = await verifyPassage(validatePassageSet(text));
        return { kind: "passage", payload: passage, verified };
      }
      if (spec.kind === "reading") {
        const text = await generateText("reading", { ...base, variant: spec.variant });
        const { verified, reading } = await verifyReading(
          validateReadingFor(spec.variant, text),
        );
        return { kind: "reading", payload: reading, verified };
      }
      if (spec.kind === "writing") {
        const text = await generateText("writing", base);
        const { verified, writing } = await verifyWriting(validateWritingSet(text));
        return { kind: "writing", payload: writing, verified };
      }
      const count = spec.count || 10;
      const text = await generateText("mcq", { ...base, count: Math.min(12, count + 2) });
      const { verified, questions } = await verifyMcq(validateQuestions(text));
      return { kind: "mcq", payload: { questions: questions.slice(0, count) }, verified };
    } catch (e) {
      lastErr = e;
      console.warn(`    retry ${attempt + 1}: ${e.message}`);
      await sleep(1500);
    }
  }
  throw lastErr;
}

async function buildExam(test, n) {
  const sectionKeys = EXAM_SECTIONS[test];
  const sections = [];
  for (const key of sectionKeys) {
    const plan = SECTION_PLANS[key];
    console.log(`  ${plan.label}…`);
    const units = [];
    for (let i = 0; i < plan.units.length; i++) {
      const spec = plan.units[i];
      process.stdout.write(`    unit ${i + 1}/${plan.units.length} (${spec.kind})… `);
      const unit = await generateUnit(plan, spec);
      const qCount = unit.payload.questions?.length ?? 0;
      console.log(`${qCount} q${unit.verified ? " ✓verified" : ""}`);
      units.push(unit);
    }
    const total = units.reduce((a, u) => a + (u.payload.questions?.length ?? 0), 0);
    sections.push({ planKey: key, label: plan.label, minutes: plan.minutes, questions: total, units });
  }
  return {
    id: `${test.toLowerCase()}-${n}`,
    test,
    label: `${test} Practice Exam ${n}`,
    sections,
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(
    `Building ${COUNT} ${TEST} exam(s). Verification: ${verifierEnabled() ? "ON" : "OFF (no OPENAI_API_KEY)"}\n`,
  );

  const manifest = [];
  for (let n = 1; n <= COUNT; n++) {
    const id = `${TEST.toLowerCase()}-${n}`;
    const file = path.join(OUT_DIR, `${id}.json`);
    let exam;
    if (fs.existsSync(file)) {
      console.log(`Exam ${id} already exists — skipping.`);
      exam = JSON.parse(fs.readFileSync(file, "utf8"));
    } else {
      console.log(`Building exam ${id}…`);
      exam = await buildExam(TEST, n);
      fs.writeFileSync(file, JSON.stringify(exam));
      console.log(`  → wrote ${path.relative(ROOT, file)}\n`);
    }
    manifest.push({
      id: exam.id,
      test: exam.test,
      label: exam.label,
      sections: exam.sections.map((s) => ({
        planKey: s.planKey,
        label: s.label,
        minutes: s.minutes,
        questions: s.questions,
      })),
    });
  }

  fs.writeFileSync(path.join(OUT_DIR, "index.json"), JSON.stringify({ exams: manifest }, null, 2));
  console.log("Done. Wrote public/exams/index.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
