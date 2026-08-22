"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserOnly, getSessionContext } from "@/lib/auth/session";
import { loadCampContext } from "@/lib/data/camp";
import { buildCampDna } from "@/lib/ai/camp-dna";
import { AiUnavailableError } from "@/lib/ai/provider";
import { recordUsage } from "@/lib/ai/usage";
import { track } from "@/lib/analytics";
import { logger } from "@/lib/logger";
import { trial } from "@/lib/config";
import {
  campBasicsSchema,
  campDetailsSchema,
  campDnaEditSchema,
  campEventSchema,
  campVoiceSchema,
  pasteExamplesSchema,
} from "@/lib/validation/schemas";

/**
 * Onboarding server actions.
 *
 * Two rules hold everywhere in this file:
 *  - The organization is resolved from the signed-in user's membership, never
 *    from anything the form sent.
 *  - Each step saves on its own, so a director can stop halfway and come back.
 */

export interface StepState {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
}

function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "camp"}-${crypto.randomUUID().slice(0, 6)}`;
}

/** Resolves the caller's organization, or null when they have not created one. */
async function currentOrganizationId(): Promise<string | null> {
  const context = await getSessionContext();
  return context?.organization.id ?? null;
}

async function advanceStep(organizationId: string, step: number) {
  const supabase = await createClient();
  await supabase
    .from("organizations")
    .update({ onboarding_step: step })
    .eq("id", organizationId)
    .lt("onboarding_step", step);
}

// ------------------------------- step 1: camp -------------------------------

export async function saveCampBasics(_prev: StepState, formData: FormData): Promise<StepState> {
  const user = await getUserOnly();
  if (!user) redirect("/sign-in");

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
  const existingId = await currentOrganizationId();

  if (existingId) {
    const { error } = await supabase.from("organizations").update(parsed.data).eq("id", existingId);
    if (error) {
      logger.error("onboarding.update_org_failed", error);
      return { error: "We couldn't save that just now. Please try again." };
    }
    await advanceStep(existingId, 2);
  } else {
    const { data: organization, error } = await supabase
      .from("organizations")
      .insert({ ...parsed.data, slug: slugify(parsed.data.name), created_by: user.id, onboarding_step: 2 })
      .select("id")
      .single<{ id: string }>();

    if (error || !organization) {
      logger.error("onboarding.create_org_failed", error);
      return { error: "We couldn't create your camp just now. Please try again." };
    }

    const { error: memberError } = await supabase
      .from("organization_members")
      .insert({ organization_id: organization.id, user_id: user.id, role: "owner" });

    if (memberError) {
      logger.error("onboarding.create_membership_failed", memberError);
      return { error: "We couldn't finish setting up your camp. Please try again." };
    }

    // Start the free trial. Stripe becomes the source of truth as soon as the
    // camp subscribes; until then this row records the trial we granted.
    const trialEnds = new Date(Date.now() + trial.days * 86_400_000).toISOString();
    await supabase.from("subscriptions").insert({
      organization_id: organization.id,
      status: "trialing",
      trial_ends_at: trialEnds,
    });

    await track("trial_started", { organizationId: organization.id, userId: user.id, properties: { days: trial.days } });
  }

  revalidatePath("/onboarding");
  redirect("/onboarding?step=2");
}

// ------------------------- step 2: about camp -------------------------

export async function saveCampDetails(_prev: StepState, formData: FormData): Promise<StepState> {
  const organizationId = await currentOrganizationId();
  if (!organizationId) redirect("/onboarding");

  let terminology: unknown = [];
  try {
    terminology = JSON.parse(String(formData.get("terminology") ?? "[]"));
  } catch {
    terminology = [];
  }

  const parsed = campDetailsSchema.safeParse({
    programs: formData.get("programs"),
    traditions: formData.get("traditions"),
    terminology,
  });

  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };

  const supabase = await createClient();

  const { error } = await supabase.from("camp_profiles").upsert(
    { organization_id: organizationId, programs: parsed.data.programs, traditions: parsed.data.traditions },
    { onConflict: "organization_id" },
  );

  if (error) {
    logger.error("onboarding.save_details_failed", error);
    return { error: "We couldn't save that just now. Please try again." };
  }

  // Terminology is small; replacing it wholesale keeps the UI honest.
  await supabase.from("camp_terminology").delete().eq("organization_id", organizationId);
  if (parsed.data.terminology.length > 0) {
    await supabase.from("camp_terminology").insert(
      parsed.data.terminology.map((term) => ({ ...term, organization_id: organizationId })),
    );
  }

  await advanceStep(organizationId, 3);
  await track("onboarding_step_completed", { organizationId, properties: { step: 2 } });
  revalidatePath("/onboarding");
  redirect("/onboarding?step=3");
}

// ---------------------------- step 3: your voice ----------------------------

export async function saveCampVoice(_prev: StepState, formData: FormData): Promise<StepState> {
  const organizationId = await currentOrganizationId();
  if (!organizationId) redirect("/onboarding");

  const parsed = campVoiceSchema.safeParse({
    voice_traits: formData.getAll("voice_traits").map(String),
    avoid_list: formData
      .getAll("avoid_list")
      .map(String)
      .filter((value) => value.trim().length > 0),
    audience: formData.get("audience"),
    communication_notes: formData.get("communication_notes"),
  });

  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };

  const supabase = await createClient();
  const { error } = await supabase.from("camp_profiles").upsert(
    {
      organization_id: organizationId,
      voice_traits: parsed.data.voice_traits,
      avoid_list: parsed.data.avoid_list,
      audience: parsed.data.audience,
      communication_notes: parsed.data.communication_notes,
    },
    { onConflict: "organization_id" },
  );

  if (error) {
    logger.error("onboarding.save_voice_failed", error);
    return { error: "We couldn't save that just now. Please try again." };
  }

  await advanceStep(organizationId, 4);
  await track("onboarding_step_completed", { organizationId, properties: { step: 3 } });
  revalidatePath("/onboarding");
  redirect("/onboarding?step=4");
}

// ------------------------- step 4: teach CampVoice -------------------------

export async function savePastedExamples(_prev: StepState, formData: FormData): Promise<StepState> {
  const organizationId = await currentOrganizationId();
  if (!organizationId) redirect("/onboarding");

  const parsed = pasteExamplesSchema.safeParse({ pasted_examples: formData.get("pasted_examples") });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };

  const supabase = await createClient();
  const { error } = await supabase.from("camp_profiles").upsert(
    { organization_id: organizationId, pasted_examples: parsed.data.pasted_examples },
    { onConflict: "organization_id" },
  );

  if (error) {
    logger.error("onboarding.save_examples_failed", error);
    return { error: "We couldn't save that just now. Please try again." };
  }

  revalidatePath("/onboarding");
  return { ok: true };
}

export async function continueToDates(): Promise<void> {
  const organizationId = await currentOrganizationId();
  if (!organizationId) redirect("/onboarding");
  await advanceStep(organizationId, 5);
  await track("onboarding_step_completed", { organizationId, properties: { step: 4 } });
  redirect("/onboarding?step=5");
}

// --------------------------- step 5: important dates ---------------------------

export async function addCampEvent(_prev: StepState, formData: FormData): Promise<StepState> {
  const organizationId = await currentOrganizationId();
  if (!organizationId) redirect("/onboarding");

  const parsed = campEventSchema.safeParse({
    title: formData.get("title"),
    event_type: formData.get("event_type") || "custom",
    starts_on: formData.get("starts_on"),
    ends_on: formData.get("ends_on") ?? "",
    notes: formData.get("notes"),
  });

  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };

  const supabase = await createClient();
  const { error } = await supabase.from("camp_events").insert({ ...parsed.data, organization_id: organizationId });

  if (error) {
    logger.error("onboarding.add_event_failed", error);
    return { error: "We couldn't save that date. Please try again." };
  }

  revalidatePath("/onboarding");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteCampEvent(formData: FormData): Promise<void> {
  const organizationId = await currentOrganizationId();
  if (!organizationId) redirect("/onboarding");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  // Scoped by organization as well as id, so an id from elsewhere matches nothing.
  await supabase.from("camp_events").delete().eq("id", id).eq("organization_id", organizationId);

  revalidatePath("/onboarding");
  revalidatePath("/dashboard");
  revalidatePath("/camp-dna");
}

export async function continueToDna(): Promise<void> {
  const organizationId = await currentOrganizationId();
  if (!organizationId) redirect("/onboarding");
  await advanceStep(organizationId, 6);
  await track("onboarding_step_completed", { organizationId, properties: { step: 5 } });
  redirect("/onboarding?step=6");
}

// ---------------------------- step 6: Camp DNA ----------------------------

export async function generateCampDna(): Promise<StepState> {
  const context = await getSessionContext();
  if (!context) redirect("/sign-in");

  const camp = await loadCampContext(context.organization);
  const supabase = await createClient();

  try {
    const built = await buildCampDna(camp);

    await recordUsage({
      organizationId: context.organization.id,
      userId: context.user.id,
      operation: "camp_dna_build",
      model: built.model,
      inputTokens: built.inputTokens,
      outputTokens: built.outputTokens,
      succeeded: true,
    });

    const { error } = await supabase.from("camp_dna").upsert(
      {
        organization_id: context.organization.id,
        ...built.draft,
        source_fingerprint: built.fingerprint,
        built_at: new Date().toISOString(),
        // A fresh build is machine-written until a human edits it.
        edited_by_user: false,
      },
      { onConflict: "organization_id" },
    );

    if (error) throw error;

    await track("camp_dna_created", { organizationId: context.organization.id, userId: context.user.id });
    revalidatePath("/onboarding");
    revalidatePath("/camp-dna");
    return { ok: true };
  } catch (error) {
    await recordUsage({
      organizationId: context.organization.id,
      userId: context.user.id,
      operation: "camp_dna_build",
      model: "unknown",
      inputTokens: 0,
      outputTokens: 0,
      succeeded: false,
      errorCode: error instanceof AiUnavailableError ? error.reason : "unknown",
    });
    logger.error("onboarding.dna_build_failed", error);

    if (error instanceof AiUnavailableError && error.reason === "not_configured") {
      return { error: "CampVoice's AI service isn't configured yet. Your camp information is saved — please contact support." };
    }
    return { error: "We couldn't build your Camp DNA right now. Your information is safe. Try again in a moment." };
  }
}

export async function saveCampDna(_prev: StepState, formData: FormData): Promise<StepState> {
  const organizationId = await currentOrganizationId();
  if (!organizationId) redirect("/onboarding");

  const parsed = campDnaEditSchema.safeParse({
    voice_summary: formData.get("voice_summary") ?? "",
    terminology_summary: formData.get("terminology_summary") ?? "",
    core_themes: String(formData.get("core_themes") ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    style_notes: formData.get("style_notes") ?? "",
    audience_notes: formData.get("audience_notes") ?? "",
    avoid_notes: formData.get("avoid_notes") ?? "",
  });

  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };

  const supabase = await createClient();
  const { error } = await supabase.from("camp_dna").upsert(
    {
      organization_id: organizationId,
      ...parsed.data,
      // Mark it as human-authored so a later rebuild asks before overwriting.
      edited_by_user: true,
    },
    { onConflict: "organization_id" },
  );

  if (error) {
    logger.error("onboarding.save_dna_failed", error);
    return { error: "We couldn't save your changes. Please try again." };
  }

  await track("camp_dna_updated", { organizationId });
  revalidatePath("/onboarding");
  revalidatePath("/camp-dna");
  return { ok: true };
}

export async function finishOnboarding(): Promise<void> {
  const organizationId = await currentOrganizationId();
  if (!organizationId) redirect("/onboarding");

  const supabase = await createClient();
  await supabase
    .from("organizations")
    .update({ onboarding_step: 6, onboarding_completed_at: new Date().toISOString() })
    .eq("id", organizationId);

  await track("onboarding_completed", { organizationId });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
