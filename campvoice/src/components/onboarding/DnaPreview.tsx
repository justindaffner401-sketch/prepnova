"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Spinner } from "@/components/ui";
import { CampDnaEditor } from "./Wizard";
import { generateCampDna, finishOnboarding } from "@/app/onboarding/actions";
import type { CampDna } from "@/lib/db/types";

/**
 * The Camp DNA preview: build it, read what CampVoice understood, edit anything
 * that is wrong, then confirm. The user is never forced to accept the machine's
 * wording.
 */
export function DnaPreview({ campName, dna }: { campName: string; dna: CampDna | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [building, startBuild] = useTransition();
  const [finishing, startFinish] = useTransition();

  function build() {
    setError("");
    startBuild(async () => {
      const result = await generateCampDna();
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  if (!dna?.built_at && !dna?.voice_summary) {
    return (
      <div className="space-y-5">
        {error ? <Alert tone="error">{error}</Alert> : null}

        <div className="card px-6 py-10 text-center">
          <h3 className="font-display text-xl font-semibold">Ready to build your Camp DNA</h3>
          <p className="mx-auto mt-2 max-w-md prose-camp">
            CampVoice will read everything you have given it and write back what it understood about how {campName}{" "}
            communicates. You can edit every word of it.
          </p>
          <Button size="lg" className="mt-6" onClick={build} disabled={building}>
            {building ? (
              <>
                <Spinner label="Building" />
                Reading your camp…
              </>
            ) : (
              "Build my Camp DNA"
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error ? <Alert tone="error">{error}</Alert> : null}

      {editing ? (
        <div className="card p-6">
          <h3 className="font-display text-lg font-semibold">Edit your Camp DNA</h3>
          <p className="mt-1 text-sm prose-camp">Change anything that is not quite right. Your words always win.</p>
          <div className="mt-5">
            <CampDnaEditor
              dna={dna}
              onSaved={() => {
                setEditing(false);
                router.refresh();
              }}
            />
          </div>
          <Button variant="ghost" className="mt-3" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <>
          <DnaSummary campName={campName} dna={dna} />

          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              onClick={() =>
                startFinish(async () => {
                  await finishOnboarding();
                })
              }
              disabled={finishing}
            >
              {finishing ? (
                <>
                  <Spinner label="Finishing" />
                  Setting up…
                </>
              ) : (
                "Looks good"
              )}
            </Button>
            <Button variant="secondary" size="lg" onClick={() => setEditing(true)}>
              Edit Camp DNA
            </Button>
            <Button variant="ghost" size="lg" onClick={build} disabled={building}>
              {building ? "Rebuilding…" : "Rebuild"}
            </Button>
          </div>

          <p className="text-sm text-ink-300">You can change your Camp DNA at any time from the Camp DNA page.</p>
        </>
      )}
    </div>
  );
}

export function DnaSummary({ campName, dna }: { campName: string; dna: CampDna }) {
  const sections = [
    { label: "Voice", value: dna.voice_summary },
    { label: "Terminology", value: dna.terminology_summary },
    { label: "Core themes", value: dna.core_themes.join("\n") },
    { label: "Communication style", value: dna.style_notes },
    { label: "Audience", value: dna.audience_notes },
    { label: "Things to avoid", value: dna.avoid_notes },
  ].filter((section) => section.value?.trim());

  return (
    <div className="card p-6">
      <p className="text-sm text-ink-500">CampVoice understands {campName} as:</p>
      <dl className="mt-5 space-y-5">
        {sections.map((section) => (
          <div key={section.label}>
            <dt className="text-sm font-semibold text-forest-700">{section.label}</dt>
            <dd className="mt-1 whitespace-pre-line prose-camp">{section.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
