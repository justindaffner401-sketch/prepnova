import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "./Logo.jsx";
import { authEnabled } from "../lib/supabase.js";
import { useAuth } from "../lib/useAuth.js";

const BASE_LINKS = [
  { label: "Features", to: "/#features" },
  { label: "Pricing", to: "/#pricing" },
  { label: "Practice", to: "/select" },
  { label: "Progress", to: "/progress" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const LINKS = authEnabled
    ? [...BASE_LINKS, { label: user ? "Account" : "Sign in", to: "/account" }]
    : BASE_LINKS;

  // Close the mobile menu on any navigation.
  useEffect(() => {
    setOpen(false);
  }, [location]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="container-pn pt-3 sm:pt-4">
        <nav className="glass flex items-center justify-between px-4 py-2.5 sm:px-5">
          <Link to="/" aria-label="PrepNova home">
            <Logo />
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <Link to="/select" className="btn-primary btn-sm ml-2">
              Start now
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="grid h-10 w-10 place-items-center rounded-lg text-slate-200 hover:bg-white/5 md:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              {open ? (
                <>
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </>
              ) : (
                <>
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </>
              )}
            </svg>
          </button>
        </nav>

        {open && (
          <div className="anim-fade-up glass mt-2 flex flex-col gap-1 p-2 md:hidden">
            {LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="rounded-lg px-4 py-3 text-sm font-medium text-slate-200 hover:bg-white/5"
              >
                {link.label}
              </Link>
            ))}
            <Link to="/select" className="btn-primary mt-1">
              Start now
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
