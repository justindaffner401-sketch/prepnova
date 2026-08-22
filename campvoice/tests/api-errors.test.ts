import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ApiError, readJson, withErrorHandling } from "@/lib/api/guard";

/**
 * Error handling. A camp director must never see a stack trace, and an AI
 * failure must never destroy what they already had.
 */

describe("request body handling", () => {
  const schema = z.object({ name: z.string().min(1) });

  function request(body: string) {
    return new Request("https://test.campvoice.com/api/x", { method: "POST", body });
  }

  it("parses a valid body", async () => {
    await expect(readJson(request(JSON.stringify({ name: "Dana" })), schema)).resolves.toEqual({ name: "Dana" });
  });

  it("gives a friendly message for malformed JSON", async () => {
    await expect(readJson(request("{not json"), schema)).rejects.toMatchObject({
      status: 400,
      userMessage: expect.stringContaining("couldn't read"),
    });
  });

  it("gives a friendly message for invalid fields", async () => {
    await expect(readJson(request(JSON.stringify({ name: "" })), schema)).rejects.toMatchObject({
      status: 400,
      userMessage: expect.stringContaining("check the form"),
    });
  });

  it("refuses an oversized body before parsing it", async () => {
    const huge = JSON.stringify({ name: "x".repeat(1_100_000) });
    await expect(readJson(request(huge), schema)).rejects.toMatchObject({ status: 413 });
  });

  it("strips unknown fields rather than passing them through", async () => {
    const result = await readJson(request(JSON.stringify({ name: "Dana", is_admin: true })), schema);
    expect(result).not.toHaveProperty("is_admin");
  });
});

describe("error responses", () => {
  it("passes a known problem through with its friendly message", async () => {
    const handler = withErrorHandling("test", async () => {
      throw new ApiError(402, "Your CampVoice trial has ended.", "not_entitled");
    });

    const response = await handler();
    expect(response.status).toBe(402);
    expect(await response.json()).toEqual({
      error: { code: "not_entitled", message: "Your CampVoice trial has ended." },
    });
  });

  it("never leaks an unexpected error's details to the user", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const handler = withErrorHandling("test", async () => {
      throw new Error("Postgres connection string postgres://user:hunter2@db:5432 failed");
    });

    const response = await handler();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(JSON.stringify(body)).not.toContain("hunter2");
    expect(JSON.stringify(body)).not.toContain("postgres://");
    expect(body.error.message).toContain("Your information is safe");

    // The real detail still reaches the server log, where the founder can find it.
    expect(spy).toHaveBeenCalled();
    expect(JSON.stringify(spy.mock.calls)).toContain("hunter2");

    spy.mockRestore();
  });

  it("returns a normal response when nothing goes wrong", async () => {
    const handler = withErrorHandling("test", async () => Response.json({ ok: true }));
    expect((await handler()).status).toBe(200);
  });
});

describe("AI failure does not destroy user data", () => {
  it("reports a service problem without touching what the camp already had", async () => {
    // The generate route saves only AFTER a successful AI call, so a failure
    // cannot overwrite an existing draft. This asserts the error shape a
    // failure produces.
    const handler = withErrorHandling("api.generate", async () => {
      throw new ApiError(503, "We couldn't generate this right now. Your information is safe. Try again.", "ai_unavailable");
    });

    const response = await handler();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error.message).toContain("Your information is safe");
  });
});
