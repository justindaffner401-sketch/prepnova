import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession, getSubscription, isEntitled } from "@/lib/auth/session";
import { getEvents } from "@/lib/data/camp";
import { categoryLabel, getTemplate } from "@/lib/ai/templates";
import { GenerationForm } from "@/components/app/GenerationForm";
import { ButtonLink, Card } from "@/components/ui";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ templateId: string }>;
}): Promise<Metadata> {
  const { templateId } = await params;
  const template = getTemplate(templateId);
  return { title: template ? `Create a ${template.label}` : "Create", robots: { index: false, follow: false } };
}

export default async function TemplatePage({
  params,
  searchParams,
}: {
  params: Promise<{ templateId: string }>;
  searchParams: Promise<{ event?: string }>;
}) {
  const { templateId } = await params;
  const template = getTemplate(templateId);
  if (!template) notFound();

  const context = await requireSession();
  const subscription = await getSubscription(context.organization.id);

  if (!isEntitled(subscription)) {
    return (
      <div className="mx-auto max-w-xl px-5 py-16">
        <Card className="p-8 text-center">
          <h1 className="font-display text-2xl font-semibold">Your trial has ended</h1>
          <p className="mt-3 prose-camp">
            Everything you taught CampVoice is safe. Start a plan and you can pick up exactly where you left off.
          </p>
          <ButtonLink href="/settings/billing" size="lg" className="mt-6">
            Choose a plan
          </ButtonLink>
        </Card>
      </div>
    );
  }

  const { event: eventId } = await searchParams;
  let prefill: Record<string, string> = {};

  if (eventId) {
    const events = await getEvents(context.organization.id);
    const event = events.find((item) => item.id === eventId);
    if (event) {
      // Fill only fields this template actually has.
      const names = new Set(template.fields.map((field) => field.name));
      const candidate: Record<string, string> = {
        event: event.title,
        event_date: event.starts_on,
        deadline: event.starts_on,
        topic: event.title,
      };
      prefill = Object.fromEntries(Object.entries(candidate).filter(([key]) => names.has(key)));
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <p className="text-sm">
        <Link href="/create" className="text-ink-500 underline underline-offset-4 hover:text-ink-900">
          ← All content types
        </Link>
      </p>

      <div className="mt-4">
        <p className="eyebrow">{categoryLabel(template.category)}</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">Create a {template.label}</h1>
        <p className="mt-2 prose-camp">{template.blurb}</p>
      </div>

      <Card className="mt-8 p-6 sm:p-8">
        <GenerationForm template={template} prefill={prefill} />
      </Card>

      <p className="mt-6 text-sm text-ink-300">
        CampVoice writes using your Camp DNA. If a detail is missing it will leave a blank in square brackets rather
        than guessing.
      </p>
    </div>
  );
}
