import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ScoreChart from "../components/ScoreChart.jsx";
import ScoreRing from "../components/ScoreRing.jsx";
import CountUp from "../components/CountUp.jsx";
import { clearResults, getResults } from "../lib/storage.js";
import {
  ArrowRight,
  Target,
  Trash,
  TrendingUp,
} from "../components/icons.jsx";

const TEST_FILTERS = ["All", "ACT", "SAT"];

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Tailwind gradient for a mastery bar, by score band.
function masteryBar(avg) {
  if (avg >= 80) return "from-emerald-500 to-teal-400";
  if (avg >= 60) return "from-electric-500 to-cyan-400";
  return "from-rose-500 to-amber-400";
}

export default function Progress() {
  const [results, setResults] = useState(() => getResults());
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    document.title = "PrepNova — Your progress";
  }, []);

  const filtered = useMemo(() => {
    const list = filter === "All" ? results : results.filter((r) => r.test === filter);
    return [...list].sort((a, b) => new Date(a.ts) - new Date(b.ts));
  }, [results, filter]);

  const stats = useMemo(() => {
    if (filtered.length === 0) return null;
    const totalQuestions = filtered.reduce((sum, r) => sum + r.total, 0);
    const avg = Math.round(
      filtered.reduce((sum, r) => sum + r.percent, 0) / filtered.length,
    );
    const best = Math.max(...filtered.map((r) => r.percent));
    return { sessions: filtered.length, totalQuestions, avg, best };
  }, [filtered]);

  const subjectBreakdown = useMemo(() => {
    const groups = {};
    for (const r of filtered) {
      (groups[r.subject] ??= []).push(r.percent);
    }
    return Object.entries(groups)
      .map(([subjectName, percents]) => ({
        subject: subjectName,
        avg: Math.round(percents.reduce((a, b) => a + b, 0) / percents.length),
        count: percents.length,
      }))
      .sort((a, b) => b.avg - a.avg);
  }, [filtered]);

  // Lowest-scoring subject (breakdown is sorted high→low) — the "focus area".
  const weakest =
    subjectBreakdown.length >= 2 ? subjectBreakdown[subjectBreakdown.length - 1] : null;

  // Mastery bars fill from 0 the first time they render (skip under reduced motion).
  const [barsReady, setBarsReady] = useState(prefersReducedMotion);
  useEffect(() => {
    if (prefersReducedMotion) return undefined;
    setBarsReady(false);
    const id = setTimeout(() => setBarsReady(true), 80);
    return () => clearTimeout(id);
  }, [filter, results]);

  function handleClear() {
    if (window.confirm("Delete all saved practice results? This can't be undone.")) {
      clearResults();
      setResults([]);
    }
  }

  return (
    <main className="container-pn pt-28 pb-20 sm:pt-36">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-display text-xs font-bold tracking-widest text-electric-400 uppercase">
              Score tracker
            </p>
            <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Watch yourself climb
            </h1>
          </div>
          <div className="flex gap-1.5">
            {TEST_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  filter === f
                    ? "bg-electric-500/20 text-electric-300 ring-1 ring-electric-400/50"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="glass mt-10 p-12 text-center sm:p-16">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-electric-500/15 text-electric-400">
              <TrendingUp className="h-7 w-7" />
            </span>
            <h2 className="mt-5 font-display text-xl font-bold text-white">
              {results.length === 0
                ? "No sessions yet"
                : `No ${filter} sessions yet`}
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
              {results.length === 0
                ? "Finish your first 5-question drill and your scores will start charting here automatically."
                : "Switch the filter or run a session for this test."}
            </p>
            <Link to="/select" className="btn-primary mt-6">
              Start practicing
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Dashboard: animated score rings, key counts, and a focus area */}
            <div className="glass mt-8 p-6 sm:p-8">
              <div className="grid items-center gap-7 sm:grid-cols-2 lg:grid-cols-4">
                <ScoreRing
                  value={stats.avg}
                  label="Average score"
                  sublabel={`across ${stats.sessions} session${stats.sessions === 1 ? "" : "s"}`}
                  id="ring-avg"
                />
                <ScoreRing value={stats.best} label="Best session" id="ring-best" />

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs font-medium tracking-wide text-slate-500">Sessions</p>
                    <p className="mt-1 font-display text-2xl font-extrabold text-white">
                      <CountUp value={stats.sessions} />
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs font-medium tracking-wide text-slate-500">Questions</p>
                    <p className="mt-1 font-display text-2xl font-extrabold text-white">
                      <CountUp value={stats.totalQuestions} />
                    </p>
                  </div>
                </div>

                {weakest ? (
                  <Link
                    to="/select"
                    className="group flex h-full flex-col justify-center rounded-xl border border-amber-400/30 bg-amber-500/[0.07] p-4 transition-colors hover:bg-amber-500/[0.13]"
                  >
                    <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-amber-300 uppercase">
                      <Target className="h-3.5 w-3.5" /> Focus here
                    </p>
                    <p className="mt-1.5 font-display text-lg font-bold text-white">{weakest.subject}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                      Your weakest area at {weakest.avg}% — drill it{" "}
                      <span className="font-semibold text-amber-300 group-hover:underline">→</span>
                    </p>
                  </Link>
                ) : (
                  <div className="flex h-full flex-col justify-center rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs font-medium tracking-wide text-slate-500">Focus area</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-300">
                      Practice a couple more subjects and your weakest area shows up here.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Chart */}
            <div className="glass mt-5 p-5 sm:p-7">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-white">Score history</h2>
                <span className="text-xs text-slate-500">last {Math.min(filtered.length, 15)} sessions</span>
              </div>
              <div className="mt-4">
                <ScoreChart results={filtered} />
              </div>
            </div>

            {/* Subject breakdown */}
            <div className="glass mt-5 p-5 sm:p-7">
              <h2 className="flex items-center gap-2 font-display font-bold text-white">
                <Target className="h-4 w-4 text-electric-400" /> Subject mastery
              </h2>
              <div className="mt-5 space-y-4">
                {subjectBreakdown.map((s) => (
                  <div key={s.subject}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-medium text-slate-200">
                        {s.subject}
                        <span className="ml-2 text-xs text-slate-500">
                          {s.count} session{s.count === 1 ? "" : "s"}
                        </span>
                      </span>
                      <span className="font-display font-bold text-white">{s.avg}%</span>
                    </div>
                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/5">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${masteryBar(s.avg)} transition-[width] duration-700 ease-out`}
                        style={{ width: barsReady ? `${s.avg}%` : "0%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* History */}
            <div className="glass mt-5 p-5 sm:p-7">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-white">Recent sessions</h2>
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-rose-400"
                >
                  <Trash className="h-3.5 w-3.5" />
                  Clear history
                </button>
              </div>
              <ul className="mt-4 divide-y divide-white/5">
                {[...filtered].reverse().map((r) => (
                  <li key={r.id} className="flex items-center gap-4 py-3.5">
                    <span
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-sm font-extrabold ${
                        r.percent >= 80
                          ? "bg-emerald-500/15 text-emerald-300"
                          : r.percent >= 60
                            ? "bg-electric-500/15 text-electric-300"
                            : "bg-rose-500/15 text-rose-300"
                      }`}
                    >
                      {r.percent}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {r.test} · {r.subject}
                        {r.source === "sample" && (
                          <span className="ml-2 text-xs font-normal text-amber-300/80">sample</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(r.ts).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        ·{" "}
                        {new Date(r.ts).toLocaleTimeString(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-slate-400">
                      {r.score}/{r.total}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
