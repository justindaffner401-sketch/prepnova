import { useEffect, useState } from "react";
import { Check, ChevronRight, Clock, Sparkles, XIcon } from "./icons.jsx";
import MathFigure from "./MathFigure.jsx";

const LETTERS = ["A", "B", "C", "D", "E"];

function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * A flat list of standalone multiple-choice questions, one per screen — used by
 * section/exam mode for Math and Science. Each question may carry a `figure`.
 *
 * Props:
 *  - questions: [{ question, choices:[string], answerIndex, explanation, figure? }]
 *  - test, subjectLabel: header chips
 *  - source, verified, hideTimer
 *  - onExit(), onComplete({ score, total })
 */
export default function McqRunner({
  questions,
  test,
  subjectLabel,
  source,
  verified,
  hideTimer,
  onExit,
  onComplete,
}) {
  const total = questions.length;
  const [answers, setAnswers] = useState(() => Array(total).fill(null));
  const [current, setCurrent] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (hideTimer) return undefined;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [hideTimer]);

  const question = questions[current];
  const answered = answers[current];
  const revealed = answered !== null;
  const answeredCount = answers.filter((a) => a !== null).length;
  const score = answers.filter((a) => a?.correct).length;

  function selectChoice(i) {
    if (revealed) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[current] = { selected: i, correct: i === question.answerIndex };
      return next;
    });
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
    <div className="mx-auto max-w-2xl">
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
              {test} · {subjectLabel}
            </span>
            {source === "sample" && (
              <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                Sample set
              </span>
            )}
            {verified && (
              <span className="flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                <Check className="h-3 w-3" /> AI-verified
              </span>
            )}
          </div>
        </div>
        {!hideTimer && (
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 font-display text-sm font-semibold text-slate-300">
            <Clock className="h-4 w-4 text-slate-400" />
            {formatElapsed(elapsed)}
          </div>
        )}
      </div>

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

      <div className="glass mt-5 p-6 sm:p-8">
        <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
          Question {current + 1} of {total}
        </p>
        <p className="mt-3 leading-relaxed font-medium whitespace-pre-line text-white sm:text-lg">
          {question.question}
        </p>

        {question.figure && (
          <div className="mt-4">
            <MathFigure figure={question.figure} />
          </div>
        )}

        <div className="mt-6 space-y-2.5">
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
            <p className="mt-2.5 text-sm leading-relaxed text-slate-300">{question.explanation}</p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-5">
          <p className="text-xs text-slate-500">
            {answeredCount} of {total} answered
          </p>
          {current + 1 < total ? (
            <button
              type="button"
              onClick={() => setCurrent((c) => Math.min(c + 1, total - 1))}
              className="btn-primary btn-sm"
            >
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
      </div>
    </div>
  );
}
