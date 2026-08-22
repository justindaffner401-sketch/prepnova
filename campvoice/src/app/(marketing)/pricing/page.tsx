import type { Metadata } from "next";
import { annualSavings, pricing, trial } from "@/lib/config";
import { SectionHeading } from "@/components/ui";
import { PricingCard } from "@/components/marketing/PricingCard";
import { Faq } from "@/components/marketing/Faq";

export const metadata: Metadata = {
  title: "Pricing",
  description: `${pricing.planName} is ${pricing.monthly.label} per month or ${pricing.annual.label} per year, with a ${trial.days}-day free trial. One plan, everything included.`,
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  const savings = annualSavings();

  return (
    <>
      <section className="bg-topo border-b border-paper-300 py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <p className="eyebrow">Pricing</p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-5xl">
            One plan. Everything included.
          </h1>
          <p className="mt-5 text-lg prose-camp">
            No per-seat pricing, no usage credits to track, no upsell tiers. {trial.days} days free to decide whether it
            sounds like your camp.
          </p>
        </div>
      </section>

      <section className="border-b border-paper-300 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <PricingCard />

          <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-ink-900">Monthly</h2>
              <p className="mt-1 font-display text-3xl font-semibold">
                {pricing.monthly.label}
                <span className="font-sans text-base font-normal text-ink-300">{pricing.monthly.suffix}</span>
              </p>
              <p className="mt-2 text-sm prose-camp">Cancel any time from your billing settings.</p>
            </div>
            <div className="card border-forest-200 p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-ink-900">Annual</h2>
                <span className="rounded-full bg-ember-50 px-2.5 py-0.5 text-xs font-semibold text-ember-700">
                  Save {savings.percent}%
                </span>
              </div>
              <p className="mt-1 font-display text-3xl font-semibold">
                {pricing.annual.label}
                <span className="font-sans text-base font-normal text-ink-300">{pricing.annual.suffix}</span>
              </p>
              <p className="mt-2 text-sm prose-camp">
                ${savings.saved} less than paying monthly (${savings.monthlyTotal} a year).
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-5">
          <SectionHeading eyebrow="Questions" title="Before you start." />
          <div className="mt-10"><Faq /></div>
        </div>
      </section>
    </>
  );
}
