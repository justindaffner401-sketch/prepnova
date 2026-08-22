import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { markPaymentFailed, markSubscriptionEnded, syncSubscription } from "@/lib/stripe/sync";
import { track } from "@/lib/analytics";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * The Stripe webhook.
 *
 * SECURITY: every request is verified against the signing secret before we
 * read a single field. An unsigned or badly signed request is rejected — this
 * is what stops anyone from granting themselves a subscription by POSTing here.
 *
 * The raw body is required for verification, which is why we read text() and
 * never JSON.parse it ourselves.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    logger.error("stripe.webhook_unconfigured", new Error("STRIPE_WEBHOOK_SECRET is not set"));
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    logger.warn("stripe.webhook_bad_signature", { message: (error as Error)?.message });
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  try {
    await handleEvent(event);
  } catch (error) {
    // A 500 makes Stripe retry, which is what we want for a transient failure.
    logger.error("stripe.webhook_handler_failed", error, { type: event.type });
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleEvent(event: Stripe.Event): Promise<void> {
  const stripe = getStripe();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode !== "subscription" || !session.subscription) break;

      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      // Carry the camp id onto the subscription so later events resolve without a lookup.
      const organizationId = session.metadata?.organization_id ?? session.client_reference_id;
      if (organizationId && !subscription.metadata?.organization_id) {
        await stripe.subscriptions.update(subscriptionId, { metadata: { organization_id: organizationId } });
        subscription.metadata = { ...subscription.metadata, organization_id: organizationId };
      }

      const result = await syncSubscription(subscription);
      if (result.organizationId) {
        await track("subscription_started", {
          organizationId: result.organizationId,
          properties: { status: result.status },
        });
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.paused":
    case "customer.subscription.resumed":
    case "customer.subscription.trial_will_end": {
      await syncSubscription(event.data.object);
      break;
    }

    case "customer.subscription.deleted": {
      await markSubscriptionEnded(event.data.object);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : (invoice.customer?.id ?? null);
      await markPaymentFailed(customerId);
      break;
    }

    case "invoice.paid": {
      // A successful payment can lift a past_due state; re-read the subscription
      // rather than guessing.
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null };
      const subscriptionRef = invoice.subscription;
      const subscriptionId = typeof subscriptionRef === "string" ? subscriptionRef : (subscriptionRef?.id ?? null);
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await syncSubscription(subscription);
      }
      break;
    }

    default:
      // Everything else is intentionally ignored.
      logger.info("stripe.webhook_ignored", { type: event.type });
  }
}
