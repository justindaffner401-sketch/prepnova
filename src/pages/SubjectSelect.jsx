import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getLastSelection, setLastSelection } from "../lib/storage.js";
import PortalTransition from "../components/PortalTransition.jsx";
import {
  ArrowRight,
  BookOpen,
  Check,
  Flask,
  GraduationCap,
  PenLine,
  Sigma,
} from "../components/icons.jsx";

const TESTS = [
  {
    id: "ACT",
    tagline: "36-point scale",
    blurb: "Four fast-paced sections including Science. Famous for rewarding sprint-level pacing.",
  },
  {
    id: "SAT",
    tagline: "1600-point scale",
    blurb: "Digital and adaptive, with evidence-first questions and a heavier emphasis on reasoning.",
  },
];

// The ACT has four sections; the digital SAT has two (Math and a combined
// Reading & Writing section we label "English").
const SUBJECTS_BY_TEST = {
  ACT: [
    { id: "English", icon: PenLine, blurb: "Grammar & rhetoric within a passage" },
    { id: "Math", icon: Sigma, blurb: "Algebra, geometry, trig & problem solving" },
    { id: "Reading", icon: BookOpen, blurb: "Comprehension, inference & evidence" },
    { id: "Science", icon: Flask, blurb: "Charts, experiments & data reasoning" },
  ],
  SAT: [
    { id: "Math", icon: Sigma, blurb: "Algebra, advanced math & problem solving" },
    { id: "English", icon: BookOpen, blurb: "Reading & Writing — comprehension + grammar" },
  ],
};

export default function SubjectSelect() {
  const navigate = useNavigate();
  const last = getLastSelection();
  const [test, setTest] = useState(last?.test ?? null);
  const [subject, setSubject] = useState(last?.subject ?? null);
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    document.title = "PrepNova — Choose your focus";
  }, []);

  const ready = Boolean(test && subject);
  const subjects = test ? (SUBJECTS_BY_TEST[test] ?? []) : [];

  function chooseTest(id) {
    setTest(id);
    // Drop a subject that doesn't exist for the new test (e.g. SAT has no Science).
    if (subject && !(SUBJECTS_BY_TEST[id] ?? []).some((s) => s.id === subject)) {
      setSubject(null);
    }
  }

  function start() {
    if (!ready || launching) return;
    setLastSelection({ test, subject });
    setLaunching(true); // play the portal, then navigate when it finishes
  }

  return (
    <main className="container-pn pt-28 pb-20 sm:pt-36">
      {launching && (
        <PortalTransition
          test={test}
          subject={subject}
          onDone={() => navigate(`/practice?test=${test}&subject=${subject}`)}
        />
      )}
      <div className="mx-auto max-w-3xl">
        <p className="font-display text-xs font-bold tracking-widest text-electric-400 uppercase">
          Step 1 of 2
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Which test are you taking?
        </h1>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {TESTS.map((t) => {
            const active = test === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => chooseTest(t.id)}
                aria-pressed={active}
                className={`group relative rounded-2xl border p-6 text-left transition-all duration-200 ${
                  active
                    ? "border-electric-400/70 bg-electric-500/10 shadow-[0_0_40px_rgba(59,130,246,0.15)]"
                    : "border-white/10 bg-white/5 hover:border-electric-400/40 hover:bg-white/[0.07]"
                }`}
              >
                {active && (
                  <span className="absolute top-4 right-4 grid h-6 w-6 place-items-center rounded-full bg-gradient-to-r from-electric-500 to-cyan-400">
                    <Check className="h-3.5 w-3.5 text-white" />
                  </span>
                )}
                <p className="font-display text-2xl font-extrabold text-white">{t.id}</p>
                <p className="mt-0.5 text-xs font-semibold tracking-wide text-electric-300">
                  {t.tagline}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{t.blurb}</p>
              </button>
            );
          })}
        </div>

        <div
          className={`transition-all duration-300 ${
            test ? "mt-12 opacity-100" : "pointer-events-none mt-12 opacity-30"
          }`}
        >
          <p className="font-display text-xs font-bold tracking-widest text-electric-400 uppercase">
            Step 2 of 2
          </p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Where do you lose the most points?
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {subjects.map((s) => {
              const active = subject === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSubject(s.id)}
                  aria-pressed={active}
                  disabled={!test}
                  className={`group flex items-start gap-4 rounded-2xl border p-5 text-left transition-all duration-200 ${
                    active
                      ? "border-electric-400/70 bg-electric-500/10 shadow-[0_0_40px_rgba(59,130,246,0.15)]"
                      : "border-white/10 bg-white/5 hover:border-electric-400/40 hover:bg-white/[0.07]"
                  }`}
                >
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-colors ${
                      active
                        ? "bg-gradient-to-br from-electric-500 to-cyan-400 text-white"
                        : "bg-electric-500/15 text-electric-400"
                    }`}
                  >
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-display font-bold text-white">{s.id}</span>
                    <span className="mt-0.5 block text-sm text-slate-400">{s.blurb}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            {ready
              ? `Locked in: ${test} ${subject}. Five questions, 60 seconds each.`
              : "Pick a test and a subject to begin."}
          </p>
          <button
            type="button"
            onClick={start}
            disabled={!ready}
            className={`btn-primary ${!ready ? "cursor-not-allowed opacity-40" : ""}`}
          >
            Start practice
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Full-length exam call-to-action */}
        <Link
          to="/exam"
          className="group mt-10 flex items-center justify-between gap-4 rounded-2xl border border-electric-400/30 bg-gradient-to-r from-electric-500/10 to-cyan-500/[0.06] p-5 transition-all duration-200 hover:border-electric-400/60 hover:from-electric-500/15"
        >
          <div className="flex items-center gap-3.5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-electric-500/15 text-electric-300">
              <GraduationCap className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display font-bold text-white">Take a full-length exam</p>
              <p className="text-sm text-slate-400">
                8 ready-made ACT &amp; SAT tests — timed and scored like the real thing, no wait.
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-electric-300 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </main>
  );
}
