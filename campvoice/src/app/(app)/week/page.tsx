import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { formatDaysAway, getEvents, upcomingEvents } from "@/lib/data/camp";
import { WeekPlanner } from "@/components/app/WeekPlanner";
import { Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "Generate My Week",
  robots: { index: false, follow: false },
};

export default async function WeekPage() {
  const context = await requireSession();
  const events = await getEvents(context.organization.id);
  const upcoming = upcomingEvents(events, 60).slice(0, 6);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">Generate My Week</h1>
      <p className="mt-2 text-lg prose-camp">
        A short list of what is worth saying right now, based on your calendar and your Camp DNA.
      </p>

      <div className="mt-8">
        <WeekPlanner campName={context.organization.name} />
      </div>

      {upcoming.length > 0 ? (
        <section className="mt-12" aria-labelledby="whats-coming">
          <h2 id="whats-coming" className="font-display text-xl font-semibold">What CampVoice is looking at</h2>
          <Card className="mt-4 divide-y divide-paper-300">
            {upcoming.map((event) => (
              <div key={event.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <p className="min-w-0 truncate font-medium text-ink-900">{event.title}</p>
                <p className="shrink-0 text-sm text-ink-300">{formatDaysAway(event.daysAway)}</p>
              </div>
            ))}
          </Card>
        </section>
      ) : null}
    </div>
  );
}
