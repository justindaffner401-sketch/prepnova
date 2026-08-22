"use client";

import { useState } from "react";
import { Alert, Button, Spinner } from "@/components/ui";

/**
 * Buttons that hand the user off to Stripe. We never render a card form or
 * hold a card number — Stripe Checkout and the Customer Portal do all of it.
 */
export function BillingActions({ hasCustomer }: { hasCustomer: boolean }) {
  const [busy, setBusy] = useState<"month" | "year" | "portal" | null>(null);
  const [error, setError] = useState("");

  async function go(endpoint: string, body?: unknown, key: "month" | "year" | "portal" = "portal") {
    setBusy(key);
    setError("");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.url) {
        setBusy(null);
        setError(payload?.error?.message ?? "We couldn't open billing just now. Please try again.");
        return;
      }

      window.location.href = payload.url;
    } catch {
      setBusy(null);
      setError("We couldn't reach our server. Please check your connection and try again.");
    }
  }

  return (
    <div className="space-y-4">
      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="flex flex-wrap gap-3">
        <Button size="lg" disabled={busy !== null} onClick={() => go("/api/stripe/checkout", { interval: "month" }, "month")}>
          {busy === "month" ? (<><Spinner label="Opening checkout" />Opening…</>) : "Subscribe monthly"}
        </Button>

        <Button size="lg" variant="secondary" disabled={busy !== null} onClick={() => go("/api/stripe/checkout", { interval: "year" }, "year")}>
          {busy === "year" ? (<><Spinner label="Opening checkout" />Opening…</>) : "Subscribe annually"}
        </Button>
      </div>

      {hasCustomer ? (
        <Button variant="ghost" disabled={busy !== null} onClick={() => go("/api/stripe/portal")}>
          {busy === "portal" ? (<><Spinner label="Opening portal" />Opening…</>) : "Manage billing, invoices and cancellation"}
        </Button>
      ) : null}
    </div>
  );
}
