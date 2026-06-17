import { useEffect } from "react";

// Desktop-only cursor-follow spotlight for `.glow-card`. A single passive,
// rAF-throttled pointermove listener sets --spot-x / --spot-y (the cursor's
// position as a % within the hovered card); the card's ::before radial reads
// those vars. Skipped entirely on touch devices and under reduced motion, so
// it adds zero cost on mobile. Renders nothing.
export default function CardSpotlight() {
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return undefined;

    let raf = 0;
    const onMove = (e) => {
      if (raf) return;
      const { clientX, clientY, target } = e;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const card = target?.closest?.(".glow-card");
        if (!card) return;
        const r = card.getBoundingClientRect();
        card.style.setProperty("--spot-x", `${((clientX - r.left) / r.width) * 100}%`);
        card.style.setProperty("--spot-y", `${((clientY - r.top) / r.height) * 100}%`);
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
