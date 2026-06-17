import { useSyncExternalStore } from "react";

// Tiny consent store backed by localStorage. Values: "accepted" | "rejected".
// `null`/undefined means the user hasn't chosen yet (show the banner).
//
// Scope note: PrepNova's only ESSENTIAL client storage is Supabase's auth
// session (kept in localStorage so you stay signed in) — that's required for
// the app to function and is not gated here. The only NON-essential item is
// Vercel Web Analytics (privacy-friendly + cookieless), which we still hold
// back until the user accepts, so rejection genuinely means "no analytics."
const KEY = "pn_cookie_consent";
const listeners = new Set();

function read() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function getConsent() {
  return read();
}

export function setConsent(value) {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    /* storage blocked — treat as not-chosen */
  }
  listeners.forEach((l) => l());
}

export function resetConsent() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useConsent() {
  return useSyncExternalStore(subscribe, read, () => null);
}
