import { useEffect, useMemo, useState } from "react";

// Subject-themed symbols that stream past you as you "fly in".
const TOKENS = {
  Math: ["3x+5", "π", "√2", "x²", "∫", "Σ", "90°", "f(x)", "÷", "≠", "½", "y=mx+b", "∞", "θ"],
  English: ["Aa", ";", "—", "?", "“ ”", "its / it's", "¶", "!", ":", "Bb", "verb", "—"],
  Reading: ["“…”", "theme", "infer", "tone", "main idea", "?", "—", "evidence", "Aa", "context"],
  Science: ["H₂O", "→", "CO₂", "°C", "g/L", "↑", "↓", "pH", "O₂", "△", "data", "cells"],
};

const COUNT = 30;

export default function PortalTransition({ test, subject, onDone }) {
  const [zoom, setZoom] = useState(false);
  const reduced = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const tokens = useMemo(() => {
    const set = TOKENS[subject] ?? TOKENS.Math;
    return Array.from({ length: COUNT }, (_, i) => ({
      id: i,
      text: set[i % set.length],
      angle: Math.round(Math.random() * 360),
      dist: 220 + Math.round(Math.random() * 420),
      delay: (Math.random() * 1.1).toFixed(2),
      size: (0.8 + Math.random() * 1.5).toFixed(2),
    }));
  }, [subject]);

  useEffect(() => {
    if (reduced) {
      const id = setTimeout(onDone, 250);
      return () => clearTimeout(id);
    }
    const zoomTimer = setTimeout(() => setZoom(true), 1350);
    const doneTimer = setTimeout(onDone, 1850);
    return () => {
      clearTimeout(zoomTimer);
      clearTimeout(doneTimer);
    };
  }, [reduced, onDone]);

  return (
    <div className={`portal-overlay ${zoom ? "portal-zoom" : ""}`} role="presentation">
      <div className="portal-glow" />
      <div className="portal-ring portal-ring-1" />
      <div className="portal-ring portal-ring-2" />
      <div className="portal-ring portal-ring-3" />

      <div className="portal-field" aria-hidden="true">
        {tokens.map((tk) => (
          <span
            key={tk.id}
            className="portal-token"
            style={{
              "--angle": `${tk.angle}deg`,
              "--dist": `${tk.dist}px`,
              "--delay": `${tk.delay}s`,
              fontSize: `${tk.size}rem`,
            }}
          >
            <span className="portal-token-inner">{tk.text}</span>
          </span>
        ))}
      </div>

      <div className="portal-label">
        <span className="portal-label-test">{test}</span>
        <span className="portal-label-sub">{subject}</span>
      </div>
    </div>
  );
}
