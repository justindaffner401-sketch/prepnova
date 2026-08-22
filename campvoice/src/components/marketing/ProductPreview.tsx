/**
 * A polished mockup of the real CampVoice generation screen, used as the hero
 * visual. Built from the same design tokens as the app, so what a visitor sees
 * on the homepage is genuinely what they get after signing up. No stock photos.
 */
export function ProductPreview() {
  return (
    <div className="relative">
      {/* Decorative glow. The inset stays inside the page padding on small
          screens so it can never cause sideways scrolling. */}
      <div
        aria-hidden="true"
        className="absolute -inset-3 rounded-[28px] bg-forest-100/40 blur-2xl sm:-inset-6"
      />

      <div className="relative overflow-hidden rounded-2xl border border-paper-300 bg-paper-50 shadow-[0_24px_70px_-30px_rgb(16_28_24/0.35)]">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-paper-300 bg-paper-200/70 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-paper-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-paper-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-paper-400" />
          <p className="ml-2 text-xs font-medium text-ink-300">Tour Follow-Up · Camp Evergreen</p>
        </div>

        <div className="grid gap-0 sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          {/* the form */}
          <div className="space-y-4 border-b border-paper-300 p-5 sm:border-b-0 sm:border-r">
            <div>
              <p className="text-xs font-medium text-ink-500">Family name</p>
              <div className="mt-1 rounded-lg border border-paper-400 bg-paper-100 px-3 py-2 text-sm text-ink-800">
                the Alvarez family
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-500">Anything memorable from the tour?</p>
              <div className="mt-1 rounded-lg border border-paper-400 bg-paper-100 px-3 py-2 text-sm leading-relaxed text-ink-800">
                Maya spent twenty minutes at the waterfront and did not want to leave.
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-500">Main goal</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className="chip chip-selected text-xs">Encourage enrollment</span>
                <span className="chip text-xs">Thank them</span>
              </div>
            </div>
            <div className="btn btn-primary w-full justify-center text-sm">Generate</div>
          </div>

          {/* the draft */}
          <div className="bg-paper-100/60 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-forest-100 text-forest-700">
                <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                  <path d="M3 8.5 6.5 12 13 4.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <p className="text-xs font-medium text-forest-700">Written in Camp Evergreen&rsquo;s voice</p>
            </div>

            <div className="space-y-2.5 text-sm leading-relaxed text-ink-800">
              <p className="font-medium text-ink-900">Subject: So glad you and Maya came out to Evergreen</p>
              <p>Hi Elena,</p>
              <p>
                Thank you for making the drive up on Saturday. Watching Maya at the waterfront was our favorite part of
                the morning, and she asked better questions about the sailing program than most grown-ups do.
              </p>
              <p>
                Sessions for next summer are open now, and the Pioneer bunks tend to fill first for her age group. If
                you would like me to hold a spot while you talk it over, just say the word.
              </p>
              <p className="text-ink-500">Warmly,<br />Dana</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5 border-t border-paper-300 pt-3">
              {["Make shorter", "Make warmer", "Another version"].map((label) => (
                <span key={label} className="chip text-xs">
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
