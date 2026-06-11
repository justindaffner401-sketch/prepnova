import { useEffect, useRef, useState } from "react";

/**
 * Circular countdown timer. Mount with a fresh `key` per question so the
 * clock resets. `active=false` freezes the remaining time (e.g. once the
 * question is answered).
 */
export default function TimerRing({ duration = 60, active = true, onExpire, size = 76 }) {
  const [remaining, setRemaining] = useState(duration);
  const endRef = useRef(null);
  const firedRef = useRef(false);
  const expireRef = useRef(onExpire);
  expireRef.current = onExpire;

  useEffect(() => {
    if (!active) return undefined;
    if (endRef.current === null) {
      endRef.current = Date.now() + duration * 1000;
    }

    const id = setInterval(() => {
      const left = Math.max(0, (endRef.current - Date.now()) / 1000);
      setRemaining(left);
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        clearInterval(id);
        expireRef.current?.();
      }
    }, 100);

    return () => clearInterval(id);
  }, [active, duration]);

  const secs = Math.ceil(remaining);
  const frac = Math.max(0, Math.min(1, remaining / duration));
  const stroke = 6;
  const r = (size - stroke - 4) / 2;
  const circumference = 2 * Math.PI * r;
  const color = secs > 20 ? "#3b82f6" : secs > 10 ? "#f59e0b" : "#ef4444";

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="timer"
      aria-label={`${secs} seconds remaining`}
    >
      <svg width={size} height={size} className={secs <= 10 && active ? "animate-pulse" : ""}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - frac)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.15s linear, stroke 0.3s ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-display text-xl font-bold tabular-nums" style={{ color }}>
          {secs}
        </span>
      </div>
    </div>
  );
}
