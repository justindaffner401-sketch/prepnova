export const USE_CASES = [
  {
    id: "prospective",
    title: "Prospective Families",
    blurb: "Turn interest into enrollment without writing the same email twice.",
    items: ["Inquiry follow-up", "Tour follow-up", "Enrollment reminder", "Open-house invitation", "Re-engagement"],
  },
  {
    id: "families",
    title: "Current Families",
    blurb: "Clear, calm communication all season long.",
    items: ["Packing reminders", "Opening-day emails", "Visiting Day communications", "Transportation reminders", "Parent updates"],
  },
  {
    id: "marketing",
    title: "Marketing",
    blurb: "Stay visible year-round without a marketing hire.",
    items: ["Instagram captions", "Facebook posts", "Reel scripts", "Monthly content", "Newsletters"],
  },
  {
    id: "staff",
    title: "Staff",
    blurb: "Recruit and prepare the team that makes the summer.",
    items: ["Recruitment posts", "Interview follow-ups", "Hiring communications", "Pre-camp reminders"],
  },
  {
    id: "alumni",
    title: "Alumni",
    blurb: "Keep the people who grew up at camp close to it.",
    items: ["Reunion communication", "Alumni newsletter", "Fundraising messaging", "Throwback content"],
  },
] as const;

export function UseCaseCards({ limit }: { limit?: number }) {
  const cases = limit ? USE_CASES.slice(0, limit) : USE_CASES;

  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {cases.map((useCase) => (
        <li key={useCase.id} className="card-interactive flex flex-col p-6">
          <h3 className="text-xl font-semibold">{useCase.title}</h3>
          <p className="mt-2 text-sm prose-camp">{useCase.blurb}</p>
          <ul className="mt-5 space-y-2 border-t border-paper-300 pt-4">
            {useCase.items.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-ink-700">
                <svg viewBox="0 0 16 16" className="mt-1 h-3.5 w-3.5 shrink-0 text-forest-500" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                  <path d="M3 8.5 6.5 12 13 4.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
