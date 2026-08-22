import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Organization, Profile, Subscription } from "@/lib/db/types";

export interface SessionContext {
  user: { id: string; email: string };
  profile: Profile;
  organization: Organization;
  membershipRole: "owner" | "member";
}

/**
 * THE authorization primitive.
 *
 * Resolves the signed-in user AND the single organization they belong to,
 * entirely from the session cookie. Nothing here reads an organization id from
 * a URL, form field or JSON body — which is why a user from Camp A cannot
 * reach Camp B by editing a request.
 *
 * `cache()` deduplicates the lookup within one server render/request.
 */
export const getSessionContext = cache(async (): Promise<SessionContext | null> => {
  const supabase = await createClient();

  let user: { id: string; email?: string } | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    return null;
  }

  if (!user?.id || !user.email) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  if (!profile) return null;

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role, organization:organizations(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<{ role: "owner" | "member"; organization: Organization | null }>();

  if (!membership?.organization) return null;

  return {
    user: { id: user.id, email: user.email },
    profile,
    organization: membership.organization,
    membershipRole: membership.role,
  };
});

/** Returns the user even when they have not created a camp yet. */
export const getUserOnly = cache(async () => {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
  } catch {
    // Supabase unreachable: treat as signed out rather than crashing the page.
    return null;
  }
});

/**
 * For pages inside the app: guarantees a signed-in user with a camp, or sends
 * them somewhere sensible.
 */
export async function requireSession(): Promise<SessionContext> {
  const context = await getSessionContext();
  if (context) return context;

  const user = await getUserOnly();
  if (!user) redirect("/sign-in");
  redirect("/onboarding");
}

/** For pages that must be finished with onboarding first. */
export async function requireOnboardedSession(): Promise<SessionContext> {
  const context = await requireSession();
  if (!context.organization.onboarding_completed_at) redirect("/onboarding");
  return context;
}

export async function requireAdmin(): Promise<SessionContext> {
  const context = await requireSession();
  if (!context.profile.is_admin) redirect("/dashboard");
  return context;
}

/** Current billing state for the signed-in camp. */
export async function getSubscription(organizationId: string): Promise<Subscription | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle<Subscription>();
  return data ?? null;
}

/** Statuses that grant access to the product. */
const ENTITLED: ReadonlySet<string> = new Set(["trialing", "active", "past_due"]);

export function isEntitled(subscription: Subscription | null): boolean {
  if (!subscription) return false;
  if (!ENTITLED.has(subscription.status)) return false;
  if (subscription.status === "trialing" && subscription.trial_ends_at) {
    return new Date(subscription.trial_ends_at).getTime() > Date.now();
  }
  return true;
}

export function trialDaysRemaining(subscription: Subscription | null): number | null {
  if (!subscription || subscription.status !== "trialing" || !subscription.trial_ends_at) return null;
  const ms = new Date(subscription.trial_ends_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}
