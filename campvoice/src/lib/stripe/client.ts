import Stripe from "stripe";
import { pricing } from "@/lib/config";

/**
 * Stripe, in one place.
 *
 * The secret key is server-only. Nothing here is ever imported by a component
 * that runs in the browser.
 */

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured.");
  cached ??= new Stripe(key, { apiVersion: "2026-07-29.dahlia", typescript: true });
  return cached;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** Looks up the configured Stripe Price for a billing interval. */
export function priceIdFor(interval: "month" | "year"): string {
  const envName = interval === "month" ? pricing.monthly.stripePriceIdEnv : pricing.annual.stripePriceIdEnv;
  const priceId = process.env[envName];
  if (!priceId) throw new Error(`${envName} is not configured.`);
  return priceId;
}

/**
 * Maps a Stripe subscription status onto ours. Stripe is always the authority;
 * we never decide a camp is paid up from anything the browser said.
 */
export function mapStatus(status: Stripe.Subscription.Status): string {
  const allowed = [
    "trialing",
    "active",
    "past_due",
    "canceled",
    "unpaid",
    "incomplete",
    "incomplete_expired",
    "paused",
  ];
  return allowed.includes(status) ? status : "none";
}

/** Seconds-since-epoch → ISO string, tolerating Stripe's nullable fields. */
export function toIso(seconds: number | null | undefined): string | null {
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}
