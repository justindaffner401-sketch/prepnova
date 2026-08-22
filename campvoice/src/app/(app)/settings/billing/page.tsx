import type { Metadata } from "next";
import { getSubscription, requireSession, trialDaysRemaining } from "@/lib/auth/session";
import { annualSavings, pricing, trial } from "@/lib/config";
import { isStripeConfigured } from "@/lib/stripe/client";
import { Alert, Badge, Card } from "@/components/ui";
import { BillingActions } from "@/components/app/BillingActions";
import type { SubscriptionStatus } from "@/lib/db/types";

export const metadata: Metadata = {
  title: "Billing",
  robots: { index: false, follow: false },
};

/** Plain-English explanation of each Stripe state. */
const STATUS_COPY: Record<SubscriptionStatus, { label: string; tone: "forest" | "ember" | "neutral"; body: string }> = {
  trialing: { label: "Free trial", tone: "forest", body: "You have full access to CampVoice during your trial." },
  active: { label: "Active", tone: "forest", body: "Your subscription is active. Thank you." },
  past_due: { label: "Payment failed", tone: "ember", body: "Your last payment didn't go through. Update your card to keep CampVoice working." },
  unpaid: { label: "Unpaid", tone: "ember", body: "We weren't able to collect payment. Update your billing details to restore access." },
  canceled: { label: "Cancelled", tone: "neutral", body: "Your subscription has ended. Everything you taught CampVoice is still here." },
  incomplete: { label: "Incomplete", tone: "ember", body: "Your checkout wasn't finished. Start again to activate your plan." },
  incomplete_expired: { label: "Expired", tone: "neutral", body: "That checkout expired. Choose a plan to start again." },
  paused: { label: "Paused", tone: "neutral", body: "Your subscription is paused." },
  none: { label: "No plan", tone: "neutral", body: "Choose a plan to keep using CampVoice after your trial." },
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const context = await requireSession();
  const subscription = await getSubscription(context.organization.id);
  const { checkout } = await searchParams;

  const status: SubscriptionStatus = subscription?.status ?? "none";
  const copy = STATUS_COPY[status];
  const days = trialDaysRemaining(subscription);
  const savings = annualSavings();

  return (
    <div className="space-y-6">
      {checkout === "success" ? (
        <Alert tone="success" title="Thank you">
          Your subscription is being confirmed with Stripe. It usually appears here within a few seconds — refresh if it
          has not updated yet.
        </Alert>
      ) : null}
      {checkout === "cancelled" ? <Alert tone="info">Checkout was cancelled. Nothing has been charged.</Alert> : null}

      {!isStripeConfigured() ? (
        <Alert tone="info" title="Billing is not connected yet">
          Stripe keys have not been added to this environment, so subscribing is unavailable. See the launch checklist
          in the README.
        </Alert>
      ) : null}

      <Card className="p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold">Your plan</h2>
            <p className="mt-1 prose-camp">{copy.body}</p>
          </div>
          <Badge tone={copy.tone}>{copy.label}</Badge>
        </div>

        <dl className="divider-soft mt-6 grid gap-4 pt-6 sm:grid-cols-2">
          {status === "trialing" && days !== null ? (
            <Detail label="Trial ends" value={days === 0 ? "Today" : `In ${days} ${days === 1 ? "day" : "days"}`} />
          ) : null}

          {subscription?.plan_interval ? (
            <Detail label="Billing" value={subscription.plan_interval === "year" ? "Annual" : "Monthly"} />
          ) : null}

          {subscription?.current_period_end ? (
            <Detail
              label={subscription.cancel_at_period_end ? "Access ends" : "Renews"}
              value={new Date(subscription.current_period_end).toLocaleDateString(undefined, { dateStyle: "long" })}
            />
          ) : null}
        </dl>

        <div className="divider-soft mt-6 pt-6">
          <BillingActions hasCustomer={Boolean(subscription?.stripe_customer_id)} />
        </div>
      </Card>

      <Card className="p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold">{pricing.planName}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-paper-300 p-4">
            <p className="text-sm font-medium text-ink-500">Monthly</p>
            <p className="mt-1 font-display text-2xl font-semibold">
              {pricing.monthly.label}
              <span className="font-sans text-sm font-normal text-ink-300">{pricing.monthly.suffix}</span>
            </p>
          </div>
          <div className="rounded-lg border border-forest-200 bg-forest-50/50 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-ink-500">Annual</p>
              <span className="rounded-full bg-ember-50 px-2 py-0.5 text-xs font-semibold text-ember-700">
                Save {savings.percent}%
              </span>
            </div>
            <p className="mt-1 font-display text-2xl font-semibold">
              {pricing.annual.label}
              <span className="font-sans text-sm font-normal text-ink-300">{pricing.annual.suffix}</span>
            </p>
          </div>
        </div>

        <ul className="mt-6 space-y-2">
          {pricing.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm text-ink-700">
              <svg viewBox="0 0 16 16" className="mt-1 h-3.5 w-3.5 shrink-0 text-forest-500" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <path d="M3 8.5 6.5 12 13 4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>

        <p className="mt-6 text-sm text-ink-300">
          New accounts include a {trial.days}-day free trial. Payments, invoices and cancellation are all handled by
          Stripe — CampVoice never sees or stores your card number.
        </p>
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-300">{label}</dt>
      <dd className="mt-0.5 text-ink-800">{value}</dd>
    </div>
  );
}
