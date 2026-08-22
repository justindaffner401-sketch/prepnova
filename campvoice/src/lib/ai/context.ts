import { ai } from "@/lib/config";
import { fitToBudget, normaliseWhitespace, wrapUntrustedReference, type ReferenceBlock } from "./guardrails";
import type {
  CampDna,
  CampEvent,
  CampProfile,
  CampTerminology,
  Organization,
  SourceDocument,
} from "@/lib/db/types";

/**
 * Builds the camp context that goes into an AI request.
 *
 * KEY DESIGN DECISION: we deliberately do NOT dump every piece of camp data
 * into every request. That would be slow, expensive, and would dilute what
 * matters. Instead each content category declares what it needs, and this file
 * assembles only that.
 *
 * There is no vector database here on purpose. A camp's knowledge is small
 * (a profile, some dates, a handful of documents) so simple, predictable
 * selection beats a search index you cannot debug.
 */

export interface CampContextInput {
  organization: Organization;
  profile: CampProfile | null;
  dna: CampDna | null;
  terminology: CampTerminology[];
  events: CampEvent[];
  documents: SourceDocument[];
}

export interface ContextOptions {
  /** Include upcoming dates. Almost every category wants these. */
  includeEvents?: boolean;
  /** How many days ahead to consider a date "relevant". */
  eventHorizonDays?: number;
  /** Include excerpts from uploaded/pasted material so the voice stays grounded. */
  includeSamples?: boolean;
  /** Character budget for the sample material. */
  sampleBudgetChars?: number;
}

function bullet(label: string, value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? `${label}: ${trimmed}` : null;
}

/** The camp's identity — always included; it is short and always relevant. */
export function buildIdentitySection(input: CampContextInput): string {
  const { organization, profile } = input;
  const lines = [
    bullet("Camp name", organization.name),
    bullet("Location", organization.location),
    bullet("Type of camp", organization.camp_type),
    bullet("Camper ages", organization.age_range),
    bullet("Website", organization.website),
    bullet("About the camp", organization.description),
    bullet("Programs and activities", profile?.programs),
    bullet("Traditions", profile?.traditions),
    bullet("Who they communicate with", profile?.audience),
  ].filter((line): line is string => line !== null);

  return `CAMP PROFILE\n${lines.join("\n")}`;
}

/** The camp's voice, as established by Camp DNA (or the raw traits if DNA is not built yet). */
export function buildVoiceSection(input: CampContextInput): string {
  const { dna, profile } = input;
  const lines: string[] = [];

  if (dna?.voice_summary) lines.push(`Voice: ${dna.voice_summary}`);
  else if (profile?.voice_traits.length) lines.push(`Voice traits: ${profile.voice_traits.join(", ")}`);

  if (dna?.style_notes) lines.push(`Communication style: ${dna.style_notes}`);
  else if (profile?.communication_notes) lines.push(`Communication notes: ${profile.communication_notes}`);

  if (dna?.core_themes.length) lines.push(`Core themes: ${dna.core_themes.join(", ")}`);
  if (dna?.audience_notes) lines.push(`Audience: ${dna.audience_notes}`);

  const avoid = dna?.avoid_notes?.trim() || profile?.avoid_list.join("; ");
  if (avoid) lines.push(`Must avoid: ${avoid}`);

  if (lines.length === 0) return "";
  return `CAMP VOICE\n${lines.join("\n")}`;
}

/** Terminology is small and high-value, so it is always included in full. */
export function buildTerminologySection(input: CampContextInput): string {
  const { terminology, dna } = input;
  if (terminology.length === 0) {
    return dna?.terminology_summary ? `CAMP TERMINOLOGY\n${dna.terminology_summary}` : "";
  }
  const lines = terminology.map((term) => {
    const note = term.note?.trim() ? ` (${term.note.trim()})` : "";
    return `Say "${term.camp_term}" rather than "${term.standard_term}"${note}`;
  });
  return `CAMP TERMINOLOGY (use these exact words and capitalisation)\n${lines.join("\n")}`;
}

/** Dates coming up soon, so the AI can reference them accurately and never guess one. */
export function buildEventsSection(input: CampContextInput, horizonDays: number): string {
  const now = new Date();
  const horizon = new Date(now.getTime() + horizonDays * 86_400_000);

  const upcoming = input.events
    .filter((event) => {
      const start = new Date(`${event.starts_on}T00:00:00`);
      return start >= new Date(now.toDateString()) && start <= horizon;
    })
    .sort((a, b) => a.starts_on.localeCompare(b.starts_on))
    .slice(0, 12);

  if (upcoming.length === 0) return "";

  const lines = upcoming.map((event) => {
    const range = event.ends_on && event.ends_on !== event.starts_on ? `${event.starts_on} to ${event.ends_on}` : event.starts_on;
    const note = event.notes?.trim() ? ` — ${event.notes.trim()}` : "";
    return `${event.title}: ${range}${note}`;
  });

  return `IMPORTANT DATES (these are the only dates you may state)\n${lines.join("\n")}`;
}

/**
 * Picks the sample material most useful for this piece of content, and wraps it
 * as untrusted reference data.
 */
export function buildSamplesSection(input: CampContextInput, budgetChars: number): string {
  const blocks: ReferenceBlock[] = [];

  const pasted = input.profile?.pasted_examples?.trim();
  if (pasted) {
    blocks.push({ label: "Examples the camp pasted in", content: pasted });
  }

  for (const doc of input.documents) {
    if (doc.status !== "ready" || !doc.extracted_text?.trim()) continue;
    blocks.push({ label: doc.title, content: doc.extracted_text });
  }

  const fitted = fitToBudget(blocks, budgetChars);
  if (fitted.length === 0) return "";
  return wrapUntrustedReference(fitted);
}

/**
 * Assembles the full camp context for one request, respecting the global
 * character budget so a camp with a hundred uploads never sends a giant prompt.
 */
export function buildCampContext(input: CampContextInput, options: ContextOptions = {}): string {
  const {
    includeEvents = true,
    eventHorizonDays = 120,
    includeSamples = true,
    sampleBudgetChars = 8000,
  } = options;

  const sections = [
    buildIdentitySection(input),
    buildVoiceSection(input),
    buildTerminologySection(input),
    includeEvents ? buildEventsSection(input, eventHorizonDays) : "",
    includeSamples ? buildSamplesSection(input, sampleBudgetChars) : "",
  ].filter((section) => section.trim().length > 0);

  const assembled = normaliseWhitespace(sections.join("\n\n"));
  return assembled.length > ai.maxContextChars ? `${assembled.slice(0, ai.maxContextChars)}…` : assembled;
}

/** A short fingerprint of the camp's source material, so we know when a DNA rebuild is worthwhile. */
export function sourceFingerprint(input: CampContextInput): string {
  const parts = [
    input.organization.updated_at,
    input.profile?.updated_at ?? "",
    String(input.terminology.length),
    String(input.documents.filter((doc) => doc.status === "ready").length),
    String((input.profile?.pasted_examples ?? "").length),
  ];
  return parts.join("|");
}
