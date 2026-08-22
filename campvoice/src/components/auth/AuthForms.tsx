"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Alert, Button, Field, Spinner } from "@/components/ui";
import {
  forgotPasswordAction,
  resetPasswordAction,
  signInAction,
  signUpAction,
  type FormState,
} from "@/app/(auth)/actions";

const EMPTY: FormState = {};

function SubmitButton({ pending, children }: { pending: boolean; children: string }) {
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Spinner label="Working" />
          Just a moment…
        </>
      ) : (
        children
      )}
    </Button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-danger-600">{message}</p>;
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpAction, EMPTY);

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}

      <Field label="Your name" htmlFor="full_name" required>
        <input
          id="full_name"
          name="full_name"
          required
          autoComplete="name"
          className="input"
          aria-invalid={Boolean(state.fieldErrors?.full_name)}
        />
        <FieldError message={state.fieldErrors?.full_name} />
      </Field>

      <Field label="Work email" htmlFor="email" required>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="input"
          aria-invalid={Boolean(state.fieldErrors?.email)}
        />
        <FieldError message={state.fieldErrors?.email} />
      </Field>

      <Field label="Password" htmlFor="password" help="At least 10 characters." required>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          className="input"
          aria-describedby="password-help"
          aria-invalid={Boolean(state.fieldErrors?.password)}
        />
        <FieldError message={state.fieldErrors?.password} />
      </Field>

      <SubmitButton pending={pending}>Create my account</SubmitButton>

      <p className="text-center text-sm text-ink-300">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-4 hover:text-ink-700">Terms</Link> and{" "}
        <Link href="/privacy" className="underline underline-offset-4 hover:text-ink-700">Privacy Policy</Link>.
      </p>
    </form>
  );
}

export function SignInForm() {
  const [state, action, pending] = useActionState(signInAction, EMPTY);
  const params = useSearchParams();
  const next = params.get("next") ?? "";
  const linkExpired = params.get("error") === "link_expired";

  return (
    <form action={action} className="space-y-5" noValidate>
      {linkExpired ? (
        <Alert tone="error">That link has expired or was already used. Please sign in, or request a new reset link.</Alert>
      ) : null}
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <input type="hidden" name="next" value={next} />

      <Field label="Email" htmlFor="email" required>
        <input id="email" name="email" type="email" required autoComplete="email" className="input" />
        <FieldError message={state.fieldErrors?.email} />
      </Field>

      <Field label="Password" htmlFor="password" required>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
        <FieldError message={state.fieldErrors?.password} />
      </Field>

      <SubmitButton pending={pending}>Sign in</SubmitButton>

      <p className="text-center text-sm">
        <Link href="/forgot-password" className="text-forest-700 underline underline-offset-4">
          Forgot your password?
        </Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, EMPTY);

  if (state.success) {
    return (
      <Alert tone="success" title="Check your inbox">
        {state.success}
      </Alert>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}

      <Field label="Email" htmlFor="email" required>
        <input id="email" name="email" type="email" required autoComplete="email" className="input" />
        <FieldError message={state.fieldErrors?.email} />
      </Field>

      <SubmitButton pending={pending}>Send reset link</SubmitButton>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetPasswordAction, EMPTY);

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}

      <Field label="New password" htmlFor="password" help="At least 10 characters." required>
        <input id="password" name="password" type="password" required minLength={10} autoComplete="new-password" className="input" />
        <FieldError message={state.fieldErrors?.password} />
      </Field>

      <Field label="Confirm new password" htmlFor="confirm" required>
        <input id="confirm" name="confirm" type="password" required autoComplete="new-password" className="input" />
        <FieldError message={state.fieldErrors?.confirm} />
      </Field>

      <SubmitButton pending={pending}>Save new password</SubmitButton>
    </form>
  );
}
