import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { Button, Card } from "@/components/ui";
import { NameForm, PasswordForm } from "@/components/app/SettingsForms";

export const metadata: Metadata = {
  title: "Account settings",
  robots: { index: false, follow: false },
};

export default async function AccountSettingsPage() {
  const context = await requireSession();

  return (
    <div className="space-y-6">
      <Card className="p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold">Your account</h2>
        <p className="mt-1 text-sm prose-camp">The person CampVoice greets on the dashboard.</p>
        <div className="mt-6">
          <NameForm fullName={context.profile.full_name ?? ""} />
        </div>

        <div className="divider-soft mt-8 pt-6">
          <p className="field-label">Email address</p>
          <p className="mt-1 text-ink-800">{context.user.email}</p>
          <p className="field-help mt-1">
            Changing the email on an account is not self-service yet. Contact support and we&rsquo;ll move it for you.
          </p>
        </div>
      </Card>

      <Card className="p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold">Password</h2>
        <div className="mt-6">
          <PasswordForm />
        </div>
      </Card>

      <Card className="p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold">Sign out</h2>
        <p className="mt-1 text-sm prose-camp">Sign out of CampVoice on this device.</p>
        <form action="/auth/sign-out" method="post" className="mt-5">
          <Button type="submit" variant="secondary">Sign out</Button>
        </form>
      </Card>
    </div>
  );
}
