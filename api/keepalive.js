// Vercel Cron keep-alive. Runs one lightweight Supabase query on a daily
// schedule (see `crons` in vercel.json) so the free-tier project keeps seeing
// activity and isn't auto-paused for inactivity. Does nothing expensive — a
// single HEAD + count query, no rows returned.
//
// Security: set a CRON_SECRET env var in Vercel and it will only run for
// Vercel Cron (which sends `Authorization: Bearer $CRON_SECRET`). Until that's
// set the endpoint still works (the query is harmless), but setting it is
// recommended. A light IP rate limit blunts manual spamming either way.

import { createClient } from "@supabase/supabase-js";
import { rateLimit, clientIp } from "./_security.js";

export default async function handler(req, res) {
  // If CRON_SECRET is configured, require it (Vercel Cron sends it automatically).
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const { limited } = rateLimit({
    bucket: "keepalive",
    identity: clientIp(req),
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (limited) return res.status(429).json({ error: "Too many requests." });

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(503).json({ error: "Supabase isn't configured on this deployment." });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
    // Lightweight DB hit — registers activity without returning any rows.
    const { error } = await supabase
      .from("subscriptions")
      .select("user_id", { count: "exact", head: true });
    if (error) throw error;
    return res.status(200).json({ ok: true, ts: new Date().toISOString() });
  } catch (err) {
    console.error("keepalive error:", err?.message);
    return res.status(502).json({ ok: false });
  }
}
