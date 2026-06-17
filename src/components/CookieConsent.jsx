import { Link } from "react-router-dom";
import { useConsent, setConsent } from "../lib/cookieConsent.js";

// Non-blocking cookie consent banner. It does NOT cover the whole screen, so
// the site stays usable while the choice is pending. Fully keyboard accessible
// (it's just links + buttons in a labelled region). Analytics is gated by the
// choice (see ConsentedAnalytics).
export default function CookieConsent() {
  const consent = useConsent();
  if (consent === "accepted" || consent === "rejected") return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-white/10 bg-navy-900/95 backdrop-blur supports-[backdrop-filter]:bg-navy-900/80"
    >
      <div className="container-pn flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
          We use essential cookies/storage to keep you signed in, and optional,
          privacy-friendly analytics to understand how the site is used. You can
          accept or reject analytics. See our{" "}
          <Link to="/privacy" className="text-electric-300 underline underline-offset-2 hover:text-electric-200">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setConsent("rejected")}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/5"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => setConsent("accepted")}
            className="rounded-lg bg-gradient-to-r from-electric-500 to-cyan-400 px-4 py-2 text-sm font-bold text-white transition hover:brightness-110"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
