import { track } from "@vercel/analytics";
import { getConsent } from "./cookieConsent.js";

// Fire a custom funnel event — ONLY when the user has accepted cookies, so we
// never track without consent. Safe to call from anywhere; it no-ops on
// rejection/no-choice and never throws (analytics must not break the app).
//
// Events we fire (see call sites): practice_started, practice_completed,
// exam_started, paywall_viewed, checkout_started, signup_success.
export function trackEvent(name, props) {
  try {
    if (getConsent() !== "accepted") return;
    track(name, props);
  } catch {
    /* ignore */
  }
}
