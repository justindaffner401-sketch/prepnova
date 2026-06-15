import { useEffect, useMemo, useState } from "react";

// Subject-themed symbols that stream past you as you "fly in".
const TOKENS = {
  Math: ["3x+5", "π", "√2", "x²", "∫", "Σ", "90°", "f(x)", "÷", "≠", "½", "y=mx+b", "∞", "θ"],
  English: ["Aa", ";", "—", "?", "“ ”", "its / it's", "¶", "!", ":", "Bb", "verb", "—"],
  Reading: ["“…”", "theme", "infer", "tone", "main idea", "?", "—", "evidence", "Aa", "context"],
  Science: ["H₂O", "→", "CO₂", "°C", "g/L", "↑", "↓", "pH", "O₂", "△", "data", "cells"],
};

const COUNT = 42;
const PALETTE = ["#60a5fa", "#22d3ee", "#34d399", "#fbbf24", "#fb7185", "#a78bfa", "#f472b6"];

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
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      angle: Math.round(Math.random() * 360),
      dist: 220 + Math.round(Math.random() * 460),
      delay: (Math.random() * 3.4).toFixed(2),
      size: (0.8 + Math.random() * 1.6).toFixed(2),
    }));
  }, [subject]);

  useEffect(() => {
    if (reduced) {
      const id = setTimeout(onDone, 250);
      return () => clearTimeout(id);
    }
    const zoomTimer = setTimeout(() => setZoom(true), 4350);
    const doneTimer = setTimeout(onDone, 4900);
    return () => {
      clearTimeout(zoomTimer);
      clearTimeout(doneTimer);
    };
  }, [reduced, onDone]);

  return (
    <div className={`portal-overlay ${zoom ? "portal-zoom" : ""}`} role="presentation">
      <div className="portal-vortex" />
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
              "--c": tk.color,
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
