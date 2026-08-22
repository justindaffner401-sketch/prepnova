import Link from "next/link";
import { SettingsNav } from "@/components/app/SettingsNav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">Settings</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <SettingsNav />
        <div className="min-w-0">{children}</div>
      </div>

      <p className="mt-12 text-sm text-ink-300">
        Need a hand? <Link href="/contact" className="text-forest-700 underline underline-offset-4">Get in touch</Link>.
      </p>
    </div>
  );
}
