import { useEffect, useRef, useState } from "react";
import { Clock } from "./icons.jsx";
import PassageRunner from "./PassageRunner.jsx";
import ReadingRunner from "./ReadingRunner.jsx";
import WritingRunner from "./WritingRunner.jsx";
import McqRunner from "./McqRunner.jsx";

function formatClock(seconds) {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

/**
 * Runs a full-length section: a sequence of units (passage / reading / writing
 * / mcq), each rendered by its runner, under ONE countdown timer with combined
 * scoring. When the timer expires, the section ends with whatever has been
 * completed so far.
 *
 * Props:
 *  - units: [{ kind, payload, verified }]
 *  - test, subjectLabel, durationSeconds
 *  - onExit(), onComplete({ score, total, answered })
 */
export default function SectionRunner({
  units,
  test,
  subjectLabel,
  durationSeconds,
  onExit,
  onComplete,
}) {
  const [unitIndex, setUnitIndex] = useState(0);
  const [remaining, setRemaining] = useState(durationSeconds);
  const resultsRef = useRef([]); // accumulated { score, total } per finished unit
  const finishedRef = useRef(false);

  function finishAll() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const score = resultsRef.current.reduce((a, r) => a + r.score, 0);
    const total = units.reduce((a, u) => a + (u.payload.questions?.length ?? 0), 0);
    const answered = resultsRef.current.reduce((a, r) => a + r.total, 0);
    onComplete({ score, total, answered });
  }

  // Countdown.
  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          finishAll();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleUnitDone(res) {
    resultsRef.current = [...resultsRef.current, res];
    if (unitIndex + 1 < units.length) {
      setUnitIndex((i) => i + 1);
    } else {
      finishAll();
    }
  }

  const unit = units[unitIndex];
  const low = remaining <= 300; // under 5 minutes
  const shared = {
    test,
    source: "ai",
    verified: unit.verified,
    hideTimer: true,
    onExit,
    onComplete: handleUnitDone,
  };

  return (
    <div>
      {/* Section bar: countdown + part progress */}
      <div className="mx-auto mb-5 flex max-w-6xl items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3">
        <div>
          <p className="font-display text-sm font-bold text-white">{subjectLabel}</p>
          <p className="text-xs text-slate-400">
            Part {unitIndex + 1} of {units.length} · full section
          </p>
        </div>
        <div
          className={`flex items-center gap-2 rounded-full border px-4 py-2 font-display text-base font-bold ${
            low
              ? "border-rose-400/40 bg-rose-500/10 text-rose-300"
              : "border-electric-400/30 bg-electric-500/10 text-electric-200"
          }`}
        >
          <Clock className="h-4 w-4" />
          {formatClock(remaining)}
        </div>
      </div>

      {/* Current unit — keyed so each part starts fresh */}
      <div key={unitIndex}>
        {unit.kind === "passage" && (
          <PassageRunner passage={unit.payload} subject="English" {...shared} />
        )}
        {unit.kind === "reading" && <ReadingRunner reading={unit.payload} {...shared} />}
        {unit.kind === "writing" && <WritingRunner writing={unit.payload} {...shared} />}
        {unit.kind === "mcq" && (
          <McqRunner
            questions={unit.payload.questions}
            subjectLabel={subjectLabel.replace(`${test} `, "")}
            {...shared}
          />
        )}
      </div>
    </div>
  );
}
