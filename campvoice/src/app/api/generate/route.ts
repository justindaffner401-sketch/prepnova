import { NextResponse } from "next/server";
import { requireEntitledSession, readJson, withErrorHandling, ApiError } from "@/lib/api/guard";
import { createClient } from "@/lib/supabase/server";
import { loadCampContext } from "@/lib/data/camp";
import { generateSchema } from "@/lib/validation/schemas";
import { getTemplate } from "@/lib/ai/templates";
import { deriveTitle, generateContent } from "@/lib/ai/generate";
import { AiUnavailableError } from "@/lib/ai/provider";
import { checkBurstLimit, checkDailyLimit, recordUsage } from "@/lib/ai/usage";
import { track } from "@/lib/analytics";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Generate one piece of content.
 *
 * Order matters: authenticate → check entitlement → check fair-use limits →
 * validate input → build the request → call the AI → save → record usage.
 * The camp is taken from the session, so nothing in the body can point this at
 * another camp's data.
 */
export const POST = withErrorHandling("api.generate", async (request: Request) => {
  const context = await requireEntitledSession();

  const burst = checkBurstLimit(`generate:${context.organization.id}`);
  if (!burst.allowed) {
    throw new ApiError(429, "That's a lot of drafts at once. Give it a few seconds and try again.", "rate_limited");
  }

  const daily = await checkDailyLimit(context.organization.id);
  if (!daily.allowed) {
    throw new ApiError(
      429,
      "You've reached today's generation limit. This protects everyone's service quality — it resets in a few hours.",
      "daily_limit",
    );
  }

  const body = await readJson(request, generateSchema);
  const template = getTemplate(body.template_id);
  if (!template) {
    throw new ApiError(400, "That content type isn't available.", "unknown_template");
  }

  // Keep only the fields this template actually declares.
  const allowed = new Set(template.fields.map((field) => field.name));
  const inputs: Record<string, string> = {};
  for (const [key, value] of Object.entries(body.inputs)) {
    if (allowed.has(key) && typeof value === "string") inputs[key] = value;
  }

  const missing = template.fields.filter((field) => field.required && !inputs[field.name]?.trim());
  if (missing.length > 0) {
    throw new ApiError(400, `Please fill in: ${missing.map((field) => field.label).join(", ")}.`, "missing_fields");
  }

  const camp = await loadCampContext(context.organization);

  let outcome;
  try {
    outcome = await generateContent({ template, inputs, camp });
  } catch (error) {
    await recordUsage({
      organizationId: context.organization.id,
      userId: context.user.id,
      operation: "generate",
      model: "unknown",
      inputTokens: 0,
      outputTokens: 0,
      succeeded: false,
      errorCode: error instanceof AiUnavailableError ? error.reason : "unknown",
    });
    logger.error("api.generate_failed", error, { templateId: template.id });
    throw new ApiError(
      503,
      "We couldn't generate this right now. Your information is safe. Try again.",
      "ai_unavailable",
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_generations")
    .insert({
      organization_id: context.organization.id,
      created_by: context.user.id,
      template_id: template.id,
      category: template.category,
      title: deriveTitle(template, inputs, outcome.text),
      inputs,
      output: outcome.text,
      model: outcome.model,
      status: "draft",
    })
    .select("id, title, output")
    .single<{ id: string; title: string; output: string }>();

  if (error || !data) {
    logger.error("api.generate_save_failed", error);
    throw new ApiError(500, "We wrote your draft but couldn't save it. Please try again.", "save_failed");
  }

  await recordUsage({
    organizationId: context.organization.id,
    userId: context.user.id,
    operation: "generate",
    model: outcome.model,
    inputTokens: outcome.inputTokens,
    outputTokens: outcome.outputTokens,
    succeeded: true,
  });

  await track("content_generated", {
    organizationId: context.organization.id,
    userId: context.user.id,
    properties: { template_id: template.id, category: template.category },
  });

  return NextResponse.json({ content: data });
});
