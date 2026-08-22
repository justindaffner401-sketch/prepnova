"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/ui/Logo";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/create", label: "Create" },
  { href: "/content", label: "Library" },
  { href: "/week", label: "My Week" },
  { href: "/camp-dna", label: "Camp DNA" },
];

export function AppNav({ campName, userName, isAdmin }: { campName: string; userName: string; isAdmin: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-paper-300 bg-paper-100/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <div className="flex items-center gap-6">
          <Logo href="/dashboard" />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive(link.href) ? "bg-forest-50 text-forest-700" : "text-ink-500 hover:bg-paper-200 hover:text-ink-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <div className="text-right">
            <p className="text-sm font-medium text-ink-900">{userName}</p>
            <p className="text-xs text-ink-300">{campName}</p>
          </div>
          <Link
            href="/settings"
            className="rounded-full border border-paper-400 px-3.5 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-paper-200"
          >
            Settings
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-ink-700 md:hidden"
          aria-expanded={open}
          aria-controls="app-mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /> : <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />}
          </svg>
        </button>
      </div>

      {open ? (
        <nav id="app-mobile-nav" className="border-t border-paper-300 bg-paper-50 px-5 py-3 md:hidden" aria-label="Main">
          <ul className="space-y-1">
            {[...LINKS, { href: "/settings", label: "Settings" }, ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : [])].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={`block rounded-lg px-3 py-2.5 font-medium ${
                    isActive(link.href) ? "bg-forest-50 text-forest-700" : "text-ink-700 hover:bg-paper-200"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-paper-300 pt-3 text-sm text-ink-300">
            {userName} · {campName}
          </p>
        </nav>
      ) : null}
    </header>
  );
}
