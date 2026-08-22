"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/session";
import { getContent } from "@/lib/data/camp";
import { saveContentSchema } from "@/lib/validation/schemas";
import { track } from "@/lib/analytics";
import { logger } from "@/lib/logger";

/**
 * Content library actions.
 *
 * Every one of these scopes its query by the caller's organization id as well
 * as the row id, so a content id belonging to another camp simply matches
 * nothing — no error, no data.
 */

export interface ContentActionState {
  error?: string;
  ok?: boolean;
}

export async function saveContent(_prev: ContentActionState, formData: FormData): Promise<ContentActionState> {
  const context = await requireSession();

  const parsed = saveContentSchema.safeParse({
    content_id: formData.get("content_id"),
    edited_output: formData.get("edited_output") ?? undefined,
    title: formData.get("title") || undefined,
  });

  if (!parsed.success) return { error: "We couldn't save those changes. Please try again." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("content_generations")
    .update({
      edited_output: parsed.data.edited_output ?? null,
      ...(parsed.data.title ? { title: parsed.data.title } : {}),
      status: "saved",
    })
    .eq("id", parsed.data.content_id)
    .eq("organization_id", context.organization.id);

  if (error) {
    logger.error("content.save_failed", error);
    return { error: "We couldn't save those changes. Please try again." };
  }

  await track("content_saved", { organizationId: context.organization.id, userId: context.user.id });
  revalidatePath(`/content/${parsed.data.content_id}`);
  revalidatePath("/content");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function toggleFavorite(formData: FormData): Promise<void> {
  const context = await requireSession();
  const id = String(formData.get("content_id") ?? "");
  if (!id) return;

  const existing = await getContent(context.organization.id, id);
  if (!existing) return;

  const supabase = await createClient();
  await supabase
    .from("content_generations")
    .update({ is_favorite: !existing.is_favorite })
    .eq("id", id)
    .eq("organization_id", context.organization.id);

  revalidatePath(`/content/${id}`);
  revalidatePath("/content");
  revalidatePath("/dashboard");
}

export async function duplicateContent(formData: FormData): Promise<void> {
  const context = await requireSession();
  const id = String(formData.get("content_id") ?? "");
  if (!id) return;

  const existing = await getContent(context.organization.id, id);
  if (!existing) return;

  const supabase = await createClient();
  const { data } = await supabase
    .from("content_generations")
    .insert({
      organization_id: context.organization.id,
      created_by: context.user.id,
      template_id: existing.template_id,
      category: existing.category,
      title: `${existing.title} (copy)`.slice(0, 160),
      inputs: existing.inputs,
      output: existing.edited_output?.trim() || existing.output,
      model: existing.model,
      parent_id: existing.id,
      status: "draft",
    })
    .select("id")
    .single<{ id: string }>();

  revalidatePath("/content");
  if (data) redirect(`/content/${data.id}`);
}

export async function deleteContent(formData: FormData): Promise<void> {
  const context = await requireSession();
  const id = String(formData.get("content_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("content_generations")
    .delete()
    .eq("id", id)
    .eq("organization_id", context.organization.id);

  revalidatePath("/content");
  revalidatePath("/dashboard");
  redirect("/content");
}
