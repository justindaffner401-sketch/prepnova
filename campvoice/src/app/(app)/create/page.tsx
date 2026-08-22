import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { getEvents } from "@/lib/data/camp";
import { CATEGORIES, templatesByCategory } from "@/lib/ai/templates";

export const metadata: Metadata = {
  title: "Create",
  robots: { index: false, follow: false },
};

/**
 * The content library picker. A camp director chooses WHAT they are making;
 * they never see a prompt box.
 */
export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const context = await requireSession();
  const { event: eventId } = await searchParams;

  // When arriving from an upcoming date, carry it through so the form can prefill.
  let eventTitle: string | null = null;
  if (eventId) {
    const events = await getEvents(context.organization.id);
    eventTitle = events.find((event) => event.id === eventId)?.title ?? null;
  }

  const suffix = eventId ? `?event=${encodeURIComponent(eventId)}` : "";

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">What are you creating?</h1>
      <p className="mt-2 text-lg prose-camp">
        {eventTitle
          ? `Pick a communication for ${eventTitle}. CampVoice will bring the date along.`
          : "Pick a communication and answer a few questions. CampVoice handles the rest."}
      </p>

      <div className="mt-10 space-y-12">
        {CATEGORIES.map((category) => (
          <section key={category.id} aria-labelledby={`category-${category.id}`}>
            <h2 id={`category-${category.id}`} className="font-display text-2xl font-semibold">
              {category.label}
            </h2>
            <p className="mt-1 text-sm prose-camp">{category.blurb}</p>

            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {templatesByCategory(category.id).map((template) => (
                <li key={template.id}>
                  <Link href={`/create/${template.id}${suffix}`} className="card-interactive block h-full p-5">
                    <p className="font-semibold text-ink-900">{template.label}</p>
                    <p className="mt-1 text-sm prose-camp">{template.blurb}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
