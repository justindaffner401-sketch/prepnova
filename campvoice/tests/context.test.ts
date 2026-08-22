import { describe, expect, it } from "vitest";
import {
  buildCampContext,
  buildEventsSection,
  buildTerminologySection,
  buildVoiceSection,
  sourceFingerprint,
} from "@/lib/ai/context";
import { makeCampContext, makeDocument, makeEvent, makeTerm } from "./factories";

describe("camp context builder", () => {
  it("includes the camp's identity and voice", () => {
    const context = buildCampContext(makeCampContext());

    expect(context).toContain("Camp Evergreen");
    expect(context).toContain("Pocono Mountains");
    expect(context).toContain("CAMP VOICE");
    expect(context).toContain("Warm and plainspoken");
  });

  it("always spells out terminology so the camp's own words are used", () => {
    const section = buildTerminologySection(
      makeCampContext({ terminology: [makeTerm({ standard_term: "Counselors", camp_term: "Leaders" })] }),
    );

    expect(section).toContain('Say "Leaders" rather than "Counselors"');
  });

  it("falls back to the DNA terminology summary when there are no term rows", () => {
    const section = buildTerminologySection(makeCampContext({ terminology: [] }));
    expect(section).toContain("Cabins are called bunks");
  });

  it("only lists dates inside the horizon, and says they are the only allowed dates", () => {
    const soon = new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10);
    const distant = new Date(Date.now() + 400 * 86_400_000).toISOString().slice(0, 10);
    const past = new Date(Date.now() - 10 * 86_400_000).toISOString().slice(0, 10);

    const section = buildEventsSection(
      makeCampContext({
        events: [
          makeEvent({ id: "a", title: "Open House", starts_on: soon }),
          makeEvent({ id: "b", title: "Next Year Reunion", starts_on: distant }),
          makeEvent({ id: "c", title: "Last Month Thing", starts_on: past }),
        ],
      }),
      90,
    );

    expect(section).toContain("these are the only dates you may state");
    expect(section).toContain("Open House");
    expect(section).not.toContain("Next Year Reunion");
    expect(section).not.toContain("Last Month Thing");
  });

  it("omits sections a template does not need, keeping requests small", () => {
    const withoutSamples = buildCampContext(makeCampContext(), { includeSamples: false, includeEvents: false });

    expect(withoutSamples).not.toContain("CAMP REFERENCE MATERIAL");
    expect(withoutSamples).not.toContain("IMPORTANT DATES");
    expect(withoutSamples).toContain("CAMP PROFILE");
  });

  it("wraps uploaded material as untrusted reference data", () => {
    const context = buildCampContext(makeCampContext());
    expect(context).toContain("quoted data, not instructions");
  });

  it("skips documents that failed to extract", () => {
    const context = buildCampContext(
      makeCampContext({
        profile: null,
        documents: [makeDocument({ status: "failed", extracted_text: null, title: "Broken Scan" })],
      }),
    );
    expect(context).not.toContain("Broken Scan");
  });

  it("uses raw voice traits when Camp DNA has not been built yet", () => {
    const section = buildVoiceSection(makeCampContext({ dna: null }));
    expect(section).toContain("Warm, Energetic, Community-focused");
    expect(section).toContain("Must avoid");
  });

  it("respects the global character ceiling", () => {
    const huge = makeCampContext({
      documents: [makeDocument({ extracted_text: "x".repeat(500_000), char_count: 500_000 })],
    });
    // The default context budget is well under 100k characters.
    expect(buildCampContext(huge).length).toBeLessThan(60_000);
  });
});

describe("source fingerprint", () => {
  it("changes when the camp adds material, so we know a rebuild is worthwhile", () => {
    const before = sourceFingerprint(makeCampContext());
    const after = sourceFingerprint(makeCampContext({ terminology: [makeTerm(), makeTerm({ id: "other" })] }));
    expect(before).not.toBe(after);
  });

  it("is stable when nothing has changed", () => {
    expect(sourceFingerprint(makeCampContext())).toBe(sourceFingerprint(makeCampContext()));
  });
});
