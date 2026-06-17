import { useEffect, useRef, useState } from "react";

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Color band by score: cyan/blue (brand) by default, with red/amber/emerald
// accents so a weak vs. strong score reads at a glance.
function colors(value) {
  if (value >= 80) return ["#34d399", "#22d3ee"]; // strong
  if (value >= 60) return ["#3b82f6", "#22d3ee"]; // solid (brand)
  return ["#fb7185", "#f59e0b"]; // needs work
}

// Animated circular score ring (count-up + arc fill) that runs the first time
// it scrolls into view. The SVG is decorative; an aria-label carries the value.
export default function ScoreRing({
  value = 0,
  label,
  sublabel,
  size = 132,
  stroke = 10,
  id = "ring",
}) {
  const target = Math.max(0, Math.min(100, Math.round(value)));
  const [shown, setShown] = useState(prefersReducedMotion ? target : 0);
  const ref = useRef(null);
  const [from, to] = colors(target);

  useEffect(() => {
    if (prefersReducedMotion) {
      setShown(target);
      return undefined;
    }
    const el = ref.current;
    let raf;
    let obs;
    const run = () => {
      const start = performance.now();
      const dur = 1100;
      const step = (now) => {
        const t = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - t, 3);
        setShown(Math.round(target * eased));
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    // Animate immediately if already on screen; otherwise wait for scroll-in.
    const rect = el?.getBoundingClientRect();
    const inView = el && rect.top < window.innerHeight && rect.bottom > 0;
    if (inView || typeof IntersectionObserver === "undefined" || !el) {
      run();
    } else {
      obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            run();
            obs.disconnect();
          }
        },
        { threshold: 0.4 },
      );
      obs.observe(el);
    }
    return () => {
      cancelAnimationFrame(raf);
      obs?.disconnect();
    };
  }, [target]);

  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (shown / 100) * circ;
  const gid = `${id}-grad`;

  return (
    <div
      ref={ref}
      className="flex flex-col items-center"
      role="img"
      aria-label={label ? `${label}: ${target}%` : `${target}%`}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={from} />
              <stop offset="100%" stopColor={to} />
            </linearGradient>
          </defs>
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
            stroke={`url(#${gid})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <span className="font-display text-3xl font-extrabold text-white">{shown}%</span>
        </div>
      </div>
      {label && <p className="mt-3 text-sm font-semibold text-white">{label}</p>}
      {sublabel && <p className="text-xs text-slate-500">{sublabel}</p>}
    </div>
  );
}
