import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionContext, getSubscription, isEntitled, type SessionContext } from "@/lib/auth/session";
import { logger } from "@/lib/logger";

/**
 * Shared helpers for API route handlers: authentication, entitlement, request
 * validation and safe error responses.
 *
 * Two rules enforced here:
 *  - The caller's organization always comes from their session, never the body.
 *  - Users see a friendly message; the real error goes to the server log only.
 */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly userMessage: string,
    readonly code: string = "error",
    readonly detail?: unknown,
  ) {
    super(userMessage);
    this.name = "ApiError";
  }
}

export function jsonError(status: number, message: string, code = "error") {
  return NextResponse.json({ error: { code, message } }, { status });
}

/** Requires a signed-in user who belongs to a camp. */
export async function requireApiSession(): Promise<SessionContext> {
  const context = await getSessionContext();
  if (!context) {
    throw new ApiError(401, "Please sign in again to continue.", "unauthenticated");
  }
  return context;
}

/** Requires an active subscription or trial on top of a session. */
export async function requireEntitledSession(): Promise<SessionContext> {
  const context = await requireApiSession();
  const subscription = await getSubscription(context.organization.id);
  if (!isEntitled(subscription)) {
    throw new ApiError(
      402,
      "Your CampVoice trial has ended. Start a subscription to keep creating content.",
      "not_entitled",
    );
  }
  return context;
}

const MAX_BODY_BYTES = 1_000_000;

/** Parses and validates a JSON body against a Zod schema. */
export async function readJson<T extends z.ZodType>(request: Request, schema: T): Promise<z.infer<T>> {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    throw new ApiError(413, "That request was too large.", "body_too_large");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw || "{}");
  } catch {
    throw new ApiError(400, "We couldn't read that request. Please try again.", "invalid_json");
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new ApiError(400, "Some details were missing or invalid. Please check the form and try again.", "invalid_input", result.error.issues);
  }
  return result.data;
}

/**
 * Wraps a route handler so no raw stack trace ever reaches a user.
 * Known problems become friendly messages; anything unexpected becomes a
 * generic message plus a full server-side log entry.
 */
export function withErrorHandling<Args extends unknown[]>(
  operation: string,
  handler: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status >= 500) logger.error(operation, error, { code: error.code });
        else logger.warn(operation, { code: error.code, detail: error.detail });
        return jsonError(error.status, error.userMessage, error.code);
      }
      logger.error(operation, error);
      return jsonError(500, "Something went wrong on our end. Your information is safe — please try again.", "server_error");
    }
  };
}
