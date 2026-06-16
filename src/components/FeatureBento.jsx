import { useReveal } from "../lib/useReveal.js";
import {
  BookOpen,
  Check,
  Clock,
  GraduationCap,
  Sparkles,
  TrendingUp,
} from "./icons.jsx";

// Bento-grid feature section (per ui-ux-pro-max "Bento Box Grid" recommendation):
// varied-size glass tiles, staggered scroll reveal, hover lift+scale.
export default function FeatureBento() {
  const [ref, shown] = useReveal();

  const tile =
    "glass glow-card group relative overflow-hidden p-6 transition-transform hover:scale-[1.02]";

  return (
    <div
      ref={ref}
      className={`reveal-stagger mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 ${
        shown ? "reveal-in" : ""
      }`}
    >
      {/* Hero tile — AI verification (big) */}
      <div
        style={{ "--i": 0 }}
        className={`${tile} sm:col-span-2 lg:col-span-2 lg:row-span-2`}
      >
        <div className="glow-blob -top-16 -right-10 h-40 w-40 bg-electric-500/20" aria-hidden="true" />
        <span className="relative grid h-12 w-12 place-items-center rounded-xl bg-emerald-500/15 text-emerald-300 transition-colors group-hover:bg-emerald-500/25">
          <Check className="h-6 w-6" />
        </span>
        <h3 className="relative mt-5 font-display text-xl font-extrabold text-white">
          Double-checked by a comprehensive AI system
        </h3>
        <p className="relative mt-2 max-w-md text-sm leading-relaxed text-slate-400">
          Every question is written by AI, then independently re-solved by a different AI model.
          Any answer the two disagree on is thrown out — so you only ever drill questions you can
          trust.
        </p>

        {/* Mini "verified answer" visual */}
        <div className="relative mt-6 space-y-2">
          {[
            ["A", "x = 3", false],
            ["B", "x = 5", true],
            ["C", "x = 8", false],
          ].map(([letter, text, correct]) => (
            <div
              key={letter}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                correct
                  ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-100"
                  : "border-white/10 bg-white/5 text-slate-400"
              }`}
            >
              <span className="font-display text-xs font-bold">{letter}</span>
              {text}
              {correct && (
                <span className="relative ml-auto flex h-4 w-4 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/40" />
                  <Check className="relative h-4 w-4 text-emerald-300" />
                </span>
              )}
            </div>
          ))}
          <p className="pt-1 text-xs font-semibold text-emerald-300/90">
            Verified by a second model ✓
          </p>
        </div>
      </div>

      {/* Full-length exams (wide) */}
      <BentoTile
        i={1}
        icon={GraduationCap}
        className="sm:col-span-2 lg:col-span-2"
        title="8 full-length, timed exams"
        body="Four ACT and four SAT practice tests — scored section by section on a clock you control, and they load instantly."
      />

      {/* Real format */}
      <BentoTile
        i={2}
        icon={BookOpen}
        title="Looks like the real test"
        body="Underlined English passages, paired & graph-based reading, and geometry diagrams — the actual digital format."
      />

      {/* Explanations */}
      <BentoTile
        i={3}
        icon={Sparkles}
        title="Tutor-grade explanations"
        body="Every answer breaks down why it's right — and why the tempting wrong choice isn't."
      />

      {/* Progress (wide) */}
      <BentoTile
        i={4}
        icon={TrendingUp}
        className="sm:col-span-2 lg:col-span-2"
        title="Progress you can see"
        body="Every session is scored and charted, so you can watch your accuracy climb week over week."
      />

      {/* Kept current (wide) */}
      <BentoTile
        i={5}
        icon={Clock}
        className="sm:col-span-2 lg:col-span-2"
        title="Kept current all year"
        body="Questions and concepts are reviewed and refreshed as new official ACT and SAT exams are released."
      />
    </div>
  );
}

function BentoTile({ i, icon: Icon, title, body, className = "" }) {
  return (
    <div
      style={{ "--i": i }}
      className={`glass glow-card group p-6 transition-transform hover:scale-[1.02] ${className}`}
    >
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-electric-500/15 text-electric-400 transition-colors group-hover:bg-electric-500/25 group-hover:text-electric-300">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 font-display font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
    </div>
  );
}
