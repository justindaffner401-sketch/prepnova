import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <div className="bg-topo flex min-h-screen flex-col">
      <header className="mx-auto w-full max-w-6xl px-5 py-5">
        <Logo />
      </header>

      <main id="main-content" className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="max-w-md text-center">
          <p className="eyebrow">404</p>
          <h1 className="mt-3 font-display text-3xl font-semibold">We couldn&rsquo;t find that page</h1>
          <p className="mt-3 prose-camp">
            The link may be out of date, or the item may have been deleted.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/dashboard" className="btn btn-primary">Go to dashboard</Link>
            <Link href="/" className="btn btn-secondary">Back to the homepage</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
