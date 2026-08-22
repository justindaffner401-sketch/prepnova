"use client";

import { useActionState, useState } from "react";
import { Alert, Button, Field, Spinner } from "@/components/ui";
import { VOICE_TRAITS } from "@/lib/validation/schemas";
import {
  addCampEvent,
  saveCampBasics,
  saveCampDetails,
  saveCampDna,
  saveCampVoice,
  savePastedExamples,
  type StepState,
} from "@/app/onboarding/actions";
import type { CampDna, CampEvent, CampProfile, CampTerminology, Organization } from "@/lib/db/types";

const EMPTY: StepState = {};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-danger-600">{message}</p>;
}

function Submit({ pending, children = "Continue" }: { pending: boolean; children?: string }) {
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? (
        <>
          <Spinner label="Saving" />
          Saving…
        </>
      ) : (
        children
      )}
    </Button>
  );
}

/* ------------------------------ Step 1: Your Camp ------------------------------ */

const CAMP_TYPES = [
  "Overnight / sleepaway",
  "Day camp",
  "Both day and overnight",
  "Specialty camp",
  "Family camp",
  "Teen / travel program",
];

export function StepCamp({ organization }: { organization: Organization | null }) {
  const [state, action, pending] = useActionState(saveCampBasics, EMPTY);

  return (
    <form action={action} className="space-y-6" noValidate>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}

      <Field label="Camp name" htmlFor="name" required>
        <input id="name" name="name" required defaultValue={organization?.name ?? ""} className="input" placeholder="Camp Evergreen" />
        <FieldError message={state.fieldErrors?.name} />
      </Field>

      <Field label="Website" htmlFor="website" help="We can import your public pages in a later step.">
        <input id="website" name="website" type="url" defaultValue={organization?.website ?? ""} className="input" placeholder="https://campevergreen.com" />
        <FieldError message={state.fieldErrors?.website} />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Location" htmlFor="location">
          <input id="location" name="location" defaultValue={organization?.location ?? ""} className="input" placeholder="Pocono Mountains, Pennsylvania" />
        </Field>

        <Field label="Type of camp" htmlFor="camp_type">
          <select id="camp_type" name="camp_type" defaultValue={organization?.camp_type ?? ""} className="input">
            <option value="">Choose one</option>
            {CAMP_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Camper age range" htmlFor="age_range">
        <input id="age_range" name="age_range" defaultValue={organization?.age_range ?? ""} className="input" placeholder="7 to 16" />
      </Field>

      <Field label="Short description" htmlFor="description" help="A few sentences about your camp, in your own words.">
        <textarea id="description" name="description" rows={4} defaultValue={organization?.description ?? ""} className="input" />
      </Field>

      <Submit pending={pending} />
    </form>
  );
}

/* ---------------------------- Step 2: About Camp ---------------------------- */

interface TermRow {
  standard_term: string;
  camp_term: string;
  note: string;
}

