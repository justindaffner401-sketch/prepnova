import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui";
import { SignUpForm } from "@/components/auth/AuthForms";
import { trial } from "@/lib/config";

export const metadata: Metadata = {
  title: "Start Free",
  description: "Create your CampVoice account.",
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return (
    <Card className="p-7 sm:p-8">
      <h1 className="font-display text-2xl font-semibold">Start your free trial</h1>
      <p className="mt-2 text-sm prose-camp">
        {trial.days} days of CampVoice.{trial.requireCard ? " Cancel any time." : " No credit card required."}
      </p>

      <div className="mt-7">
        <SignUpForm />
      </div>

      <p className="mt-6 border-t border-paper-300 pt-5 text-center text-sm text-ink-500">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-forest-700 underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
