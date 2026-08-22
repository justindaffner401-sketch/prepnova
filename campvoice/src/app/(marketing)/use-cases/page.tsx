import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass, SectionHeading } from "@/components/ui";
import { UseCaseCards } from "@/components/marketing/UseCaseCards";
import { CATEGORIES, templatesByCategory } from "@/lib/ai/templates";

export const metadata: Metadata = {
  title: "Use Cases",
  description:
    "Summer camp email templates, parent communication, enrollment marketing, staff recruitment and social media content — every communication a camp has to write.",
  alternates: { canonical: "/use-cases" },
};

export default function UseCasesPage() {
  return (
    <>
      <section className="bg-topo border-b border-paper-300 py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <p className="eyebrow">Use cases</p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-5xl">
            Everything a camp has to write, in one place.
          </h1>
          <p className="mt-5 text-lg prose-camp">
            Five audiences, more than thirty communication types. Each one is a short form, not a blank page.
          </p>
        </div>
      </section>

      <section className="border-b border-paper-300 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <UseCaseCards />
        </div>
      </section>

      <section className="border-b border-paper-300 bg-paper-200/40 py-20">
        <div className="mx-auto max-w-5xl px-5">
          <SectionHeading eyebrow="The full library" title="Every template included in CampVoice Pro." />
          <div className="mt-12 space-y-10">
            {CATEGORIES.map((category) => (
              <div key={category.id}>
                <h2 className="font-display text-2xl font-semibold">{category.label}</h2>
                <p className="mt-1 text-sm prose-camp">{category.blurb}</p>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {templatesByCategory(category.id).map((template) => (
                    <li key={template.id} className="card px-4 py-3">
                      <p className="text-sm font-semibold text-ink-900">{template.label}</p>
                      <p className="mt-0.5 text-sm text-ink-500">{template.blurb}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="font-display text-3xl font-semibold">Start with the one you need this week.</h2>
          <Link href="/sign-up" className={buttonClass("primary", "lg", "mt-6")}>Start Free</Link>
        </div>
      </section>
    </>
  );
}
