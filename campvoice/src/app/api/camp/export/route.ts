import { requireApiSession, withErrorHandling } from "@/lib/api/guard";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Download everything this camp has in CampVoice, as one JSON file.
 *
 * Only the caller's own organization is exported, because every query below is
 * scoped by the session's organization id.
 */
export const GET = withErrorHandling("api.export", async () => {
  const context = await requireApiSession();
  const supabase = await createClient();
  const organizationId = context.organization.id;

  const [profile, dna, terminology, events, documents, content] = await Promise.all([
    supabase.from("camp_profiles").select("*").eq("organization_id", organizationId).maybeSingle(),
    supabase.from("camp_dna").select("*").eq("organization_id", organizationId).maybeSingle(),
    supabase.from("camp_terminology").select("*").eq("organization_id", organizationId),
    supabase.from("camp_events").select("*").eq("organization_id", organizationId),
    supabase.from("source_documents").select("id, kind, title, source_url, char_count, status, created_at").eq("organization_id", organizationId),
    supabase.from("content_generations").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    camp: context.organization,
    camp_profile: profile.data ?? null,
    camp_dna: dna.data ?? null,
    terminology: terminology.data ?? [],
    events: events.data ?? [],
    // Metadata only: the extracted text can be very large and the camp already has the originals.
    uploaded_materials: documents.data ?? [],
    content: content.data ?? [],
  };

  const filename = `campvoice-export-${context.organization.slug}-${new Date().toISOString().slice(0, 10)}.json`;

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
});
