"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert, Badge, Button, Card } from "@/components/ui";

interface Suggestion {
  template_id: string;
  headline: string;
  reason: string;
  urgency: "now" | "this_week" | "soon";
  template_label: string;
  category: string;
}

const URGENCY_LABEL: Record<Suggestion["urgency"], string> = {
  now: "Do this first",
  this_week: "This week",
  soon: "Soon",
};

export function WeekPlanner({ campName }: { campName: string }) {
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState("");

  async function generate() {
    setState("working");
    setError("");

    try {
      const response = await fetch("/api/week", { method: "POST" });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setState("error");
        setError(body?.error?.message ?? "We couldn't build your suggestions right now. Please try again.");
        return;
      }

      setSuggestions(body.suggestions ?? []);
      setState("done");
    } catch {
      setState("error");
      setError("We couldn't reach our server. Please check your connection and try again.");
    }
  }

  if (state === "working") {
    return (
      <Card className="px-6 py-14 text-center" role="status" aria-live="polite">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-forest-50">
          <svg className="h-6 w-6 animate-spin text-forest-700" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v3a5 5 0 0 0-5 5H4z" />
          </svg>
        </div>
        <p className="mt-5 font-display text-xl font-semibold">Looking at your camp calendar…</p>
        <p className="mt-2 text-sm text-ink-300">Checking what is coming up and what is worth saying.</p>
      </Card>
    );
  }

  if (state === "done") {
    if (suggestions.length === 0) {
      return (
        <Card className="px-6 py-12 text-center">
          <h2 className="font-display text-xl font-semibold">Nothing urgent this week</h2>
          <p className="mx-auto mt-2 max-w-md prose-camp">
            CampVoice could not find a genuine reason to send anything right now. Add a few upcoming dates and it will
            have more to work with.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/camp-dna#dates" className="btn btn-secondary">Add dates</Link>
            <Button variant="ghost" onClick={generate}>Try again</Button>
          </div>
        </Card>
      );
    }

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-500">
            {suggestions.length} suggestions for {campName}. Nothing is created until you choose one.
          </p>
          <Button variant="ghost" size="sm" onClick={generate}>Refresh suggestions</Button>
        </div>

        <ul className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <li key={`${suggestion.template_id}-${index}`}>
              <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-ink-900">{suggestion.headline}</h2>
                    <Badge tone={suggestion.urgency === "now" ? "ember" : "forest"}>
                      {URGENCY_LABEL[suggestion.urgency]}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-sm prose-camp">{suggestion.reason}</p>
                  <p className="mt-1 text-xs text-ink-300">Uses the {suggestion.template_label} template.</p>
                </div>
                <Link href={`/create/${suggestion.template_id}`} className="btn btn-primary btn-sm">
                  Generate
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {state === "error" ? <Alert tone="error">{error}</Alert> : null}

      <Card className="px-6 py-12 text-center">
        <h2 className="font-display text-xl font-semibold">What should {campName} send this week?</h2>
        <p className="mx-auto mt-2 max-w-md prose-camp">
          CampVoice will look at your upcoming dates, where you are in the camp year, and your Camp DNA, then suggest a
          few things worth writing. It never sends or publishes anything.
        </p>
        <Button size="lg" className="mt-6" onClick={generate}>
          {state === "error" ? "Try again" : "Generate My Week"}
        </Button>
      </Card>
    </div>
  );
}
