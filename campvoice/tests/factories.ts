import type {
  CampDna,
  CampEvent,
  CampProfile,
  CampTerminology,
  Organization,
  SourceDocument,
  Subscription,
} from "@/lib/db/types";
import type { CampContextInput } from "@/lib/ai/context";

/** Test fixtures for a fictional camp. Never real camp data. */

export function makeOrganization(overrides: Partial<Organization> = {}): Organization {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Camp Evergreen",
    slug: "camp-evergreen",
    website: "https://campevergreen.example",
    logo_path: null,
    location: "Pocono Mountains, Pennsylvania",
    camp_type: "Overnight / sleepaway",
    age_range: "7 to 16",
    description: "A Pennsylvania sleepaway camp on 400 wooded acres.",
    onboarding_step: 6,
    onboarding_completed_at: "2026-01-10T00:00:00.000Z",
    created_by: "22222222-2222-4222-8222-222222222222",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-10T00:00:00.000Z",
    ...overrides,
  };
}

export function makeProfile(overrides: Partial<CampProfile> = {}): CampProfile {
  return {
    organization_id: "11111111-1111-4111-8111-111111111111",
    programs: "Waterfront and sailing\nHorseback riding\nCeramics studio",
    traditions: "Color War\nFriday night campfire",
    audience: "Current camp parents and prospective families",
    voice_traits: ["Warm", "Energetic", "Community-focused"],
    avoid_list: ["Excessive emojis", "Corporate language"],
    communication_notes: "We sign off from the whole leadership team.",
    pasted_examples: "Dear Evergreen families, the bunks are full and the lake is warm.",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-05T00:00:00.000Z",
    ...overrides,
  };
}

export function makeDna(overrides: Partial<CampDna> = {}): CampDna {
  return {
    organization_id: "11111111-1111-4111-8111-111111111111",
    voice_summary: "Warm and plainspoken, like a letter from a friend who runs a camp.",
    terminology_summary: "Cabins are called bunks. Visiting Day is always capitalised.",
    core_themes: ["Community", "Tradition", "Independence"],
    style_notes: "Short paragraphs, warm openings, very few exclamation points.",
    audience_notes: "Mostly parents of returning campers.",
    avoid_notes: "No emojis, no corporate language.",
    edited_by_user: false,
    source_fingerprint: null,
    built_at: "2026-01-06T00:00:00.000Z",
    created_at: "2026-01-06T00:00:00.000Z",
    updated_at: "2026-01-06T00:00:00.000Z",
    ...overrides,
  };
}

export function makeTerm(overrides: Partial<CampTerminology> = {}): CampTerminology {
  return {
    id: "33333333-3333-4333-8333-333333333333",
    organization_id: "11111111-1111-4111-8111-111111111111",
    standard_term: "Cabins",
    camp_term: "Bunks",
    note: null,
    created_at: "2026-01-02T00:00:00.000Z",
    ...overrides,
  };
}

export function makeEvent(overrides: Partial<CampEvent> = {}): CampEvent {
  return {
    id: "44444444-4444-4444-8444-444444444444",
    organization_id: "11111111-1111-4111-8111-111111111111",
    title: "Visiting Day",
    event_type: "visiting_day",
    starts_on: "2026-07-18",
    ends_on: null,
    notes: "Gates open at 10am",
    created_at: "2026-01-03T00:00:00.000Z",
    updated_at: "2026-01-03T00:00:00.000Z",
    ...overrides,
  };
}

export function makeDocument(overrides: Partial<SourceDocument> = {}): SourceDocument {
  return {
    id: "55555555-5555-4555-8555-555555555555",
    organization_id: "11111111-1111-4111-8111-111111111111",
    kind: "upload",
    title: "Last summer's opening day email",
    storage_path: "11111111-1111-4111-8111-111111111111/opening-day-abc12345.pdf",
    source_url: null,
    mime_type: "application/pdf",
    byte_size: 1024,
    extracted_text: "Dear families, opening day is nearly here and the bunks are ready.",
    char_count: 64,
    status: "ready",
    error_message: null,
    created_by: "22222222-2222-4222-8222-222222222222",
    created_at: "2026-01-04T00:00:00.000Z",
    ...overrides,
  };
}

export function makeSubscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    organization_id: "11111111-1111-4111-8111-111111111111",
    stripe_customer_id: "cus_test123",
    stripe_subscription_id: "sub_test123",
    status: "active",
    price_id: "price_test_monthly",
    plan_interval: "month",
    cancel_at_period_end: false,
    current_period_end: "2099-01-01T00:00:00.000Z",
    trial_ends_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeCampContext(overrides: Partial<CampContextInput> = {}): CampContextInput {
  return {
    organization: makeOrganization(),
    profile: makeProfile(),
    dna: makeDna(),
    terminology: [makeTerm()],
    events: [makeEvent()],
    documents: [makeDocument()],
    ...overrides,
  };
}
