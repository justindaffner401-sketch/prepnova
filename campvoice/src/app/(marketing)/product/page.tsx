import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass, SectionHeading } from "@/components/ui";
import { ProductPreview } from "@/components/marketing/ProductPreview";
import { CampDnaDiagram } from "@/components/marketing/CampDnaDiagram";

export const metadata: Metadata = {
  title: "Product",
  description:
    "CampVoice learns your camp's voice, terminology, traditions and dates, then writes parent emails, prospective-family follow-ups, social content and newsletters in minutes.",
  alternates: { canonical: "/product" },
};

const FEATURES = [
  {
    title: "A form, not a prompt",
    body: "You never learn prompt engineering. Choose what you are creating, answer three or four plain questions, and CampVoice handles the rest behind the scenes.",
  },
  {
    title: "Camp DNA, always applied",
    body: "Every draft is written against your persistent camp profile. You do not re-explain your camp, ever.",
  },
  {
    title: "Never invents camp facts",
    body: "CampVoice states only what you have told it. If a detail is missing it leaves a visible blank instead of guessing a date, a program or a price.",
  },
  {
    title: "One-click revisions",
    body: "Shorter, warmer, more energetic, more professional, less 'AI', or a completely different version. Or describe the change in your own words.",
  },
  {
    title: "Content history",
    body: "Every draft is searchable and filterable by category, type, date and favourites, so last year's opening-day email is always thirty seconds away.",
  },
  {
    title: "Generate My Week",
    body: "CampVoice looks at your calendar and the season and suggests three to six things worth sending. Nothing is ever sent automatically.",
  },
];

export default function ProductPage() {
  return (
    <>
      <section className="bg-topo border-b border-paper-300 py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="max-w-2xl">
            <p className="eyebrow">Product</p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-5xl">
              Communications software that already knows your camp.
            </h1>
            <p className="mt-5 text-lg prose-camp">
              CampVoice does one thing extremely well: it creates excellent camp communications. It is not a CRM, not an
              email sender, and not a camper database.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/sign-up" className={buttonClass("primary", "lg")}>Start Free</Link>
              <Link href="/how-it-works" className={buttonClass("secondary", "lg")}>See How It Works</Link>
            </div>
          </div>
          <div className="mt-12">
            <ProductPreview />
          </div>
        </div>
      </section>

      <section className="border-b border-paper-300 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHeading eyebrow="What you get" title="Built around how camps actually work." />
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="card p-6">
                <h2 className="text-lg font-semibold">{feature.title}</h2>
                <p className="mt-2 text-sm prose-camp">{feature.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-paper-300 bg-paper-200/40 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHeading
            eyebrow="Camp DNA"
            title="The part that makes it yours."
            description="Everything you teach CampVoice becomes one profile, and that profile is applied to every single thing it writes."
          />
          <div className="mt-14"><CampDnaDiagram /></div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-5">
          <SectionHeading
            eyebrow="What CampVoice is not"
            title="Deliberately focused."
            description="A short list, because saying no is what keeps the product simple enough to be genuinely useful."
            align="left"
          />
          <ul className="mt-8 grid gap-2.5 sm:grid-cols-2">
            {["A CRM", "An email sender", "A social scheduler", "A CampMinder replacement", "A camper-management system", "A parent database", "A marketing agency", "A generic chatbot"].map((item) => (
              <li key={item} className="flex items-center gap-2.5 rounded-lg border border-paper-300 bg-paper-50 px-4 py-2.5 text-sm text-ink-500">
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-ink-300" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
