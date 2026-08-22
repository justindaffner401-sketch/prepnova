import Link from "next/link";

/**
 * The CampVoice mark: two pine forms rising out of a soundwave baseline —
 * camp plus voice. Drawn inline so it is crisp at any size and needs no asset.
 */
export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label="CampVoice" fill="none">
      <path d="M16 3.5 22.5 15h-4.2L23 23H9l4.7-8H9.5L16 3.5Z" fill="currentColor" opacity="0.92" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.55">
        <path d="M4 27v-3.5" />
        <path d="M8.5 27v-6" />
        <path d="M23.5 27v-6" />
        <path d="M28 27v-3.5" />
      </g>
      <path d="M13.5 27h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className = "", href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={`inline-flex items-center gap-2.5 text-forest-700 ${className}`}>
      <LogoMark />
      <span className="font-display text-xl font-semibold tracking-tight text-ink-900">CampVoice</span>
    </Link>
  );
}
