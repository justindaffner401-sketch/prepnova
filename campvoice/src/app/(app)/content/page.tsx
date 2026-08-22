import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { listContent } from "@/lib/data/camp";
import { CATEGORIES, categoryLabel, getTemplate } from "@/lib/ai/templates";
import { Badge, ButtonLink, EmptyState } from "@/components/ui";

export const metadata: Metadata = {
  title: "Content Library",
  robots: { index: false, follow: false },
};

interface SearchParams {
  q?: string;
  category?: string;
  favorites?: string;
  page?: string;
}

export default async function ContentLibraryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const context = await requireSession();
  const params = await searchParams;

  const category = CATEGORIES.some((item) => item.id === params.category) ? params.category : undefined;
  const favoritesOnly = params.favorites === "1";
  const search = params.q?.trim() || undefined;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const result = await listContent({
    organizationId: context.organization.id,
    category,
    favoritesOnly,
    search,
    page,
  });

  const hasFilters = Boolean(category || favoritesOnly || search);

  function href(next: Partial<SearchParams>) {
    const query = new URLSearchParams();
    const merged = { q: search, category, favorites: favoritesOnly ? "1" : undefined, ...next };
    for (const [key, value] of Object.entries(merged)) {
      if (value) query.set(key, String(value));
    }
    const queryString = query.toString();
    return queryString ? `/content?${queryString}` : "/content";
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">Content Library</h1>
          <p className="mt-2 prose-camp">
            {result.total === 0 ? "Everything you create lives here." : `${result.total} ${result.total === 1 ? "item" : "items"}.`}
          </p>
        </div>
        <ButtonLink href="/create">Generate Something</ButtonLink>
      </div>

      {/* ------------------------------------------------------- filters */}
      <form method="get" className="mt-8 flex flex-wrap items-end gap-3" role="search">
        <div className="min-w-[12rem] flex-1">
          <label htmlFor="q" className="field-label">Search by title</label>
          <input id="q" name="q" defaultValue={search ?? ""} className="input mt-1.5" placeholder="Tour follow-up" />
        </div>

        <div>
          <label htmlFor="category" className="field-label">Category</label>
          <select id="category" name="category" defaultValue={category ?? ""} className="input mt-1.5">
            <option value="">All categories</option>
            {CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 pb-2.5 text-sm text-ink-700">
          <input type="checkbox" name="favorites" value="1" defaultChecked={favoritesOnly} className="h-4 w-4 rounded border-paper-400" />
          Favourites only
        </label>

        <button type="submit" className="btn btn-secondary">Filter</button>
        {hasFilters ? (
          <Link href="/content" className="btn btn-ghost btn-sm">Clear</Link>
        ) : null}
      </form>

      {/* --------------------------------------------------------- items */}
      <div className="mt-8">
        {result.items.length === 0 ? (
          hasFilters ? (
            <EmptyState
              title="Nothing matched those filters"
              description="Try a different category, or clear the filters to see everything."
              action={<ButtonLink href="/content" variant="secondary">Clear filters</ButtonLink>}
            />
          ) : (
            <EmptyState
              title="Nothing here yet"
              description="Create your first CampVoice communication."
              action={<ButtonLink href="/create">Generate Something</ButtonLink>}
            />
          )
        ) : (
          <ul className="divide-y divide-paper-300 overflow-hidden rounded-[var(--radius-card)] border border-paper-300 bg-paper-50">
            {result.items.map((item) => {
              const template = getTemplate(item.template_id);
              return (
                <li key={item.id}>
                  <Link href={`/content/${item.id}`} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-paper-100">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink-900">
                        {item.is_favorite ? <span className="mr-1 text-ember-500" aria-label="Favourite">★</span> : null}
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-sm text-ink-300">
                        {template?.label ?? item.template_id} · {categoryLabel(item.category)} ·{" "}
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <Badge tone={item.status === "saved" ? "forest" : "neutral"}>
                      {item.status === "saved" ? "Saved" : "Draft"}
                    </Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ---------------------------------------------------- pagination */}
      {result.pageCount > 1 ? (
        <nav className="mt-8 flex items-center justify-between" aria-label="Pagination">
          {result.page > 1 ? (
            <Link href={href({ page: String(result.page - 1) })} className="btn btn-secondary btn-sm">
              ← Newer
            </Link>
          ) : (
            <span />
          )}

          <p className="text-sm text-ink-300">
            Page {result.page} of {result.pageCount}
          </p>

          {result.page < result.pageCount ? (
            <Link href={href({ page: String(result.page + 1) })} className="btn btn-secondary btn-sm">
              Older →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
