import Link from "next/link";
import { LogoMark } from "@/components/ui/Logo";
import { brand } from "@/lib/config";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/product", label: "Product" },
      { href: "/how-it-works", label: "How It Works" },
      { href: "/use-cases", label: "Use Cases" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/contact", label: "Contact" },
      { href: "/sign-in", label: "Sign In" },
      { href: "/sign-up", label: "Start Free" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/cookies", label: "Cookie Policy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-paper-300 bg-paper-200/50">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5 text-forest-700">
              <LogoMark className="h-7 w-7" />
              <span className="font-display text-lg font-semibold text-ink-900">CampVoice</span>
            </div>
            <p className="mt-3 max-w-xs text-sm prose-camp">{brand.tagline}</p>
            <a
              href={`mailto:${brand.supportEmail}`}
              className="mt-4 inline-block text-sm font-medium text-forest-700 underline underline-offset-4"
            >
              {brand.supportEmail}
            </a>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="font-sans text-sm font-semibold text-ink-900">{column.title}</h2>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-ink-500 transition-colors hover:text-forest-700">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="divider-soft mt-12 pt-6 text-sm text-ink-300">
          <p>© {new Date().getFullYear()} CampVoice. CampVoice creates communications. You decide where and when they are sent.</p>
        </div>
      </div>
    </footer>
  );
}
