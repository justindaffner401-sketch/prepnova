import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, requireApiSession, withErrorHandling } from "@/lib/api/guard";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const idSchema = z.uuid();

/** Removes one uploaded/imported source, including the stored original file. */
export const DELETE = withErrorHandling(
  "api.delete_document",
  async (_request: Request, ctx: { params: Promise<{ id: string }> }) => {
    const context = await requireApiSession();
    const { id } = await ctx.params;

    const parsed = idSchema.safeParse(id);
    if (!parsed.success) throw new ApiError(400, "We couldn't find that item.", "invalid_id");

    const supabase = await createClient();

    // Scoped to the caller's organization, so another camp's id matches nothing.
    const { data: document } = await supabase
      .from("source_documents")
      .select("id, storage_path")
      .eq("id", parsed.data)
      .eq("organization_id", context.organization.id)
      .maybeSingle<{ id: string; storage_path: string | null }>();

    if (!document) throw new ApiError(404, "We couldn't find that item.", "not_found");

    if (document.storage_path) {
      const { error } = await supabase.storage.from("camp-materials").remove([document.storage_path]);
      if (error) logger.warn("api.delete_storage_failed", { message: error.message });
    }

    await supabase
      .from("source_documents")
      .delete()
      .eq("id", document.id)
      .eq("organization_id", context.organization.id);

    return NextResponse.json({ ok: true });
  },
);
