"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/session";
import { campBasicsSchema, passwordSchema } from "@/lib/validation/schemas";
import { logger } from "@/lib/logger";

export interface SettingsState {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: string;
}

function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}

const nameSchema = z.object({ full_name: z.string().trim().min(1, "Please enter your name.").max(120) });

export async function updateName(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const context = await requireSession();
  const parsed = nameSchema.safeParse({ full_name: formData.get("full_name") });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ full_name: parsed.data.full_name }).eq("id", context.user.id);

  if (error) {
    logger.error("settings.update_name_failed", error);
    return { error: "We couldn't save that. Please try again." };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: "Your name has been updated." };
}

const changePasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((data) => data.password === data.confirm, { message: "Those passwords do not match.", path: ["confirm"] });

export async function changePassword(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  await requireSession();

  const parsed = changePasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    logger.warn("settings.change_password_failed", { message: error.message });
    return { error: "We couldn't change your password. Please sign out, sign back in, and try again." };
  }

  return { ok: "Your password has been changed." };
}

export async function updateCamp(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const context = await requireSession();

  const parsed = campBasicsSchema.safeParse({
    name: formData.get("name"),
    website: formData.get("website"),
    location: formData.get("location"),
    camp_type: formData.get("camp_type"),
    age_range: formData.get("age_range"),
    description: formData.get("description"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };

  const supabase = await createClient();
  const { error } = await supabase.from("organizations").update(parsed.data).eq("id", context.organization.id);

  if (error) {
    logger.error("settings.update_camp_failed", error);
    return { error: "We couldn't save those changes. Please try again." };
  }

  revalidatePath("/settings/camp");
  revalidatePath("/camp-dna");
  revalidatePath("/dashboard");
  return { ok: "Your camp details have been updated." };
}
