import { useEffect, useRef, useState } from "react";

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Counts an integer up from 0 to `value` the first time it scrolls into view.
// Reduced-motion users see the final value immediately. Purely presentational.
export default function CountUp({
  value = 0,
  duration = 1100,
  className = "",
  prefix = "",
  suffix = "",
}) {
  const [n, setN] = useState(prefersReducedMotion ? value : 0);
  const ref = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion) {
      setN(value);
      return undefined;
    }
    const el = ref.current;
    let raf;
    let obs;
    const run = () => {
      const start = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
        setN(Math.round(value * eased));
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    // If it's already on screen, animate now; otherwise wait until it scrolls
    // in. (The immediate path also avoids relying on IO firing for in-view
    // elements, which can be flaky.)
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
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {n.toLocaleString()}
      {suffix}
    </span>
  );
}
