import { NextResponse } from "next/server";
import { ApiError, readJson, requireApiSession, withErrorHandling } from "@/lib/api/guard";
import { createClient } from "@/lib/supabase/server";
import { websiteImportSchema } from "@/lib/validation/schemas";
import { importWebsite, ImportError } from "@/lib/ingest/website";
import { checkBurstLimit } from "@/lib/ai/usage";
import { track } from "@/lib/analytics";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Imports the readable text from one public camp web page. */
export const POST = withErrorHandling("api.import_website", async (request: Request) => {
  const context = await requireApiSession();

  const burst = checkBurstLimit(`import:${context.organization.id}`, 10, 600_000);
  if (!burst.allowed) {
    throw new ApiError(429, "That's a lot of imports at once. Please wait a moment and try again.", "rate_limited");
  }

  const body = await readJson(request, websiteImportSchema);

  let page;
  try {
    page = await importWebsite(body.url);
  } catch (error) {
    if (error instanceof ImportError) throw new ApiError(400, error.userMessage, error.code);
    logger.error("api.import_failed", error);
    throw new ApiError(
      400,
      "We couldn't import that page automatically. You can continue by pasting your camp information instead.",
      "import_failed",
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("source_documents")
    .insert({
      organization_id: context.organization.id,
      kind: "website",
      title: page.title,
      source_url: page.url,
      extracted_text: page.text,
      char_count: page.text.length,
      status: "ready",
      created_by: context.user.id,
    })
    .select("id, title, char_count")
    .single<{ id: string; title: string; char_count: number }>();

  if (error || !data) {
    logger.error("api.import_save_failed", error);
    throw new ApiError(500, "We read that page but couldn't save it. Please try again.", "save_failed");
  }

  await track("website_imported", {
    organizationId: context.organization.id,
    userId: context.user.id,
    properties: { characters: page.text.length },
  });

  // Show the camp exactly what we took, so nothing is imported blindly.
  return NextResponse.json({
    document: {
      id: data.id,
      title: data.title,
      characters: data.char_count,
      excerpt: page.text.slice(0, 600),
    },
  });
});
