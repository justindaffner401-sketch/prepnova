"use client";

import { useEffect } from "react";

/**
 * The app-wide error boundary. A camp director sees a calm message, never a
 * stack trace. The real error is logged to the browser console and, on the
 * server, to Vercel's logs.
 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("CampVoice error boundary:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-5 py-16">
      <div className="card max-w-md p-8 text-center">
        <h1 className="font-display text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-3 prose-camp">
          Your camp information is safe. This was a problem on our end, not something you did.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn btn-primary">Try again</button>
          <a href="/dashboard" className="btn btn-secondary">Back to dashboard</a>
        </div>
        {error.digest ? (
          <p className="mt-5 text-xs text-ink-300">
            If you contact support, mention reference {error.digest}.
          </p>
        ) : null}
      </div>
    </div>
  );
}
