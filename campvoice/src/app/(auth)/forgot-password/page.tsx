import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui";
import { ForgotPasswordForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = {
  title: "Reset your password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <Card className="p-7 sm:p-8">
      <h1 className="font-display text-2xl font-semibold">Reset your password</h1>
      <p className="mt-2 text-sm prose-camp">
        Enter the email you use for CampVoice and we&rsquo;ll send you a link to set a new password.
      </p>

      <div className="mt-7">
        <ForgotPasswordForm />
      </div>

      <p className="mt-6 border-t border-paper-300 pt-5 text-center text-sm text-ink-500">
        <Link href="/sign-in" className="font-medium text-forest-700 underline underline-offset-4">
          Back to sign in
        </Link>
      </p>
    </Card>
  );
}
