import Link from "next/link";
import type { Subscription } from "@/lib/db/types";
import { trialDaysRemaining } from "@/lib/auth/session";

/**
 * The billing state strip. Always driven by the `subscriptions` row that the
 * Stripe webhook writes — never by anything the browser believes.
 */
export function TrialBanner({ subscription }: { subscription: Subscription | null }) {
  if (!subscription) return null;

  const days = trialDaysRemaining(subscription);

  if (subscription.status === "trialing" && days !== null) {
    const urgent = days <= 3;
    return (
      <div className={`border-b px-5 py-2.5 text-center text-sm ${urgent ? "border-ember-200 bg-ember-50 text-ember-700" : "border-paper-300 bg-paper-200/70 text-ink-700"}`}>
        {days === 0 ? "Your free trial ends today." : `${days} ${days === 1 ? "day" : "days"} left in your free trial.`}{" "}
        <Link href="/settings/billing" className="font-medium underline underline-offset-4">
          Choose a plan
        </Link>
      </div>
    );
  }

  if (subscription.status === "past_due" || subscription.status === "unpaid") {
    return (
      <div role="alert" className="border-b border-ember-200 bg-ember-50 px-5 py-2.5 text-center text-sm text-ember-700">
        We couldn&rsquo;t process your last payment.{" "}
        <Link href="/settings/billing" className="font-medium underline underline-offset-4">
          Update your billing details
        </Link>{" "}
        to keep CampVoice working.
      </div>
    );
  }

  if (subscription.status === "canceled" || subscription.status === "none") {
    return (
      <div className="border-b border-paper-300 bg-paper-200/70 px-5 py-2.5 text-center text-sm text-ink-700">
        Your CampVoice subscription has ended.{" "}
        <Link href="/settings/billing" className="font-medium underline underline-offset-4">
          Restart your plan
        </Link>
      </div>
    );
  }

  if (subscription.cancel_at_period_end && subscription.current_period_end) {
    const endsOn = new Date(subscription.current_period_end).toLocaleDateString(undefined, { dateStyle: "long" });
    return (
      <div className="border-b border-paper-300 bg-paper-200/70 px-5 py-2.5 text-center text-sm text-ink-700">
        Your plan is set to end on {endsOn}.{" "}
        <Link href="/settings/billing" className="font-medium underline underline-offset-4">
          Keep CampVoice
        </Link>
      </div>
    );
  }

  return null;
}
