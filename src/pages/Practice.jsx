import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import TimerRing from "../components/TimerRing.jsx";
import PassageRunner from "../components/PassageRunner.jsx";
import { generatePassage, generateQuestions } from "../lib/claude.js";
import { getSamplePassage, getSampleQuestions } from "../lib/demoQuestions.js";
import {
  getApiKey,
  hasStoredKey,
  saveResult,
  setStoredKey,
} from "../lib/storage.js";
import {
  AlertTriangle,
  ArrowRight,
  Bolt,
  Check,
  ChevronRight,
  KeyIcon,
  RotateCcw,
  Sparkles,
  XIcon,
} from "../components/icons.jsx";

import { VALID_SUBJECTS, VALID_TESTS, isPassageMode } from "../lib/questionSpec.js";
import { authEnabled } from "../lib/supabase.js";
import { useAuth } from "../lib/useAuth.js";
import CalculatorWidget from "../components/CalculatorWidget.jsx";

const SECONDS_PER_QUESTION = 60;
const LETTERS = ["A", "B", "C", "D"];

const LOADING_MESSAGES = [
  "Drafting fresh questions…",
  "Calibrating difficulty…",
  "Sharpening the wrong answers…",
  "Writing explanations that teach…",
];

function LoadingScreen({ onCancel }) {
  const [msgIndex, setMsgIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length),
      1800,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="glass mx-auto max-w-md p-10 text-center">
      <div className="anim-spin-slow mx-auto h-14 w-14 rounded-full border-4 border-electric-500/20 border-t-electric-400" />
      <p className="mt-6 font-display font-bold text-white">{LOADING_MESSAGES[msgIndex]}</p>
      <p className="mt-2 text-sm text-slate-400">
        Claude is writing five questions just for this session.
      </p>
      <button type="button" onClick={onCancel} className="btn-ghost btn-sm mt-6">
        Cancel
      </button>
    </div>
  );
}

