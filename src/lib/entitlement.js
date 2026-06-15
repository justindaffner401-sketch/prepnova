// Single source of truth for "does this subscription row grant Pro access
// right now?" — shared by the client (useAuth) and the server (the
// generate-questions gate) so they can never drift apart.

const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing", "past_due"];

/**
 * @param {{status?: string, current_period_end?: string|null} | null} sub
 * @returns {boolean}
 */
export function isEntitled(sub) {
  if (!sub || !sub.status) return false;
  // Lifetime: one-time purchase, never expires.
  if (sub.status === "lifetime") return true;
  // Recurring subscription (monthly): Stripe manages expiry via webhooks.
  if (ACTIVE_SUBSCRIPTION_STATUSES.includes(sub.status)) return true;
  // 1-year: one-time purchase with a hard expiry we set ourselves.
  if (sub.status === "year") {
    return Boolean(sub.current_period_end) && new Date(sub.current_period_end) > new Date();
  }
  return false;
}
