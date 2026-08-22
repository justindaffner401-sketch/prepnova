"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { buttonClass } from "@/components/ui";

const NAV = [
  { href: "/product", label: "Product" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/use-cases", label: "Use Cases" },
  { href: "/pricing", label: "Pricing" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-paper-300/70 bg-paper-100/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-3.5" aria-label="Main">
        <Logo />

        <div className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-ink-500 transition-colors hover:bg-paper-200 hover:text-ink-900"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/sign-in" className={buttonClass("ghost", "sm")}>
            Sign In
          </Link>
          <Link href="/sign-up" className={buttonClass("primary", "sm")}>
            Start Free
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-ink-700 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /> : <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />}
          </svg>
        </button>
      </nav>

      {open ? (
        <div id="mobile-nav" className="border-t border-paper-300 bg-paper-50 px-5 py-4 md:hidden">
          <ul className="space-y-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 font-medium text-ink-700 hover:bg-paper-200"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2">
            <Link href="/sign-in" className={buttonClass("secondary", "md")} onClick={() => setOpen(false)}>
              Sign In
            </Link>
            <Link href="/sign-up" className={buttonClass("primary", "md")} onClick={() => setOpen(false)}>
              Start Free
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
