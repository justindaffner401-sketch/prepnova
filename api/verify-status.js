// TEMPORARY diagnostic endpoint for the 2nd-model verification pass.
// Reports whether OPENAI_API_KEY is configured in THIS deployment and whether a
// minimal test call to OpenAI succeeds. Never returns the key itself. Guarded by
// a fixed token so it can't be hit (and drain quota) by random traffic.
//
// Check it with:  curl "https://www.prepnovaai.com/api/verify-status?token=pnstatus"
// Safe to delete once verification is confirmed working.

export default async function handler(req, res) {
  if ((req.query?.token || "") !== "pnstatus") {
    return res.status(404).json({ error: "Not found." });
  }

  const keyPresent = Boolean(process.env.OPENAI_API_KEY);
  const model = process.env.OPENAI_VERIFY_MODEL || "gpt-4o-mini";
  if (!keyPresent) {
    return res.status(200).json({
      keyPresent: false,
      model,
      ok: false,
      detail: "OPENAI_API_KEY is not set in this deployment (add it in Vercel, then redeploy).",
    });
  }

  let ok = false;
  let status = null;
  let detail = "";
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 1,
        messages: [{ role: "user", content: "ping" }],
      }),
    });
    status = r.status;
    ok = r.ok;
    if (!r.ok) {
      const data = await r.json().catch(() => null);
      detail = data?.error?.message || `HTTP ${r.status}`;
    }
  } catch (e) {
    detail = String(e?.message || e);
  }

  return res.status(200).json({ keyPresent: true, model, ok, status, detail });
}
