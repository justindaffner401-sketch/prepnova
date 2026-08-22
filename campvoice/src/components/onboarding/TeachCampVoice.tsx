"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Alert, Button, Field, Spinner } from "@/components/ui";
import type { SourceDocument } from "@/lib/db/types";

/**
 * Website import + file upload.
 *
 * Both run through API routes rather than server actions because they stream
 * files and can take a while. Every failure shows a plain-English message with
 * a way forward, never a technical error.
 */

export function WebsiteImport({ defaultUrl }: { defaultUrl: string | null }) {
  const router = useRouter();
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<{ title: string; excerpt: string; characters: number } | null>(null);

  async function handleImport() {
    if (!url.trim()) return;
    setState("working");
    setMessage("");
    setPreview(null);

    try {
      const response = await fetch("/api/camp/import-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setState("error");
        setMessage(body?.error?.message ?? "We couldn't import that page automatically. You can continue by pasting your camp information instead.");
        return;
      }

      setPreview(body.document);
      setState("done");
      router.refresh();
    } catch {
      setState("error");
      setMessage("We couldn't reach that page. You can continue by pasting your camp information instead.");
    }
  }

  return (
    <div className="space-y-4">
      {state === "error" ? <Alert tone="error">{message}</Alert> : null}

      <Field label="Your camp website" htmlFor="import-url" help="We read the public text on that page. Nothing is published or changed.">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="import-url"
            className="input"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://campevergreen.com/about"
            inputMode="url"
          />
          <Button type="button" variant="secondary" onClick={handleImport} disabled={state === "working" || !url.trim()}>
            {state === "working" ? (
              <>
                <Spinner label="Importing" />
                Reading…
              </>
            ) : (
              "Import"
            )}
          </Button>
        </div>
      </Field>

      {preview ? (
        <div className="card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-900">Imported: {preview.title}</p>
              <p className="text-xs text-ink-300">{preview.characters.toLocaleString()} characters of text</p>
            </div>
          </div>
          <p className="mt-3 line-clamp-4 text-sm prose-camp">{preview.excerpt}</p>
          <p className="mt-3 text-xs text-ink-300">
            Check this looks like your camp. CampVoice treats imported text as reference material only.
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function DocumentUpload({ documents }: { documents: SourceDocument[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setErrors([]);
    const failures: string[] = [];

    for (const file of Array.from(files)) {
      const body = new FormData();
      body.append("file", file);
      try {
        const response = await fetch("/api/camp/documents", { method: "POST", body });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          failures.push(`${file.name}: ${payload?.error?.message ?? "We couldn't read this file."}`);
        }
      } catch {
        failures.push(`${file.name}: upload failed. Please try again.`);
      }
    }

    setErrors(failures);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/camp/documents/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {errors.length > 0 ? (
        <Alert tone="error" title="Some files couldn't be read">
          <ul className="mt-1 list-disc space-y-1 pl-4">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </Alert>
      ) : null}

      <div className="rounded-lg border border-dashed border-paper-400 bg-paper-50 px-5 py-8 text-center">
        <label htmlFor="file-upload" className="cursor-pointer">
          <span className="font-medium text-forest-700 underline underline-offset-4">Choose files</span>
          <span className="text-ink-500"> to upload</span>
        </label>
        <input
          ref={inputRef}
          id="file-upload"
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          className="sr-only"
          disabled={uploading}
          onChange={(event) => handleFiles(event.target.files)}
        />
        <p className="mt-2 text-sm text-ink-300">PDF, Word (.docx) or plain text, up to 8MB each.</p>
        {uploading ? (
          <p className="mt-3 inline-flex items-center gap-2 text-sm text-forest-700">
            <Spinner label="Uploading" />
            Reading your files…
          </p>
        ) : null}
      </div>

      {documents.length === 0 ? (
        <p className="text-sm text-ink-300">
          Upload previous emails or newsletters to help CampVoice understand your voice.
        </p>
      ) : (
        <ul className="divide-y divide-paper-300 rounded-lg border border-paper-300 bg-paper-50">
          {documents.map((document) => (
            <li key={document.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-ink-900">{document.title}</p>
                <p className="text-xs text-ink-300">
                  {document.status === "ready"
                    ? `${document.char_count.toLocaleString()} characters · ${labelForKind(document.kind)}`
                    : document.error_message ?? "Couldn't be read"}
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => handleDelete(document.id)} aria-label={`Remove ${document.title}`}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function labelForKind(kind: SourceDocument["kind"]): string {
  if (kind === "website") return "imported from your website";
  if (kind === "paste") return "pasted text";
  return "uploaded file";
}
