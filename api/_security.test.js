import { describe, it, expect } from "vitest";
import { rateLimit, checkBody, onlyAllowedKeys, envInt } from "./_security.js";

describe("rateLimit", () => {
  it("allows requests under the limit, then returns 429-style limited", () => {
    const args = { bucket: "test", identity: "ip-A", limit: 2, windowMs: 10_000 };
    expect(rateLimit(args).limited).toBe(false); // 1
    expect(rateLimit(args).limited).toBe(false); // 2
    const third = rateLimit(args); // 3 — over
    expect(third.limited).toBe(true);
    expect(third.retryAfter).toBeGreaterThan(0);
  });

  it("tracks identities independently", () => {
    const a = { bucket: "test2", identity: "ip-X", limit: 1, windowMs: 10_000 };
    const b = { bucket: "test2", identity: "ip-Y", limit: 1, windowMs: 10_000 };
    expect(rateLimit(a).limited).toBe(false);
    expect(rateLimit(b).limited).toBe(false); // different identity, not limited
    expect(rateLimit(a).limited).toBe(true); // same identity again, limited
  });
});

describe("checkBody", () => {
  it("accepts a missing body and a small object", () => {
    expect(checkBody(undefined)).toBeNull();
    expect(checkBody(null)).toBeNull();
    expect(checkBody({ plan: "monthly" })).toBeNull();
  });

  it("rejects non-objects and arrays", () => {
    expect(checkBody("nope")).toBeTruthy();
    expect(checkBody([1, 2, 3])).toBeTruthy();
  });

  it("rejects oversized bodies", () => {
    expect(checkBody({ big: "x".repeat(5000) }, { maxBytes: 4096 })).toBeTruthy();
  });
});

describe("onlyAllowedKeys", () => {
  it("passes when keys are a subset of the allowlist", () => {
    expect(onlyAllowedKeys({ plan: "year" }, ["plan"])).toBe(true);
    expect(onlyAllowedKeys({}, ["plan"])).toBe(true);
    expect(onlyAllowedKeys(null, ["plan"])).toBe(true);
  });

  it("fails when an unexpected key is present", () => {
    expect(onlyAllowedKeys({ plan: "year", evil: 1 }, ["plan"])).toBe(false);
  });
});

describe("envInt", () => {
  it("returns the fallback when unset or invalid", () => {
    delete process.env.PN_TEST_INT;
    expect(envInt("PN_TEST_INT", 7)).toBe(7);
    process.env.PN_TEST_INT = "-5";
    expect(envInt("PN_TEST_INT", 7)).toBe(7);
    process.env.PN_TEST_INT = "abc";
    expect(envInt("PN_TEST_INT", 7)).toBe(7);
  });

  it("parses a valid positive integer", () => {
    process.env.PN_TEST_INT = "42";
    expect(envInt("PN_TEST_INT", 7)).toBe(42);
    delete process.env.PN_TEST_INT;
  });
});
