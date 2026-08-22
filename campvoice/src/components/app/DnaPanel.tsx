"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Card, Spinner } from "@/components/ui";
import { CampDnaEditor } from "@/components/onboarding/Wizard";
import { DnaSummary } from "@/components/onboarding/DnaPreview";
import { generateCampDna } from "@/app/onboarding/actions";
import type { CampDna } from "@/lib/db/types";

/**
 * View, edit or rebuild Camp DNA.
 *
 * A rebuild NEVER silently overwrites wording a human wrote: if the DNA has
 * been edited, we ask first and say plainly what will be lost.
 */
export function DnaPanel({
  campName,
  dna,
  sourcesChanged,
}: {
  campName: string;
  dna: CampDna | null;
  sourcesChanged: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmRebuild, setConfirmRebuild] = useState(false);
  const [error, setError] = useState("");
  const [building, startBuild] = useTransition();

  function rebuild() {
    setError("");
    setConfirmRebuild(false);
    startBuild(async () => {
      const result = await generateCampDna();
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  function requestRebuild() {
    if (dna?.edited_by_user) setConfirmRebuild(true);
    else rebuild();
  }

  if (editing) {
    return (
      <Card className="p-6 sm:p-8">
        <h3 className="font-display text-lg font-semibold">Edit your Camp DNA</h3>
        <p className="mt-1 text-sm prose-camp">Your words always win. CampVoice will use exactly what you write here.</p>
        <div className="mt-5">
          <CampDnaEditor
            dna={dna}
            onSaved={() => {
              setEditing(false);
              router.refresh();
            }}
          />
        </div>
        <Button variant="ghost" className="mt-3" onClick={() => setEditing(false)}>Cancel</Button>
      </Card>
    );
  }

  if (!dna?.voice_summary && !dna?.built_at) {
    return (
      <Card className="px-6 py-10 text-center">
        {error ? <div className="mb-5"><Alert tone="error">{error}</Alert></div> : null}
        <h3 className="font-display text-lg font-semibold">No Camp DNA yet</h3>
        <p className="mx-auto mt-2 max-w-md prose-camp">
          Once you have added some camp information, CampVoice can build the profile it uses for every draft.
        </p>
        <Button className="mt-5" onClick={rebuild} disabled={building}>
          {building ? (<><Spinner label="Building" />Building…</>) : "Build my Camp DNA"}
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <Alert tone="error">{error}</Alert> : null}

      {sourcesChanged ? (
        <Alert tone="info">
          You have added or changed camp material since this Camp DNA was built. Rebuilding will bring it up to date.
        </Alert>
      ) : null}

      {confirmRebuild ? (
        <Alert tone="error" title="This will replace your edits">
          <p className="mt-1">
            You have edited this Camp DNA by hand. Rebuilding replaces every field with a freshly written version, and
            your wording will be lost.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={rebuild}>Rebuild anyway</Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmRebuild(false)}>Keep my version</Button>
          </div>
        </Alert>
      ) : null}

      <DnaSummary campName={campName} dna={dna} />

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setEditing(true)}>Edit Camp DNA</Button>
        <Button variant="ghost" onClick={requestRebuild} disabled={building}>
          {building ? (<><Spinner label="Rebuilding" />Rebuilding…</>) : "Rebuild Camp DNA"}
        </Button>
      </div>

      {dna.built_at ? (
        <p className="text-sm text-ink-300">
          Last built{" "}
          {new Date(dna.built_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}.
        </p>
      ) : null}
    </div>
  );
}
