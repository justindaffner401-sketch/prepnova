import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authEnabled, supabase } from "../lib/supabase.js";
import { useAuth } from "../lib/useAuth.js";
import { AlertTriangle, Check } from "../components/icons.jsx";

/**
 * Landing page for Supabase password-recovery links. The link signs the user
 * in automatically (supabase-js picks the token out of the URL); this page
 * just collects the new password.
 */
export default function ResetPassword() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  // Give supabase-js a moment to consume the token from the URL before we
  // declare the link dead.
  const [graceOver, setGraceOver] = useState(false);

  useEffect(() => {
    document.title = "PrepNova — Reset password";
    const t = setTimeout(() => setGraceOver(true), 2500);
    return () => clearTimeout(t);
  }, []);

  if (!authEnabled) {
    return (
      <main className="container-pn pt-28 pb-20 sm:pt-36">
        <div className="glass mx-auto max-w-md p-8 text-center">
          <p className="text-slate-400">Accounts aren't enabled on this build.</p>
        </div>
      </main>
    );
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Those passwords don't match — try again.");
      return;
    }
    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
      setTimeout(() => navigate("/account"), 2500);
    } catch (err) {
      setError(err.message || "Couldn't update the password. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container-pn pt-28 pb-20 sm:pt-36">
      <div className="mx-auto max-w-md">
        <div className="glass p-7 sm:p-9">
          <h1 className="font-display text-2xl font-extrabold text-white">
            Choose a new password
          </h1>

          {done ? (
            <p className="mt-4 flex items-center gap-2.5 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300">
              <Check className="h-4 w-4 shrink-0" />
              Password updated — taking you to your account…
            </p>
          ) : !user && !loading && graceOver ? (
            <div className="mt-4">
              <p className="flex items-center gap-2.5 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                This reset link is invalid or has expired.
              </p>
              <p className="mt-4 text-sm text-slate-400">
                Request a fresh one from the{" "}
                <Link to="/account" className="text-electric-400 hover:underline">
                  sign-in page
                </Link>{" "}
                using "Forgot password?".
              </p>
            </div>
          ) : !user ? (
            <p className="mt-4 text-sm text-slate-400">Checking your reset link…</p>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-3">
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password (8+ characters)"
                aria-label="New password"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-electric-400/70 focus:ring-2 focus:ring-electric-500/30"
              />
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat new password"
                aria-label="Repeat new password"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-electric-400/70 focus:ring-2 focus:ring-electric-500/30"
              />
              {error && (
                <p className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-300">
                  {error}
                </p>
              )}
              <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-50">
                {busy ? "Saving…" : "Set new password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
