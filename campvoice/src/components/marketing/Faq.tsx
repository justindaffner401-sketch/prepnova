export const FAQ_ITEMS = [
  {
    question: "Does CampVoice send emails for me?",
    answer:
      "No. CampVoice creates your communications. You remain in control of where and when they are sent — copy the draft into your email platform, your social scheduler, or wherever you already work.",
  },
  {
    question: "Does CampVoice replace CampMinder or my camp-management software?",
    answer:
      "No. CampVoice complements those platforms by helping create the communication itself. It holds no camper records, no parent database and no enrollment data.",
  },
  {
    question: "Will everything sound like AI?",
    answer:
      "CampVoice learns your camp's existing communications and preferences through Camp DNA, and it is instructed to avoid the phrasing that makes writing sound machine-generated. Every draft is also editable before you use it, and one-click revisions let you push it further toward your voice.",
  },
  {
    question: "Can I edit the content?",
    answer:
      "Yes. Everything is editable before use. You can rewrite it by hand, ask for a shorter or warmer version, or request a specific change in your own words.",
  },
  {
    question: "Does CampVoice train on our private camp content?",
    answer:
      "Your camp materials are stored in your own CampVoice account and used to build your Camp DNA and generate your drafts. They are sent to our AI provider, Anthropic, only as part of fulfilling those requests. Anthropic's commercial terms state that they do not use inputs or outputs submitted through their API to train their models. We do not sell or share your materials, and you can delete them at any time from Settings. Because provider terms can change, the current terms are the authority — please review Anthropic's commercial terms and our Privacy Policy before uploading anything you consider sensitive.",
  },
  {
    question: "What if CampVoice doesn't know a detail?",
    answer:
      "It leaves a visible blank in square brackets rather than guessing. CampVoice is explicitly instructed never to invent a date, a program name, a tradition, a price or a promise.",
  },
] as const;

export function Faq() {
  return (
    <dl className="divide-y divide-paper-300 border-y border-paper-300">
      {FAQ_ITEMS.map((item) => (
        <div key={item.question} className="py-6">
          <dt className="font-sans text-base font-semibold text-ink-900">{item.question}</dt>
          <dd className="mt-2 prose-camp">{item.answer}</dd>
        </div>
      ))}
    </dl>
  );
}
