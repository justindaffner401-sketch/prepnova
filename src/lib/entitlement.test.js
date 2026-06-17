import { describe, it, expect } from "vitest";
import { isEntitled } from "./entitlement.js";

const future = new Date(Date.now() + 86_400_000).toISOString();
const past = new Date(Date.now() - 86_400_000).toISOString();

describe("isEntitled", () => {
  it("denies when there's no subscription or status", () => {
    expect(isEntitled(null)).toBe(false);
    expect(isEntitled(undefined)).toBe(false);
    expect(isEntitled({})).toBe(false);
    expect(isEntitled({ status: "none" })).toBe(false);
    expect(isEntitled({ status: "canceled" })).toBe(false);
  });

  it("grants active recurring states", () => {
    expect(isEntitled({ status: "active" })).toBe(true);
    expect(isEntitled({ status: "trialing" })).toBe(true);
    expect(isEntitled({ status: "past_due" })).toBe(true);
  });

  it("grants lifetime forever", () => {
    expect(isEntitled({ status: "lifetime" })).toBe(true);
  });

  it("grants a 1-year plan only until its expiry", () => {
    expect(isEntitled({ status: "year", current_period_end: future })).toBe(true);
    expect(isEntitled({ status: "year", current_period_end: past })).toBe(false);
    expect(isEntitled({ status: "year", current_period_end: null })).toBe(false);
  });
});
