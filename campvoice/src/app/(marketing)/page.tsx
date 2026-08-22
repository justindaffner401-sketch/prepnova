import type { Metadata } from "next";
import Link from "next/link";
import { brand, trial } from "@/lib/config";
import { buttonClass, SectionHeading } from "@/components/ui";
import { ProductPreview } from "@/components/marketing/ProductPreview";
import { CampDnaDiagram } from "@/components/marketing/CampDnaDiagram";
import { UseCaseCards } from "@/components/marketing/UseCaseCards";
import { PricingCard } from "@/components/marketing/PricingCard";
import { Faq, FAQ_ITEMS } from "@/components/marketing/Faq";
import { HowItWorksSteps } from "@/components/marketing/HowItWorksSteps";

export const metadata: Metadata = {
  // `absolute` opts out of the root layout's "%s · CampVoice" template, which
  // would otherwise print the brand name twice on the homepage.
  title: { absolute: `${brand.name} — ${brand.tagline}` },
  description: brand.description,
  alternates: { canonical: "/" },
};

/** Structured data so search engines understand what CampVoice is. */
function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: brand.name,
        applicationCategory: "BusinessApplication",
        description: brand.description,
        url: brand.siteUrl,
        offers: { "@type": "Offer", price: "79", priceCurrency: "USD" },
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ_ITEMS.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };

  // Escaping "<" means this can never close its own <script> tag, whatever the
  // content becomes later. The data itself is developer-authored, not user input.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export default function HomePage() {
  return (
    <>
      <StructuredData />

      {/* ------------------------------------------------------------ hero */}
      <section className="bg-topo border-b border-paper-300">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:py-24">
          <div>
            <p className="eyebrow">Built for summer camps</p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-[3.4rem]">
              Your camp&rsquo;s voice, ready whenever you need it.
            </h1>
            <p className="mt-6 max-w-xl text-lg prose-camp">{brand.description}</p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/sign-up" className={buttonClass("primary", "lg")}>
                Start Free
              </Link>
              <Link href="/how-it-works" className={buttonClass("secondary", "lg")}>
                See How It Works
              </Link>
            </div>

            <p className="mt-4 text-sm text-ink-300">
              {trial.days}-day free trial.{trial.requireCard ? " Cancel any time." : " No credit card required."}
            </p>
          </div>

          <ProductPreview />
        </div>
      </section>

      {/* ----------------------------------------------------- core value */}
      <section className="border-b border-paper-300 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHeading
            eyebrow="The problem"
            title="Stop starting every message from scratch."
            description="Most camp communication is written twice: once in your head, and once again the following year. CampVoice remembers the parts that never change so you only have to supply what is new."
          />

          <ul className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Your tone", body: "Warm, energetic, premium, plainspoken — however your camp actually sounds." },
              { title: "Your terminology", body: "If cabins are bunks and counselors are Leaders, CampVoice never gets it wrong." },
              { title: "Your traditions", body: "Color War, Visiting Day, the opening campfire. Referenced correctly, never invented." },
              { title: "Your programs", body: "What you actually offer, described the way you describe it." },
              { title: "Your dates", body: "Enrollment, sessions, deadlines. Real dates from your calendar, never made up." },
              { title: "Your preferences", body: "The words you never use, and the ones you always do." },
            ].map((item) => (
              <li key={item.title} className="card p-5">
                <h3 className="text-base font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-sm prose-camp">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ----------------------------------------------------- Camp DNA */}
      <section className="border-b border-paper-300 bg-paper-200/40 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHeading
            eyebrow="Camp DNA"
            title="Your camp is not generic. Your AI shouldn't be either."
            description="Camp DNA is the persistent profile CampVoice builds from everything you teach it. It is what makes the difference between a draft that sounds like your camp and one that sounds like software."
          />
          <div className="mt-14">
            <CampDnaDiagram />
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- use cases */}
      <section className="border-b border-paper-300 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHeading
            eyebrow="Use cases"
            title="Everything a camp actually has to write."
            description="Thirty-plus communication types, each with a short form instead of a blank page."
          />
          <div className="mt-12">
            <UseCaseCards />
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- how it works */}
      <section className="border-b border-paper-300 bg-paper-200/40 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHeading eyebrow="How it works" title="Three steps, then you're done teaching it." />
          <div className="mt-12">
            <HowItWorksSteps />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- pricing */}
      <section className="border-b border-paper-300 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHeading
            eyebrow="Pricing"
            title="One plan. Everything included."
            description="Less than an hour of a marketing contractor's time, for the whole year of communications."
          />
          <div className="mt-12">
            <PricingCard />
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- FAQ */}
      <section className="border-b border-paper-300 bg-paper-200/40 py-20">
        <div className="mx-auto max-w-3xl px-5">
          <SectionHeading eyebrow="Questions" title="What camps ask us first." />
          <div className="mt-10">
            <Faq />
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">
            Teach CampVoice about your camp once.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg prose-camp">
            Then spend your summer running camp instead of rewriting emails.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/sign-up" className={buttonClass("primary", "lg")}>
              Start Free
            </Link>
            <Link href="/use-cases" className={buttonClass("secondary", "lg")}>
              See what it writes
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