export default function Practice() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const test = params.get("test");
  const subject = params.get("subject");
  const valid = VALID_TESTS.includes(test) && VALID_SUBJECTS.includes(subject);
  const passageMode = valid && isPassageMode(test, subject);

  // "intro" | "loading" | "active" | "done" | "error"
  const [phase, setPhase] = useState("intro");
  const [source, setSource] = useState(null); // "ai" | "sample"
  const [questions, setQuestions] = useState([]);
  const [passageSet, setPassageSet] = useState(null); // passage-mode payload
  const [result, setResult] = useState(null); // { score, total } at completion
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [, setKeyVersion] = useState(0); // bump to re-read getApiKey()
  const abortRef = useRef(null);
  const savedRef = useRef(false);

  const { user, subscribed } = useAuth();
  const apiKey = getApiKey();
  // AI generation is available with a local key (dev), or in production via
  // the serverless proxy — gated to Pro subscribers once accounts are enabled.
  const aiAvailable =
    Boolean(apiKey) || (import.meta.env.PROD && (!authEnabled || subscribed));

  useEffect(() => {
    if (!valid) navigate("/select", { replace: true });
  }, [valid, navigate]);

  useEffect(() => {
    document.title = valid
      ? `PrepNova — ${test} ${subject} practice`
      : "PrepNova";
  }, [valid, test, subject]);

  // Abort any in-flight generation if the user navigates away.
  useEffect(() => () => abortRef.current?.abort(), []);

  const score = answers.filter((a) => a.correct).length;

  // Unified tally for the results screen. Passage mode reports its own
  // score/total via onComplete; the MCQ flow derives it from `answers`.
  const resultScore = passageMode ? (result?.score ?? 0) : score;
  const resultTotal = passageMode ? (result?.total ?? 0) : questions.length;

  // Persist the result exactly once when the session completes.
  useEffect(() => {
    if (phase !== "done" || savedRef.current || resultTotal === 0) return;
    savedRef.current = true;
    saveResult({ test, subject, score: resultScore, total: resultTotal, source });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (!valid) return null;

  function beginSession(qs, src) {
    setQuestions(qs);
    setSource(src);
    setAnswers([]);
    setCurrent(0);
    setSelected(null);
    setRevealed(false);
    setResult(null);
    savedRef.current = false;
    setPhase("active");
  }

  function beginPassageSession(set, src) {
    setPassageSet(set);
    setSource(src);
    setResult(null);
    savedRef.current = false;
    setPhase("active");
  }

  async function startAI() {
    setPhase("loading");
    setError("");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      if (passageMode) {
        const set = await generatePassage({
          test,
          subject,
          apiKey: getApiKey(),
          signal: controller.signal,
        });
        beginPassageSession(set, "ai");
      } else {
        const qs = await generateQuestions({
          test,
          subject,
          apiKey: getApiKey(),
          signal: controller.signal,
        });
        beginSession(qs, "ai");
      }
    } catch (e) {
      if (controller.signal.aborted) return;
      setError(e.message || "Something went wrong.");
      setPhase("error");
    }
  }

  function cancelLoading() {
    abortRef.current?.abort();
    setPhase("intro");
  }

  function startSample() {
    if (passageMode) {
      beginPassageSession(getSamplePassage(), "sample");
    } else {
      beginSession(getSampleQuestions(subject), "sample");
    }
  }

  function finishPassage({ score: s, total }) {
    setResult({ score: s, total });
    setPhase("done");
  }

  function saveKey() {
    setStoredKey(keyInput);
    setKeyInput("");
    setKeyVersion((v) => v + 1);
  }

  function removeKey() {
    setStoredKey("");
    setKeyVersion((v) => v + 1);
  }

  function answerQuestion(i) {
    if (revealed) return;
    setSelected(i);
    setRevealed(true);
    setAnswers((a) => [
      ...a,
      { selected: i, correct: i === questions[current].answerIndex, timedOut: false },
    ]);
  }

  function handleExpire() {
    if (revealed) return;
    setSelected(null);
    setRevealed(true);
    setAnswers((a) => [...a, { selected: null, correct: false, timedOut: true }]);
  }

  function next() {
    if (current + 1 >= questions.length) {
      setPhase("done");
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setRevealed(false);
    }
  }

  function endSession() {
    if (window.confirm("Leave this practice session? Progress won't be saved.")) {
      navigate("/select");
    }
  }

  const question = questions[current];

  return (
    <main className="container-pn pt-28 pb-20 sm:pt-36">
      {subject === "Math" && phase === "active" && <CalculatorWidget />}
      {/* ---------------- Intro ---------------- */}
      {phase === "intro" && (
        <div className="anim-fade-up mx-auto max-w-xl">
          <div className="glass p-7 sm:p-9">
            <span className="rounded-full border border-electric-400/30 bg-electric-500/10 px-3 py-1 text-xs font-semibold text-electric-300">
              {test} · {subject}
            </span>
            <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white">
              Ready to drill?
            </h1>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              {passageMode ? (
                <>
                  <li className="flex items-center gap-2.5">
                    <Bolt className="h-4 w-4 text-electric-400" /> A full passage
                    with underlined portions to fix — just like the real ACT
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Sparkles className="h-4 w-4 text-cyan-300" /> Answer each
                    underlined spot as you go; the passage stays pinned
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400" /> A detailed
                    explanation after every answer
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-2.5">
                    <Bolt className="h-4 w-4 text-electric-400" /> 5
                    multiple-choice questions written for this session
                  </li>
                  <li className="flex items-center gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-amber-400" /> 60
                    seconds per question — the clock starts immediately
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Sparkles className="h-4 w-4 text-cyan-300" /> A detailed
                    explanation after every answer
                  </li>
                </>
              )}
            </ul>

            <div className="mt-7 border-t border-white/10 pt-6">
              {apiKey ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-sm text-emerald-300">
                    <Check className="h-4 w-4" /> Claude API key ready
                  </p>
                  {hasStoredKey() && (
                    <button
                      type="button"
                      onClick={removeKey}
                      className="text-xs text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline"
                    >
                      Remove key
                    </button>
                  )}
                </div>
              ) : !import.meta.env.PROD ? (
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-white">
                    <KeyIcon className="h-4 w-4 text-electric-400" />
                    Add your Anthropic API key for AI questions
                  </p>
                  <div className="mt-3 flex gap-2">
                    <input
                      type="password"
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      placeholder="sk-ant-…"
                      aria-label="Anthropic API key"
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-electric-400/70 focus:ring-2 focus:ring-electric-500/30"
                    />
                    <button
                      type="button"
                      onClick={saveKey}
                      disabled={!keyInput.trim()}
                      className="btn-ghost btn-sm shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Save
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Stored only in this browser and sent only to Anthropic. No
                    key? Try the sample set below.
                  </p>
                </div>
              ) : !authEnabled ? (
                <p className="flex items-center gap-2 text-sm text-slate-400">
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  Questions are generated server-side — no API key needed.
                </p>
              ) : subscribed ? (
                <p className="flex items-center gap-2 text-sm text-emerald-300">
                  <Check className="h-4 w-4 shrink-0" /> PrepNova Pro active —
                  unlimited AI questions.
                </p>
              ) : user ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-sm text-slate-300">
                    <KeyIcon className="h-4 w-4 shrink-0 text-electric-400" />
                    AI questions are part of PrepNova Pro.
                  </p>
                  <Link to="/account" className="btn-ghost btn-sm">
                    Upgrade — $29/mo
                  </Link>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-sm text-slate-300">
                    <KeyIcon className="h-4 w-4 shrink-0 text-electric-400" />
                    Sign in to unlock AI-generated questions.
                  </p>
                  <Link to="/account" className="btn-ghost btn-sm">
                    Sign in
                  </Link>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={startAI}
                disabled={!aiAvailable}
                className={`btn-primary flex-1 ${!aiAvailable ? "cursor-not-allowed opacity-40" : ""}`}
              >
                <Bolt className="h-4 w-4" />
                {passageMode ? "Generate AI passage" : "Generate 5 AI questions"}
              </button>
              <button type="button" onClick={startSample} className="btn-ghost flex-1">
                Use sample set
              </button>
            </div>
          </div>

          <p className="mt-4 text-center text-sm text-slate-500">
            Wrong subject?{" "}
            <Link to="/select" className="text-electric-400 hover:underline">
              Change selection
            </Link>
          </p>
        </div>
      )}

      {/* ---------------- Loading ---------------- */}
      {phase === "loading" && <LoadingScreen onCancel={cancelLoading} />}

      {/* ---------------- Error ---------------- */}
      {phase === "error" && (
        <div className="anim-fade-up glass mx-auto max-w-md p-8 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-rose-500/15 text-rose-400">
            <AlertTriangle className="h-6 w-6" />
          </span>
          <h2 className="mt-4 font-display text-xl font-bold text-white">
            Couldn't generate questions
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">{error}</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" onClick={startAI} className="btn-primary">
              <RotateCcw className="h-4 w-4" />
              Try again
            </button>
            <button type="button" onClick={startSample} className="btn-ghost">
              Use sample set
            </button>
          </div>
          <button
            type="button"
            onClick={() => setPhase("intro")}
            className="mt-4 text-xs text-slate-500 hover:text-slate-300"
          >
            Back to setup
          </button>
        </div>
      )}

      {/* ---------------- Active: passage mode ---------------- */}
      {phase === "active" && passageMode && passageSet && (
        <PassageRunner
          passage={passageSet}
          test={test}
          subject={subject}
          source={source}
          onExit={endSession}
          onComplete={finishPassage}
        />
      )}

      {/* ---------------- Active question (MCQ mode) ---------------- */}
      {phase === "active" && !passageMode && question && (
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <button
                type="button"
                onClick={endSession}
                className="text-xs font-medium text-slate-500 hover:text-slate-300"
              >
                ← End session
              </button>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="rounded-full border border-electric-400/30 bg-electric-500/10 px-3 py-1 text-xs font-semibold text-electric-300">
                  {test} · {subject}
                </span>
                {source === "sample" && (
                  <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                    Sample set
                  </span>
                )}
              </div>
            </div>
            <TimerRing
              key={current}
              duration={SECONDS_PER_QUESTION}
              active={!revealed}
              onExpire={handleExpire}
            />
          </div>

          {/* Progress segments */}
          <div className="mt-5 flex gap-1.5" aria-label={`Question ${current + 1} of ${questions.length}`}>
            {questions.map((_, i) => {
              let cls = "bg-white/10";
              if (i < answers.length) {
                cls = answers[i].correct ? "bg-emerald-400" : "bg-rose-400";
              } else if (i === current) {
                cls = "bg-electric-400";
              }
              return <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${cls}`} />;
            })}
          </div>

          <div className="glass mt-5 p-6 sm:p-8">
            <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
              Question {current + 1} of {questions.length}
            </p>
            <p className="mt-3 leading-relaxed font-medium whitespace-pre-line text-white sm:text-lg">
              {question.question}
            </p>

            {revealed && answers[answers.length - 1]?.timedOut && (
              <p className="mt-4 flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0" /> Time's up — this
                one counts as missed.
              </p>
            )}

            <div className="mt-6 space-y-2.5">
              {question.choices.map((choice, i) => {
                const isCorrect = i === question.answerIndex;
                const isSelected = i === selected;
                let cls =
                  "border-white/10 bg-white/5 hover:border-electric-400/60 hover:bg-electric-500/10";
                if (revealed) {
                  if (isCorrect) cls = "border-emerald-400/70 bg-emerald-500/10";
                  else if (isSelected) cls = "border-rose-400/70 bg-rose-500/10";
                  else cls = "border-white/5 bg-white/[0.02] opacity-60";
                }
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => answerQuestion(i)}
                    disabled={revealed}
                    className={`flex w-full items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left text-sm transition-all duration-150 sm:text-base ${cls}`}
                  >
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg font-display text-xs font-bold ${
                        revealed && isCorrect
                          ? "bg-emerald-400 text-navy-950"
                          : revealed && isSelected
                            ? "bg-rose-400 text-navy-950"
                            : "bg-white/10 text-slate-300"
                      }`}
                    >
                      {LETTERS[i]}
                    </span>
                    <span className="text-slate-200">{choice}</span>
                    {revealed && isCorrect && (
                      <Check className="ml-auto h-5 w-5 shrink-0 text-emerald-400" />
                    )}
                    {revealed && isSelected && !isCorrect && (
                      <XIcon className="ml-auto h-5 w-5 shrink-0 text-rose-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {revealed && (
              <div className="anim-fade-up mt-6 rounded-xl border-l-2 border-electric-400 bg-electric-500/5 p-5">
                <p className="flex items-center gap-2 font-display text-xs font-bold tracking-widest text-electric-300 uppercase">
                  <Sparkles className="h-3.5 w-3.5" /> Explanation
                </p>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-300">
                  {question.explanation}
                </p>
                <button type="button" onClick={next} className="btn-primary mt-5">
                  {current + 1 >= questions.length ? "See results" : "Next question"}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- Results ---------------- */}
      {phase === "done" && (
        <div className="anim-fade-up mx-auto max-w-xl text-center">
          <div className="glass p-8 sm:p-10">
            <div className="relative mx-auto h-36 w-36">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="9" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="url(#scoreGrad)"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 52}
                  strokeDashoffset={2 * Math.PI * 52 * (1 - resultScore / resultTotal)}
                  style={{ transition: "stroke-dashoffset 1s ease" }}
                />
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <div>
                  <p className="font-display text-4xl font-extrabold text-white">
                    {Math.round((resultScore / resultTotal) * 100)}%
                  </p>
                  <p className="text-xs text-slate-400">
                    {resultScore}/{resultTotal} correct
                  </p>
                </div>
              </div>
            </div>

            <h2 className="mt-6 font-display text-2xl font-extrabold text-white">
              {resultScore === resultTotal
                ? "Perfect run."
                : resultScore / resultTotal >= 0.8
                  ? "Elevated indeed."
                  : resultScore / resultTotal >= 0.6
                    ? "Solid — keep climbing."
                    : "Every rep counts. Run it back."}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {test} {subject} · saved to your progress tracker
              {source === "sample" ? " · sample set" : ""}
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => (source === "ai" ? startAI() : startSample())}
                className="btn-primary"
              >
                <RotateCcw className="h-4 w-4" />
                New questions
              </button>
              <Link to="/select" className="btn-ghost">
                Change subject
              </Link>
              <Link to="/progress" className="btn-ghost">
                View progress
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
