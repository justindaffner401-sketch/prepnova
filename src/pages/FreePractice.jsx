import { Link } from "react-router-dom";
import { useSeo } from "../lib/useSeo.js";
import { ArrowRight, Check, Sparkles } from "../components/icons.jsx";

// SEO landing pages for high-intent searches ("free ACT practice questions",
// "free SAT practice"). Original, honest copy — we never claim to host the real
// exams. One component serves both /free-act-practice and /free-sat-practice.

const COMMON_PERKS = [
  "Real digital ACT & SAT format — not a PDF worksheet",
  "Every question double-checked by a second AI model",
  "A clear explanation on every answer — right and wrong",
  "Progress tracked by section, topic, and question type",
  "8 full-length, timed practice exams",
];

function faqSchema(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

const ACT_FAQS = [
  {
    q: "Are these the real ACT questions?",
    a: "No. They're original questions, written by AI in the real digital ACT format and independently re-checked by a second AI model. The official tests belong to ACT, Inc. — practicing on originals keeps you on the right side of copyright while still drilling the exact skills and format.",
  },
  {
    q: "Is the ACT practice really free?",
    a: "Yes — you can run a sample set free, no account needed. Unlimited AI-generated questions and the 8 full-length timed exams are part of PrepNova Pro ($29/month, cancel anytime).",
  },
  {
    q: "What's on the ACT?",
    a: "Four scored sections — English, Math, Reading, and Science — plus an optional Writing essay. PrepNova covers all four with section-accurate question types.",
  },
  {
    q: "How should I practice for the ACT?",
    a: "Drill timed sets, review the explanation on every miss, and track which topics cost you the most points — then focus there. PrepNova surfaces your weakest area automatically.",
  },
];

const SAT_FAQS = [
  {
    q: "Are these the real SAT questions?",
    a: "No. They're original questions written in the real digital SAT (Bluebook-style) format and re-checked by a second AI model. The official tests belong to the College Board — you practice on originals that mirror the real format and skills.",
  },
  {
    q: "Is the SAT practice really free?",
    a: "Yes — a sample set is free without an account. Unlimited AI-generated questions and 8 full-length timed exams are part of PrepNova Pro ($29/month, cancel anytime).",
  },
  {
    q: "What's on the digital SAT?",
    a: "Two sections — Reading & Writing, and Math — delivered adaptively in the digital format. PrepNova practices both in the real on-screen style.",
  },
  {
    q: "How should I practice for the SAT?",
    a: "Practice in the real digital format, review every explanation, and target the question types you miss most. PrepNova tracks your accuracy by topic and points you at your weakest area.",
  },
];

const DATA = {
  ACT: {
    title: "Free ACT Practice Questions (Real Digital Format) | PrepNova",
    description:
      "Practice free ACT questions in the real digital format — English, Math, Reading, and Science — with an explanation on every answer and progress tracking. Start free, no card needed.",
    canonical: "https://www.prepnovaai.com/free-act-practice",
    eyebrow: "Free ACT practice",
    h1: "Free ACT Practice Questions",
    blurb:
      "Drill real-format ACT questions across English, Math, Reading, and Science — each with a clear explanation, all double-checked by a comprehensive AI system. Start free; no credit card to try a set.",
    sections: ["English", "Math", "Reading", "Science"],
    faqs: ACT_FAQS,
    jsonLd: faqSchema(ACT_FAQS),
  },
  SAT: {
    title: "Free SAT Practice Questions (Digital Format) | PrepNova",
    description:
      "Practice free digital-SAT questions in the real on-screen format — Reading & Writing and Math — with an explanation on every answer and progress tracking. Start free, no card needed.",
    canonical: "https://www.prepnovaai.com/free-sat-practice",
    eyebrow: "Free SAT practice",
    h1: "Free SAT Practice Questions",
    blurb:
      "Drill real-format digital-SAT questions across Reading & Writing and Math — each with a clear explanation, all double-checked by a comprehensive AI system. Start free; no credit card to try a set.",
    sections: ["Reading & Writing", "Math"],
    faqs: SAT_FAQS,
    jsonLd: faqSchema(SAT_FAQS),
  },
};

export default function FreePractice({ test }) {
  const d = DATA[test];
  useSeo({
    title: d.title,
    description: d.description,
    canonical: d.canonical,
    jsonLd: d.jsonLd,
  });

  return (
    <main className="container-pn max-w-3xl pt-28 pb-20 sm:pt-36">
      <p className="font-display text-xs font-bold tracking-widest text-electric-400 uppercase">
        {d.eyebrow}
      </p>
      <h1 className="mt-2 font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl">
        {d.h1}
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-400">{d.blurb}</p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Link to="/select" className="btn-primary">
          Start practicing free <ArrowRight className="h-4 w-4" />
        </Link>
        <Link to="/diagnostic" className="btn-ghost">
          Take the free diagnostic
        </Link>
      </div>

      {/* Sections covered */}
      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {d.sections.map((s) => (
          <div key={s} className="glass glow-card p-5">
            <p className="font-display text-lg font-bold text-white">{test} {s}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">
              Section-accurate {s} questions with full explanations.
            </p>
          </div>
        ))}
      </div>

      {/* Why practice here */}
      <h2 className="mt-14 font-display text-2xl font-extrabold tracking-tight text-white">
        Practice like it's the real test
      </h2>
      <ul className="mt-5 space-y-2.5">
        {COMMON_PERKS.map((perk) => (
          <li key={perk} className="flex items-start gap-2.5 text-sm text-slate-200">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            {perk}
          </li>
        ))}
      </ul>

      {/* FAQ (matches the FAQ structured data) */}
      <h2 className="mt-14 font-display text-2xl font-extrabold tracking-tight text-white">
        {test} practice — FAQ
      </h2>
      <div className="mt-5 space-y-3">
        {d.faqs.map((f) => (
          <div key={f.q} className="glass p-5">
            <h3 className="font-display font-bold text-white">{f.q}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{f.a}</p>
          </div>
        ))}
      </div>

      {/* Closing CTA */}
      <div className="glass mt-12 flex flex-col items-center gap-4 p-8 text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-electric-400/30 bg-electric-500/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-electric-300">
          <Sparkles className="h-3.5 w-3.5" /> Start free in 30 seconds
        </p>
        <h2 className="font-display text-2xl font-extrabold text-white">
          Know exactly what to fix on the {test}
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-slate-400">
          Try a free set now. Upgrade to PrepNova Pro for unlimited questions and 8 full-length
          timed exams — for less than a dollar a day.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link to="/select" className="btn-primary">
            Start practicing free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/#pricing" className="btn-ghost">
            See pricing
          </Link>
        </div>
      </div>
    </main>
  );
}
