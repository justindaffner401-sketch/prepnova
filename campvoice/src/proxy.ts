import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Runs before every request (Next.js calls this the "proxy" convention; it was
 * called middleware in older versions). Two jobs:
 *  1. Refresh the Supabase session cookie so users are not logged out mid-task.
 *  2. Bounce signed-out visitors away from the private app routes.
 *
 * The real security check still happens on the server for each page and API
 * route (see src/lib/auth/session.ts). This layer is a convenience, not the
 * boundary.
 */

const PROTECTED_PREFIXES = ["/dashboard", "/create", "/content", "/week", "/camp-dna", "/settings", "/admin", "/onboarding"];
const AUTH_PAGES = ["/sign-in", "/sign-up"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // If Supabase is unreachable, treat the visitor as signed out rather than
  // failing the request. The marketing site keeps working, and protected pages
  // send people to sign in — which is the correct answer when we cannot verify
  // who they are.
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  const path = request.nextUrl.pathname;

  if (!user && PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && AUTH_PAGES.includes(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)"],
};
