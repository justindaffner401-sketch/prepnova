import { NextResponse } from "next/server";
import { ApiError, readJson, requireEntitledSession, withErrorHandling } from "@/lib/api/guard";
import { createClient } from "@/lib/supabase/server";
import { getContent, loadCampContext } from "@/lib/data/camp";
import { reviseSchema } from "@/lib/validation/schemas";
import { getTemplate } from "@/lib/ai/templates";
import { reviseContent } from "@/lib/ai/generate";
import { AiUnavailableError } from "@/lib/ai/provider";
import { checkBurstLimit, checkDailyLimit, recordUsage } from "@/lib/ai/usage";
import { track } from "@/lib/analytics";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Revise an existing draft.
 *
 * The draft is looked up scoped to the caller's organization, so passing
 * another camp's content id simply finds nothing.
 */
export const POST = withErrorHandling("api.revise", async (request: Request) => {
  const context = await requireEntitledSession();

  const burst = checkBurstLimit(`revise:${context.organization.id}`);
  if (!burst.allowed) {
    throw new ApiError(429, "That's a lot of revisions at once. Give it a few seconds and try again.", "rate_limited");
  }

  const daily = await checkDailyLimit(context.organization.id);
  if (!daily.allowed) {
    throw new ApiError(429, "You've reached today's generation limit. It resets in a few hours.", "daily_limit");
  }

  const body = await readJson(request, reviseSchema);

  if (body.action === "custom" && !body.custom_instruction?.trim()) {
    throw new ApiError(400, "Please describe the change you'd like.", "missing_instruction");
  }

  const existing = await getContent(context.organization.id, body.content_id);
  if (!existing) {
    throw new ApiError(404, "We couldn't find that draft.", "not_found");
  }

  const template = getTemplate(existing.template_id);
  if (!template) {
    throw new ApiError(400, "That content type is no longer available.", "unknown_template");
  }

  const camp = await loadCampContext(context.organization);
  const currentDraft = existing.edited_output?.trim() || existing.output;

  let outcome;
  try {
    outcome = await reviseContent({
      template,
      currentDraft,
      actionId: body.action,
      customInstruction: body.custom_instruction,
      camp,
    });
  } catch (error) {
    await recordUsage({
      organizationId: context.organization.id,
      userId: context.user.id,
      operation: "revise",
      model: "unknown",
      inputTokens: 0,
      outputTokens: 0,
      succeeded: false,
      errorCode: error instanceof AiUnavailableError ? error.reason : "unknown",
    });
    logger.error("api.revise_failed", error, { contentId: existing.id });
    throw new ApiError(503, "We couldn't revise this right now. Your draft is safe. Try again.", "ai_unavailable");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("content_generations")
    .update({
      output: outcome.text,
      // A revision replaces the draft, so any earlier manual edit is superseded.
      edited_output: null,
      revision_count: existing.revision_count + 1,
      model: outcome.model,
    })
    .eq("id", existing.id)
    .eq("organization_id", context.organization.id);

  if (error) {
    logger.error("api.revise_save_failed", error);
    throw new ApiError(500, "We revised your draft but couldn't save it. Please try again.", "save_failed");
  }

  await recordUsage({
    organizationId: context.organization.id,
    userId: context.user.id,
    operation: "revise",
    model: outcome.model,
    inputTokens: outcome.inputTokens,
    outputTokens: outcome.outputTokens,
    succeeded: true,
  });

  await track("content_regenerated", {
    organizationId: context.organization.id,
    userId: context.user.id,
    properties: { template_id: template.id, action: body.action },
  });

  return NextResponse.json({ output: outcome.text, revision_count: existing.revision_count + 1 });
});
