import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { Card } from "@/components/ui";
import { CampForm } from "@/components/app/SettingsForms";

export const metadata: Metadata = {
  title: "Camp settings",
  robots: { index: false, follow: false },
};

export default async function CampSettingsPage() {
  const context = await requireSession();

  return (
    <div className="space-y-6">
      <Card className="p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold">Camp profile</h2>
        <p className="mt-1 text-sm prose-camp">
          The facts CampVoice writes from. Everything else — voice, terminology, traditions and dates — lives on the{" "}
          <Link href="/camp-dna" className="text-forest-700 underline underline-offset-4">Camp DNA</Link> page.
        </p>
        <div className="mt-6">
          <CampForm organization={context.organization} />
        </div>
      </Card>
    </div>
  );
}
