import { normaliseWhitespace } from "@/lib/ai/guardrails";
import { logger } from "@/lib/logger";

/**
 * Importing a camp's public website.
 *
 * SECURITY: fetching a URL a user supplies is server-side request forgery
 * territory. We defend by only allowing http/https, refusing anything that
 * resolves to a private or loopback address, refusing redirects to such
 * addresses, capping the response size, and capping the time we will wait.
 * We extract text only — no scripts run, and nothing from the page is treated
 * as an instruction.
 */

export class ImportError extends Error {
  constructor(
    readonly userMessage: string,
    readonly code: "invalid_url" | "blocked" | "unreachable" | "empty",
  ) {
    super(userMessage);
    this.name = "ImportError";
  }
}

const BLOCKED_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "metadata.google.internal"]);

/** True for addresses that are not on the public internet. */
export function isPrivateAddress(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) return true;

  // IPv4 private and reserved ranges.
  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a >= 224) return true;
  }

  // IPv6 loopback, link-local and unique-local.
  if (host === "::" || host.startsWith("fe80:") || host.startsWith("fc") || host.startsWith("fd")) return true;

  return false;
}

export function assertSafeUrl(input: string): URL {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new ImportError("That doesn't look like a web address. Try something like https://yourcamp.com", "invalid_url");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ImportError("Please use a web address starting with https://", "invalid_url");
  }
  if (isPrivateAddress(url.hostname)) {
    throw new ImportError("We can only import from a public website address.", "blocked");
  }
  return url;
}

const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 12_000;

export interface ImportedPage {
  url: string;
  title: string;
  text: string;
}

/** Strips markup and returns readable text. */
export function htmlToText(html: string): { title: string; text: string } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]{0,300}?)<\/title>/i);
  const title = titleMatch?.[1] ? decodeEntities(titleMatch[1]).trim().slice(0, 160) : "";

  const body = html
    // Drop anything that is not readable prose.
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    // Keep paragraph structure.
    .replace(/<\/(p|div|section|article|li|h[1-6]|br)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  return { title, text: normaliseWhitespace(decodeEntities(body)) };
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  rsquo: "'",
  lsquo: "'",
  ldquo: '"',
  rdquo: '"',
  mdash: "-",
  ndash: "-",
  hellip: "...",
};

function decodeEntities(input: string): string {
  return input
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name: string) => ENTITIES[name.toLowerCase()] ?? match);
}

export async function importWebsite(rawUrl: string): Promise<ImportedPage> {
  const url = assertSafeUrl(rawUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      // Do not follow redirects automatically: a redirect could point at a
      // private address and bypass the check above.
      redirect: "manual",
      headers: { "User-Agent": "CampVoiceBot/1.0 (+https://www.campvoice.com)", Accept: "text/html" },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        throw new ImportError("We couldn't import that page automatically. You can continue by pasting your camp information instead.", "unreachable");
      }
      // Follow exactly one redirect, re-validating the destination.
      const next = assertSafeUrl(new URL(location, url).toString());
      const followed = await fetch(next, {
        signal: controller.signal,
        redirect: "manual",
        headers: { "User-Agent": "CampVoiceBot/1.0 (+https://www.campvoice.com)", Accept: "text/html" },
      });
      return await readPage(followed, next);
    }

    return await readPage(response, url);
  } catch (error) {
    if (error instanceof ImportError) throw error;
    logger.warn("ingest.website_failed", { host: url.hostname, message: (error as Error)?.message });
    throw new ImportError(
      "We couldn't import that page automatically. You can continue by pasting your camp information instead.",
      "unreachable",
    );
  } finally {
    clearTimeout(timer);
  }
}

async function readPage(response: Response, url: URL): Promise<ImportedPage> {
  if (!response.ok) {
    throw new ImportError(
      "We couldn't import that page automatically. You can continue by pasting your camp information instead.",
      "unreachable",
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
    throw new ImportError("That address doesn't look like a web page we can read.", "unreachable");
  }

  const declaredLength = Number(response.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_BYTES) {
    throw new ImportError("That page is too large to import. Try a specific page like your About page.", "unreachable");
  }

  const raw = await response.text();
  const { title, text } = htmlToText(raw.slice(0, MAX_BYTES));

  if (text.replace(/\s/g, "").length < 200) {
    throw new ImportError(
      "We couldn't find enough readable text on that page. You can continue by pasting your camp information instead.",
      "empty",
    );
  }

  return { url: url.toString(), title: title || url.hostname, text: text.slice(0, 60_000) };
}
