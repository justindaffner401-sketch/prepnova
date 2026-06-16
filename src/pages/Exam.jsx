import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SectionRunner from "../components/SectionRunner.jsx";
import { assembleSection } from "../lib/section.js";
import { SECTION_PLANS, EXAM_SECTIONS } from "../lib/sectionPlans.js";
import { getApiKey, saveResult } from "../lib/storage.js";
import { authEnabled } from "../lib/supabase.js";
import { useAuth } from "../lib/useAuth.js";
import { setFocusMode } from "../lib/focusMode.js";
import { ArrowRight, Bolt, Check, Clock, RotateCcw, Sparkles } from "../components/icons.jsx";

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

  const [prebuilt, setPrebuilt] = useState([]); // manifest summaries
  const [runQueue, setRunQueue] = useState([]); // [{ planKey, label, test, minutes, units|null }]
  const [queueIndex, setQueueIndex] = useState(0);
  const [units, setUnits] = useState(null);
  const [runLabel, setRunLabel] = useState(""); // "ACT Practice Exam 1" or section label
  const [progress, setProgress] = useState({ done: 0, total: 1, label: "" });
  const [results, setResults] = useState([]); // { key, label, score, total }
  const [error, setError] = useState("");
  const abortRef = useRef(null);

  useEffect(() => {
    document.title = "PrepNova — Full-length exam";
  }, []);
  useEffect(() => () => abortRef.current?.abort(), []);

  // Freeze the 3D background through a running exam (including the between-
  // section break, so it doesn't pop in and out) — only "setup"/"done" show it.
  useEffect(() => {
    setFocusMode(phase === "active" || phase === "break");
    return () => setFocusMode(false);
  }, [phase]);

  // Load the prebuilt-exam library (static).
  useEffect(() => {
    fetch("/exams/index.json")
      .then((r) => (r.ok ? r.json() : { exams: [] }))
      .then((d) => setPrebuilt(Array.isArray(d?.exams) ? d.exams : []))
      .catch(() => setPrebuilt([]));
  }, []);

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

  const current = runQueue[queueIndex] || null;
  const durationSeconds = current ? Math.max(1, current.minutes) * 60 : 60;

  async function assemble(planKey) {
    setPhase("loading");
    setError("");
    setProgress({ done: 0, total: SECTION_PLANS[planKey].units.length, label: "Starting…" });
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const built = await assembleSection(planKey, {
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

  // Begin running a queue from index 0.
  function beginQueue(queue, label) {
    setRunQueue(queue);
    setRunLabel(label);
    setQueueIndex(0);
    setResults([]);
    enterItem(queue, 0);
  }

  function enterItem(queue, idx) {
    const item = queue[idx];
    if (item.units) {
      setUnits(item.units);
      setPhase("active");
    } else {
      assemble(item.planKey);
    }
  }

  function startSectionRun() {
    const plan = SECTION_PLANS[sectionKey];
    beginQueue([{ planKey: sectionKey, label: plan.label, test: plan.test, minutes, units: null }], plan.label);
  }
  function startExamRun() {
    const queue = EXAM_SECTIONS[test].map((k) => ({
      planKey: k,
      label: SECTION_PLANS[k].label,
      test,
      minutes: SECTION_PLANS[k].minutes,
      units: null,
    }));
    beginQueue(queue, `${test} full exam`);
  }
  async function startPrebuilt(summary) {
    setPhase("loading");
    setProgress({ done: 0, total: 1, label: "Loading exam…" });
    try {
      const res = await fetch(`/exams/${summary.id}.json`);
      if (!res.ok) throw new Error("Couldn't load that exam.");
      const exam = await res.json();
      const queue = exam.sections.map((s) => ({
        planKey: s.planKey,
        label: s.label,
        test: exam.test,
        minutes: s.minutes,
        units: s.units,
      }));
      beginQueue(queue, exam.label);
    } catch (e) {
      setError(e.message || "Couldn't load that exam.");
      setPhase("error");
    }
  }

  function handleSectionComplete({ score, total }) {
    const item = runQueue[queueIndex];
    saveResult({
      test: item.test,
      subject: SECTION_PLANS[item.planKey].subject,
      score,
      total,
      source: "exam",
    });
    setResults((r) => [...r, { key: item.planKey, label: item.label, score, total }]);
    if (queueIndex + 1 < runQueue.length) setPhase("break");
    else setPhase("done");
  }

  function nextSection() {
    const next = queueIndex + 1;
    setQueueIndex(next);
    enterItem(runQueue, next);
  }

  function cancelLoading() {
    abortRef.current?.abort();
    setPhase("setup");
  }

  const totalScore = results.reduce((a, r) => a + r.score, 0);
  const totalQuestions = results.reduce((a, r) => a + r.total, 0);
  const pct = totalQuestions ? Math.round((totalScore / totalQuestions) * 100) : 0;
  const prebuiltForTest = prebuilt.filter((e) => e.test === test);

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
            A ready-made full exam that loads instantly — or generate a section fresh, on a clock you choose.
          </p>

          {/* Test */}
          <div className="glass mt-6 p-6 sm:p-7">
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

            {/* Prebuilt library */}
            {prebuiltForTest.length > 0 && (
              <div className="mt-6">
                <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-emerald-300 uppercase">
                  <Sparkles className="h-3.5 w-3.5" /> Ready-made exams · instant
                </p>
                <div className="mt-2 grid gap-2">
                  {prebuiltForTest.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => startPrebuilt(e)}
                      disabled={!aiAvailable}
                      className={`flex items-center justify-between rounded-xl border border-emerald-400/30 bg-emerald-500/[0.06] px-4 py-3 text-left transition hover:border-emerald-400/60 ${
                        aiAvailable ? "" : "cursor-not-allowed opacity-50"
                      }`}
                    >
                      <div>
                        <p className="font-display text-sm font-bold text-white">{e.label}</p>
                        <p className="text-xs text-slate-400">
                          {e.sections.length} sections ·{" "}
                          {e.sections.reduce((a, s) => a + (s.questions || 0), 0)} questions
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-emerald-300" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Generate fresh */}
            <p className="mt-6 text-xs font-semibold tracking-widest text-slate-500 uppercase">
              Or generate fresh
            </p>
            <div className="mt-2 flex gap-2">
              {[
                ["section", "One section"],
                ["exam", "Full exam"],
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

            {mode === "section" && (
              <>
                <div className="mt-3 grid grid-cols-2 gap-2">
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

                <p className="mt-4 text-xs font-semibold tracking-widest text-slate-500 uppercase">
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

            <div className="mt-6 border-t border-white/10 pt-5">
              {aiAvailable ? (
                <button
                  type="button"
                  onClick={mode === "exam" ? startExamRun : startSectionRun}
                  className="btn-primary w-full"
                >
                  <Bolt className="h-4 w-4" />
                  {mode === "exam" ? "Generate full exam" : "Generate section"}
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

      {/* ---------------- Loading ---------------- */}
      {phase === "loading" && (
        <div className="glass mx-auto max-w-md p-10 text-center">
          <div className="anim-spin-slow mx-auto h-14 w-14 rounded-full border-4 border-electric-500/20 border-t-electric-400" />
          <p className="mt-6 font-display font-bold text-white">{progress.label || "Loading…"}</p>
          {progress.total > 1 && (
            <>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-electric-500 to-cyan-400 transition-all"
                  style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Part {Math.min(progress.done + 1, progress.total)} of {progress.total} · generating &amp; verifying
              </p>
            </>
          )}
          <button type="button" onClick={cancelLoading} className="btn-ghost btn-sm mt-6">
            Cancel
          </button>
        </div>
      )}

      {/* ---------------- Active section ---------------- */}
      {phase === "active" && units && current && (
        <SectionRunner
          units={units}
          test={current.test}
          subjectLabel={current.label}
          durationSeconds={durationSeconds}
          onExit={() => {
            if (window.confirm("Leave the exam? Progress won't be saved.")) navigate("/select");
          }}
          onComplete={handleSectionComplete}
        />
      )}

      {/* ---------------- Between sections ---------------- */}
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
          <p className="mt-1 text-xs text-slate-500">Next: {runQueue[queueIndex + 1]?.label}</p>
          <button type="button" onClick={nextSection} className="btn-primary mt-6">
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ---------------- Error ---------------- */}
      {phase === "error" && (
        <div className="anim-fade-up glass mx-auto max-w-md p-8 text-center">
          <h2 className="font-display text-xl font-bold text-white">Something went wrong</h2>
          <p className="mt-2 text-sm text-slate-400">{error}</p>
          <button type="button" onClick={() => setPhase("setup")} className="btn-primary mt-6">
            <RotateCcw className="h-4 w-4" /> Back to setup
          </button>
        </div>
      )}

      {/* ---------------- Results ---------------- */}
      {phase === "done" && (
        <div className="anim-fade-up mx-auto max-w-xl text-center">
          <div className="glass p-8 sm:p-10">
            <p className="font-display text-xs font-bold tracking-widest text-electric-400 uppercase">
              {runLabel} complete
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
                    {r.score}/{r.total} · {r.total ? Math.round((r.score / r.total) * 100) : 0}%
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
