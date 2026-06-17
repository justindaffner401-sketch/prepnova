// Shared security helpers for the serverless API routes.
//
// Rate limiting here is IN-MEMORY and per warm function instance: counters are
// not shared across Vercel regions/instances and reset on cold starts. That
// makes it good for blunting casual abuse and runaway clients, but it is NOT a
// hard global guarantee. For strong, shared limits in production, back this with
// Upstash Redis (@upstash/ratelimit) — the call sites below would swap the
// in-memory check for an Upstash check without other changes.

/** First client IP from the proxy chain (Vercel sets x-forwarded-for). */
export function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) return fwd.split(",")[0].trim();
  return req.headers["x-real-ip"] || req.socket?.remoteAddress || "unknown";
}

/** Read a positive integer env var, falling back to a default. */
export function envInt(name, fallback) {
  const n = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// One shared map keyed by `${bucket}:${identity}` → array of request timestamps.
const hits = new Map();

/**
 * Sliding-window limiter. `identity` lets callers add a user id on top of IP so
 * a single account can't fan out across many IPs (and vice-versa) — pass the
 * authenticated user id when you have one.
 *
 * Returns { limited, retryAfter } where retryAfter is seconds until the window
 * frees up. Callers send a 429 with a Retry-After header when limited.
 */
export function rateLimit({ bucket, identity, limit, windowMs }) {
  const key = `${bucket}:${identity}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (recent.length >= limit) {
    hits.set(key, recent);
    const retryAfter = Math.max(1, Math.ceil((windowMs - (now - recent[0])) / 1000));
    return { limited: true, retryAfter };
  }

  recent.push(now);
  hits.set(key, recent);

  // Bound memory: occasionally drop fully-expired buckets.
  if (hits.size > 5000) {
    for (const [k, stamps] of hits) {
      if (stamps.every((t) => now - t >= windowMs)) hits.delete(k);
    }
  }
  return { limited: false, retryAfter: 0 };
}

/**
 * Reject obviously-abusive request bodies before we do any work: must be a
 * plain JSON object and under a small byte budget (these endpoints only take a
 * handful of short fields). Returns an error string, or null when OK.
 */
export function checkBody(body, { maxBytes = 4096 } = {}) {
  if (body === undefined || body === null) return null; // some routes take no body
  if (typeof body !== "object" || Array.isArray(body)) return "Invalid request body.";
  let size = 0;
  try {
    size = Buffer.byteLength(JSON.stringify(body), "utf8");
  } catch {
    return "Invalid request body.";
  }
  if (size > maxBytes) return "Request body too large.";
  return null;
}

/** True if `obj` only contains keys from `allowed` (rejects unexpected fields). */
export function onlyAllowedKeys(obj, allowed) {
  if (!obj || typeof obj !== "object") return true;
  return Object.keys(obj).every((k) => allowed.includes(k));
}
