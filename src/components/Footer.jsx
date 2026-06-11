import { Link } from "react-router-dom";
import Logo from "./Logo.jsx";

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

        <div className="flex gap-16">
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
        </div>
      </div>
      <div className="border-t border-white/5 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} PrepNova · prepnovaai.com · Your Score. Elevated.
      </div>
    </footer>
  );
}
