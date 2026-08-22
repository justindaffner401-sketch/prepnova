import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { checkBurstLimit } from "@/lib/ai/usage";
import { track } from "@/lib/analytics";

export const runtime = "nodejs";

/**
 * Records that a draft was copied. No content is sent or stored — just the fact
 * that a copy happened, so we can see which templates are actually useful.
 * Lightly rate limited so a stuck button cannot fill the analytics table.
 */
export async function POST() {
  const context = await getSessionContext();
  if (context && checkBurstLimit(`copied:${context.organization.id}`, 30, 60_000).allowed) {
    await track("content_copied", { organizationId: context.organization.id, userId: context.user.id });
  }
  return NextResponse.json({ ok: true });
}
