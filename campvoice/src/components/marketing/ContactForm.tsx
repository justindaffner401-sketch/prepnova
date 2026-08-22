"use client";

import { useState } from "react";
import { Alert, Button, Field, Spinner } from "@/components/ui";

/**
 * The public support form.
 *
 * Spam defences, in order of how much they help:
 *  1. A hidden honeypot field a human never sees and a bot usually fills in.
 *  2. A minimum time-on-page, because bots submit instantly.
 *  3. Server-side rate limiting by IP (see the API route).
 * No third-party captcha, so no tracking script on the marketing site.
 */
export function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [loadedAt] = useState(() => Date.now());

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setMessage("");

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
          camp_name: String(form.get("camp_name") ?? ""),
          message: String(form.get("message") ?? ""),
          website: String(form.get("website") ?? ""),
          elapsed_ms: Date.now() - loadedAt,
        }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setState("error");
        setMessage(body?.error?.message ?? "We couldn't send that just now. Please email us instead.");
        return;
      }

      setState("sent");
    } catch {
      setState("error");
      setMessage("We couldn't reach our server. Please check your connection, or email us instead.");
    }
  }

  if (state === "sent") {
    return (
      <Alert tone="success" title="Message received">
        Thank you. We read every message and will reply to the email address you gave us.
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {state === "error" ? <Alert tone="error">{message}</Alert> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" htmlFor="name" required>
          <input id="name" name="name" required maxLength={120} autoComplete="name" className="input" />
        </Field>
        <Field label="Email" htmlFor="email" required>
          <input id="email" name="email" type="email" required maxLength={200} autoComplete="email" className="input" />
        </Field>
      </div>

      <Field label="Camp name" htmlFor="camp_name">
        <input id="camp_name" name="camp_name" maxLength={160} className="input" />
      </Field>

      <Field label="How can we help?" htmlFor="message" required>
        <textarea id="message" name="message" required maxLength={4000} rows={6} className="input" />
      </Field>

      {/* Honeypot: hidden from people, tempting to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <Button type="submit" size="lg" disabled={state === "sending"}>
        {state === "sending" ? (
          <>
            <Spinner label="Sending" />
            Sending…
          </>
        ) : (
          "Send message"
        )}
      </Button>
    </form>
  );
}
