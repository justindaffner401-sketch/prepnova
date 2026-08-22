import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Card, SkeletonLines } from "@/components/ui";
import { SignInForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to CampVoice.",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <Card className="p-7 sm:p-8">
      <h1 className="font-display text-2xl font-semibold">Welcome back</h1>
      <p className="mt-2 text-sm prose-camp">Sign in to pick up where your camp left off.</p>

      <div className="mt-7">
        <Suspense fallback={<SkeletonLines count={4} />}>
          <SignInForm />
        </Suspense>
      </div>

      <p className="mt-6 border-t border-paper-300 pt-5 text-center text-sm text-ink-500">
        New to CampVoice?{" "}
        <Link href="/sign-up" className="font-medium text-forest-700 underline underline-offset-4">
          Start free
        </Link>
      </p>
    </Card>
  );
}
