import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionContext, getUserOnly } from "@/lib/auth/session";
import { getCampDna, getCampProfile, getEvents, getSourceDocuments, getTerminology } from "@/lib/data/camp";
import { Logo } from "@/components/ui/Logo";
import { Button, Card } from "@/components/ui";
import {
  AddEventForm,
  EventList,
  PasteExamplesForm,
  StepAbout,
  StepCamp,
  StepVoice,
} from "@/components/onboarding/Wizard";
import { DocumentUpload, WebsiteImport } from "@/components/onboarding/TeachCampVoice";
import { DnaPreview } from "@/components/onboarding/DnaPreview";
import { continueToDates, continueToDna, deleteCampEvent } from "./actions";

export const metadata: Metadata = {
  title: "Set up your camp",
  robots: { index: false, follow: false },
};

const STEPS = [
  { number: 1, title: "Your camp", blurb: "The basics, so CampVoice knows who it is writing for." },
  { number: 2, title: "About camp", blurb: "Programs, traditions and the words you use." },
  { number: 3, title: "Your voice", blurb: "How CampVoice should sound, and what to avoid." },
  { number: 4, title: "Teach CampVoice", blurb: "Show it how your camp already writes." },
  { number: 5, title: "Important dates", blurb: "So it never guesses a date." },
  { number: 6, title: "Camp DNA", blurb: "Read what it understood, and correct anything." },
] as const;

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const user = await getUserOnly();
  if (!user) redirect("/sign-in?next=/onboarding");

  const context = await getSessionContext();
  const organization = context?.organization ?? null;

  const params = await searchParams;
  const requested = Number.parseInt(params.step ?? "", 10);
  const furthest = organization?.onboarding_step ?? 1;

  // A user can go back to a finished step, but not skip ahead past what they've done.
  const current = Number.isFinite(requested)
    ? Math.min(Math.max(1, requested), Math.max(1, furthest))
    : Math.max(1, furthest);

  const step = STEPS.find((item) => item.number === current) ?? STEPS[0];

  return (
    <div className="bg-topo min-h-screen">
      <header className="border-b border-paper-300 bg-paper-100/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <Logo href={organization?.onboarding_completed_at ? "/dashboard" : "/"} />
          {organization?.onboarding_completed_at ? (
            <Link href="/dashboard" className="text-sm font-medium text-forest-700 underline underline-offset-4">
              Back to dashboard
            </Link>
          ) : null}
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-4xl px-5 py-10">
        <Progress current={current} furthest={furthest} />

        <div className="mt-8">
          <p className="eyebrow">Step {step.number} of {STEPS.length}</p>
          <h1 className="mt-2 font-display text-3xl font-semibold">{step.title}</h1>
          <p className="mt-2 prose-camp">{step.blurb}</p>
        </div>

        <div className="mt-8">
          {current === 1 ? (
            <Card className="p-6 sm:p-8">
              <StepCamp organization={organization} />
            </Card>
          ) : null}

          {current === 2 && organization ? <StepTwo organizationId={organization.id} /> : null}
          {current === 3 && organization ? <StepThree organizationId={organization.id} /> : null}
          {current === 4 && organization ? <StepFour organizationId={organization.id} website={organization.website} /> : null}
          {current === 5 && organization ? <StepFive organizationId={organization.id} /> : null}
          {current === 6 && organization ? <StepSix organizationId={organization.id} campName={organization.name} /> : null}
        </div>

        {current > 1 ? (
          <p className="mt-8 text-sm">
            <Link href={`/onboarding?step=${current - 1}`} className="text-ink-500 underline underline-offset-4 hover:text-ink-900">
              ← Back to step {current - 1}
            </Link>
          </p>
        ) : null}
      </main>
    </div>
  );
}

function Progress({ current, furthest }: { current: number; furthest: number }) {
  return (
    <nav aria-label="Setup progress">
      <ol className="flex items-center gap-1.5">
        {STEPS.map((step) => {
          const done = step.number < furthest;
          const active = step.number === current;
          return (
            <li key={step.number} className="flex-1">
              <Link
                href={`/onboarding?step=${step.number}`}
                aria-current={active ? "step" : undefined}
                aria-disabled={step.number > furthest}
                tabIndex={step.number > furthest ? -1 : undefined}
                className={`block h-1.5 rounded-full transition-colors ${
                  active ? "bg-forest-700" : done ? "bg-forest-400" : "bg-paper-300"
                } ${step.number > furthest ? "pointer-events-none" : ""}`}
              >
                <span className="sr-only">
                  Step {step.number}: {step.title}
                  {done ? " (completed)" : active ? " (current)" : ""}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

async function StepTwo({ organizationId }: { organizationId: string }) {
  const [profile, terminology] = await Promise.all([getCampProfile(organizationId), getTerminology(organizationId)]);
  return (
    <Card className="p-6 sm:p-8">
      <StepAbout profile={profile} terminology={terminology} />
    </Card>
  );
}

async function StepThree({ organizationId }: { organizationId: string }) {
  const profile = await getCampProfile(organizationId);
  return (
    <Card className="p-6 sm:p-8">
      <StepVoice profile={profile} />
    </Card>
  );
}

async function StepFour({ organizationId, website }: { organizationId: string; website: string | null }) {
  const [profile, documents] = await Promise.all([getCampProfile(organizationId), getSourceDocuments(organizationId)]);

  return (
    <div className="space-y-6">
      <Card className="p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold">Import your website</h2>
        <p className="mt-1 text-sm prose-camp">
          The fastest way to teach CampVoice. We read the public text on the page you give us.
        </p>
        <div className="mt-5">
          <WebsiteImport defaultUrl={website} />
        </div>
      </Card>

      <Card className="p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold">Upload previous communications</h2>
        <p className="mt-1 text-sm prose-camp">
          Last year&rsquo;s emails, a newsletter, your brochure. These teach CampVoice how you already sound.
        </p>
        <div className="mt-5">
          <DocumentUpload documents={documents} />
        </div>
      </Card>

      <Card className="p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold">Or paste examples</h2>
        <p className="mt-1 text-sm prose-camp">If it is easier to copy and paste, do that instead.</p>
        <div className="mt-5">
          <PasteExamplesForm profile={profile} />
        </div>
      </Card>

      <form action={continueToDates}>
        <Button type="submit" size="lg">Continue</Button>
      </form>
    </div>
  );
}

async function StepFive({ organizationId }: { organizationId: string }) {
  const events = await getEvents(organizationId);

  return (
    <div className="space-y-6">
      <Card className="p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold">Add a date</h2>
        <p className="mt-1 text-sm prose-camp">
          CampVoice will only ever state a date that appears here or that you type into a form.
        </p>
        <div className="mt-5">
          <AddEventForm />
        </div>
      </Card>

      <div>
        <h2 className="font-display text-lg font-semibold">Your camp calendar</h2>
        <div className="mt-3">
          <EventList events={events} onDelete={deleteCampEvent} />
        </div>
      </div>

      <form action={continueToDna}>
        <Button type="submit" size="lg">Continue</Button>
      </form>
    </div>
  );
}

async function StepSix({ organizationId, campName }: { organizationId: string; campName: string }) {
  const dna = await getCampDna(organizationId);
  return <DnaPreview campName={campName} dna={dna} />;
}
