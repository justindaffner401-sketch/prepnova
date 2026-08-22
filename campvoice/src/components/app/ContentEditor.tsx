"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { Alert, Button, Spinner } from "@/components/ui";
import { REVISION_ACTIONS } from "@/lib/ai/generate";
import { saveContent, type ContentActionState } from "@/app/(app)/content/actions";
import type { ContentGeneration } from "@/lib/db/types";

const EMPTY: ContentActionState = {};

/**
 * The content editor.
 *
 * Everything a camp director wants to do with a draft lives here: read it, edit
 * it by hand, revise it with one click, copy it, and save it.
 */
export function ContentEditor({ content, isNew }: { content: ContentGeneration; isNew: boolean }) {
  const router = useRouter();

  // What the server currently holds for this draft.
  const serverDraft = content.edited_output?.trim() || content.output;

  const [draft, setDraft] = useState(serverDraft);
  const [title, setTitle] = useState(content.title);
  const [syncedTo, setSyncedTo] = useState(serverDraft);
  const [revising, setRevising] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customInstruction, setCustomInstruction] = useState("");
  const [saveState, saveAction, saving] = useActionState(saveContent, EMPTY);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // When a revision replaces the draft on the server, that becomes the truth
  // again. This is React's "adjust state when a prop changes" pattern, done
  // during render rather than in an effect so there is no extra render pass.
  if (serverDraft !== syncedTo) {
    setSyncedTo(serverDraft);
    setDraft(serverDraft);
  }

  // "Unsaved changes" is derived, not tracked: it is simply whether what is on
  // screen differs from what the server holds. After a save the server value
  // updates and this becomes false on its own.
  const dirty = draft !== serverDraft || title !== content.title;

  // Warn before leaving with unsaved manual edits.
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  async function revise(actionId: string, instruction?: string) {
    setRevising(actionId);
    setError("");

    try {
      const response = await fetch("/api/revise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_id: content.id,
          action: actionId,
          ...(instruction ? { custom_instruction: instruction } : {}),
        }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(body?.error?.message ?? "We couldn't revise this right now. Your draft is safe. Try again.");
        return;
      }

      setDraft(body.output);
      setSyncedTo(body.output);
      setCustomOpen(false);
      setCustomInstruction("");
      router.refresh();
    } catch {
      setError("We couldn't reach our server. Your draft is safe — please try again.");
    } finally {
      setRevising(null);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      void fetch("/api/analytics/copied", { method: "POST" }).catch(() => {});
    } catch {
      // Clipboard can be blocked; select the text so the user can copy manually.
      textareaRef.current?.focus();
      textareaRef.current?.select();
      setError("Your browser blocked copying. The draft is selected — press Ctrl+C (or ⌘C) to copy it.");
    }
  }

  const busy = revising !== null;

  return (
    <div className="space-y-5">
      {isNew ? (
        <Alert tone="success" title="Your draft is ready">
          Read it through, change anything you like, then save it to your library.
        </Alert>
      ) : null}

      {error ? <Alert tone="error">{error}</Alert> : null}
      {saveState.error ? <Alert tone="error">{saveState.error}</Alert> : null}
      {saveState.ok && !dirty ? <Alert tone="success">Saved to your library.</Alert> : null}

      {/* ------------------------------------------------------- the draft */}
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-paper-300 bg-paper-200/50 px-4 py-2.5">
          <p className="text-sm font-medium text-ink-500">
            Your draft
            {content.revision_count > 0 ? ` · revised ${content.revision_count}×` : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={copy} disabled={busy}>
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>

        <label htmlFor="draft" className="sr-only">Draft content, editable</label>
        <textarea
          ref={textareaRef}
          id="draft"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={busy}
          rows={18}
          spellCheck
          className="block w-full resize-y border-0 bg-paper-50 px-5 py-4 font-sans text-base leading-relaxed text-ink-800 focus:outline-none disabled:opacity-60"
        />
      </div>

      {busy ? (
        <p className="inline-flex items-center gap-2 text-sm text-forest-700" role="status" aria-live="polite">
          <Spinner label="Revising" />
          Rewriting in your camp&rsquo;s voice…
        </p>
      ) : null}

      {/* -------------------------------------------------- revision tools */}
      <section aria-labelledby="revise-heading">
        <h2 id="revise-heading" className="text-sm font-semibold text-ink-900">
          Change it with one click
        </h2>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {REVISION_ACTIONS.map((action) => (
            <Button
              key={action.id}
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => revise(action.id)}
            >
              {revising === action.id ? "Working…" : action.label}
            </Button>
          ))}
          <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => setCustomOpen((open) => !open)}>
            Custom Revision
          </Button>
        </div>

        {customOpen ? (
          <div className="mt-3 rounded-lg border border-paper-300 bg-paper-50 p-4">
            <label htmlFor="custom-instruction" className="field-label">
              What would you like changed?
            </label>
            <textarea
              id="custom-instruction"
              className="input mt-1.5"
              rows={2}
              maxLength={600}
              value={customInstruction}
              onChange={(event) => setCustomInstruction(event.target.value)}
              placeholder="Mention that the waterfront was her favorite part of the tour."
            />
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                size="sm"
                disabled={busy || customInstruction.trim().length < 3}
                onClick={() => revise("custom", customInstruction.trim())}
              >
                {revising === "custom" ? "Revising…" : "Apply change"}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setCustomOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      {/* ------------------------------------------------------------ save */}
      <form action={saveAction} className="divider-soft flex flex-wrap items-end gap-3 pt-5">
        <input type="hidden" name="content_id" value={content.id} />
        <input type="hidden" name="edited_output" value={draft} />

        <div className="min-w-0 flex-1">
          <label htmlFor="title" className="field-label">Title in your library</label>
          <input
            id="title"
            name="title"
            className="input mt-1.5"
            maxLength={160}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        <Button type="submit" size="lg" disabled={saving || busy}>
          {saving ? (
            <>
              <Spinner label="Saving" />
              Saving…
            </>
          ) : dirty ? (
            "Save changes"
          ) : (
            "Save to library"
          )}
        </Button>
      </form>
    </div>
  );
}
