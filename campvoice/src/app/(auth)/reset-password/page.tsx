import type { Metadata } from "next";
import { Card } from "@/components/ui";
import { ResetPasswordForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <Card className="p-7 sm:p-8">
      <h1 className="font-display text-2xl font-semibold">Choose a new password</h1>
      <p className="mt-2 text-sm prose-camp">Pick something you don&rsquo;t use anywhere else.</p>

      <div className="mt-7">
        <ResetPasswordForm />
      </div>
    </Card>
  );
}
