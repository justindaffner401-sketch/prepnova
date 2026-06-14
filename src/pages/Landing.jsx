import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Footer from "../components/Footer.jsx";
import WhyUs from "../components/WhyUs.jsx";
import { authEnabled } from "../lib/supabase.js";
import {
  ArrowRight,
  Bolt,
  BookOpen,
  Check,
  Clock,
  Sparkles,
  Target,
  TrendingUp,
} from "../components/icons.jsx";

const FEATURES = [
  {
    icon: Bolt,
    title: "Fresh questions, every time",
    body: "Claude AI writes new ACT- and SAT-style questions on demand, so you never grind the same worksheet twice.",
  },
  {
    icon: BookOpen,
    title: "Tutor-grade explanations",
    body: "Every answer comes with a step-by-step breakdown of why it's right — and why the tempting wrong choice isn't.",
  },
  {
    icon: Clock,
    title: "Beat the clock",
    body: "A 60-second timer on every question builds the pacing instincts the real test demands.",
  },
  {
    icon: Target,
    title: "Built around your weaknesses",
    body: "Pick your test and your weakest subject, then drill exactly where the points are hiding.",
  },
  {
    icon: TrendingUp,
    title: "Progress you can see",
    body: "Every session is scored and charted, so you can watch your accuracy climb week over week.",
  },
  {
    icon: Sparkles,
    title: "Always on",
    body: "No scheduling, no commute, no hourly meter running. Your AI tutor is ready at 6 a.m. or midnight.",
  },
];

const PREPNOVA_PERKS = [
  "Unlimited AI-generated questions",
  "ACT & SAT · Math, English, Reading, Science",
  "Detailed explanation on every answer",
  "60-second pacing drills",
  "Progress tracking & analytics",
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
      <section className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0" aria-hidden="true" />
        <div
          className="glow-blob -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 bg-electric-600/25"
          aria-hidden="true"
        />
        <div className="glow-blob top-40 -left-32 h-72 w-72 bg-cyan-500/10" aria-hidden="true" />

        <div className="container-pn relative grid items-center gap-12 pt-32 pb-20 sm:pt-40 lg:grid-cols-2 lg:pb-28">
          <div>
            <span className="anim-fade-up inline-flex items-center gap-2 rounded-full border border-electric-400/30 bg-electric-500/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-electric-300">
              <Sparkles className="h-3.5 w-3.5" />
              AI-powered ACT &amp; SAT prep
            </span>

            <h1
              className="anim-fade-up mt-6 font-display text-5xl leading-[1.05] font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl"
              style={{ animationDelay: "80ms" }}
            >
              Your Score.
              <br />
              <span className="text-gradient">Elevated.</span>
            </h1>

            <p
              className="anim-fade-up mt-6 max-w-xl text-lg leading-relaxed text-slate-400"
              style={{ animationDelay: "160ms" }}
            >
              PrepNova generates unlimited practice questions tuned to your
              weakest subjects, explains every answer like a private tutor, and
              tracks your climb — for less than a dollar a day.
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
              ACT &amp; SAT · 4 subjects · $29/month · Cancel anytime
            </p>
          </div>

          <div className="anim-fade-up flex justify-center lg:justify-end" style={{ animationDelay: "200ms" }}>
            <MockQuestionCard />
          </div>
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section className="border-y border-white/5 bg-navy-950/40">
        <div className="container-pn grid gap-8 py-12 sm:grid-cols-3">
          {[
            ["01", "Pick your test", "ACT or SAT — then call out your weakest subject."],
            ["02", "Drill weak spots", "Five fresh AI questions, 60 seconds each, explained in depth."],
            ["03", "Watch it climb", "Every session is charted so progress is impossible to miss."],
          ].map(([num, title, body]) => (
            <div key={num} className="flex gap-4">
              <span className="font-display text-3xl font-extrabold text-electric-500/40">{num}</span>
              <div>
                <p className="font-display font-bold text-white">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">{body}</p>
              </div>
            </div>
          ))}
        </div>
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
              PrepNova pairs Claude AI with the structure of real test prep —
              targeted drills, honest pacing, and explanations that actually
              teach.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="glass group p-6 transition-all duration-300 hover:-translate-y-1 hover:border-electric-400/40"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-electric-500/15 text-electric-400 transition-colors group-hover:bg-electric-500/25">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display font-bold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Why us ---------------- */}
      <WhyUs />

      {/* ---------------- Pricing ---------------- */}
      <section id="pricing" className="scroll-mt-28 border-t border-white/5 bg-navy-950/40">
        <div className="container-pn py-20 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              One simple <span className="text-gradient">price</span>
            </h2>
            <p className="mt-4 text-slate-400">
              Unlimited AI-powered practice across both tests and every subject.
              No contracts, no hidden fees — cancel anytime.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-sm">
            <div className="relative rounded-2xl border border-electric-400/50 bg-gradient-to-b from-electric-500/15 to-cyan-400/5 p-7 shadow-[0_0_60px_rgba(59,130,246,0.18)]">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-electric-500 to-cyan-400 px-3 py-1 font-display text-[11px] font-bold tracking-wide text-white">
                BEST VALUE
              </span>
              <p className="font-display font-bold text-white">PrepNova</p>
              <p className="mt-3">
                <span className="font-display text-5xl font-extrabold text-white">$29</span>
                <span className="ml-1 text-sm text-slate-300">/month</span>
              </p>
              <p className="mt-2 text-xs text-electric-200/90">
                Less than one hour with the cheapest tutor.
              </p>
              <ul className="mt-5 space-y-2.5">
                {PREPNOVA_PERKS.map((perk) => (
                  <li key={perk} className="flex items-start gap-2.5 text-sm text-slate-200">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    {perk}
                  </li>
                ))}
              </ul>
              <Link to={authEnabled ? "/account" : "/select"} className="btn-primary mt-6 w-full">
                Get started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Signup CTA ---------------- */}
      <section className="container-pn py-20 sm:py-24">
        <div className="relative overflow-hidden rounded-3xl border border-electric-400/30 bg-gradient-to-br from-navy-800 via-navy-900 to-navy-950 px-6 py-14 text-center sm:px-12">
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
        </div>
      </section>

      <Footer />
    </main>
  );
}
