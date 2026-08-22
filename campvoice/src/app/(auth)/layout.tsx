import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-topo flex min-h-screen flex-col">
      <header className="mx-auto w-full max-w-6xl px-5 py-5">
        <Logo />
      </header>

      <main id="main-content" className="flex flex-1 items-center justify-center px-5 py-8">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-5 py-6 text-center text-sm text-ink-300">
        <Link href="/privacy" className="hover:text-ink-700">Privacy</Link>
        <span className="mx-2" aria-hidden="true">·</span>
        <Link href="/terms" className="hover:text-ink-700">Terms</Link>
        <span className="mx-2" aria-hidden="true">·</span>
        <Link href="/contact" className="hover:text-ink-700">Contact</Link>
      </footer>
    </div>
  );
}
