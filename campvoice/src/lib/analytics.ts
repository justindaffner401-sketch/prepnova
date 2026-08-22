import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

/**
 * Product analytics.
 *
 * Deliberately minimal and privacy-conscious: we record WHICH kind of thing
 * happened, never the content of a communication, never a parent or camper
 * name, never anything a family typed. Events are stored in your own database,
 * so no third-party tracker is involved.
 *
 * To send events somewhere else later (PostHog, Plausible, …), add a branch in
 * `track()` — nothing that calls it needs to change.
 */

export const ANALYTICS_EVENTS = [
  "signup_started",
  "signup_completed",
  "onboarding_step_completed",
  "onboarding_completed",
  "camp_dna_created",
  "camp_dna_updated",
  "content_generated",
  "content_regenerated",
  "content_copied",
  "content_saved",
  "generate_my_week_used",
  "trial_started",
  "checkout_started",
  "subscription_started",
  "subscription_canceled",
  "document_uploaded",
  "website_imported",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

/** Values safe to attach to an event: identifiers, counts and flags only. */
export type AnalyticsProperties = Record<string, string | number | boolean | null>;

export async function track(
  event: AnalyticsEvent,
  options: { organizationId?: string | null; userId?: string | null; properties?: AnalyticsProperties } = {},
): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("analytics_events").insert({
      event,
      organization_id: options.organizationId ?? null,
      user_id: options.userId ?? null,
      properties: options.properties ?? {},
    });
  } catch (error) {
    // Analytics must never break a user action.
    logger.warn("analytics.track_failed", { event, message: (error as Error)?.message });
  }
}
