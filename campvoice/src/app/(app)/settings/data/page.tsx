import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { getSourceDocuments, listContent } from "@/lib/data/camp";
import { brand } from "@/lib/config";
import { Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "Your data",
  robots: { index: false, follow: false },
};

export default async function DataSettingsPage() {
  const context = await requireSession();
  const [documents, content] = await Promise.all([
    getSourceDocuments(context.organization.id),
    listContent({ organizationId: context.organization.id, pageSize: 5 }),
  ]);

  return (
    <div className="space-y-6">
      <Card className="p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold">What CampVoice holds for you</h2>
        <dl className="mt-5 grid gap-4 sm:grid-cols-3">
          <Stat label="Saved communications" value={content.total} />
          <Stat label="Uploaded materials" value={documents.length} />
          <Stat label="Camp profile" value={context.organization.onboarding_completed_at ? "Complete" : "In progress"} />
        </dl>
        <p className="mt-6 text-sm prose-camp">
          CampVoice deliberately holds no camper records, no parent database and no health information. A first name you
          type into one communication is stored with that draft only.
        </p>
      </Card>

      <Card className="p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold">Download your data</h2>
        <p className="mt-1 text-sm prose-camp">
          One JSON file with your camp profile, Camp DNA, terminology, dates and every communication you have created.
        </p>
        <a href="/api/camp/export" className="btn btn-secondary mt-5" download>
          Download my data
        </a>
      </Card>

      <Card className="p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold">Delete things</h2>
        <div className="mt-4 space-y-4 text-sm prose-camp">
          <p>
            Individual communications can be deleted from the{" "}
            <Link href="/content" className="text-forest-700 underline underline-offset-4">content library</Link>. Uploaded
            files and imported pages can be removed on the{" "}
            <Link href="/camp-dna#knowledge" className="text-forest-700 underline underline-offset-4">Camp DNA page</Link>.
          </p>
          <p>
            To delete your whole account and everything in it, email{" "}
            <a href={`mailto:${brand.supportEmail}?subject=Delete%20my%20CampVoice%20account`} className="text-forest-700 underline underline-offset-4">
              {brand.supportEmail}
            </a>{" "}
            from the address on your account. We remove it from our live systems and confirm when it is done. Account
            deletion is handled by a person on purpose, so it cannot happen by accident.
          </p>
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-paper-300 bg-paper-100/60 p-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-300">{label}</dt>
      <dd className="mt-1 font-display text-2xl font-semibold text-ink-900">{value}</dd>
    </div>
  );
}
