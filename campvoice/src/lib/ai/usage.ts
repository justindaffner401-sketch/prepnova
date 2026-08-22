import { createAdminClient } from "@/lib/supabase/admin";
import { estimateCostUsd, limits } from "@/lib/config";
import { logger } from "@/lib/logger";

/**
 * Fair-use limits and AI cost tracking.
 *
 * Two layers, on purpose:
 *  - A per-minute burst limit held in memory, which stops an accidental
 *    double-click storm instantly and costs nothing.
 *  - A per-day limit counted in the database, which survives restarts and
 *    covers all of the serverless instances at once. This is the one that
 *    actually protects your bill.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const burstBuckets = new Map<string, Bucket>();

export interface LimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
  reason?: "burst" | "daily";
}

/** In-memory burst limiter. Per serverless instance, which is fine for its job. */
export function checkBurstLimit(key: string, max = limits.generationsPerMinute, windowMs = 60_000): LimitResult {
  const now = Date.now();
  const bucket = burstBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    burstBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= max) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000), reason: "burst" };
  }

  bucket.count += 1;
  return { allowed: true };
}

/** Clears expired buckets so a long-lived instance does not grow forever. */
export function pruneBurstBuckets(now = Date.now()): void {
  for (const [key, bucket] of burstBuckets) {
    if (bucket.resetAt <= now) burstBuckets.delete(key);
  }
}

/** Test-only helper. */
export function resetBurstBuckets(): void {
  burstBuckets.clear();
}

/** Database-backed daily limit, shared across every server instance. */
export async function checkDailyLimit(organizationId: string, max = limits.generationsPerDay): Promise<LimitResult> {
  try {
    const admin = createAdminClient();
    const since = new Date(Date.now() - 86_400_000).toISOString();
    const { count, error } = await admin
      .from("ai_usage")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("created_at", since);

    if (error) throw error;
    if ((count ?? 0) >= max) {
      return { allowed: false, retryAfterSeconds: 3600, reason: "daily" };
    }
    return { allowed: true };
  } catch (error) {
    // A limiter outage must not take the product down. Log it and allow.
    logger.error("usage.daily_limit_check_failed", error, { organizationId });
    return { allowed: true };
  }
}

export interface UsageRecord {
  organizationId: string;
  userId: string | null;
  operation: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  succeeded: boolean;
  errorCode?: string;
}

/** Records what an AI call cost. Never throws — accounting must not break a feature. */
export async function recordUsage(record: UsageRecord): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("ai_usage").insert({
      organization_id: record.organizationId,
      user_id: record.userId,
      operation: record.operation,
      model: record.model,
      input_tokens: record.inputTokens,
      output_tokens: record.outputTokens,
      estimated_cost_usd: estimateCostUsd(record.model, record.inputTokens, record.outputTokens),
      succeeded: record.succeeded,
      error_code: record.errorCode ?? null,
    });
  } catch (error) {
    logger.error("usage.record_failed", error, { organizationId: record.organizationId });
  }
}
