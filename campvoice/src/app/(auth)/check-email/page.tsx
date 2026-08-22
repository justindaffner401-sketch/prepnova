import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "Confirm your email",
  robots: { index: false, follow: false },
};

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <Card className="p-7 text-center sm:p-8">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-forest-50 text-forest-700">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      </span>

      <h1 className="mt-5 font-display text-2xl font-semibold">Confirm your email</h1>
      <p className="mt-3 prose-camp">
        We sent a confirmation link{email ? <> to <strong className="text-ink-900">{email}</strong></> : null}. Click it
        and we&rsquo;ll take you straight into setting up your camp.
      </p>
      <p className="mt-4 text-sm text-ink-300">
        Nothing arrived? Check your spam folder, or{" "}
        <Link href="/contact" className="underline underline-offset-4 hover:text-ink-700">tell us</Link> and we&rsquo;ll help.
      </p>
    </Card>
  );
}
