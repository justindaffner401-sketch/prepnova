import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass, SectionHeading } from "@/components/ui";
import { HowItWorksSteps } from "@/components/marketing/HowItWorksSteps";
import { trial } from "@/lib/config";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Teach CampVoice about your camp once, it builds your Camp DNA, and then every parent email, tour follow-up, social post and newsletter takes minutes instead of an afternoon.",
  alternates: { canonical: "/how-it-works" },
};

const ONBOARDING = [
  { step: "Your camp", body: "Name, website, location, type of camp, camper ages and a short description." },
  { step: "About camp", body: "Programs and activities, traditions, and the words your camp uses for things." },
  { step: "Your voice", body: "Pick the tone traits that fit, then tell CampVoice what to avoid." },
  { step: "Teach CampVoice", body: "Import your website, upload previous emails and newsletters, or paste examples." },
  { step: "Important dates", body: "Enrollment, sessions, Visiting Day, open houses, staff arrival and your own events." },
  { step: "Camp DNA preview", body: "Read what CampVoice understood, edit anything that is off, and confirm." },
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="bg-topo border-b border-paper-300 py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <p className="eyebrow">How it works</p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-5xl">
            One setup. Then it just knows.
          </h1>
          <p className="mt-5 text-lg prose-camp">
            The whole point of CampVoice is that you explain your camp once. Everything after that is a short form and a
            finished draft.
          </p>
        </div>
      </section>

      <section className="border-b border-paper-300 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <HowItWorksSteps />
        </div>
      </section>

      <section className="border-b border-paper-300 bg-paper-200/40 py-20">
        <div className="mx-auto max-w-3xl px-5">
          <SectionHeading eyebrow="Setup" title="What the first sitting looks like." align="left" />
          <ol className="mt-10 space-y-4">
            {ONBOARDING.map((item, index) => (
              <li key={item.step} className="card flex gap-4 p-5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest-50 font-display text-sm font-semibold text-forest-700">
                  {index + 1}
                </span>
                <div>
                  <h2 className="font-semibold">{item.step}</h2>
                  <p className="mt-1 text-sm prose-camp">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-sm text-ink-300">
            You can skip any step and come back to it. Camp DNA improves as you add more, and it is always editable.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="font-display text-3xl font-semibold">Then a tour follow-up takes ninety seconds.</h2>
          <p className="mx-auto mt-4 max-w-xl prose-camp">
            Family name, one memorable detail from the visit, and what you want to happen next. That is the whole form.
          </p>
          <Link href="/sign-up" className={buttonClass("primary", "lg", "mt-7")}>Start Free</Link>
          <p className="mt-3 text-sm text-ink-300">
            {trial.days}-day free trial.{trial.requireCard ? " Cancel any time." : " No credit card required."}
          </p>
        </div>
      </section>
    </>
  );
}
