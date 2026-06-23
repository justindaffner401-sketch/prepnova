import { useEffect } from "react";

// Per-route SEO for this client-rendered SPA: sets <title>, meta description,
// canonical, and an optional JSON-LD block, restoring the previous values when
// the route unmounts. Googlebot executes JS and indexes these; for maximum SEO
// a prerender/SSG step would emit static HTML (a worthwhile follow-up).
//
// Pass a STABLE jsonLd object (module constant) so the effect doesn't re-run
// and re-inject on every render.
export function useSeo({ title, description, canonical, jsonLd } = {}) {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) document.title = title;

    const descEl = document.head.querySelector('meta[name="description"]');
    const prevDesc = descEl?.getAttribute("content");
    if (description && descEl) descEl.setAttribute("content", description);

    const linkEl = document.head.querySelector('link[rel="canonical"]');
    const prevCanonical = linkEl?.getAttribute("href");
    if (canonical && linkEl) linkEl.setAttribute("href", canonical);

    let script;
    if (jsonLd) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      document.title = prevTitle;
      if (description && descEl && prevDesc != null) descEl.setAttribute("content", prevDesc);
      if (canonical && linkEl && prevCanonical != null) linkEl.setAttribute("href", prevCanonical);
      script?.remove();
    };
  }, [title, description, canonical, jsonLd]);
}
