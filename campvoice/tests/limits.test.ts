import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkBurstLimit, pruneBurstBuckets, resetBurstBuckets } from "@/lib/ai/usage";
import { annualSavings, estimateCostUsd, pricing } from "@/lib/config";

describe("burst rate limiting", () => {
  beforeEach(() => resetBurstBuckets());

  it("allows requests up to the limit", () => {
    for (let i = 0; i < 5; i += 1) {
      expect(checkBurstLimit("camp-a", 5).allowed, `request ${i + 1}`).toBe(true);
    }
  });

  it("blocks the request past the limit and says when to retry", () => {
    for (let i = 0; i < 3; i += 1) checkBurstLimit("camp-a", 3);
    const blocked = checkBurstLimit("camp-a", 3);

    expect(blocked.allowed).toBe(false);
    expect(blocked.reason).toBe("burst");
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("keeps one camp's limit separate from another's", () => {
    for (let i = 0; i < 3; i += 1) checkBurstLimit("camp-a", 3);

    expect(checkBurstLimit("camp-a", 3).allowed).toBe(false);
    expect(checkBurstLimit("camp-b", 3).allowed).toBe(true);
  });

  it("lets a camp through again once the window has passed", () => {
    vi.useFakeTimers();
    try {
      for (let i = 0; i < 2; i += 1) checkBurstLimit("camp-a", 2, 60_000);
      expect(checkBurstLimit("camp-a", 2, 60_000).allowed).toBe(false);

      vi.advanceTimersByTime(60_001);
      expect(checkBurstLimit("camp-a", 2, 60_000).allowed).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("prunes expired buckets so memory does not grow forever", () => {
    checkBurstLimit("camp-a", 5, 1_000);
    // Pruning at a point past the window clears the bucket entirely.
    pruneBurstBuckets(Date.now() + 10_000);
    expect(checkBurstLimit("camp-a", 1, 60_000).allowed).toBe(true);
  });

  afterEach(() => vi.useRealTimers());
});

describe("pricing configuration", () => {
  it("computes annual savings rather than hard-coding them", () => {
    const savings = annualSavings();
    expect(savings.monthlyTotal).toBe(pricing.monthly.amount * 12);
    expect(savings.saved).toBe(pricing.monthly.amount * 12 - pricing.annual.amount);
    expect(savings.percent).toBeGreaterThan(0);
    expect(savings.percent).toBeLessThan(100);
  });

  it("prices the annual plan below twelve months", () => {
    expect(pricing.annual.amount).toBeLessThan(pricing.monthly.amount * 12);
  });
});

describe("AI cost estimation", () => {
  it("estimates a cost from token counts", () => {
    // 1M input + 1M output on Opus pricing.
    expect(estimateCostUsd("claude-opus-5", 1_000_000, 1_000_000)).toBeCloseTo(30, 5);
  });

  it("falls back to a conservative rate for an unknown model", () => {
    expect(estimateCostUsd("some-future-model", 1_000_000, 0)).toBeGreaterThan(0);
  });

  it("returns zero for a call that used no tokens", () => {
    expect(estimateCostUsd("claude-opus-5", 0, 0)).toBe(0);
  });
});
