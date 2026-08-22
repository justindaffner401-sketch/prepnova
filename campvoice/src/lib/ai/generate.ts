import { ai } from "@/lib/config";
import { generateText } from "./provider";
import { CAMPVOICE_SYSTEM_PROMPT, CAMPVOICE_REVISION_PROMPT } from "./system-prompt";
import { buildCampContext, type CampContextInput } from "./context";
import { neutraliseInjection, scrubAiTells } from "./guardrails";
import type { ContentTemplate, TemplateField } from "./templates";

/**
 * The generation service.
 *
 * A camp director fills in a small form; this file turns those answers plus the
 * camp's own context into a single well-shaped request, and cleans up the
 * result. No prompt text lives anywhere else in the app.
 */

export interface GenerationRequest {
  template: ContentTemplate;
  inputs: Record<string, string>;
  camp: CampContextInput;
}

export interface GenerationOutcome {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

/** Renders the user's form answers as labelled lines the model can rely on. */
function renderInputs(template: ContentTemplate, inputs: Record<string, string>): string {
  const lines: string[] = [];

  for (const field of template.fields) {
    const raw = inputs[field.name];
    if (raw === undefined) continue;
    const value = raw.trim();
    if (!value) continue;
    lines.push(`${field.label}: ${describeValue(field, value)}`);
  }

  if (lines.length === 0) return "The staff member did not add any specific details.";
  return lines.join("\n");
}

function describeValue(field: TemplateField, value: string): string {
  if (field.options) {
    const match = field.options.find((option) => option.value === value);
    if (match) return match.label;
  }
  // Form answers come from the camp's own staff, but they are still text that
  // ends up in a prompt, so we defang the obvious hijack patterns.
  return neutraliseInjection(value);
}

const FORMAT_NOTE: Record<ContentTemplate["format"], string> = {
  email: "Produce an email. First line: \"Subject: ...\". Then a blank line, then the body.",
  social: "Produce only the post text. No subject line, no title.",
  script: "Produce only the script lines. No subject line, no title.",
  newsletter: "Produce a newsletter. First line: \"Subject: ...\". Then a blank line, then the body with plain text section headings.",
};

export function buildGenerationPrompt(request: GenerationRequest): { system: string; user: string } {
  const { template, inputs, camp } = request;

  const context = buildCampContext(camp, {
    includeEvents: template.context.includeEvents ?? true,
    eventHorizonDays: template.context.eventHorizonDays ?? 120,
    includeSamples: template.context.includeSamples ?? true,
    sampleBudgetChars: template.context.sampleBudgetChars ?? 8000,
  });

  const system = [
    CAMPVOICE_SYSTEM_PROMPT,
    "",
    "THIS CAMP",
    context || "No camp profile has been provided yet. Write in a warm, plain, neutral camp voice and leave bracketed blanks for any fact you do not have.",
  ].join("\n");

  const user = [
    `CONTENT TYPE: ${template.label}`,
    "",
    "INSTRUCTIONS FOR THIS CONTENT TYPE",
    template.instructions,
    "",
    FORMAT_NOTE[template.format],
    "",
    "DETAILS THE STAFF MEMBER PROVIDED",
    renderInputs(template, inputs),
    "",
    "Write the finished piece now. Output only the communication itself.",
  ].join("\n");

  return { system, user };
}

export async function generateContent(request: GenerationRequest): Promise<GenerationOutcome> {
  const { system, user } = buildGenerationPrompt(request);

  const result = await generateText({
    model: ai.generationModel,
    system,
    user,
    maxTokens: request.template.format === "newsletter" ? 3000 : ai.maxOutputTokens,
    think: true,
  });

  return {
    text: scrubAiTells(result.value),
    model: result.model,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
  };
}

/** The one-click editing actions offered in the content editor. */
export const REVISION_ACTIONS = [
  { id: "shorter", label: "Make Shorter", instruction: "Cut this to about two thirds of its current length. Remove the least important sentences. Keep every fact and the same tone." },
  { id: "warmer", label: "Make Warmer", instruction: "Make this warmer and more personal. Soften formal phrasing. Do not add new facts or new compliments." },
  { id: "energetic", label: "Make More Energetic", instruction: "Raise the energy with stronger verbs and shorter sentences. Do not add exclamation points beyond one, and do not add new claims." },
  { id: "professional", label: "Make More Professional", instruction: "Make this more polished and professional while staying warm. Tighten loose phrasing. Do not make it corporate or add jargon." },
  { id: "less-ai", label: "Make Less \"AI\"", instruction: "Rewrite this so it reads as though a camp director wrote it in one sitting. Break up even rhythm, vary sentence length, remove any phrase that sounds like marketing copy, and cut every generic sentence that could apply to any camp." },
  { id: "more-camp", label: "Add More Camp Personality", instruction: "Bring in more of this camp's specific character, using only its own terminology, traditions and programs from the camp material. Do not invent anything new." },
  { id: "another", label: "Give Me Another Version", instruction: "Write a genuinely different version of this communication. Same purpose, same facts, same audience, different structure and opening." },
] as const;

export type RevisionActionId = (typeof REVISION_ACTIONS)[number]["id"];

export function revisionInstruction(actionId: string, custom?: string): string | null {
  if (actionId === "custom") {
    const trimmed = custom?.trim();
    if (!trimmed) return null;
    return `Apply this specific change from the staff member, and change nothing else: "${neutraliseInjection(trimmed)}"`;
  }
  return REVISION_ACTIONS.find((action) => action.id === actionId)?.instruction ?? null;
}

export interface RevisionRequest {
  template: ContentTemplate;
  currentDraft: string;
  actionId: string;
  customInstruction?: string;
  camp: CampContextInput;
}

export async function reviseContent(request: RevisionRequest): Promise<GenerationOutcome> {
  const instruction = revisionInstruction(request.actionId, request.customInstruction);
  if (!instruction) {
    throw new Error("Unknown revision action.");
  }

  const context = buildCampContext(request.camp, {
    includeEvents: request.template.context.includeEvents ?? true,
    eventHorizonDays: request.template.context.eventHorizonDays ?? 120,
    // Revisions do not need the full sample library; the draft already carries the voice.
    includeSamples: false,
  });

  const system = [CAMPVOICE_REVISION_PROMPT, "", "THIS CAMP", context].join("\n");

  const user = [
    `CONTENT TYPE: ${request.template.label}`,
    "",
    "CURRENT DRAFT",
    request.currentDraft,
    "",
    "REVISION INSTRUCTION",
    instruction,
    "",
    FORMAT_NOTE[request.template.format],
    "",
    "Return the complete revised communication only.",
  ].join("\n");

  const result = await generateText({
    model: ai.generationModel,
    system,
    user,
    maxTokens: ai.maxOutputTokens,
    think: true,
  });

  return {
    text: scrubAiTells(result.value),
    model: result.model,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
  };
}

/** A readable title for the content library, derived from the draft itself. */
export function deriveTitle(template: ContentTemplate, inputs: Record<string, string>, output: string): string {
  const subjectMatch = output.match(/^Subject:\s*(.+)$/m);
  if (subjectMatch?.[1]) return subjectMatch[1].trim().slice(0, 120);

  const named = inputs.family_name?.trim() || inputs.program?.trim() || inputs.event?.trim() || inputs.role?.trim();
  if (named) return `${template.label} — ${named}`.slice(0, 120);

  const firstLine = output.split("\n").find((line) => line.trim().length > 0);
  if (firstLine) return firstLine.trim().slice(0, 80);

  return template.label;
}
