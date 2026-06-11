// Opens the Stripe customer portal (manage / cancel subscription, update card).

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(503).json({ error: "Billing isn't configured on this deployment yet." });
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

  const { data: subRow } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (!subRow?.stripe_customer_id) {
    return res.status(400).json({ error: "No billing profile yet — subscribe first." });
  }

  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY);
    const origin = req.headers.origin || "https://www.prepnovaai.com";
    const session = await stripe.billingPortal.sessions.create({
      customer: subRow.stripe_customer_id,
      return_url: `${origin}/account`,
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("create-portal-session:", err?.message);
    return res.status(502).json({ error: "Couldn't open the billing portal. Try again." });
  }
}
