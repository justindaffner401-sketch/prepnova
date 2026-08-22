import Link from "next/link";
import { annualSavings, pricing, trial } from "@/lib/config";
import { buttonClass } from "@/components/ui";

/**
 * The pricing card. Every number comes from src/lib/config.ts — change it once
 * there (and in Stripe) and every page updates.
 */
export function PricingCard({ ctaHref = "/sign-up" }: { ctaHref?: string }) {
  const savings = annualSavings();

  return (
    <div className="mx-auto max-w-lg">
      <div className="card overflow-hidden">
        <div className="border-b border-paper-300 bg-forest-700 px-7 py-6 text-paper-50">
          <p className="text-sm font-medium text-forest-100">{pricing.planName}</p>
          <p className="mt-1.5 flex items-baseline gap-1.5">
            <span className="font-display text-5xl font-semibold">{pricing.monthly.label}</span>
            <span className="text-forest-100">{pricing.monthly.suffix}</span>
          </p>
          <p className="mt-3 text-sm text-forest-100">
            Or {pricing.annual.label}{pricing.annual.suffix} — save ${savings.saved} a year ({savings.percent}% off).
          </p>
        </div>

        <div className="px-7 py-6">
          <p className="text-sm font-medium text-ink-900">Everything in CampVoice:</p>
          <ul className="mt-4 space-y-2.5">
            {pricing.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-ink-700">
                <svg viewBox="0 0 16 16" className="mt-1 h-3.5 w-3.5 shrink-0 text-forest-500" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                  <path d="M3 8.5 6.5 12 13 4.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>

          <Link href={ctaHref} className={buttonClass("primary", "lg", "mt-7 w-full")}>
            Start Free
          </Link>
          <p className="mt-3 text-center text-sm text-ink-300">
            {trial.days}-day free trial.{trial.requireCard ? " Card required, cancel any time." : " No credit card required."}
          </p>
        </div>
      </div>
    </div>
  );
}
