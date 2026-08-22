import { NextResponse } from "next/server";
import { ApiError, readJson, withErrorHandling } from "@/lib/api/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { contactSchema } from "@/lib/validation/schemas";
import { checkBurstLimit } from "@/lib/ai/usage";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

/**
 * The public contact form.
 *
 * Anti-spam, in order: honeypot field, a minimum time on page, and a per-IP
 * rate limit. No third-party captcha, so the marketing site stays tracker-free.
 */
export const POST = withErrorHandling("api.contact", async (request: Request) => {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const burst = checkBurstLimit(`contact:${ip}`, 3, 900_000);
  if (!burst.allowed) {
    throw new ApiError(429, "Thanks — we already have your message. We'll be in touch shortly.", "rate_limited");
  }

  const body = await readJson(request, contactSchema);

  // A bot filled the hidden field, or submitted faster than a person can type.
  if (body.website.trim() !== "" || body.elapsed_ms < 2000) {
    logger.info("api.contact_rejected_spam");
    // Answer as though it worked, so a bot learns nothing.
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("support_messages").insert({
    name: body.name,
    email: body.email,
    camp_name: body.camp_name || null,
    message: body.message,
  });

  if (error) {
    logger.error("api.contact_save_failed", error);
    throw new ApiError(500, "We couldn't send that just now. Please email us directly instead.", "save_failed");
  }

  return NextResponse.json({ ok: true });
});
