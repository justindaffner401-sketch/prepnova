import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type {
  CampDna,
  CampEvent,
  CampProfile,
  CampTerminology,
  ContentGeneration,
  Organization,
  SourceDocument,
} from "@/lib/db/types";
import type { CampContextInput } from "@/lib/ai/context";

/**
 * Reads of a camp's own data.
 *
 * Every query here runs through the request-scoped Supabase client, so Row
 * Level Security applies: even if a caller passed the wrong organization id,
 * the database returns nothing. The id still always comes from the session.
 */

export const getCampProfile = cache(async (organizationId: string): Promise<CampProfile | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("camp_profiles")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle<CampProfile>();
  return data ?? null;
});

export const getCampDna = cache(async (organizationId: string): Promise<CampDna | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("camp_dna")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle<CampDna>();
  return data ?? null;
});

export const getTerminology = cache(async (organizationId: string): Promise<CampTerminology[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("camp_terminology")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });
  return data ?? [];
});

export const getEvents = cache(async (organizationId: string): Promise<CampEvent[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("camp_events")
    .select("*")
    .eq("organization_id", organizationId)
    .order("starts_on", { ascending: true });
  return data ?? [];
});

export const getSourceDocuments = cache(async (organizationId: string): Promise<SourceDocument[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("source_documents")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  return data ?? [];
});

/**
 * Assembles everything the AI layer needs about a camp, in one place.
 * `documents` is trimmed to the most recent ready ones; the context builder
 * applies the real character budget.
 */
export async function loadCampContext(organization: Organization): Promise<CampContextInput> {
  const [profile, dna, terminology, events, documents] = await Promise.all([
    getCampProfile(organization.id),
    getCampDna(organization.id),
    getTerminology(organization.id),
    getEvents(organization.id),
    getSourceDocuments(organization.id),
  ]);

  return {
    organization,
    profile,
    dna,
    terminology,
    events,
    documents: documents.filter((doc) => doc.status === "ready").slice(0, 12),
  };
}

/** Upcoming dates, with a friendly "in N days" figure for the dashboard. */
export interface UpcomingEvent extends CampEvent {
  daysAway: number;
}

export function upcomingEvents(events: CampEvent[], withinDays = 120, now = new Date()): UpcomingEvent[] {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  return events
    .map((event) => {
      const start = new Date(`${event.starts_on}T00:00:00Z`);
      const daysAway = Math.round((start.getTime() - today.getTime()) / 86_400_000);
      return { ...event, daysAway };
    })
    .filter((event) => event.daysAway >= 0 && event.daysAway <= withinDays)
    .sort((a, b) => a.daysAway - b.daysAway);
}

export function formatDaysAway(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days < 30) return `${days} days`;
  const months = Math.round(days / 30);
  return months <= 1 ? "about a month" : `about ${months} months`;
}

// ------------------------------ content history ------------------------------

export interface ContentQuery {
  organizationId: string;
  category?: string;
  templateId?: string;
  favoritesOnly?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ContentPage {
  items: ContentGeneration[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export async function listContent(query: ContentQuery): Promise<ContentPage> {
  const supabase = await createClient();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(50, Math.max(5, query.pageSize ?? 20));
  const from = (page - 1) * pageSize;

  let builder = supabase
    .from("content_generations")
    .select("*", { count: "exact" })
    .eq("organization_id", query.organizationId)
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (query.category) builder = builder.eq("category", query.category);
  if (query.templateId) builder = builder.eq("template_id", query.templateId);
  if (query.favoritesOnly) builder = builder.eq("is_favorite", true);
  if (query.search) {
    // Escape the PostgREST pattern wildcards so a search term cannot change the query shape.
    const term = query.search.replace(/[%_,()]/g, " ").trim();
    if (term) builder = builder.ilike("title", `%${term}%`);
  }

  const { data, count } = await builder;
  const total = count ?? 0;

  return {
    items: (data ?? []) as ContentGeneration[],
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getContent(organizationId: string, id: string): Promise<ContentGeneration | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("content_generations")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", id)
    .maybeSingle<ContentGeneration>();
  return data ?? null;
}

export async function recentContent(organizationId: string, take = 5): Promise<ContentGeneration[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("content_generations")
    .select("*")
    .eq("organization_id", organizationId)
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(take);
  return (data ?? []) as ContentGeneration[];
}
