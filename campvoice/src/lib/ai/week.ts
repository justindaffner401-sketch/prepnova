import { z } from "zod";
import { ai } from "@/lib/config";
import { generateStructured } from "./provider";
import { buildCampContext, type CampContextInput } from "./context";
import { TEMPLATES } from "./templates";

/**
 * "Generate My Week".
 *
 * Looks at the camp's upcoming dates, the season, and their Camp DNA, and
 * suggests three to six pieces of content worth creating now. It only ever
 * SUGGESTS — nothing is generated, sent or published without the user clicking.
 */

const templateIds = TEMPLATES.map((template) => template.id);

const SuggestionSchema = z.object({
  template_id: z.string().describe(`The id of the content template to use. Must be exactly one of: ${templateIds.join(", ")}`),
  headline: z.string().describe("A short title for the suggestion, e.g. \"Enrollment Reminder\"."),
  reason: z.string().describe("One short sentence explaining why now, referencing a real date or season. No invented facts."),
  urgency: z.enum(["now", "this_week", "soon"]).describe("How time-sensitive this is."),
});

export const WeekPlanSchema = z.object({
  suggestions: z.array(SuggestionSchema).min(1).max(6),
});

export type WeekSuggestion = z.infer<typeof SuggestionSchema>;

const WEEK_SYSTEM = `You are planning a summer camp's communications for the coming week.

You suggest what the camp should create. You never write the content itself here, and you never send anything.

Rules:
- Suggest between three and six items. Fewer is fine if there is genuinely little to say.
- Every reason must reference something real: a date from the camp's calendar, the current point in the camp year, or a clear gap. If you cannot give a real reason, do not suggest the item.
- Never invent a date, deadline, program or event.
- Do not suggest the same content type twice.
- Prefer variety across audiences: families, prospective families, staff, social, alumni.
- Keep each reason to one short sentence a busy camp director can scan.`;

function seasonNote(now: Date): string {
  const month = now.getUTCMonth();
  if (month >= 0 && month <= 2) return "It is winter, which for most camps is peak enrollment and staff hiring season.";
  if (month >= 3 && month <= 4) return "It is spring: enrollment is closing out, staff hiring is finishing, and pre-camp family communication starts.";
  if (month === 5) return "It is early summer: camp is opening or about to open.";
  if (month >= 6 && month <= 7) return "It is mid-summer: camp is in session and families want updates from the field.";
  if (month === 8) return "It is the end of summer: sessions are closing and re-enrollment begins.";
  return "It is autumn: the off-season, when camps keep families warm and open enrollment for next year.";
}

export interface WeekPlanResult {
  suggestions: WeekSuggestion[];
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export async function planWeek(camp: CampContextInput, now = new Date()): Promise<WeekPlanResult> {
  const context = buildCampContext(camp, {
    includeEvents: true,
    eventHorizonDays: 90,
    includeSamples: false,
  });

  const catalogue = TEMPLATES.map((template) => `${template.id} (${template.label}, ${template.category}): ${template.blurb}`).join("\n");

  const user = [
    `Today's date is ${now.toISOString().slice(0, 10)}.`,
    seasonNote(now),
    "",
    context,
    "",
    "AVAILABLE CONTENT TYPES",
    catalogue,
    "",
    "Suggest what this camp should create this week.",
  ].join("\n");

  const result = await generateStructured({
    model: ai.utilityModel,
    schema: WeekPlanSchema,
    system: WEEK_SYSTEM,
    user,
    maxTokens: 1500,
    think: true,
  });

  // Defend against a suggestion pointing at a template that does not exist.
  const valid = new Set(templateIds);
  const suggestions = result.value.suggestions.filter((suggestion) => valid.has(suggestion.template_id));

  return {
    suggestions,
    model: result.model,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
  };
}
