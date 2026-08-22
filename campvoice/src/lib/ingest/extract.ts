import { limits } from "@/lib/config";
import { normaliseWhitespace } from "@/lib/ai/guardrails";

/**
 * Turning an uploaded file into usable reference text.
 *
 * Order of operations, and why:
 *  1. Validate the file (type, size) BEFORE reading it.
 *  2. Extract text with a library that does not execute anything in the file.
 *  3. Normalise whitespace so a badly extracted PDF does not blow the budget.
 *
 * The extracted text is REFERENCE DATA. It is wrapped by
 * src/lib/ai/guardrails.ts before it ever reaches a prompt, so instructions
 * hidden inside a document are read as quoted text, never obeyed.
 */

export const ACCEPTED_TYPES: Record<string, "pdf" | "docx" | "text"> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "text",
  "text/markdown": "text",
};

export const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"] as const;

export class ExtractionError extends Error {
  constructor(
    readonly userMessage: string,
    readonly code: "unsupported" | "too_large" | "empty" | "unreadable",
  ) {
    super(userMessage);
    this.name = "ExtractionError";
  }
}

export interface FileCandidate {
  name: string;
  type: string;
  size: number;
}

/** Checks a file before we spend any time on it. */
export function validateFile(file: FileCandidate): "pdf" | "docx" | "text" {
  if (file.size > limits.maxUploadBytes) {
    const mb = Math.round(limits.maxUploadBytes / (1024 * 1024));
    throw new ExtractionError(`That file is larger than ${mb}MB. Please upload a smaller version.`, "too_large");
  }
  if (file.size === 0) {
    throw new ExtractionError("That file appears to be empty.", "empty");
  }

  const byMime = ACCEPTED_TYPES[file.type];
  if (byMime) return byMime;

  // Some browsers send an empty or generic MIME type; fall back to the extension.
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx")) return "docx";
  if (lower.endsWith(".txt") || lower.endsWith(".md")) return "text";

  throw new ExtractionError("CampVoice can read PDF, Word (.docx), and plain text files.", "unsupported");
}

const MAX_EXTRACTED_CHARS = 200_000;

/** Extracts plain text. Never throws a raw library error at the caller. */
export async function extractText(buffer: ArrayBuffer, kind: "pdf" | "docx" | "text"): Promise<string> {
  let raw = "";

  try {
    if (kind === "pdf") {
      const { extractText: extractPdfText, getDocumentProxy } = await import("unpdf");
      const document = await getDocumentProxy(new Uint8Array(buffer));
      const result = await extractPdfText(document, { mergePages: true });
      raw = Array.isArray(result.text) ? result.text.join("\n\n") : result.text;
    } else if (kind === "docx") {
      const mammoth = (await import("mammoth")).default;
      const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
      raw = result.value;
    } else {
      raw = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
    }
  } catch {
    throw new ExtractionError(
      "We couldn't read this file. Try another version or paste the text directly.",
      "unreadable",
    );
  }

  const text = normaliseWhitespace(raw).slice(0, MAX_EXTRACTED_CHARS);

  if (text.replace(/\s/g, "").length < 40) {
    throw new ExtractionError(
      "We couldn't find any readable text in that file. If it's a scan, please paste the text directly.",
      "empty",
    );
  }

  return text;
}

/** A safe, predictable storage filename. Never trusts the name the browser sent. */
export function safeStorageName(originalName: string): string {
  const extension = (originalName.match(/\.[a-z0-9]{1,5}$/i)?.[0] ?? "").toLowerCase();
  const stem = originalName
    .replace(/\.[^.]*$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const unique = crypto.randomUUID().slice(0, 8);
  return `${stem || "document"}-${unique}${extension}`;
}

/** A readable title for the library. */
export function titleFromFilename(name: string): string {
  return name
    .replace(/\.[^.]*$/, "")
    .replace(/[_-]+/g, " ")
    .trim()
    .slice(0, 120) || "Uploaded document";
}
