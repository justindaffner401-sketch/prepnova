"use client";

import { useActionState } from "react";
import { Alert, Button, Field, Spinner } from "@/components/ui";
import { changePassword, updateCamp, updateName, type SettingsState } from "@/app/(app)/settings/actions";
import type { Organization } from "@/lib/db/types";

const EMPTY: SettingsState = {};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-danger-600">{message}</p>;
}

function Submit({ pending, children }: { pending: boolean; children: string }) {
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (<><Spinner label="Saving" />Saving…</>) : children}
    </Button>
  );
}

export function NameForm({ fullName }: { fullName: string }) {
  const [state, action, pending] = useActionState(updateName, EMPTY);

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.ok ? <Alert tone="success">{state.ok}</Alert> : null}

      <Field label="Your name" htmlFor="full_name" required>
        <input id="full_name" name="full_name" defaultValue={fullName} className="input" required />
        <FieldError message={state.fieldErrors?.full_name} />
      </Field>

      <Submit pending={pending}>Save name</Submit>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, EMPTY);

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.ok ? <Alert tone="success">{state.ok}</Alert> : null}

      <Field label="New password" htmlFor="password" help="At least 10 characters." required>
        <input id="password" name="password" type="password" minLength={10} autoComplete="new-password" className="input" required />
        <FieldError message={state.fieldErrors?.password} />
      </Field>

      <Field label="Confirm new password" htmlFor="confirm" required>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" className="input" required />
        <FieldError message={state.fieldErrors?.confirm} />
      </Field>

      <Submit pending={pending}>Change password</Submit>
    </form>
  );
}

const CAMP_TYPES = [
  "Overnight / sleepaway",
  "Day camp",
  "Both day and overnight",
  "Specialty camp",
  "Family camp",
  "Teen / travel program",
];

export function CampForm({ organization }: { organization: Organization }) {
  const [state, action, pending] = useActionState(updateCamp, EMPTY);

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.ok ? <Alert tone="success">{state.ok}</Alert> : null}

      <Field label="Camp name" htmlFor="name" required>
        <input id="name" name="name" defaultValue={organization.name} className="input" required />
        <FieldError message={state.fieldErrors?.name} />
      </Field>

      <Field label="Website" htmlFor="website">
        <input id="website" name="website" type="url" defaultValue={organization.website ?? ""} className="input" />
        <FieldError message={state.fieldErrors?.website} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Location" htmlFor="location">
          <input id="location" name="location" defaultValue={organization.location ?? ""} className="input" />
        </Field>

        <Field label="Type of camp" htmlFor="camp_type">
          <select id="camp_type" name="camp_type" defaultValue={organization.camp_type ?? ""} className="input">
            <option value="">Choose one</option>
            {CAMP_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Camper age range" htmlFor="age_range">
        <input id="age_range" name="age_range" defaultValue={organization.age_range ?? ""} className="input" />
      </Field>

      <Field label="Short description" htmlFor="description">
        <textarea id="description" name="description" rows={4} defaultValue={organization.description ?? ""} className="input" />
      </Field>

      <Submit pending={pending}>Save camp details</Submit>
    </form>
  );
}
