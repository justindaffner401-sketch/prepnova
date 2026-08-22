import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { formatDaysAway, getEvents, recentContent, upcomingEvents } from "@/lib/data/camp";
import { quickTemplates, categoryLabel } from "@/lib/ai/templates";
import { Badge, ButtonLink, Card, EmptyState } from "@/components/ui";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

function greeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const context = await requireSession();
  if (!context.organization.onboarding_completed_at) redirect("/onboarding");

  const [events, recent] = await Promise.all([
    getEvents(context.organization.id),
    recentContent(context.organization.id, 6),
  ]);

  const upcoming = upcomingEvents(events, 120).slice(0, 4);
  const firstName = context.profile.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">
            {greeting()}, {firstName}.
          </h1>
          <p className="mt-2 text-lg prose-camp">What does {context.organization.name} need today?</p>
        </div>
        <ButtonLink href="/create" size="lg">
          Generate Something
        </ButtonLink>
      </div>

      {/* ------------------------------------------------ quick generate */}
      <section className="mt-10" aria-labelledby="quick-generate">
        <h2 id="quick-generate" className="font-display text-xl font-semibold">
          Quick Generate
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickTemplates().map((template) => (
            <li key={template.id}>
              <Link href={`/create/${template.id}`} className="card-interactive block h-full p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-forest-600">
                  {categoryLabel(template.category)}
                </p>
                <p className="mt-1.5 font-semibold text-ink-900">{template.label}</p>
                <p className="mt-1 text-sm prose-camp">{template.blurb}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        {/* -------------------------------------------- upcoming dates */}
        <section aria-labelledby="upcoming-dates">
          <div className="flex items-center justify-between gap-3">
            <h2 id="upcoming-dates" className="font-display text-xl font-semibold">Upcoming Dates</h2>
            <Link href="/camp-dna#dates" className="text-sm text-forest-700 underline underline-offset-4">
              Manage
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No dates yet"
                description="Add important camp dates and CampVoice can recommend timely communications."
                action={<ButtonLink href="/camp-dna#dates" variant="secondary">Add dates</ButtonLink>}
              />
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {upcoming.map((event) => (
                <li key={event.id}>
                  <Card className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink-900">{event.title}</p>
                        <p className="text-sm text-ink-300">
                          {new Date(`${event.starts_on}T00:00:00`).toLocaleDateString(undefined, {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <Badge tone={event.daysAway <= 14 ? "ember" : "forest"}>{formatDaysAway(event.daysAway)}</Badge>
                    </div>
                    <ButtonLink
                      href={`/create?event=${encodeURIComponent(event.id)}`}
                      variant="secondary"
                      size="sm"
                      className="mt-3"
                    >
                      Create Communication
                    </ButtonLink>
                  </Card>
                </li>
              ))}
            </ul>
          )}

          <Card className="mt-5 border-forest-200 bg-forest-50/40 p-5">
            <h3 className="font-semibold text-ink-900">Not sure what to send?</h3>
            <p className="mt-1 text-sm prose-camp">
              CampVoice can look at your calendar and the season, then suggest a few things worth writing this week.
            </p>
            <ButtonLink href="/week" variant="secondary" size="sm" className="mt-3">
              Generate My Week
            </ButtonLink>
          </Card>
        </section>

        {/* ---------------------------------------------- recent content */}
        <section aria-labelledby="recent-content">
          <div className="flex items-center justify-between gap-3">
            <h2 id="recent-content" className="font-display text-xl font-semibold">Recent Content</h2>
            <Link href="/content" className="text-sm text-forest-700 underline underline-offset-4">
              View library
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="Nothing here yet"
                description="Create your first CampVoice communication and it will appear here."
                action={<ButtonLink href="/create">Generate Something</ButtonLink>}
              />
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-paper-300 overflow-hidden rounded-[var(--radius-card)] border border-paper-300 bg-paper-50">
              {recent.map((item) => (
                <li key={item.id}>
                  <Link href={`/content/${item.id}`} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-paper-100">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink-900">
                        {item.is_favorite ? <span className="mr-1 text-ember-500" aria-label="Favourite">★</span> : null}
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-sm text-ink-300">
                        {categoryLabel(item.category)} ·{" "}
                        {new Date(item.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <Badge tone={item.status === "saved" ? "forest" : "neutral"}>
                      {item.status === "saved" ? "Saved" : "Draft"}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
