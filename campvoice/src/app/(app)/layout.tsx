import Link from "next/link";
import { requireSession, getSubscription } from "@/lib/auth/session";
import { AppNav } from "@/components/app/AppNav";
import { TrialBanner } from "@/components/app/TrialBanner";
import { brand } from "@/lib/config";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const context = await requireSession();
  const subscription = await getSubscription(context.organization.id);

  const firstName = context.profile.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="flex min-h-screen flex-col">
      <TrialBanner subscription={subscription} />
      <AppNav campName={context.organization.name} userName={firstName} isAdmin={context.profile.is_admin} />

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-paper-300 py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 text-sm text-ink-300">
          <p>CampVoice creates your communications. You decide where and when they are sent.</p>
          <nav aria-label="Legal" className="flex gap-4">
            <Link href="/privacy" className="hover:text-ink-700">Privacy</Link>
            <Link href="/terms" className="hover:text-ink-700">Terms</Link>
            <a href={`mailto:${brand.supportEmail}`} className="hover:text-ink-700">Support</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
