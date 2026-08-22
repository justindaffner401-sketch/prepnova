const STEPS = [
  {
    number: "1",
    title: "Teach CampVoice about your camp",
    body: "Add your website, previous communications, important dates, terminology and preferences. It takes one sitting, and you only do it once.",
  },
  {
    number: "2",
    title: "CampVoice builds your Camp DNA",
    body: "Your camp's identity becomes persistent context for every generation: how you sound, what you call things, what you care about, and what you never want to see.",
  },
  {
    number: "3",
    title: "Generate what you need",
    body: "Choose a communication, provide a few details, and receive a polished draft in seconds. Edit it, revise it with one click, save it, and find it again later.",
  },
] as const;

export function HowItWorksSteps() {
  return (
    <ol className="grid gap-6 md:grid-cols-3">
      {STEPS.map((step) => (
        <li key={step.number} className="card relative p-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-700 font-display text-lg font-semibold text-paper-50">
            {step.number}
          </span>
          <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
          <p className="mt-2 text-sm prose-camp">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}
