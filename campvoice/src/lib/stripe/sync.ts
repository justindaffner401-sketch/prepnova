import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapStatus, toIso } from "./client";
import { track } from "@/lib/analytics";
import { logger } from "@/lib/logger";

/**
 * Writes Stripe's view of a subscription into our database.
 *
 * This is the ONLY place subscription state is written. It runs from the
 * webhook with the service-role key, because there is no user session when
 * Stripe calls us. Everything the app shows about billing comes from the row
 * this function writes.
 */

export interface SyncResult {
  organizationId: string | null;
  status: string;
}

/** Finds the camp a Stripe subscription belongs to. */
async function resolveOrganizationId(subscription: Stripe.Subscription): Promise<string | null> {
  const fromMetadata = subscription.metadata?.organization_id;
  if (fromMetadata) return fromMetadata;

  // Fall back to the customer we recorded when checkout started.
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
  if (!customerId) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("subscriptions")
    .select("organization_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle<{ organization_id: string }>();

  return data?.organization_id ?? null;
}

export async function syncSubscription(subscription: Stripe.Subscription): Promise<SyncResult> {
  const organizationId = await resolveOrganizationId(subscription);
  const status = mapStatus(subscription.status);

  if (!organizationId) {
    logger.warn("stripe.sync_unmatched_subscription", { subscriptionId: subscription.id });
    return { organizationId: null, status };
  }

  const item = subscription.items.data[0];
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;

  const admin = createAdminClient();
  const { error } = await admin.from("subscriptions").upsert(
    {
      organization_id: organizationId,
      stripe_customer_id: customerId ?? null,
      stripe_subscription_id: subscription.id,
      status,
      price_id: item?.price.id ?? null,
      plan_interval: item?.price.recurring?.interval ?? null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_end: toIso(item?.current_period_end),
      trial_ends_at: toIso(subscription.trial_end),
    },
    { onConflict: "organization_id" },
  );

  if (error) {
    logger.error("stripe.sync_write_failed", error, { organizationId });
    throw error;
  }

  logger.info("stripe.sync_ok", { organizationId, status });
  return { organizationId, status };
}

/** Marks a camp's subscription as ended when Stripe deletes it. */
export async function markSubscriptionEnded(subscription: Stripe.Subscription): Promise<SyncResult> {
  const organizationId = await resolveOrganizationId(subscription);
  if (!organizationId) return { organizationId: null, status: "canceled" };

  const admin = createAdminClient();
  await admin
    .from("subscriptions")
    .update({ status: "canceled", cancel_at_period_end: false })
    .eq("organization_id", organizationId);

  await track("subscription_canceled", { organizationId });
  return { organizationId, status: "canceled" };
}

/** Records a failed payment so the app can warn the camp before access lapses. */
export async function markPaymentFailed(customerId: string | null): Promise<void> {
  if (!customerId) return;
  const admin = createAdminClient();
  await admin.from("subscriptions").update({ status: "past_due" }).eq("stripe_customer_id", customerId);
  logger.warn("stripe.payment_failed", { customerId });
}
