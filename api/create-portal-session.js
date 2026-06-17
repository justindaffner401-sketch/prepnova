// Opens the Stripe customer portal (manage / cancel subscription, update card).

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, clientIp, envInt } from "./_security.js";

const BILLING_MAX = envInt("RATE_LIMIT_BILLING_MAX", 30);
const BILLING_WINDOW_MS = envInt("RATE_LIMIT_BILLING_WINDOW_MS", 60 * 60 * 1000);

function tooMany(res, retryAfter) {
  res.setHeader("Retry-After", String(retryAfter));
  return res.status(429).json({ error: "Too many requests — wait a moment and try again." });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const ipLimit = rateLimit({ bucket: "billing-ip", identity: clientIp(req), limit: BILLING_MAX, windowMs: BILLING_WINDOW_MS });
  if (ipLimit.limited) return tooMany(res, ipLimit.retryAfter);

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

  const userLimit = rateLimit({ bucket: "billing-user", identity: userData.user.id, limit: BILLING_MAX, windowMs: BILLING_WINDOW_MS });
  if (userLimit.limited) return tooMany(res, userLimit.retryAfter);

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
