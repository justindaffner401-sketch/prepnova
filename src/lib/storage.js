const RESULTS_KEY = "prepnova_results";
const API_KEY_KEY = "prepnova_api_key";
const SELECTION_KEY = "prepnova_last_selection";

/* ---------------- Results ---------------- */

export function getResults() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RESULTS_KEY));
    return Array.isArray(parsed) ? parsed.filter(isValidResult) : [];
  } catch {
    return [];
  }
}

function isValidResult(r) {
  return (
    r &&
    typeof r === "object" &&
    typeof r.test === "string" &&
    typeof r.subject === "string" &&
    Number.isFinite(r.score) &&
    Number.isFinite(r.total) &&
    r.total > 0
  );
}

export function saveResult({ test, subject, score, total, source }) {
  const entry = {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ts: new Date().toISOString(),
    test,
    subject,
    score,
    total,
    percent: Math.round((score / total) * 100),
    source,
  };
  try {
    localStorage.setItem(RESULTS_KEY, JSON.stringify([...getResults(), entry]));
  } catch {
    // Storage full or unavailable — the session still completes, it just isn't persisted.
  }
  return entry;
}

export function clearResults() {
  localStorage.removeItem(RESULTS_KEY);
}

/* ---------------- API key ---------------- */

export function getApiKey() {
  return (
    localStorage.getItem(API_KEY_KEY) ||
    import.meta.env.VITE_ANTHROPIC_API_KEY ||
    ""
  );
}

export function hasStoredKey() {
  return Boolean(localStorage.getItem(API_KEY_KEY));
}

export function setStoredKey(key) {
  const trimmed = (key || "").trim();
  if (trimmed) localStorage.setItem(API_KEY_KEY, trimmed);
  else localStorage.removeItem(API_KEY_KEY);
}

/* ---------------- Last selection ---------------- */

export function getLastSelection() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SELECTION_KEY));
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function setLastSelection(selection) {
  try {
    localStorage.setItem(SELECTION_KEY, JSON.stringify(selection));
  } catch {
    // Non-critical.
  }
}
