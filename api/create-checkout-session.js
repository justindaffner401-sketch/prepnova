// Creates a Stripe Checkout session for PrepNova Pro.
// Two plans: "monthly" ($29/mo with a 7-day free trial) and "lifetime"
// ($180 one-time). Requires a signed-in Supabase user (Bearer access token).

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const TRIAL_DAYS = 7;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const {
    STRIPE_SECRET_KEY,
    STRIPE_PRICE_ID,
    STRIPE_LIFETIME_PRICE_ID,
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
  } = process.env;
  if (!STRIPE_SECRET_KEY || !STRIPE_PRICE_ID || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(503).json({ error: "Billing isn't configured on this deployment yet." });
  }

  const plan = req.body?.plan === "lifetime" ? "lifetime" : "monthly";
  if (plan === "lifetime" && !STRIPE_LIFETIME_PRICE_ID) {
    return res.status(503).json({ error: "The lifetime plan isn't available yet." });
  }

  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) {
    return res.status(401).json({ error: "Sign in first." });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !userData?.user) {
    return res.status(401).json({ error: "Your session expired — sign in again." });
  }
  const user = userData.user;

  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY);

    // Reuse the Stripe customer if this user already has one.
    const { data: subRow } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = subRow?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabase.from("subscriptions").upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        status: "none",
        updated_at: new Date().toISOString(),
      });
    }

    const origin = req.headers.origin || "https://www.prepnovaai.com";
    const common = {
      customer: customerId,
      client_reference_id: user.id,
      allow_promotion_codes: true,
      success_url: `${origin}/account?checkout=success`,
      cancel_url: `${origin}/account?checkout=cancelled`,
    };

    const params =
      plan === "lifetime"
        ? {
            ...common,
            mode: "payment",
            line_items: [{ price: STRIPE_LIFETIME_PRICE_ID, quantity: 1 }],
            payment_intent_data: {
              metadata: { plan: "lifetime", supabase_user_id: user.id },
            },
          }
        : {
            ...common,
            mode: "subscription",
            line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
            subscription_data: { trial_period_days: TRIAL_DAYS },
          };

    const session = await stripe.checkout.sessions.create(params);
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("create-checkout-session:", err?.message);
    return res.status(502).json({ error: "Couldn't start checkout. Try again in a moment." });
  }
}
