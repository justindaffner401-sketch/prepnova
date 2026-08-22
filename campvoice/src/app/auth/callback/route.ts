import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

/**
 * Where Supabase sends people after they click an email link (confirmation or
 * password reset). We exchange the one-time code for a session, then continue
 * to wherever they were headed.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/dashboard";

  // Only ever redirect within our own site.
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=link_expired`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    logger.warn("auth.callback_failed", { message: error.message });
    return NextResponse.redirect(`${origin}/sign-in?error=link_expired`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
