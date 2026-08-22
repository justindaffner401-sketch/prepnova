import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import {
  getCampDna,
  getCampProfile,
  getEvents,
  getSourceDocuments,
  getTerminology,
  loadCampContext,
} from "@/lib/data/camp";
import { sourcesChangedSince } from "@/lib/ai/camp-dna";
import { Badge, Card } from "@/components/ui";
import { AddEventForm, EventList, PasteExamplesForm, StepAbout, StepVoice } from "@/components/onboarding/Wizard";
import { DocumentUpload, WebsiteImport } from "@/components/onboarding/TeachCampVoice";
import { DnaPanel } from "@/components/app/DnaPanel";
import { deleteCampEvent } from "@/app/onboarding/actions";

export const metadata: Metadata = {
  title: "Camp DNA",
  robots: { index: false, follow: false },
};

/**
 * The Camp DNA page: everything the camp has taught CampVoice, all editable.
 * Same components as onboarding, so there is one way to edit each thing.
 */
export default async function CampDnaPage() {
  const context = await requireSession();
  const organizationId = context.organization.id;

  const [dna, profile, terminology, events, documents, camp] = await Promise.all([
    getCampDna(organizationId),
    getCampProfile(organizationId),
    getTerminology(organizationId),
    getEvents(organizationId),
    getSourceDocuments(organizationId),
    loadCampContext(context.organization),
  ]);

  const staleDna = sourcesChangedSince(dna, camp);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">Camp DNA</h1>
          <p className="mt-2 prose-camp">
            Everything CampVoice knows about {context.organization.name}. Change anything here and every future draft
            follows.
          </p>
        </div>
        {dna?.edited_by_user ? <Badge tone="forest">Edited by you</Badge> : null}
      </div>

      <div className="mt-10 space-y-8">
        {/* ------------------------------------------------- the DNA itself */}
        <section aria-labelledby="dna-heading">
          <h2 id="dna-heading" className="font-display text-2xl font-semibold">
            How CampVoice understands you
          </h2>
          <div className="mt-4">
            <DnaPanel campName={context.organization.name} dna={dna} sourcesChanged={staleDna} />
          </div>
        </section>

        {/* ------------------------------------------------------- identity */}
        <Section id="identity" title="Camp identity" blurb="The basics CampVoice writes from.">
          <dl className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "Camp name", value: context.organization.name },
              { label: "Location", value: context.organization.location },
              { label: "Type", value: context.organization.camp_type },
              { label: "Camper ages", value: context.organization.age_range },
              { label: "Website", value: context.organization.website },
            ]
              .filter((item) => item.value)
              .map((item) => (
                <div key={item.label}>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-ink-300">{item.label}</dt>
                  <dd className="mt-0.5 text-ink-800">{item.value}</dd>
                </div>
              ))}
          </dl>
          {context.organization.description ? (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-300">About</p>
              <p className="mt-0.5 prose-camp">{context.organization.description}</p>
            </div>
          ) : null}
          <p className="mt-4 text-sm text-ink-300">
            Edit these in <a href="/settings/camp" className="text-forest-700 underline underline-offset-4">Settings → Camp</a>.
          </p>
        </Section>

        {/* ------------------------------- programs, traditions, terminology */}
        <Section id="about" title="Programs, traditions and terminology" blurb="What you offer and what you call it.">
          <StepAbout profile={profile} terminology={terminology} />
        </Section>

        {/* ---------------------------------------------------------- voice */}
        <Section id="voice" title="Voice and things to avoid" blurb="How CampVoice should sound for you.">
          <StepVoice profile={profile} />
        </Section>

        {/* ---------------------------------------------------------- dates */}
        <Section id="dates" title="Important dates" blurb="CampVoice only ever states a date it can see here.">
          <div className="space-y-6">
            <AddEventForm />
            <EventList events={events} onDelete={deleteCampEvent} />
          </div>
        </Section>

        {/* ------------------------------------------------ uploaded material */}
        <Section id="knowledge" title="Uploaded knowledge" blurb="The material CampVoice studies to learn your voice.">
          <div className="space-y-8">
            <div>
              <h3 className="font-semibold text-ink-900">Import a page from your website</h3>
              <div className="mt-3">
                <WebsiteImport defaultUrl={context.organization.website} />
              </div>
            </div>

            <div className="divider-soft pt-6">
              <h3 className="font-semibold text-ink-900">Files</h3>
              <div className="mt-3">
                <DocumentUpload documents={documents} />
              </div>
            </div>

            <div className="divider-soft pt-6">
              <h3 className="font-semibold text-ink-900">Pasted examples</h3>
              <div className="mt-3">
                <PasteExamplesForm profile={profile} />
              </div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  blurb,
  children,
}: {
  id: string;
  title: string;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-24">
      <h2 id={`${id}-heading`} className="font-display text-2xl font-semibold">{title}</h2>
      <p className="mt-1 text-sm prose-camp">{blurb}</p>
      <Card className="mt-4 p-6 sm:p-8">{children}</Card>
    </section>
  );
}
