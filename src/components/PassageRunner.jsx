import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  PenLine,
  Sparkles,
  XIcon,
} from "./icons.jsx";

const LETTERS = ["A", "B", "C", "D"];

function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Exam-replica runner for a single passage + its grouped questions
 * (ACT English, slice 1). The passage stays pinned while the student answers
 * each underlined portion as they go.
 *
 * Props:
 *  - passage:    { title, segments:[{text, underline, ref}], questions:[{ref, prompt, choices:[string], answerIndex, explanation}] }
 *  - test, subject: labels for the header chip
 *  - source:     "ai" | "sample"
 *  - onExit():   leave the session without scoring
 *  - onComplete({ score, total }): finish and record the result
 */
export default function PassageRunner({ passage, test, subject, source, onExit, onComplete }) {
  const { title, segments, questions } = passage;
  const total = questions.length;

  // One slot per question: null until answered, then { selected, correct }.
  const [answers, setAnswers] = useState(() => Array(total).fill(null));
  const [current, setCurrent] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // Count-up timer — the real section is timed, but a single-passage drill
  // shouldn't auto-fail the student, so this only measures, never expires.
  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Map an underline ref to its question index so clicking a span navigates.
  const refToIndex = useMemo(() => {
    const m = new Map();
    questions.forEach((q, i) => m.set(q.ref, i));
    return m;
  }, [questions]);

  const question = questions[current];
  const answered = answers[current];
  const revealed = answered !== null;
  const answeredCount = answers.filter((a) => a !== null).length;
  const score = answers.filter((a) => a?.correct).length;
  const activeRef = question.ref;

  function selectChoice(i) {
    if (revealed) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[current] = { selected: i, correct: i === question.answerIndex };
      return next;
    });
  }

  function goToRef(ref) {
    const i = refToIndex.get(ref);
    if (i !== undefined) setCurrent(i);
  }

  function goNext() {
    setCurrent((c) => Math.min(c + 1, total - 1));
  }

  function finish() {
    if (
      answeredCount < total &&
      !window.confirm(
        `You've answered ${answeredCount} of ${total}. Finish and see your score anyway?`,
      )
    ) {
      return;
    }
    onComplete({ score, total });
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onExit}
            className="text-xs font-medium text-slate-500 hover:text-slate-300"
          >
            ← End session
          </button>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-electric-400/30 bg-electric-500/10 px-3 py-1 text-xs font-semibold text-electric-300">
              {test} · {subject}
            </span>
            <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
              Passage
            </span>
            {source === "sample" && (
              <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                Sample set
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 font-display text-sm font-semibold text-slate-300">
          <Clock className="h-4 w-4 text-slate-400" />
          {formatElapsed(elapsed)}
        </div>
      </div>

      {/* Progress segments */}
      <div className="mt-5 flex gap-1.5" aria-label={`Question ${current + 1} of ${total}`}>
        {questions.map((q, i) => {
          let cls = "bg-white/10";
          if (answers[i]) cls = answers[i].correct ? "bg-emerald-400" : "bg-rose-400";
          if (i === current) cls += " ring-2 ring-electric-400/60 ring-offset-1 ring-offset-navy-950";
          return (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`Go to question ${i + 1}`}
              className={`h-1.5 flex-1 rounded-full transition-colors ${cls}`}
            />
          );
        })}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        {/* ---------------- Passage (pinned) ---------------- */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="glass max-h-[70vh] overflow-y-auto p-6 sm:p-7">
            <p className="flex items-center gap-2 font-display text-xs font-bold tracking-widest text-cyan-300 uppercase">
              <BookOpen className="h-3.5 w-3.5" />
              {title || "Reading Passage"}
            </p>
            <p className="mt-4 leading-loose whitespace-pre-line text-slate-200">
              {segments.map((seg, i) => {
                if (!seg.underline) return <span key={i}>{seg.text}</span>;
                const ans = answers[refToIndex.get(seg.ref)];
                const isActive = seg.ref === activeRef;
                let cls =
                  "underline decoration-electric-400/60 decoration-2 underline-offset-4 hover:bg-electric-500/10";
                if (ans) {
                  cls = ans.correct
                    ? "underline decoration-emerald-400/70 decoration-2 underline-offset-4 bg-emerald-500/10"
                    : "underline decoration-rose-400/70 decoration-2 underline-offset-4 bg-rose-500/10";
                }
                if (isActive) cls += " bg-electric-500/20 ring-1 ring-electric-400/50";
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => goToRef(seg.ref)}
                    className={`rounded px-0.5 text-white transition-colors ${cls}`}
                  >
                    {seg.text}
                    <sup className="ml-0.5 font-display text-[0.6rem] font-bold text-electric-300">
                      {seg.ref}
                    </sup>
                  </button>
                );
              })}
            </p>
          </div>
        </div>

        {/* ---------------- Question panel ---------------- */}
        <div className="glass p-6 sm:p-7">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
              Question {current + 1} of {total}
            </p>
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-electric-500/15 font-display text-xs font-bold text-electric-300">
              {question.ref}
            </span>
          </div>

          {question.prompt ? (
            <p className="mt-3 leading-relaxed font-medium text-white sm:text-lg">
              {question.prompt}
            </p>
          ) : (
            <p className="mt-3 flex items-center gap-2 text-sm text-slate-400">
              <PenLine className="h-4 w-4 shrink-0 text-electric-400" />
              Choose the best version of underlined portion{" "}
              <span className="font-semibold text-electric-300">{question.ref}</span>.
            </p>
          )}

          <div className="mt-5 space-y-2.5">
            {question.choices.map((choice, i) => {
              const isCorrect = i === question.answerIndex;
              const isSelected = answered?.selected === i;
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
                  onClick={() => selectChoice(i)}
                  disabled={revealed}
                  className={`flex w-full items-center gap-3.5 rounded-xl border px-4 py-3 text-left text-sm transition-all duration-150 ${cls}`}
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
            <div className="anim-fade-up mt-5 rounded-xl border-l-2 border-electric-400 bg-electric-500/5 p-5">
              <p className="flex items-center gap-2 font-display text-xs font-bold tracking-widest text-electric-300 uppercase">
                <Sparkles className="h-3.5 w-3.5" /> Explanation
              </p>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-300">
                {question.explanation}
              </p>
            </div>
          )}

          {/* Footer nav */}
          <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-5">
            <p className="text-xs text-slate-500">
              {answeredCount} of {total} answered
            </p>
            {current + 1 < total ? (
              <button type="button" onClick={goNext} className="btn-primary btn-sm">
                Next question
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button type="button" onClick={finish} className="btn-primary btn-sm">
                Finish & see score
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
          {current + 1 < total && answeredCount === total && (
            <button
              type="button"
              onClick={finish}
              className="mt-3 w-full text-center text-xs font-semibold text-electric-300 hover:text-electric-200"
            >
              All answered — finish & see score
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
