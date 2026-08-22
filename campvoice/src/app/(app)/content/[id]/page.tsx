import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { getContent } from "@/lib/data/camp";
import { categoryLabel, getTemplate } from "@/lib/ai/templates";
import { Button } from "@/components/ui";
import { ContentEditor } from "@/components/app/ContentEditor";
import { deleteContent, duplicateContent, toggleFavorite } from "../actions";

export const metadata: Metadata = {
  title: "Draft",
  robots: { index: false, follow: false },
};

export default async function ContentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const context = await requireSession();
  const { id } = await params;
  const { new: isNewParam } = await searchParams;

  // Scoped to this camp: another camp's id returns nothing and 404s.
  const content = await getContent(context.organization.id, id);
  if (!content) notFound();

  const template = getTemplate(content.template_id);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <p className="text-sm">
        <Link href="/content" className="text-ink-500 underline underline-offset-4 hover:text-ink-900">
          ← Content library
        </Link>
      </p>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow">
            {categoryLabel(content.category)} · {template?.label ?? content.template_id}
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">{content.title}</h1>
          <p className="mt-1 text-sm text-ink-300">
            Created{" "}
            {new Date(content.created_at).toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <form action={toggleFavorite}>
            <input type="hidden" name="content_id" value={content.id} />
            <Button type="submit" variant="ghost" size="sm" aria-pressed={content.is_favorite}>
              {content.is_favorite ? "★ Favourite" : "☆ Favourite"}
            </Button>
          </form>

          <form action={duplicateContent}>
            <input type="hidden" name="content_id" value={content.id} />
            <Button type="submit" variant="ghost" size="sm">Duplicate</Button>
          </form>

          <form action={deleteContent}>
            <input type="hidden" name="content_id" value={content.id} />
            <Button type="submit" variant="ghost" size="sm" className="text-danger-600">Delete</Button>
          </form>
        </div>
      </div>

      <div className="mt-8">
        <ContentEditor content={content} isNew={isNewParam === "1"} />
      </div>

      {template && Object.keys(content.inputs).length > 0 ? (
        <details className="mt-10 rounded-lg border border-paper-300 bg-paper-50 px-5 py-4">
          <summary className="cursor-pointer text-sm font-medium text-ink-700">
            What you told CampVoice
          </summary>
          <dl className="mt-4 space-y-3">
            {template.fields
              .filter((field) => {
                const value = content.inputs[field.name];
                return typeof value === "string" && value.trim().length > 0;
              })
              .map((field) => (
                <div key={field.name}>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-ink-300">{field.label}</dt>
                  <dd className="mt-0.5 text-sm text-ink-700">{String(content.inputs[field.name])}</dd>
                </div>
              ))}
          </dl>
          <p className="mt-4">
            <Link href={`/create/${content.template_id}`} className="text-sm text-forest-700 underline underline-offset-4">
              Start a new {template.label.toLowerCase()}
            </Link>
          </p>
        </details>
      ) : null}
    </div>
  );
}
