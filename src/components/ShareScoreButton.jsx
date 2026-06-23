import { useState } from "react";
import { shareScoreCard } from "../lib/shareScore.js";
import { trackEvent } from "../lib/analytics.js";

function ShareIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
      <path d="M16 6l-4-4-4 4" />
      <path d="M12 2v13" />
    </svg>
  );
}

// Generates a branded score card and shares it (native share sheet on mobile;
// download + copied link on desktop). Shows transient feedback.
export default function ShareScoreButton({ percent, test, subjectLabel, score, total, className = "" }) {
  const [status, setStatus] = useState("idle"); // idle | working | done | saved | error

  async function onClick() {
    setStatus("working");
    trackEvent("score_shared", { test, percent });
    try {
      const { method } = await shareScoreCard({ percent, test, subjectLabel, score, total });
      setStatus(method === "download" ? "saved" : "done");
    } catch {
      setStatus("error");
    }
    setTimeout(() => setStatus("idle"), 2600);
  }

  const label =
    status === "working"
      ? "Preparing…"
      : status === "saved"
        ? "Saved! Link copied"
        : status === "done"
          ? "Shared!"
          : status === "error"
            ? "Couldn't share"
            : "Share my score";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={status === "working"}
      className={`btn-ghost disabled:opacity-60 ${className}`}
    >
      <ShareIcon />
      {label}
    </button>
  );
}
