import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import { mapStatus, toIso } from "@/lib/stripe/client";

/**
 * Stripe is the authority on whether a camp has paid. These tests cover the
 * translation from Stripe's world into ours, and the webhook's refusal to trust
 * an unsigned request.
 */

describe("status mapping", () => {
  it("passes through every status we model", () => {
    const statuses: Stripe.Subscription.Status[] = [
      "trialing",
      "active",
      "past_due",
      "canceled",
      "unpaid",
      "incomplete",
      "incomplete_expired",
      "paused",
    ];
    for (const status of statuses) {
      expect(mapStatus(status), status).toBe(status);
    }
  });

  it("falls back to 'none' for anything unexpected", () => {
    expect(mapStatus("something_new" as Stripe.Subscription.Status)).toBe("none");
  });
});

describe("timestamp conversion", () => {
  it("converts Stripe seconds to an ISO string", () => {
    expect(toIso(1_767_225_600)).toBe(new Date(1_767_225_600_000).toISOString());
  });

  it("tolerates Stripe's null and undefined fields", () => {
    expect(toIso(null)).toBeNull();
    expect(toIso(undefined)).toBeNull();
    expect(toIso(0)).toBeNull();
  });
});

/**
 * The webhook is the one endpoint anyone on the internet can reach that grants
 * a subscription. If signature verification ever regresses, anybody could POST
 * themselves a paid plan — so it is tested directly.
 */
describe("webhook signature verification", () => {
  const constructEvent = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    constructEvent.mockReset();
    process.env.STRIPE_SECRET_KEY = "sk_test_fake";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_fake";

    vi.doMock("@/lib/stripe/client", () => ({
      getStripe: () => ({ webhooks: { constructEvent } }),
      isStripeConfigured: () => true,
      mapStatus,
      toIso,
      priceIdFor: () => "price_fake",
    }));
  });

  async function post(headers: Record<string, string>, body = "{}") {
    const { POST } = await import("@/app/api/stripe/webhook/route");
    return POST(new Request("https://test.campvoice.com/api/stripe/webhook", { method: "POST", headers, body }));
  }

  it("rejects a request with no signature header", async () => {
    const response = await post({});
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "missing_signature" });
    expect(constructEvent).not.toHaveBeenCalled();
  });

  it("rejects a forged signature", async () => {
    constructEvent.mockImplementation(() => {
      throw new Error("No signatures found matching the expected signature for payload");
    });

    const response = await post({ "stripe-signature": "t=1,v1=forged" });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_signature" });
  });

  it("verifies the signature before reading any field of the body", async () => {
    constructEvent.mockImplementation(() => {
      throw new Error("bad signature");
    });

    // A body that claims a paid subscription must still be rejected.
    const hostile = JSON.stringify({
      type: "customer.subscription.updated",
      data: { object: { id: "sub_x", status: "active", metadata: { organization_id: "someone-elses-camp" } } },
    });

    const response = await post({ "stripe-signature": "t=1,v1=forged" }, hostile);
    expect(response.status).toBe(400);
  });

  it("accepts a correctly signed event", async () => {
    constructEvent.mockReturnValue({ type: "customer.subscription.trial_will_end", data: { object: {} } });
    vi.doMock("@/lib/stripe/sync", () => ({
      syncSubscription: vi.fn().mockResolvedValue({ organizationId: "org", status: "trialing" }),
      markSubscriptionEnded: vi.fn(),
      markPaymentFailed: vi.fn(),
    }));

    const response = await post({ "stripe-signature": "t=1,v1=valid" });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });
  });

  it("ignores event types it does not handle, without failing", async () => {
    constructEvent.mockReturnValue({ type: "customer.created", data: { object: {} } });
    const response = await post({ "stripe-signature": "t=1,v1=valid" });
    expect(response.status).toBe(200);
  });
});
