import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * ORGANIZATION ISOLATION — the security property that matters most.
 *
 * A user from Camp A must never reach Camp B's data by changing an id in a
 * request. CampVoice enforces that in three independent layers:
 *
 *   1. The organization is resolved from the SESSION, never from the request.
 *   2. Every query is additionally scoped by `.eq("organization_id", …)`.
 *   3. Postgres Row Level Security refuses the row even if 1 and 2 failed.
 *
 * These tests prove layers 1 and 2 in code (layer 3 is asserted structurally
 * against the migration, and verified against a live database at deploy time —
 * see README → "Verify database isolation").
 */

const CAMP_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const CAMP_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

/**
 * A stand-in for the Supabase client that records how each query was filtered
 * and behaves like the real database: a row is only returned when the query's
 * organization filter matches the row's owner.
 */
function createFakeSupabase(rows: { id: string; organization_id: string }[]) {
  const calls: { table: string; filters: Record<string, string> }[] = [];

  function builder(table: string) {
    const filters: Record<string, string> = {};
    const record = { table, filters };
    calls.push(record);

    const chain = {
      select: () => chain,
      eq: (column: string, value: string) => {
        filters[column] = value;
        return chain;
      },
      neq: () => chain,
      order: () => chain,
      limit: () => chain,
      range: () => chain,
      ilike: () => chain,
      maybeSingle: async () => {
        const match = rows.find(
          (row) =>
            (!filters.id || row.id === filters.id) &&
            (!filters.organization_id || row.organization_id === filters.organization_id),
        );
        return { data: match ?? null, error: null };
      },
      then: undefined,
    };
    return chain;
  }

  return { client: { from: builder }, calls };
}

describe("content lookups are scoped to the caller's camp", () => {
  beforeEach(() => vi.resetModules());

  it("returns nothing when Camp A asks for a document owned by Camp B", async () => {
    const { client, calls } = createFakeSupabase([{ id: "content-owned-by-b", organization_id: CAMP_B }]);
    vi.doMock("@/lib/supabase/server", () => ({ createClient: async () => client }));

    const { getContent } = await import("@/lib/data/camp");
    const result = await getContent(CAMP_A, "content-owned-by-b");

    expect(result).toBeNull();

    // The query must have carried BOTH filters, not just the id.
    const query = calls.find((call) => call.table === "content_generations");
    expect(query?.filters.organization_id).toBe(CAMP_A);
    expect(query?.filters.id).toBe("content-owned-by-b");
  });

  it("returns the row when the camp genuinely owns it", async () => {
    const { client } = createFakeSupabase([{ id: "content-owned-by-a", organization_id: CAMP_A }]);
    vi.doMock("@/lib/supabase/server", () => ({ createClient: async () => client }));

    const { getContent } = await import("@/lib/data/camp");
    expect(await getContent(CAMP_A, "content-owned-by-a")).not.toBeNull();
  });

  it("scopes every camp-data read by organization", async () => {
    const { client, calls } = createFakeSupabase([]);
    vi.doMock("@/lib/supabase/server", () => ({ createClient: async () => client }));

    const camp = await import("@/lib/data/camp");
    await camp.getCampProfile(CAMP_A);
    await camp.getCampDna(CAMP_A);

    for (const call of calls) {
      expect(call.filters.organization_id, call.table).toBe(CAMP_A);
    }
  });
});

describe("the request body can never choose the organization", () => {
  it("no validation schema accepts an organization id from the client", async () => {
    const schemas = await import("@/lib/validation/schemas");

    const clientFacing = [
      schemas.generateSchema,
      schemas.reviseSchema,
      schemas.saveContentSchema,
      schemas.campEventSchema,
      schemas.campBasicsSchema,
      schemas.campDetailsSchema,
      schemas.campVoiceSchema,
      schemas.websiteImportSchema,
      schemas.checkoutSchema,
      schemas.contactSchema,
    ];

    for (const schema of schemas ? clientFacing : []) {
      const parsed = schema.safeParse({
        // A hostile client trying to point the request at another camp.
        organization_id: CAMP_B,
        organizationId: CAMP_B,
        // Plus enough valid data that the schema could otherwise succeed.
        template_id: "tour-follow-up",
        content_id: "11111111-1111-4111-8111-111111111111",
        action: "shorter",
        inputs: {},
        title: "Visiting Day",
        starts_on: "2026-07-18",
        name: "Camp Evergreen",
        url: "https://campevergreen.com",
        interval: "month",
        email: "d@e.com",
        message: "We would like to know more about CampVoice, please.",
      });

      if (parsed.success) {
        // Zod strips unknown keys, so the organization id never survives.
        expect(parsed.data).not.toHaveProperty("organization_id");
        expect(parsed.data).not.toHaveProperty("organizationId");
      }
    }
  });
});

describe("row level security covers every camp table", () => {
  it("enables and forces RLS, and scopes each policy by membership", async () => {
    const { readFileSync } = await import("node:fs");
    const sql = readFileSync(new URL("../supabase/migrations/0002_rls_policies.sql", import.meta.url), "utf8");

    const campTables = [
      "camp_profiles",
      "camp_terminology",
      "camp_dna",
      "camp_events",
      "source_documents",
      "content_generations",
      "organizations",
      "organization_members",
      "subscriptions",
      "ai_usage",
    ];

    for (const table of campTables) {
      expect(sql, `${table} must have RLS enabled`).toMatch(
        new RegExp(`alter table public\\.${table}\\s+enable row level security;`),
      );
    }

    // The tables holding a camp's own writing also FORCE RLS, so even a
    // mistake in table ownership cannot leak rows.
    for (const table of ["camp_profiles", "camp_dna", "content_generations", "source_documents"]) {
      expect(sql, `${table} must force RLS`).toMatch(
        new RegExp(`alter table public\\.${table}\\s+force row level security;`),
      );
    }

    // Nothing may be readable without a membership check.
    const selectPolicies = sql.match(/for select\s+using \(([^)]*\)?[^;]*)\);/g) ?? [];
    expect(selectPolicies.length).toBeGreaterThan(5);
    for (const policy of selectPolicies) {
      expect(policy).toMatch(/is_org_member|auth\.uid\(\)|is_platform_admin/);
    }

    // Billing must not be writable from the browser under any circumstances.
    expect(sql).not.toMatch(/on public\.subscriptions for (insert|update|delete)/);
    expect(sql).not.toMatch(/on public\.ai_usage for (insert|update|delete)/);
  });

  it("keeps uploaded files behind a per-organization path check", async () => {
    const { readFileSync } = await import("node:fs");
    const sql = readFileSync(new URL("../supabase/migrations/0002_rls_policies.sql", import.meta.url), "utf8");

    // Files live at <organization_id>/<name>, and every storage policy checks it.
    const storagePolicies = sql.split("storage.objects").slice(1);
    expect(storagePolicies.length).toBeGreaterThanOrEqual(3);
    for (const policy of storagePolicies) {
      expect(policy).toContain("split_part(name, '/', 1)");
      expect(policy).toContain("is_org_member");
    }
  });
});
