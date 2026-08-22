import { NextResponse } from "next/server";
import { ApiError, readJson, requireApiSession, withErrorHandling } from "@/lib/api/guard";
import { createClient } from "@/lib/supabase/server";
import { getStripe, isStripeConfigured, priceIdFor } from "@/lib/stripe/client";
import { checkoutSchema } from "@/lib/validation/schemas";
import { brand, trial } from "@/lib/config";
import { checkBurstLimit } from "@/lib/ai/usage";
import { track } from "@/lib/analytics";
import { logger } from "@/lib/logger";
import type { Subscription } from "@/lib/db/types";

export const runtime = "nodejs";

/**
 * Starts a Stripe Checkout session.
 *
 * We never take a price from the browser — only an interval, which we map to a
 * Price id configured in the environment. That means a modified request cannot
 * buy the plan at a price we did not set.
 */
export const POST = withErrorHandling("api.checkout", async (request: Request) => {
  const context = await requireApiSession();

  if (!isStripeConfigured()) {
    throw new ApiError(503, "Billing isn't set up yet. Please contact support.", "billing_unconfigured");
  }

  const burst = checkBurstLimit(`checkout:${context.organization.id}`, 8, 600_000);
  if (!burst.allowed) {
    throw new ApiError(429, "Please wait a moment before trying again.", "rate_limited");
  }

  const body = await readJson(request, checkoutSchema);
  const stripe = getStripe();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("organization_id", context.organization.id)
    .maybeSingle<Subscription>();

  // Reuse the camp's Stripe customer so their billing history stays in one place.
  let customerId = existing?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: context.user.email,
      name: context.organization.name,
      metadata: { organization_id: context.organization.id, user_id: context.user.id },
    });
    customerId = customer.id;
  }

  // Only offer a trial to a camp that has never subscribed.
  const alreadySubscribed = Boolean(existing?.stripe_subscription_id);
  const remainingTrialDays = remainingDays(existing?.trial_ends_at ?? null);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceIdFor(body.interval), quantity: 1 }],
    success_url: `${brand.siteUrl}/settings/billing?checkout=success`,
    cancel_url: `${brand.siteUrl}/settings/billing?checkout=cancelled`,
    allow_promotion_codes: true,
    client_reference_id: context.organization.id,
    // The webhook reads this to know which camp to update.
    subscription_data: {
      metadata: { organization_id: context.organization.id },
      ...(alreadySubscribed || remainingTrialDays === 0 ? {} : { trial_period_days: remainingTrialDays ?? trial.days }),
    },
    metadata: { organization_id: context.organization.id },
    ...(trial.requireCard ? {} : { payment_method_collection: "if_required" as const }),
  });

  if (!session.url) {
    logger.error("api.checkout_no_url", new Error("Stripe returned no checkout URL"));
    throw new ApiError(502, "We couldn't open checkout. Please try again.", "checkout_failed");
  }

  // Record the customer id now so a webhook arriving first still matches.
  await supabase.from("subscriptions").upsert(
    {
      organization_id: context.organization.id,
      stripe_customer_id: customerId,
      status: existing?.status ?? "none",
      trial_ends_at: existing?.trial_ends_at ?? null,
    },
    { onConflict: "organization_id" },
  );

  await track("checkout_started", {
    organizationId: context.organization.id,
    userId: context.user.id,
    properties: { interval: body.interval },
  });

  return NextResponse.json({ url: session.url });
});

/** Days left on a trial we granted at signup, so a camp is not given it twice. */
function remainingDays(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  const days = Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86_400_000);
  return days > 0 ? Math.min(days, 365) : 0;
}
