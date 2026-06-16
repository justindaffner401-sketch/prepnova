// App-wide animated aurora background. Pure CSS (GPU-friendly transforms), sits
// fixed behind all content (-z-10) above the navy canvas (the base color is on
// <html>, not <body> — see index.css — so this negative-z layer isn't covered).
// Subtle enough to keep text readable; freezes under prefers-reduced-motion.
export default function AuroraBackground() {
  return <div className="aurora-bg" aria-hidden="true" />;
}
