"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/settings", label: "Account" },
  { href: "/settings/camp", label: "Camp" },
  { href: "/camp-dna", label: "Camp DNA" },
  { href: "/settings/billing", label: "Billing" },
  { href: "/settings/data", label: "Your data" },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Settings">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5 lg:overflow-visible">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`block whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-forest-50 text-forest-700" : "text-ink-500 hover:bg-paper-200 hover:text-ink-900"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
