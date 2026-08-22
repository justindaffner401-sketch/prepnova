import { describe, expect, it } from "vitest";
import { isEntitled, trialDaysRemaining } from "@/lib/auth/session";
import { makeSubscription } from "./factories";

/**
 * Who can use the product. Getting this wrong either gives the product away or
 * locks out a paying customer, so it is tested carefully.
 */

const future = () => new Date(Date.now() + 5 * 86_400_000).toISOString();
const past = () => new Date(Date.now() - 86_400_000).toISOString();

describe("entitlement", () => {
  it("grants access while a subscription is active", () => {
    expect(isEntitled(makeSubscription({ status: "active" }))).toBe(true);
  });

  it("grants access during a live trial", () => {
    expect(isEntitled(makeSubscription({ status: "trialing", trial_ends_at: future() }))).toBe(true);
  });

  it("revokes access once the trial date has passed", () => {
    expect(isEntitled(makeSubscription({ status: "trialing", trial_ends_at: past() }))).toBe(false);
  });

  it("keeps access during a failed payment, so a card problem is not a lockout", () => {
    expect(isEntitled(makeSubscription({ status: "past_due" }))).toBe(true);
  });

  it("revokes access when cancelled, unpaid, or never subscribed", () => {
    expect(isEntitled(makeSubscription({ status: "canceled" }))).toBe(false);
    expect(isEntitled(makeSubscription({ status: "unpaid" }))).toBe(false);
    expect(isEntitled(makeSubscription({ status: "none" }))).toBe(false);
    expect(isEntitled(makeSubscription({ status: "incomplete" }))).toBe(false);
  });

  it("revokes access when there is no subscription row at all", () => {
    expect(isEntitled(null)).toBe(false);
  });

  it("treats a trialing subscription with no end date as still entitled", () => {
    // Stripe drives this row; a missing trial_end means the trial has not been
    // given an end, so we do not lock the camp out on our own guess.
    expect(isEntitled(makeSubscription({ status: "trialing", trial_ends_at: null }))).toBe(true);
  });
});

describe("trial countdown", () => {
  it("counts whole days remaining", () => {
    const ends = new Date(Date.now() + 3.2 * 86_400_000).toISOString();
    expect(trialDaysRemaining(makeSubscription({ status: "trialing", trial_ends_at: ends }))).toBe(4);
  });

  it("never goes negative", () => {
    expect(trialDaysRemaining(makeSubscription({ status: "trialing", trial_ends_at: past() }))).toBe(0);
  });

  it("returns nothing for a camp that is not trialing", () => {
    expect(trialDaysRemaining(makeSubscription({ status: "active" }))).toBeNull();
    expect(trialDaysRemaining(null)).toBeNull();
  });
});
