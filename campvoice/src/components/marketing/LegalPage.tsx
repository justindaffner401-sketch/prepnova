import type { ReactNode } from "react";

/**
 * Shared shell for the legal pages.
 *
 * IMPORTANT: the text on these pages is a starting draft written by the
 * CampVoice team, NOT legal advice and NOT reviewed by an attorney. The notice
 * below is deliberately visible so nobody — including the founder — mistakes
 * these for approved policies. Have counsel review and replace them before
 * taking real customers.
 */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-5 py-16">
      <header>
        <p className="eyebrow">Legal</p>
        <h1 className="mt-3 font-display text-4xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-ink-300">Last updated: {updated}</p>
      </header>

      <div role="note" className="mt-8 rounded-lg border border-ember-200 bg-ember-50 px-5 py-4">
        <p className="text-sm font-semibold text-ember-700">Draft pending legal review</p>
        <p className="mt-1 text-sm text-ink-700">
          This document is a plain-English starting point prepared for CampVoice. It has not been reviewed or approved by
          an attorney and it is not legal advice. Sections marked <code className="rounded bg-paper-200 px-1">[BRACKETED]</code>{" "}
          must be completed, and the whole document should be reviewed by counsel, before CampVoice takes paying
          customers.
        </p>
      </div>

      <div className="legal-body mt-10 space-y-8">{children}</div>
    </article>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-sans text-lg font-semibold text-ink-900">{heading}</h2>
      <div className="mt-2 space-y-3 prose-camp">{children}</div>
    </section>
  );
}
