import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { authEnabled } from "../lib/supabase.js";
import { ArrowRight, Check, Sparkles, XIcon } from "./icons.jsx";

/* Cost of an 8-week prep plan at each option's lowest public price.
 * Tutoring assumes two 1-hour sessions/week (16 hrs) at $45/hr — the floor of
 * the $45–200 range. PrepNova is two months at $29. Bars scale to the max. */
const COST_BARS = [
  { label: "Princeton Review", sub: "Self-paced course", amount: 949, display: "$949+" },
  { label: "Private tutor", sub: "16 one-hour sessions", amount: 720, display: "$720+" },
  { label: "Kaplan", sub: "Self-paced course", amount: 699, display: "$699+" },
  { label: "PrepNova", sub: "2 months, unlimited", amount: 58, display: "$58", highlight: true },
];
const MAX_COST = 949;

/* yes = Check, no = X, partial = muted dash */
const MATRIX = [
  { feature: "Unlimited practice questions", pn: "yes", tutor: "no", course: "partial" },
  { feature: "Available 24/7, instantly", pn: "yes", tutor: "no", course: "yes" },
  { feature: "Targets your weakest subject", pn: "yes", tutor: "yes", course: "no" },
  { feature: "Explanation on every answer", pn: "yes", tutor: "yes", course: "partial" },
  { feature: "Progress tracking & analytics", pn: "yes", tutor: "partial", course: "yes" },
  { feature: "No scheduling or commute", pn: "yes", tutor: "no", course: "yes" },
];

/** Fires once when the element first scrolls into view. */
function useInView(threshold = 0.25) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return undefined;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function Cell({ value }) {
  if (value === "yes") return <Check className="mx-auto h-5 w-5 text-emerald-400" />;
  if (value === "no") return <XIcon className="mx-auto h-5 w-5 text-rose-400/70" />;
  return <span className="mx-auto block h-0.5 w-3 rounded bg-slate-600" aria-label="limited" />;
}

export default function WhyUs() {
  const [barsRef, barsInView] = useInView();

  return (
    <section id="why" className="scroll-mt-28 border-t border-white/5">
      <div className="container-pn py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-electric-400/30 bg-electric-500/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-electric-300">
            <Sparkles className="h-3.5 w-3.5" />
            Why PrepNova
          </span>
          <h2 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Top scores shouldn't cost
            <br />
            <span className="text-gradient">thousands of dollars.</span>
          </h2>
          <p className="mt-4 text-slate-400">
            Private tutors run the meter by the hour. The big test-prep brands
            charge hundreds up front for fixed courses. PrepNova gives you more —
            for the price of a couple of coffees a month.
          </p>
        </div>

        {/* ---------------- Cost comparison ---------------- */}
        <div ref={barsRef} className="mx-auto mt-14 max-w-3xl">
          <p className="text-center text-sm font-semibold tracking-wide text-slate-300">
            What an 8-week prep plan actually costs
          </p>
          <div className="glass mt-5 space-y-5 p-6 sm:p-8">
            {COST_BARS.map((bar, i) => (
              <div key={bar.label}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span
                    className={`text-sm font-semibold ${
                      bar.highlight ? "text-white" : "text-slate-300"
                    }`}
                  >
                    {bar.label}
                    <span className="ml-2 text-xs font-normal text-slate-500">{bar.sub}</span>
                  </span>
                  <span
                    className={`font-display text-lg font-extrabold ${
                      bar.highlight ? "text-gradient" : "text-slate-400"
                    }`}
                  >
                    {bar.display}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/5">
                  <div
                    className={`h-full rounded-full ${
                      bar.highlight
                        ? "bg-gradient-to-r from-electric-500 to-cyan-400"
                        : "bg-slate-600/70"
                    }`}
                    style={{
                      width: barsInView ? `${Math.max((bar.amount / MAX_COST) * 100, 4)}%` : "0%",
                      transition: `width 1s cubic-bezier(0.22,1,0.36,1) ${i * 120}ms`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-slate-500">
            Each option at its lowest public price for an 8-week plan. Tutoring
            assumes two 1-hour sessions a week at $45/hr; PrepNova is two months
            at $29.
          </p>
        </div>

        {/* ---------------- Feature matrix ---------------- */}
        <div className="mx-auto mt-16 max-w-3xl">
          <p className="text-center text-sm font-semibold tracking-wide text-slate-300">
            And you get more where it counts
          </p>
          <div className="glass mt-5 overflow-hidden p-2 sm:p-3">
            {/* Header row */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 px-3 py-3 sm:gap-x-6 sm:px-4">
              <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                Feature
              </span>
              <span className="w-16 text-center font-display text-xs font-bold text-electric-300 sm:w-20">
                PrepNova
              </span>
              <span className="w-14 text-center text-xs font-medium text-slate-500 sm:w-20">
                Tutor
              </span>
              <span className="w-14 text-center text-xs font-medium text-slate-500 sm:w-20">
                Courses
              </span>
            </div>
            {MATRIX.map((row) => (
              <div
                key={row.feature}
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 rounded-xl px-3 py-3 odd:bg-white/[0.02] sm:gap-x-6 sm:px-4"
              >
                <span className="text-sm text-slate-200">{row.feature}</span>
                <span className="w-16 rounded-lg bg-electric-500/10 py-1.5 sm:w-20">
                  <Cell value={row.pn} />
                </span>
                <span className="w-14 sm:w-20">
                  <Cell value={row.tutor} />
                </span>
                <span className="w-14 sm:w-20">
                  <Cell value={row.course} />
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ---------------- Closing CTA ---------------- */}
        <div className="mx-auto mt-12 max-w-xl text-center">
          <p className="text-slate-300">
            Same goal — a higher score — at a fraction of the price, available
            the moment you need it.
          </p>
          <Link
            to={authEnabled ? "/account" : "/select"}
            className="btn-primary mt-6"
          >
            Start practicing
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
