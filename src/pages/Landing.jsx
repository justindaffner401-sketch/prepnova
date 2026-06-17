import { lazy, Suspense, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import WhyUs from "../components/WhyUs.jsx";
import FeatureBento from "../components/FeatureBento.jsx";
import BlackHoleBackground from "../components/BlackHoleBackground.jsx";
import { useReveal } from "../lib/useReveal.js";
import { authEnabled } from "../lib/supabase.js";
import { ArrowRight, Check, Sparkles } from "../components/icons.jsx";

// 3D hero is heavy (three.js); lazy-load so only the landing route pays for it.
const Hero3D = lazy(() => import("../components/Hero3D.jsx"));

// Reveal-on-scroll wrapper.
function Reveal({ children, className = "", stagger = false, as: Tag = "div" }) {
  const [ref, shown] = useReveal();
  const base = stagger ? "reveal-stagger" : "reveal";
  return (
    <Tag ref={ref} className={`${base} ${shown ? "reveal-in" : ""} ${className}`}>
      {children}
    </Tag>
  );
}

const PREPNOVA_PERKS = [
  "8 full-length, timed practice exams",
  "All questions double-checked by a comprehensive AI system",
  "Real digital ACT & SAT format",
  "Updated as new official tests release",
  "Detailed explanation on every answer",
  "Progress tracking & analytics",
  "ACT & SAT · all subjects",
  "Cancel anytime",
];

function MockQuestionCard() {
  return (
    <div className="anim-float glass relative w-full max-w-sm p-5 shadow-2xl shadow-electric-500/10" aria-hidden="true">
      <div className="flex items-center justify-between">
        <span className="rounded-full border border-electric-400/30 bg-electric-500/10 px-3 py-1 text-xs font-semibold text-electric-300">
          ACT · Math
        </span>
        <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-electric-500/60 font-display text-sm font-bold text-electric-300">
          42
        </span>
      </div>
      <p className="mt-4 font-medium text-white">If 3x + 5 = 20, what is the value of x?</p>
      <div className="mt-4 space-y-2 text-sm">
        {[
          { label: "A", text: "3" },
          { label: "B", text: "5", correct: true },
          { label: "C", text: "8" },
          { label: "D", text: "15" },
        ].map((c) => (
          <div
            key={c.label}
            className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
              c.correct
                ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-200"
                : "border-white/10 bg-white/5 text-slate-300"
            }`}
          >
            <span className="font-display text-xs font-bold">{c.label}</span>
            {c.text}
            {c.correct && <Check className="ml-auto h-4 w-4" />}
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-emerald-300/90">
        Correct — subtract 5, divide by 3. Nice pacing.
      </p>
    </div>
  );
}

export default function Landing() {
  const { hash } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "PrepNova — Your Score. Elevated.";
  }, []);

  // Support /#features style links from any page.
  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) {
      // No explicit behavior — html { scroll-behavior: smooth } handles the
      // easing, and behavior:auto scrolls reliably even in throttled tabs.
      const t = setTimeout(() => el.scrollIntoView(), 50);
      return () => clearTimeout(t);
    }
  }, [hash]);

  return (
    <main>
      {/* ---------------- Hero ---------------- */}
      <section className="relative flex min-h-screen items-center overflow-hidden">
        {/* Full-bleed cinematic black-hole environment (video + overlays). */}
        <BlackHoleBackground />

        <div className="container-pn relative z-10 grid items-center gap-12 pt-32 pb-20 sm:pt-40 lg:grid-cols-2 lg:pb-28">
          <div>
            <span className="anim-fade-up inline-flex items-center gap-2 rounded-full border border-electric-400/30 bg-electric-500/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-electric-300">
              <Sparkles className="h-3.5 w-3.5" />
              AI-built, AI-verified ACT &amp; SAT prep
            </span>

            <h1
              className="anim-fade-up mt-6 font-display text-5xl leading-[1.05] font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl"
              style={{ animationDelay: "80ms" }}
            >
              Your Score.
              <br />
              <span className="text-gradient-anim">Elevated.</span>
            </h1>

            <p
              className="anim-fade-up mt-6 max-w-xl text-lg leading-relaxed text-slate-400"
              style={{ animationDelay: "160ms" }}
            >
              Unlimited ACT &amp; SAT practice in the real digital-test format —
              all questions double-checked by a comprehensive AI system, plus
              eight full-length timed exams and tutor-grade explanations. For
              less than a dollar a day.
            </p>

            <div
              className="anim-fade-up mt-8 flex flex-col gap-3 sm:flex-row"
              style={{ animationDelay: "240ms" }}
            >
              <Link to="/select" className="btn-primary">
                Start practicing
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#pricing" className="btn-ghost">
                See pricing
              </a>
            </div>

            <p
              className="anim-fade-up mt-6 text-xs font-medium tracking-wide text-slate-500"
              style={{ animationDelay: "320ms" }}
            >
              8 full-length exams · AI-verified · $29/month · Cancel anytime
            </p>

            <div
              className="anim-fade-up mt-8 grid max-w-lg grid-cols-2 gap-3 sm:grid-cols-4"
              style={{ animationDelay: "400ms" }}
            >
              {[
                ["8", "Full-length exams"],
                ["∞", "Practice questions"],
                ["2×", "AI-checked answers"],
                ["<$1", "Per day"],
              ].map(([n, l]) => (
                <div key={l} className="glass glow-card px-3 py-3 text-center">
                  <p className="font-display text-2xl font-extrabold text-gradient">{n}</p>
                  <p className="mt-0.5 text-[11px] leading-tight text-slate-400">{l}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="anim-fade-up flex justify-center lg:justify-end" style={{ animationDelay: "200ms" }}>
            <div className="relative">
              {/* Live 3D orb backdrop */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Suspense fallback={null}>
                  <Hero3D />
                </Suspense>
              </div>
              {/* Product card floating in front (frosted glass over the orb) */}
              <div className="relative z-10">
                <MockQuestionCard />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section className="border-y border-white/5 bg-navy-950/40">
        <Reveal stagger className="container-pn grid gap-8 py-12 sm:grid-cols-3">
          {[
            ["01", "Pick your test", "ACT or SAT — then call out your weakest subject."],
            ["02", "Drill or sit an exam", "Targeted drills or a full-length timed exam — all questions double-checked by a comprehensive AI system."],
            ["03", "Watch it climb", "Every session is charted so progress is impossible to miss."],
          ].map(([num, title, body], i) => (
            <div key={num} className="flex gap-4" style={{ "--i": i }}>
              <span className="font-display text-3xl font-extrabold text-electric-500/40">{num}</span>
              <div>
                <p className="font-display font-bold text-white">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">{body}</p>
              </div>
            </div>
          ))}
        </Reveal>
      </section>

      {/* ---------------- Features ---------------- */}
      <section id="features" className="scroll-mt-28">
        <div className="container-pn py-20 sm:py-24">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Everything a tutor does.
              <br />
              <span className="text-gradient">None of the invoice.</span>
            </h2>
            <p className="mt-4 text-slate-400">
              PrepNova pairs AI generation with a comprehensive AI accuracy
              check and the structure of the real digital exams — so every
              question is realistic, verified, and explained.
            </p>
          </div>

          <FeatureBento />
        </div>
      </section>

      {/* ---------------- Why us ---------------- */}
      <WhyUs />

      {/* ---------------- Pricing ---------------- */}
      <section id="pricing" className="scroll-mt-28 border-t border-white/5 bg-navy-950/40">
        <div className="container-pn py-20 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Choose your <span className="text-gradient">plan</span>
            </h2>
            <p className="mt-4 text-slate-400">
              Unlimited AI-powered practice across both tests and every subject.
              Start free — or save big with a longer plan.
            </p>
          </div>

          {/* Every plan includes */}
          <ul className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-x-6 gap-y-2">
            {PREPNOVA_PERKS.map((perk) => (
              <li key={perk} className="flex items-center gap-2 text-sm text-slate-300">
                <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                {perk}
              </li>
            ))}
          </ul>

          {/* Plans */}
          <div className="mx-auto mt-10 grid max-w-4xl items-stretch gap-5 md:grid-cols-3">
            {/* Monthly */}
            <div className="glass flex flex-col p-6">
              <p className="font-display font-bold text-white">Monthly</p>
              <p className="mt-3">
                <span className="font-display text-4xl font-extrabold text-white">$29</span>
                <span className="ml-1 text-sm text-slate-300">/mo</span>
              </p>
              <p className="mt-2 text-xs text-electric-200/90">7-day free trial included.</p>
              <div className="flex-1" />
              <Link to={authEnabled ? "/account" : "/select"} className="btn-ghost mt-6 w-full">
                Start free trial
              </Link>
            </div>

            {/* 1 Year — featured */}
            <div className="relative flex flex-col rounded-2xl border border-electric-400/50 bg-gradient-to-b from-electric-500/15 to-cyan-400/5 p-6 shadow-[0_0_60px_rgba(59,130,246,0.18)] md:-mt-2">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-electric-500 to-cyan-400 px-3 py-1 font-display text-[11px] font-bold tracking-wide text-white">
                BEST VALUE
              </span>
              <p className="font-display font-bold text-white">1 Year</p>
              <p className="mt-3">
                <span className="font-display text-4xl font-extrabold text-white">$250</span>
                <span className="ml-1 text-sm text-slate-300">/year</span>
              </p>
              <p className="mt-2 text-xs text-electric-200/90">
                <span className="text-slate-500 line-through">$348/yr</span> — save $98 vs monthly.
              </p>
              <div className="flex-1" />
              <Link to={authEnabled ? "/account" : "/select"} className="btn-primary mt-6 w-full">
                Get 1 year
              </Link>
            </div>

            {/* Lifetime */}
            <div className="glass flex flex-col p-6">
              <p className="font-display font-bold text-white">Lifetime</p>
              <p className="mt-3">
                <span className="font-display text-4xl font-extrabold text-white">$600</span>
                <span className="ml-1 text-sm text-slate-300">once</span>
              </p>
              <p className="mt-2 text-xs text-electric-200/90">
                Yours forever. Younger siblings? Pass it down when they're ready.
              </p>
              <div className="flex-1" />
              <Link to={authEnabled ? "/account" : "/select"} className="btn-ghost mt-6 w-full">
                Get lifetime
              </Link>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-slate-500">
            Cancel the monthly plan anytime. The sample question set is always free.
          </p>
        </div>
      </section>

      {/* ---------------- Signup CTA ---------------- */}
      <section className="container-pn py-20 sm:py-24">
        <Reveal className="relative overflow-hidden rounded-3xl border border-electric-400/30 bg-gradient-to-br from-navy-800 via-navy-900 to-navy-950 px-6 py-14 text-center sm:px-12">
          <div className="glow-blob -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 bg-electric-500/20" aria-hidden="true" />
          <div className="relative">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Ready to elevate your score?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-slate-400">
              Jump into a practice set right now — no credit card required to
              try it.
            </p>
            <form
              className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                navigate("/select");
              }}
            >
              <input
                type="email"
                required
                placeholder="you@email.com"
                aria-label="Email address"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none backdrop-blur transition focus:border-electric-400/70 focus:ring-2 focus:ring-electric-500/30"
              />
              <button type="submit" className="btn-primary shrink-0">
                Start free
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
            <p className="mt-4 text-xs text-slate-500">
              Practice mode is free to try. Plans start at $29/month.
            </p>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
