export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16" role="status" aria-live="polite">
      <span className="sr-only">Loading</span>
      <div className="shimmer h-8 w-56 rounded" aria-hidden="true" />
      <div className="mt-4 space-y-3" aria-hidden="true">
        <div className="shimmer h-4 w-full rounded" />
        <div className="shimmer h-4 w-11/12 rounded" />
        <div className="shimmer h-4 w-9/12 rounded" />
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2" aria-hidden="true">
        <div className="shimmer h-28 rounded-[var(--radius-card)]" />
        <div className="shimmer h-28 rounded-[var(--radius-card)]" />
      </div>
    </div>
  );
}
