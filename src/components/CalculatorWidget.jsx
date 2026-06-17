import { useEffect, useRef, useState } from "react";
import { Calculator as CalcIcon, XIcon } from "./icons.jsx";

// Desmos's public demo key works on any domain. Swap in your own free
// production key (request at desmos.com/api) via VITE_DESMOS_API_KEY — no code
// change needed.
const DESMOS_KEY =
  import.meta.env.VITE_DESMOS_API_KEY || "dcb31709b452b1cf9dc26972add0fda6";
const DESMOS_SRC = `https://www.desmos.com/api/v1.11/calculator.js?apiKey=${DESMOS_KEY}`;

let desmosPromise = null;
function loadDesmos() {
  if (typeof window !== "undefined" && window.Desmos) return Promise.resolve();
  if (desmosPromise) return desmosPromise;
  desmosPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = DESMOS_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      desmosPromise = null; // allow a retry on the next open
      reject(new Error("Failed to load Desmos"));
    };
    document.head.appendChild(s);
  });
  return desmosPromise;
}

/**
 * Floating Desmos graphing calculator. Lazy-loads the Desmos script on first
 * open; the instance persists across open/close so the student's work is kept.
 */
export default function CalculatorWidget() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const mountRef = useRef(null);
  const calcRef = useRef(null);

  // Lazy-load Desmos the first time the panel opens.
  useEffect(() => {
    if (!open || status === "ready" || status === "loading") return;
    setStatus("loading");
    loadDesmos().then(
      () => setStatus("ready"),
      () => setStatus("error"),
    );
  }, [open, status]);

  // Mount the calculator once the script is ready. Wrapped in try/catch so a
  // Desmos init failure (e.g. a strict CSP blocking its eval/worker) shows the
  // widget's own error state instead of throwing and blanking the whole app.
  useEffect(() => {
    if (status !== "ready" || !mountRef.current || calcRef.current || !window.Desmos) return;
    try {
      calcRef.current = window.Desmos.GraphingCalculator(mountRef.current, {
        border: false,
        lockViewport: false,
      });
    } catch (err) {
      console.error("Desmos init failed:", err);
      setStatus("error");
    }
  }, [status]);

  // Destroy only when leaving Math practice (the widget unmounts).
  useEffect(() => {
    return () => {
      calcRef.current?.destroy();
      calcRef.current = null;
    };
  }, []);

  // Desmos needs a resize nudge after the panel was hidden.
  useEffect(() => {
    if (!open || !calcRef.current) return undefined;
    const id = setTimeout(() => calcRef.current?.resize(), 60);
    return () => clearTimeout(id);
  }, [open]);

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed right-5 bottom-5 z-40 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-electric-500 to-cyan-400 px-4 py-3 font-display text-sm font-bold text-white shadow-[0_8px_30px_rgba(59,130,246,0.45)] transition hover:brightness-110 active:scale-95"
          aria-label="Open calculator"
        >
          <CalcIcon className="h-5 w-5" />
          <span className="hidden sm:inline">Calculator</span>
        </button>
      )}

      <div
        className={`fixed right-5 bottom-5 z-50 flex h-[min(70vh,460px)] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-white/15 bg-navy-800 shadow-2xl transition-all duration-200 ${
          open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
          <span className="flex items-center gap-2 font-display text-sm font-bold text-white">
            <CalcIcon className="h-4 w-4 text-electric-400" /> Calculator
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid h-7 w-7 place-items-center rounded-lg text-slate-300 hover:bg-white/10"
            aria-label="Close calculator"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="relative flex-1 bg-white">
          {status === "error" && (
            <div className="grid h-full place-items-center p-4 text-center text-sm text-slate-600">
              Couldn't load the calculator — check your connection and reopen.
            </div>
          )}
          {(status === "idle" || status === "loading") && (
            <div className="grid h-full place-items-center">
              <div className="anim-spin-slow h-8 w-8 rounded-full border-4 border-electric-500/20 border-t-electric-400" />
            </div>
          )}
          <div ref={mountRef} className="absolute inset-0" />
        </div>
      </div>
    </>
  );
}
