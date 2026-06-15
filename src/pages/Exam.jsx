import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SectionRunner from "../components/SectionRunner.jsx";
import { SECTION_PLANS, EXAM_SECTIONS, assembleSection } from "../lib/section.js";
import { getApiKey, saveResult } from "../lib/storage.js";
import { authEnabled } from "../lib/supabase.js";
import { useAuth } from "../lib/useAuth.js";
import { ArrowRight, Bolt, Check, Clock, RotateCcw } from "../components/icons.jsx";

const TESTS = ["ACT", "SAT"];
const sectionsForTest = (test) => Object.keys(SECTION_PLANS).filter((k) => k.startsWith(`${test}-`));

export default function Exam() {
  const navigate = useNavigate();
  const { user, subscribed } = useAuth();
  const apiKey = getApiKey();
  const aiAvailable = Boolean(apiKey) || (import.meta.env.PROD && (!authEnabled || subscribed));

  // "setup" | "loading" | "active" | "break" | "done" | "error"
  const [phase, setPhase] = useState("setup");
  const [test, setTest] = useState("ACT");
  const [mode, setMode] = useState("section"); // "section" | "exam"
  const [sectionKey, setSectionKey] = useState("ACT-English");
  const [minutes, setMinutes] = useState(SECTION_PLANS["ACT-English"].minutes);

  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [units, setUnits] = useState(null);
  const [progress, setProgress] = useState({ done: 0, total: 1, label: "" });
  const [results, setResults] = useState([]); // { key, label, score, total }
  const [error, setError] = useState("");
  const abortRef = useRef(null);

  useEffect(() => {
    document.title = "PrepNova — Full-length exam";
  }, []);
  useEffect(() => () => abortRef.current?.abort(), []);

  function pickTest(t) {
    setTest(t);
    const first = sectionsForTest(t)[0];
    setSectionKey(first);
    setMinutes(SECTION_PLANS[first].minutes);
  }
  function pickSection(key) {
    setSectionKey(key);
    setMinutes(SECTION_PLANS[key].minutes);
  }

  const currentPlan = queue[queueIndex] ? SECTION_PLANS[queue[queueIndex]] : null;
  const sectionSeconds =
    mode === "exam" && currentPlan ? currentPlan.minutes * 60 : Math.max(1, minutes) * 60;

  async function assemble(key) {
    setPhase("loading");
    setError("");
    setProgress({ done: 0, total: SECTION_PLANS[key].units.length, label: "Starting…" });
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const built = await assembleSection(key, {
        apiKey: getApiKey(),
        signal: controller.signal,
        onProgress: setProgress,
      });
      setUnits(built);
      setPhase("active");
    } catch (e) {
      if (controller.signal.aborted) return;
      setError(e.message || "Couldn't build the section. Try again.");
      setPhase("error");
    }
  }

  function start() {
    if (!aiAvailable) return;
    const q = mode === "exam" ? EXAM_SECTIONS[test] : [sectionKey];
    setQueue(q);
    setQueueIndex(0);
    setResults([]);
    assemble(q[0]);
  }

  function handleSectionComplete({ score, total }) {
    const key = queue[queueIndex];
    const plan = SECTION_PLANS[key];
    saveResult({ test: plan.test, subject: plan.subject, score, total, source: "exam" });
    setResults((r) => [...r, { key, label: plan.label, score, total }]);
    if (queueIndex + 1 < queue.length) {
      setPhase("break");
    } else {
      setPhase("done");
    }
  }

  function nextSection() {
    const next = queueIndex + 1;
    setQueueIndex(next);
    assemble(queue[next]);
  }

  function cancelLoading() {
    abortRef.current?.abort();
    setPhase("setup");
  }

  const totalScore = results.reduce((a, r) => a + r.score, 0);
  const totalQuestions = results.reduce((a, r) => a + r.total, 0);
  const pct = totalQuestions ? Math.round((totalScore / totalQuestions) * 100) : 0;

  return (
    <main className="container-pn pt-28 pb-20 sm:pt-36">
      {/* ---------------- Setup ---------------- */}
      {phase === "setup" && (
        <div className="anim-fade-up mx-auto max-w-xl">
          <p className="font-display text-xs font-bold tracking-widest text-electric-400 uppercase">
            Full-length
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Take a real-length exam
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            A whole section — or the entire test — generated fresh and verified, on a clock you choose.
          </p>

          <div className="glass mt-6 p-6 sm:p-7">
            {/* Test */}
            <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">Test</p>
            <div className="mt-2 flex gap-2">
              {TESTS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => pickTest(t)}
                  className={`flex-1 rounded-xl border px-4 py-2.5 font-display text-sm font-bold transition ${
                    test === t
                      ? "border-electric-400/70 bg-electric-500/10 text-white"
                      : "border-white/10 bg-white/5 text-slate-300 hover:border-electric-400/40"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Mode */}
            <p className="mt-5 text-xs font-semibold tracking-widest text-slate-500 uppercase">
              What to take
            </p>
            <div className="mt-2 flex gap-2">
              {[
                ["section", "One section"],
                ["exam", "Full exam (all sections)"],
              ].map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                    mode === m
                      ? "border-electric-400/70 bg-electric-500/10 text-white"
                      : "border-white/10 bg-white/5 text-slate-300 hover:border-electric-400/40"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Section picker (single mode) */}
            {mode === "section" && (
              <>
                <p className="mt-5 text-xs font-semibold tracking-widest text-slate-500 uppercase">
                  Section
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {sectionsForTest(test).map((key) => {
                    const plan = SECTION_PLANS[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => pickSection(key)}
                        className={`rounded-xl border px-4 py-3 text-left transition ${
                          sectionKey === key
                            ? "border-electric-400/70 bg-electric-500/10"
                            : "border-white/10 bg-white/5 hover:border-electric-400/40"
                        }`}
                      >
                        <p className="font-display text-sm font-bold text-white">{plan.label}</p>
                        <p className="text-xs text-slate-400">~{plan.target} questions</p>
                      </button>
                    );
                  })}
                </div>

                {/* Timer */}
                <p className="mt-5 text-xs font-semibold tracking-widest text-slate-500 uppercase">
                  Timer
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {[
                    ["Real time", SECTION_PLANS[sectionKey].minutes],
                    ["Relaxed", Math.round(SECTION_PLANS[sectionKey].minutes * 1.5)],
                    ["Untimed", 180],
                  ].map(([label, m]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setMinutes(m)}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                        minutes === m
                          ? "border-electric-400/70 bg-electric-500/10 text-electric-200"
                          : "border-white/10 bg-white/5 text-slate-300 hover:border-electric-400/40"
                      }`}
                    >
                      {label} · {m}m
                    </button>
                  ))}
                  <label className="flex items-center gap-2 text-xs text-slate-400">
                    Custom
                    <input
                      type="number"
                      min="1"
                      value={minutes}
                      onChange={(e) => setMinutes(Math.max(1, Number(e.target.value) || 1))}
                      className="w-16 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-sm text-white outline-none focus:border-electric-400/70"
                    />
                    min
                  </label>
                </div>
              </>
            )}

            {mode === "exam" && (
              <p className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                <Clock className="h-4 w-4 shrink-0 text-electric-400" />
                {EXAM_SECTIONS[test].length} sections, back-to-back, each on its real time limit.
              </p>
            )}

            <div className="mt-6 border-t border-white/10 pt-5">
              {aiAvailable ? (
                <button type="button" onClick={start} className="btn-primary w-full">
                  <Bolt className="h-4 w-4" />
                  {mode === "exam" ? "Start full exam" : "Start section"}
                </button>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-300">
                    Full-length exams use AI generation — part of PrepNova Pro.
                  </p>
                  <Link to="/account" className="btn-ghost btn-sm">
                    {user ? "Upgrade" : "Sign in"}
                  </Link>
                </div>
              )}
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-slate-500">
            Just want a quick set?{" "}
            <Link to="/select" className="text-electric-400 hover:underline">
              Practice mode
            </Link>
          </p>
        </div>
      )}

      {/* ---------------- Loading / assembling ---------------- */}
      {phase === "loading" && (
        <div className="glass mx-auto max-w-md p-10 text-center">
          <div className="anim-spin-slow mx-auto h-14 w-14 rounded-full border-4 border-electric-500/20 border-t-electric-400" />
          <p className="mt-6 font-display font-bold text-white">
            Building {SECTION_PLANS[queue[queueIndex]]?.label}…
          </p>
          <p className="mt-2 text-sm text-slate-400">{progress.label}</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-electric-500 to-cyan-400 transition-all"
              style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Part {Math.min(progress.done + 1, progress.total)} of {progress.total} · generating &amp; verifying
          </p>
          <button type="button" onClick={cancelLoading} className="btn-ghost btn-sm mt-6">
            Cancel
          </button>
        </div>
      )}

      {/* ---------------- Active section ---------------- */}
      {phase === "active" && units && currentPlan && (
        <SectionRunner
          units={units}
          test={currentPlan.test}
          subjectLabel={currentPlan.label}
          durationSeconds={sectionSeconds}
          onExit={() => {
            if (window.confirm("Leave the exam? Progress won't be saved.")) navigate("/select");
          }}
          onComplete={handleSectionComplete}
        />
      )}

      {/* ---------------- Between sections (exam mode) ---------------- */}
      {phase === "break" && (
        <div className="anim-fade-up glass mx-auto max-w-md p-8 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
            <Check className="h-6 w-6" />
          </span>
          <h2 className="mt-4 font-display text-xl font-bold text-white">
            {results[results.length - 1]?.label} complete
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Score so far: {totalScore}/{totalQuestions} ({pct}%)
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Next: {SECTION_PLANS[queue[queueIndex + 1]]?.label}
          </p>
          <button type="button" onClick={nextSection} className="btn-primary mt-6">
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ---------------- Error ---------------- */}
      {phase === "error" && (
        <div className="anim-fade-up glass mx-auto max-w-md p-8 text-center">
          <h2 className="font-display text-xl font-bold text-white">Couldn't build the exam</h2>
          <p className="mt-2 text-sm text-slate-400">{error}</p>
          <div className="mt-6 flex justify-center gap-3">
            <button type="button" onClick={() => assemble(queue[queueIndex])} className="btn-primary">
              <RotateCcw className="h-4 w-4" /> Try again
            </button>
            <button type="button" onClick={() => setPhase("setup")} className="btn-ghost">
              Back to setup
            </button>
          </div>
        </div>
      )}

      {/* ---------------- Results ---------------- */}
      {phase === "done" && (
        <div className="anim-fade-up mx-auto max-w-xl text-center">
          <div className="glass p-8 sm:p-10">
            <p className="font-display text-xs font-bold tracking-widest text-electric-400 uppercase">
              {mode === "exam" ? "Full exam" : "Section"} complete
            </p>
            <p className="mt-3 font-display text-5xl font-extrabold text-white">{pct}%</p>
            <p className="mt-1 text-sm text-slate-400">
              {totalScore} of {totalQuestions} correct
            </p>

            <div className="mt-6 space-y-2 text-left">
              {results.map((r) => (
                <div
                  key={r.key}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <span className="text-sm font-semibold text-white">{r.label}</span>
                  <span className="text-sm text-slate-300">
                    {r.score}/{r.total} ·{" "}
                    {r.total ? Math.round((r.score / r.total) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button type="button" onClick={() => setPhase("setup")} className="btn-primary">
                <RotateCcw className="h-4 w-4" /> New exam
              </button>
              <Link to="/progress" className="btn-ghost">
                View progress <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
