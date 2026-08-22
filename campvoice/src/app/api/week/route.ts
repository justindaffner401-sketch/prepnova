import { NextResponse } from "next/server";
import { ApiError, requireEntitledSession, withErrorHandling } from "@/lib/api/guard";
import { loadCampContext } from "@/lib/data/camp";
import { planWeek } from "@/lib/ai/week";
import { getTemplate } from "@/lib/ai/templates";
import { AiUnavailableError } from "@/lib/ai/provider";
import { checkBurstLimit, recordUsage } from "@/lib/ai/usage";
import { track } from "@/lib/analytics";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * "Generate My Week" — suggestions only. Nothing is written, sent or published
 * here; each suggestion is a link the user can choose to follow.
 */
export const POST = withErrorHandling("api.week", async () => {
  const context = await requireEntitledSession();

  const burst = checkBurstLimit(`week:${context.organization.id}`, 4, 300_000);
  if (!burst.allowed) {
    throw new ApiError(429, "You just refreshed this. Give it a minute and try again.", "rate_limited");
  }

  const camp = await loadCampContext(context.organization);

  try {
    const plan = await planWeek(camp);

    await recordUsage({
      organizationId: context.organization.id,
      userId: context.user.id,
      operation: "week_plan",
      model: plan.model,
      inputTokens: plan.inputTokens,
      outputTokens: plan.outputTokens,
      succeeded: true,
    });

    await track("generate_my_week_used", {
      organizationId: context.organization.id,
      userId: context.user.id,
      properties: { count: plan.suggestions.length },
    });

    const suggestions = plan.suggestions.map((suggestion) => {
      const template = getTemplate(suggestion.template_id);
      return {
        template_id: suggestion.template_id,
        headline: suggestion.headline,
        reason: suggestion.reason,
        urgency: suggestion.urgency,
        template_label: template?.label ?? suggestion.template_id,
        category: template?.category ?? "marketing",
      };
    });

    return NextResponse.json({ suggestions });
  } catch (error) {
    await recordUsage({
      organizationId: context.organization.id,
      userId: context.user.id,
      operation: "week_plan",
      model: "unknown",
      inputTokens: 0,
      outputTokens: 0,
      succeeded: false,
      errorCode: error instanceof AiUnavailableError ? error.reason : "unknown",
    });
    logger.error("api.week_failed", error);
    throw new ApiError(503, "We couldn't build your suggestions right now. Please try again in a moment.", "ai_unavailable");
  }
});