export function StepAbout({
  profile,
  terminology,
}: {
  profile: CampProfile | null;
  terminology: CampTerminology[];
}) {
  const [state, action, pending] = useActionState(saveCampDetails, EMPTY);
  const [terms, setTerms] = useState<TermRow[]>(() =>
    terminology.length > 0
      ? terminology.map((term) => ({ standard_term: term.standard_term, camp_term: term.camp_term, note: term.note ?? "" }))
      : [{ standard_term: "", camp_term: "", note: "" }],
  );

  function updateTerm(index: number, patch: Partial<TermRow>) {
    setTerms((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  const payload = JSON.stringify(
    terms
      .filter((term) => term.standard_term.trim() && term.camp_term.trim())
      .map((term) => ({
        standard_term: term.standard_term.trim(),
        camp_term: term.camp_term.trim(),
        note: term.note.trim() || undefined,
      })),
  );

  return (
    <form action={action} className="space-y-6" noValidate>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <input type="hidden" name="terminology" value={payload} />

      <Field label="Programs and activities" htmlFor="programs" help="Everything you offer. One per line is fine.">
        <textarea id="programs" name="programs" rows={5} defaultValue={profile?.programs ?? ""} className="input" placeholder={"Waterfront and sailing\nHorseback riding\nCeramics studio\nRopes course"} />
      </Field>

      <Field label="Traditions" htmlFor="traditions" help="Color War, Visiting Day, the opening campfire, anything that matters.">
        <textarea id="traditions" name="traditions" rows={5} defaultValue={profile?.traditions ?? ""} className="input" placeholder={"Color War, always announced by surprise\nFriday night campfire\nBanquet on the last night"} />
      </Field>

      <fieldset className="space-y-3">
        <legend className="field-label">Camp terminology</legend>
        <p className="field-help">
          The words your camp uses instead of the standard ones. CampVoice will use yours every time.
        </p>

        <div className="space-y-3">
          {terms.map((term, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-start">
              <div>
                <label className="sr-only" htmlFor={`standard-${index}`}>Standard word</label>
                <input
                  id={`standard-${index}`}
                  className="input"
                  placeholder="Cabins"
                  value={term.standard_term}
                  onChange={(event) => updateTerm(index, { standard_term: event.target.value })}
                />
              </div>
              <div>
                <label className="sr-only" htmlFor={`camp-${index}`}>What your camp calls it</label>
                <input
                  id={`camp-${index}`}
                  className="input"
                  placeholder="Bunks"
                  value={term.camp_term}
                  onChange={(event) => updateTerm(index, { camp_term: event.target.value })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="sm:mt-1"
                onClick={() => setTerms((rows) => rows.filter((_, i) => i !== index))}
                aria-label={`Remove terminology row ${index + 1}`}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>

        <Button type="button" variant="secondary" size="sm" onClick={() => setTerms((rows) => [...rows, { standard_term: "", camp_term: "", note: "" }])}>
          Add another
        </Button>
      </fieldset>

      <Submit pending={pending} />
    </form>
  );
}

/* ---------------------------- Step 3: Your Voice ---------------------------- */

const AVOID_SUGGESTIONS = [
  "Excessive emojis",
  "Exclamation points",
  "Corporate language",
  "Slang",
  "Words like 'journey' or 'unlock'",
];

export function StepVoice({ profile }: { profile: CampProfile | null }) {
  const [state, action, pending] = useActionState(saveCampVoice, EMPTY);
  const [selected, setSelected] = useState<string[]>(profile?.voice_traits ?? []);
  const [avoid, setAvoid] = useState<string[]>(profile?.avoid_list ?? []);
  const [avoidDraft, setAvoidDraft] = useState("");

  function toggleTrait(trait: string) {
    setSelected((current) => (current.includes(trait) ? current.filter((item) => item !== trait) : [...current, trait]));
  }

  function addAvoid(value: string) {
    const trimmed = value.trim();
    if (!trimmed || avoid.includes(trimmed)) return;
    setAvoid((current) => [...current, trimmed]);
    setAvoidDraft("");
  }

  return (
    <form action={action} className="space-y-7" noValidate>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}

      <fieldset>
        <legend className="field-label">How should CampVoice sound?</legend>
        <p className="field-help mt-1">Pick as many as fit. Most camps choose three or four.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {VOICE_TRAITS.map((trait) => {
            const isSelected = selected.includes(trait);
            return (
              <button
                key={trait}
                type="button"
                onClick={() => toggleTrait(trait)}
                aria-pressed={isSelected}
                className={`chip ${isSelected ? "chip-selected" : ""}`}
              >
                {isSelected ? (
                  <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path d="M3 8.5 6.5 12 13 4.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
                {trait}
              </button>
            );
          })}
        </div>
        {selected.map((trait) => (
          <input key={trait} type="hidden" name="voice_traits" value={trait} />
        ))}
      </fieldset>

      <fieldset>
        <legend className="field-label">Anything CampVoice should avoid?</legend>
        <p className="field-help mt-1">Words, habits or phrases you never want to see.</p>

        {avoid.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {avoid.map((item) => (
              <li key={item}>
                <span className="chip chip-selected">
                  {item}
                  <button
                    type="button"
                    onClick={() => setAvoid((current) => current.filter((value) => value !== item))}
                    aria-label={`Remove ${item}`}
                    className="ml-0.5 text-forest-700/70 hover:text-forest-700"
                  >
                    ×
                  </button>
                </span>
                <input type="hidden" name="avoid_list" value={item} />
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-3 flex gap-2">
          <label className="sr-only" htmlFor="avoid-input">Add something to avoid</label>
          <input
            id="avoid-input"
            className="input"
            value={avoidDraft}
            placeholder="e.g. phrases we never use"
            onChange={(event) => setAvoidDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addAvoid(avoidDraft);
              }
            }}
          />
          <Button type="button" variant="secondary" onClick={() => addAvoid(avoidDraft)}>
            Add
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {AVOID_SUGGESTIONS.filter((suggestion) => !avoid.includes(suggestion)).map((suggestion) => (
            <button key={suggestion} type="button" onClick={() => addAvoid(suggestion)} className="chip text-xs hover:bg-paper-300">
              + {suggestion}
            </button>
          ))}
        </div>
      </fieldset>

      <Field label="Who do you write to most?" htmlFor="audience">
        <input id="audience" name="audience" defaultValue={profile?.audience ?? ""} className="input" placeholder="Current camp parents, prospective families, alumni" />
      </Field>

      <Field label="Anything else about how you communicate?" htmlFor="communication_notes">
        <textarea id="communication_notes" name="communication_notes" rows={3} defaultValue={profile?.communication_notes ?? ""} className="input" placeholder="e.g. we always sign off from the whole leadership team, never one person" />
      </Field>

      <Submit pending={pending} />
    </form>
  );
}

/* -------------------------- Step 4: Paste examples -------------------------- */

export function PasteExamplesForm({ profile }: { profile: CampProfile | null }) {
  const [state, action, pending] = useActionState(savePastedExamples, EMPTY);

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.ok ? <Alert tone="success">Saved. CampVoice will study these.</Alert> : null}

      <Field
        label="Paste examples"
        htmlFor="pasted_examples"
        help="Emails, newsletters, social posts, or other communications that sound like your camp."
      >
        <textarea
          id="pasted_examples"
          name="pasted_examples"
          rows={10}
          defaultValue={profile?.pasted_examples ?? ""}
          className="input font-mono text-sm"
          placeholder="Paste anything here. The more your real writing CampVoice sees, the better it sounds like you."
        />
      </Field>

      <Submit pending={pending}>Save examples</Submit>
    </form>
  );
}

/* --------------------------- Step 5: Important dates --------------------------- */

const EVENT_TYPE_OPTIONS = [
  { value: "enrollment_opens", label: "Enrollment opens" },
  { value: "camp_start", label: "Camp starts" },
  { value: "camp_end", label: "Camp ends" },
  { value: "visiting_day", label: "Visiting Day" },
  { value: "open_house", label: "Open house" },
  { value: "reunion", label: "Reunion" },
  { value: "staff_arrival", label: "Staff arrival" },
  { value: "staff_applications", label: "Staff applications open" },
  { value: "deadline", label: "Deadline" },
  { value: "custom", label: "Something else" },
];

export function AddEventForm() {
  const [state, action, pending] = useActionState(addCampEvent, EMPTY);
  const [resetKey, setResetKey] = useState(0);

  return (
    <form
      key={resetKey}
      action={async (formData) => {
        await action(formData);
        setResetKey((value) => value + 1);
      }}
      className="space-y-4"
      noValidate
    >
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="What is it?" htmlFor="title" required>
          <input id="title" name="title" required className="input" placeholder="Visiting Day" />
          <FieldError message={state.fieldErrors?.title} />
        </Field>

        <Field label="Type" htmlFor="event_type">
          <select id="event_type" name="event_type" className="input" defaultValue="custom">
            {EVENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date" htmlFor="starts_on" required>
          <input id="starts_on" name="starts_on" type="date" required className="input" />
          <FieldError message={state.fieldErrors?.starts_on} />
        </Field>

        <Field label="End date" htmlFor="ends_on" help="Only if it runs more than one day.">
          <input id="ends_on" name="ends_on" type="date" className="input" />
          <FieldError message={state.fieldErrors?.ends_on} />
        </Field>
      </div>

      <Field label="Notes" htmlFor="notes">
        <input id="notes" name="notes" className="input" placeholder="Gates open at 10am" />
      </Field>

      <Submit pending={pending}>Add this date</Submit>
    </form>
  );
}

export function EventList({ events, onDelete }: { events: CampEvent[]; onDelete: (formData: FormData) => Promise<void> }) {
  if (events.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-paper-400 px-4 py-8 text-center text-sm text-ink-300">
        Add important camp dates and CampVoice can recommend timely communications.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-paper-300 rounded-lg border border-paper-300 bg-paper-50">
      {events.map((event) => (
        <li key={event.id} className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-medium text-ink-900">{event.title}</p>
            <p className="text-sm text-ink-300">
              {event.starts_on}
              {event.ends_on && event.ends_on !== event.starts_on ? ` – ${event.ends_on}` : ""}
              {event.notes ? ` · ${event.notes}` : ""}
            </p>
          </div>
          <form action={onDelete}>
            <input type="hidden" name="id" value={event.id} />
            <Button type="submit" variant="ghost" size="sm" aria-label={`Remove ${event.title}`}>
              Remove
            </Button>
          </form>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------ Step 6: Camp DNA ------------------------------ */

export function CampDnaEditor({ dna, onSaved }: { dna: CampDna | null; onSaved?: () => void }) {
  const [state, action, pending] = useActionState(saveCampDna, EMPTY);

  return (
    <form
      action={async (formData) => {
        await action(formData);
        onSaved?.();
      }}
      className="space-y-5"
      noValidate
    >
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.ok ? <Alert tone="success">Camp DNA saved. CampVoice will use this from now on.</Alert> : null}

      <Field label="Voice" htmlFor="voice_summary" help="How your camp sounds when it writes.">
        <textarea id="voice_summary" name="voice_summary" rows={3} defaultValue={dna?.voice_summary ?? ""} className="input" />
      </Field>

      <Field label="Terminology" htmlFor="terminology_summary" help="The words your camp uses, including capitalisation that matters.">
        <textarea id="terminology_summary" name="terminology_summary" rows={3} defaultValue={dna?.terminology_summary ?? ""} className="input" />
      </Field>

      <Field label="Core themes" htmlFor="core_themes" help="One per line.">
        <textarea id="core_themes" name="core_themes" rows={4} defaultValue={(dna?.core_themes ?? []).join("\n")} className="input" />
      </Field>

      <Field label="Communication style" htmlFor="style_notes">
        <textarea id="style_notes" name="style_notes" rows={4} defaultValue={dna?.style_notes ?? ""} className="input" />
      </Field>

      <Field label="Audience" htmlFor="audience_notes">
        <textarea id="audience_notes" name="audience_notes" rows={3} defaultValue={dna?.audience_notes ?? ""} className="input" />
      </Field>

      <Field label="Things to avoid" htmlFor="avoid_notes">
        <textarea id="avoid_notes" name="avoid_notes" rows={3} defaultValue={dna?.avoid_notes ?? ""} className="input" />
      </Field>

      <Submit pending={pending}>Save Camp DNA</Submit>
    </form>
  );
}
