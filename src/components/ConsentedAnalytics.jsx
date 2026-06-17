import { Analytics } from "@vercel/analytics/react";
import { useConsent } from "../lib/cookieConsent.js";

// Vercel Web Analytics loads ONLY after the user accepts cookies. Until then
// (or if they reject) nothing analytics-related is mounted or requested.
export default function ConsentedAnalytics() {
  return useConsent() === "accepted" ? <Analytics /> : null;
}
