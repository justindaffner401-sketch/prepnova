import { Link } from "react-router-dom";
import Logo from "./Logo.jsx";
import { resetConsent } from "../lib/cookieConsent.js";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-navy-950/60">
      <div className="container-pn flex flex-col gap-8 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xs space-y-3">
          <Logo />
          <p className="text-sm leading-relaxed text-slate-400">
            AI-powered ACT &amp; SAT prep that costs less than a single hour
            with a private tutor.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap gap-12 sm:gap-16">
          <div className="space-y-3">
            <p className="font-display text-xs font-bold uppercase tracking-widest text-slate-500">
              Product
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/#features" className="text-slate-400 hover:text-white">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/#pricing" className="text-slate-400 hover:text-white">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/diagnostic" className="text-slate-400 hover:text-white">
                  Free diagnostic
                </Link>
              </li>
              <li>
                <Link to="/free-act-practice" className="text-slate-400 hover:text-white">
                  Free ACT practice
                </Link>
              </li>
              <li>
                <Link to="/free-sat-practice" className="text-slate-400 hover:text-white">
                  Free SAT practice
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <p className="font-display text-xs font-bold uppercase tracking-widest text-slate-500">
              App
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/select" className="text-slate-400 hover:text-white">
                  Practice
                </Link>
              </li>
              <li>
                <Link to="/progress" className="text-slate-400 hover:text-white">
                  Progress
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <p className="font-display text-xs font-bold uppercase tracking-widest text-slate-500">
              Legal
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="text-slate-400 hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-slate-400 hover:text-white">
                  Terms of Service
                </Link>
              </li>
              <li>
                {/* Re-opens the cookie banner so users can change their choice. */}
                <button
                  type="button"
                  onClick={resetConsent}
                  className="text-slate-400 hover:text-white"
                >
                  Cookie settings
                </button>
              </li>
              <li>
                <a href="mailto:justindaffner@icloud.com" className="text-slate-400 hover:text-white">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </div>
      <div className="border-t border-white/5 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} PrepNova · prepnovaai.com · Your Score. Elevated.
      </div>
    </footer>
  );
}
