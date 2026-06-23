import { useState } from "react";
import { Link } from "react-router-dom";
import { useSeo } from "../lib/useSeo.js";
import ScoreRing from "../components/ScoreRing.jsx";
import { ArrowRight, Sparkles, Target, TrendingUp } from "../components/icons.jsx";

// Top-of-funnel "free diagnostic" page. It reuses the existing free practice +
// the Progress dashboard (no new quiz engine): practice a free set → your score
// rings and weakest area show up on Progress → drill that area / upgrade.

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is the PrepNova diagnostic?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A free, no-pressure way to find out where you're losing points on the ACT or SAT. Practice a free set, and PrepNova scores you by section and topic and surfaces your weakest area automatically.",
      },
    },
    {
      "@type": "Question",
      name: "Is the diagnostic free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. You can run a free sample set without an account and see your results. Unlimited practice and full-length exams are part of PrepNova Pro.",
      },
    },
  ],
};

const STEPS = [
  {
    icon: Sparkles,
    title: "Practice a free set",
    body: "Pick a test and a subject, then run a quick set of real-format questions — no account needed to start.",
  },
  {
    icon: TrendingUp,
    title: "See your score rings",
    body: "Every set is scored and charted. Your accuracy shows up as score rings on your progress dashboard.",
  },
  {
    icon: Target,
    title: "Find your weakest area",
    body: "PrepNova calls out the section and topic costing you the most points — so you know exactly what to fix.",
  },
];

export default function Diagnostic() {
  const [test, setTest] = useState("ACT");
  useSeo({
    title: "Free ACT & SAT Diagnostic — Find Your Weak Areas | PrepNova",
    description:
      "Take a free ACT or SAT diagnostic: practice real-format questions and instantly see your score rings and the exact topics costing you points. No credit card to start.",
    canonical: "https://www.prepnovaai.com/diagnostic",
    jsonLd: JSON_LD,
  });

  return (
    <main className="container-pn max-w-4xl pt-28 pb-20 sm:pt-36">
      <div className="grid items-center gap-10 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="font-display text-xs font-bold tracking-widest text-electric-400 uppercase">
            Free diagnostic
          </p>
          <h1 className="mt-2 font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl">
            Find out exactly where
            <br />
            <span className="text-gradient">you lose points.</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-400">
            Practice a free set of real-format {test} questions, and PrepNova shows your score by
            section and topic — and the one area that's costing you the most. Free to start, no card.
          </p>

          <div className="mt-6 inline-flex rounded-xl bg-white/5 p-1">
            {["ACT", "SAT"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTest(t)}
                aria-pressed={test === t}
                className={`rounded-lg px-5 py-2 font-display text-sm font-bold transition-colors ${
                  test === t ? "bg-electric-500/20 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to="/select" className="btn-primary">
              Start the free {test} diagnostic <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/progress" className="btn-ghost">
              View my results
            </Link>
          </div>
        </div>

        {/* Sample dashboard visual */}
        <div className="glass glow-card p-6">
          <p className="text-center text-xs font-semibold tracking-widest text-slate-500 uppercase">
            Sample result
          </p>
          <div className="mt-4 flex justify-center">
            <ScoreRing value={72} label="Overall" sublabel="across your sets" id="diag-ring" size={150} />
          </div>
          <div className="mt-5 rounded-xl border border-amber-400/30 bg-amber-500/[0.07] p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-amber-300 uppercase">
              <Target className="h-3.5 w-3.5" /> Focus here
            </p>
            <p className="mt-1 font-display text-lg font-bold text-white">
              {test === "ACT" ? "Science" : "Reading & Writing"}
            </p>
            <p className="text-xs text-slate-400">Your weakest area — drill it to gain the most points.</p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <h2 className="mt-16 text-center font-display text-2xl font-extrabold tracking-tight text-white">
        How the diagnostic works
      </h2>
      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <div key={s.title} className="glass glow-card p-6">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-electric-500/15 text-electric-400">
              <s.icon className="h-5 w-5" />
            </span>
            <p className="mt-4 font-display text-xs font-bold tracking-widest text-slate-500">
              STEP {i + 1}
            </p>
            <h3 className="mt-1 font-display font-bold text-white">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link to="/select" className="btn-primary">
          Start the free diagnostic <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}
