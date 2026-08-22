"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { forgotPasswordSchema, resetPasswordSchema, signInSchema, signUpSchema } from "@/lib/validation/schemas";
import { track } from "@/lib/analytics";
import { logger } from "@/lib/logger";
import { brand } from "@/lib/config";

/**
 * Authentication server actions.
 *
 * Next.js server actions are POST-only and origin-checked, which gives us CSRF
 * protection without extra code. Supabase handles password hashing, email
 * verification and reset tokens — we never build any of that ourselves.
 */

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: string;
}

function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}

async function siteOrigin(): Promise<string> {
  const headerList = await headers();
  const origin = headerList.get("origin");
  if (origin) return origin;
  const host = headerList.get("host");
  if (host) return `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
  return brand.siteUrl;
}

export async function signUpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  await track("signup_started");

  const supabase = await createClient();
  const origin = await siteOrigin();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name },
      emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
    },
  });

  if (error) {
    logger.warn("auth.sign_up_failed", { message: error.message });
    // Do not reveal whether an address is already registered.
    if (error.message.toLowerCase().includes("already")) {
      return { error: "We couldn't create that account. If you already have one, try signing in or resetting your password." };
    }
    return { error: "We couldn't create your account just now. Please try again." };
  }

  await track("signup_completed", { userId: data.user?.id ?? null });

  // When email confirmation is on, there is no session yet.
  if (!data.session) {
    redirect(`/check-email?email=${encodeURIComponent(parsed.data.email)}`);
  }

  redirect("/onboarding");
}

export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    logger.warn("auth.sign_in_failed", { message: error.message });
    if (error.message.toLowerCase().includes("not confirmed")) {
      return { error: "Please confirm your email address first. Check your inbox for the link we sent." };
    }
    return { error: "That email and password don't match. Please try again." };
  }

  const nextPath = String(formData.get("next") ?? "");
  redirect(nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard");
}

export async function forgotPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = await createClient();
  const origin = await siteOrigin();

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) logger.warn("auth.reset_request_failed", { message: error.message });

  // Always the same answer, so this cannot be used to discover who has an account.
  return {
    success: "If that email has a CampVoice account, we've sent a reset link. It expires in one hour.",
  };
}

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { error: "That reset link has expired. Please request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    logger.warn("auth.reset_failed", { message: error.message });
    return { error: "We couldn't update your password. Please request a fresh reset link." };
  }

  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
