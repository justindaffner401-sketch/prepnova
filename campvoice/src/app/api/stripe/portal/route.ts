import { NextResponse } from "next/server";
import { ApiError, requireApiSession, withErrorHandling } from "@/lib/api/guard";
import { createClient } from "@/lib/supabase/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import { brand } from "@/lib/config";
import type { Subscription } from "@/lib/db/types";

export const runtime = "nodejs";

/**
 * Opens the Stripe Customer Portal, where a camp updates their card, changes
 * plan, downloads invoices, or cancels. We deliberately do not rebuild any of
 * that ourselves.
 */
export const POST = withErrorHandling("api.portal", async () => {
  const context = await requireApiSession();

  if (!isStripeConfigured()) {
    throw new ApiError(503, "Billing isn't set up yet. Please contact support.", "billing_unconfigured");
  }

  const supabase = await createClient();
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("organization_id", context.organization.id)
    .maybeSingle<Pick<Subscription, "stripe_customer_id">>();

  if (!subscription?.stripe_customer_id) {
    throw new ApiError(400, "You don't have a billing account yet. Choose a plan to get started.", "no_customer");
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: `${brand.siteUrl}/settings/billing`,
  });

  return NextResponse.json({ url: session.url });
});
