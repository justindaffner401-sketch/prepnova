// Stripe webhook: keeps the Supabase `subscriptions` table in sync.
// Uses the Web-handler style so we get the raw request body — required for
// Stripe signature verification (a parsed/re-serialized body breaks the MAC).
//
// Configure in Stripe: Developers → Webhooks → endpoint
//   https://www.prepnovaai.com/api/stripe-webhook
// with events: checkout.session.completed, customer.subscription.updated,
// customer.subscription.deleted.

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

function periodEnd(subscription) {
  // Newer Stripe API versions expose current_period_end on the subscription
  // item rather than the subscription itself — support both.
  const ts =
    subscription?.items?.data?.[0]?.current_period_end ??
    subscription?.current_period_end;
  return ts ? new Date(ts * 1000).toISOString() : null;
}

export async function POST(request) {
  const {
    STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET,
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
  } = process.env;
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response("Webhook not configured", { status: 503 });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY);
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("stripe-webhook signature failure:", err?.message);
    return new Response("Invalid signature", { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (!session.client_reference_id) break;

        if (session.mode === "payment") {
          // Lifetime one-time purchase — never expires.
          await supabase.from("subscriptions").upsert({
            user_id: session.client_reference_id,
            stripe_customer_id: session.customer,
            stripe_subscription_id: null,
            status: "lifetime",
            current_period_end: null,
            updated_at: new Date().toISOString(),
          });
        } else if (session.mode === "subscription") {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          await supabase.from("subscriptions").upsert({
            user_id: session.client_reference_id,
            stripe_customer_id: session.customer,
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            current_period_end: periodEnd(subscription),
            updated_at: new Date().toISOString(),
          });
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const { data: row } = await supabase
          .from("subscriptions")
          .select("user_id, status")
          .eq("stripe_customer_id", subscription.customer)
          .maybeSingle();
        if (!row?.user_id) break; // customer we don't know about
        if (row.status === "lifetime") break; // never downgrade a lifetime member
        await supabase.from("subscriptions").upsert({
          user_id: row.user_id,
          stripe_customer_id: subscription.customer,
          stripe_subscription_id: subscription.id,
          status: event.type === "customer.subscription.deleted" ? "canceled" : subscription.status,
          current_period_end: periodEnd(subscription),
          updated_at: new Date().toISOString(),
        });
        break;
      }

      default:
        break; // unsubscribed event types are acknowledged and ignored
    }
  } catch (err) {
    console.error("stripe-webhook handler error:", err?.message);
    // 500 → Stripe retries the delivery later.
    return new Response("Handler error", { status: 500 });
  }

  return Response.json({ received: true });
}
