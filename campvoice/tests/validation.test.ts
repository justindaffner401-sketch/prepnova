import { describe, expect, it } from "vitest";
import {
  campBasicsSchema,
  campEventSchema,
  contactSchema,
  generateSchema,
  reviseSchema,
  signUpSchema,
  websiteImportSchema,
} from "@/lib/validation/schemas";

/** Everything that arrives from a browser passes through these schemas first. */

describe("sign-up validation", () => {
  it("accepts a normal signup", () => {
    const result = signUpSchema.safeParse({
      full_name: "Dana Reyes",
      email: "Dana@CampEvergreen.com",
      password: "a-good-passphrase",
    });
    expect(result.success).toBe(true);
    // Email is normalised so "Dana@" and "dana@" are one account.
    if (result.success) expect(result.data.email).toBe("dana@campevergreen.com");
  });

  it("rejects a short password", () => {
    expect(signUpSchema.safeParse({ full_name: "Dana", email: "d@e.com", password: "short" }).success).toBe(false);
  });

  it("rejects a malformed email", () => {
    expect(signUpSchema.safeParse({ full_name: "Dana", email: "not-an-email", password: "a-good-passphrase" }).success).toBe(false);
  });
});

describe("camp basics validation", () => {
  it("requires a full web address", () => {
    expect(campBasicsSchema.safeParse({ name: "Camp Evergreen", website: "campevergreen" }).success).toBe(false);
    expect(campBasicsSchema.safeParse({ name: "Camp Evergreen", website: "https://campevergreen.com" }).success).toBe(true);
  });

  it("turns an empty optional field into null rather than an empty string", () => {
    const result = campBasicsSchema.safeParse({ name: "Camp Evergreen", location: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.location).toBeNull();
  });

  it("rejects a camp with no name", () => {
    expect(campBasicsSchema.safeParse({ name: "C" }).success).toBe(false);
  });
});

describe("event validation", () => {
  it("accepts a single-day event", () => {
    expect(campEventSchema.safeParse({ title: "Visiting Day", starts_on: "2026-07-18", ends_on: "" }).success).toBe(true);
  });

  it("rejects an end date before the start date", () => {
    const result = campEventSchema.safeParse({ title: "Session", starts_on: "2026-07-18", ends_on: "2026-07-01" });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed date", () => {
    expect(campEventSchema.safeParse({ title: "Session", starts_on: "July 18" }).success).toBe(false);
  });
});

describe("generation request validation", () => {
  it("rejects a template that does not exist", () => {
    expect(generateSchema.safeParse({ template_id: "not-a-template", inputs: {} }).success).toBe(false);
  });

  it("accepts a real template", () => {
    expect(generateSchema.safeParse({ template_id: "tour-follow-up", inputs: { family_name: "Smith" } }).success).toBe(true);
  });

  it("rejects an absurdly long field value", () => {
    expect(generateSchema.safeParse({ template_id: "tour-follow-up", inputs: { notes: "x".repeat(5000) } }).success).toBe(false);
  });
});

describe("revision request validation", () => {
  it("rejects an unknown action", () => {
    expect(
      reviseSchema.safeParse({ content_id: "11111111-1111-4111-8111-111111111111", action: "make-purple" }).success,
    ).toBe(false);
  });

  it("rejects a content id that is not a UUID", () => {
    expect(reviseSchema.safeParse({ content_id: "1 OR 1=1", action: "shorter" }).success).toBe(false);
  });

  it("accepts a valid revision", () => {
    expect(
      reviseSchema.safeParse({ content_id: "11111111-1111-4111-8111-111111111111", action: "warmer" }).success,
    ).toBe(true);
  });
});

describe("website import validation", () => {
  it("adds https:// when a camp types a bare domain", () => {
    const result = websiteImportSchema.safeParse({ url: "campevergreen.com" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.url).toBe("https://campevergreen.com");
  });

  it("leaves an explicit protocol alone", () => {
    const result = websiteImportSchema.safeParse({ url: "http://campevergreen.com" });
    if (result.success) expect(result.data.url).toBe("http://campevergreen.com");
  });
});

describe("contact form validation", () => {
  it("requires a real message", () => {
    expect(contactSchema.safeParse({ name: "Dana", email: "d@e.com", message: "hi" }).success).toBe(false);
  });

  it("accepts a genuine enquiry", () => {
    expect(
      contactSchema.safeParse({
        name: "Dana",
        email: "d@e.com",
        message: "We run a camp in Pennsylvania and would like to know more.",
        elapsed_ms: 8000,
      }).success,
    ).toBe(true);
  });
});
