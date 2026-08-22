import { NextResponse } from "next/server";
import { ApiError, requireApiSession, withErrorHandling } from "@/lib/api/guard";
import { createClient } from "@/lib/supabase/server";
import { extractText, ExtractionError, safeStorageName, titleFromFilename, validateFile } from "@/lib/ingest/extract";
import { checkBurstLimit } from "@/lib/ai/usage";
import { limits } from "@/lib/config";
import { track } from "@/lib/analytics";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Upload one camp document.
 *
 * The pipeline: validate → store the original in a private bucket → extract
 * text → save the text as reference material. Extracted text is NEVER treated
 * as an instruction (see src/lib/ai/guardrails.ts).
 */
export const POST = withErrorHandling("api.upload_document", async (request: Request) => {
  const context = await requireApiSession();

  const burst = checkBurstLimit(`upload:${context.organization.id}`, limits.uploadsPerDay, 3_600_000);
  if (!burst.allowed) {
    throw new ApiError(429, "You've uploaded a lot of files in the last hour. Please try again shortly.", "rate_limited");
  }

  const supabase = await createClient();

  const { count } = await supabase
    .from("source_documents")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", context.organization.id);

  if ((count ?? 0) >= limits.maxSourceDocuments) {
    throw new ApiError(
      400,
      `You've reached the limit of ${limits.maxSourceDocuments} saved materials. Remove one to add another.`,
      "too_many_documents",
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new ApiError(400, "We couldn't read that upload. Please try again.", "invalid_form");
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    throw new ApiError(400, "Please choose a file to upload.", "no_file");
  }

  let kind: "pdf" | "docx" | "text";
  try {
    kind = validateFile({ name: file.name, type: file.type, size: file.size });
  } catch (error) {
    if (error instanceof ExtractionError) throw new ApiError(400, error.userMessage, error.code);
    throw error;
  }

  const buffer = await file.arrayBuffer();

  // Store the original first, so the camp keeps their source even if extraction fails.
  const storagePath = `${context.organization.id}/${safeStorageName(file.name)}`;
  const { error: uploadError } = await supabase.storage
    .from("camp-materials")
    .upload(storagePath, buffer, { contentType: file.type || "application/octet-stream", upsert: false });

  if (uploadError) {
    logger.error("api.upload_storage_failed", uploadError);
    throw new ApiError(500, "We couldn't save that file. Please try again.", "storage_failed");
  }

  let text: string;
  try {
    text = await extractText(buffer, kind);
  } catch (error) {
    const message =
      error instanceof ExtractionError
        ? error.userMessage
        : "We couldn't read this file. Try another version or paste the text directly.";

    await supabase.from("source_documents").insert({
      organization_id: context.organization.id,
      kind: "upload",
      title: titleFromFilename(file.name),
      storage_path: storagePath,
      mime_type: file.type || null,
      byte_size: file.size,
      status: "failed",
      error_message: message,
      created_by: context.user.id,
    });

    throw new ApiError(400, message, "extraction_failed");
  }

  const { data, error } = await supabase
    .from("source_documents")
    .insert({
      organization_id: context.organization.id,
      kind: "upload",
      title: titleFromFilename(file.name),
      storage_path: storagePath,
      mime_type: file.type || null,
      byte_size: file.size,
      extracted_text: text,
      char_count: text.length,
      status: "ready",
      created_by: context.user.id,
    })
    .select("id, title, char_count")
    .single<{ id: string; title: string; char_count: number }>();

  if (error || !data) {
    logger.error("api.upload_save_failed", error);
    throw new ApiError(500, "We read your file but couldn't save it. Please try again.", "save_failed");
  }

  await track("document_uploaded", {
    organizationId: context.organization.id,
    userId: context.user.id,
    properties: { kind, characters: text.length },
  });

  return NextResponse.json({ document: data });
});
