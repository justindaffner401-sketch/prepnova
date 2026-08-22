const INPUTS = [
  { label: "Website", detail: "What you already say publicly" },
  { label: "Previous Communications", detail: "Emails, newsletters, posts" },
  { label: "Important Dates", detail: "Enrollment, sessions, Visiting Day" },
  { label: "Brand Voice", detail: "Tone traits and what to avoid" },
  { label: "Camp Information", detail: "Programs, traditions, terminology" },
];

const OUTPUTS = ["Emails", "Social Posts", "Newsletters", "Family Communications", "Staff Communications"];

/**
 * The Camp DNA explainer: five inputs converge into one profile, which powers
 * five kinds of output. Laid out as a real three-column flow on desktop and a
 * readable vertical stack on mobile.
 */
export function CampDnaDiagram() {
  return (
    <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      <ul className="space-y-2.5">
        {INPUTS.map((input) => (
          <li key={input.label} className="card px-4 py-3">
            <p className="text-sm font-semibold text-ink-900">{input.label}</p>
            <p className="text-sm text-ink-500">{input.detail}</p>
          </li>
        ))}
      </ul>

      <div className="flex flex-col items-center gap-3 py-2">
        <Arrow className="rotate-90 lg:rotate-0" />
        <div className="rounded-2xl border border-forest-200 bg-forest-700 px-6 py-5 text-center shadow-[0_18px_40px_-20px_rgb(22_41_31/0.6)]">
          <p className="font-display text-xl font-semibold text-paper-50">Camp DNA</p>
          <p className="mt-1 max-w-[15rem] text-sm text-forest-100">
            One persistent profile of how your camp sounds and what it knows.
          </p>
        </div>
        <Arrow className="rotate-90 lg:rotate-0" />
      </div>

      <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
        {OUTPUTS.map((output) => (
          <li key={output} className="card flex items-center gap-2.5 px-4 py-3">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ember-500" aria-hidden="true" />
            <span className="text-sm font-medium text-ink-800">{output}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 12" className={`h-3 w-10 text-forest-400 ${className}`} fill="none" aria-hidden="true">
      <path d="M0 6h32" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
      <path d="M31 1.5 38 6l-7 4.5z" fill="currentColor" />
    </svg>
  );
}
