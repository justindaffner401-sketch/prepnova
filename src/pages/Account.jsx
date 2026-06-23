import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authEnabled, supabase } from "../lib/supabase.js";
import { useAuth } from "../lib/useAuth.js";
import { isEntitled } from "../lib/entitlement.js";
import {
  AlertTriangle,
  ArrowRight,
  Bolt,
  Check,
  Sparkles,
} from "../components/icons.jsx";
import { trackEvent } from "../lib/analytics.js";

const PERKS = [
  "Unlimited AI-generated questions",
  "ACT & SAT · all four subjects",
  "Tutor-grade explanations on every answer",
  "Progress tracking & analytics",
  "Cancel anytime",
];

async function callBilling(endpoint, accessToken, body) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || "Something went wrong. Try again.");
  if (!data?.url) throw new Error("No redirect URL returned. Try again.");
  window.location.assign(data.url);
}

export default function Account() {
  const { user, session, subscription, subscribed, loading, refreshSubscription } = useAuth();
  const [params, setParams] = useSearchParams();
  const checkoutResult = params.get("checkout");

  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null); // { kind: "error" | "info", text }
  const pollRef = useRef(false);

  useEffect(() => {
    document.title = "PrepNova — Account";
  }, []);

  // Funnel: signed in, not yet Pro → they're looking at the paywall.
  useEffect(() => {
    if (!loading && user && !subscribed) trackEvent("paywall_viewed");
  }, [loading, user, subscribed]);

  // After returning from Stripe Checkout the webhook may lag a moment —
  // poll the subscription a few times so the page flips to Pro on its own.
  useEffect(() => {
    if (checkoutResult !== "success" || !user || subscribed || pollRef.current) return;
    pollRef.current = true;
    let attempts = 0;
    const id = setInterval(async () => {
      attempts += 1;
      const sub = await refreshSubscription();
      if (isEntitled(sub) || attempts >= 8) {
        clearInterval(id);
      }
    }, 1500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutResult, user, subscribed]);

  if (!authEnabled) {
    return (
      <main className="container-pn pt-28 pb-20 sm:pt-36">
        <div className="glass mx-auto max-w-md p-8 text-center">
          <h1 className="font-display text-2xl font-extrabold text-white">Accounts coming soon</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Sign-ups aren't enabled on this build yet. Practice mode is open —
            no account needed.
          </p>
          <Link to="/select" className="btn-primary mt-6">
            Start practicing
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    );
  }

  async function submitAuth(e) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        trackEvent("signup_success");
        if (!data.session) {
          setMessage({
            kind: "info",
            text: "Check your email for a confirmation link, then come back and sign in.",
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      setPassword("");
    } catch (err) {
      setMessage({ kind: "error", text: err.message || "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  async function startCheckout(plan) {
    setBusy(true);
    setMessage(null);
    trackEvent("checkout_started", { plan });
    try {
      await callBilling("/api/create-checkout-session", session.access_token, { plan });
    } catch (err) {
      setMessage({ kind: "error", text: err.message });
      setBusy(false);
    }
  }

  async function openPortal() {
    setBusy(true);
    setMessage(null);
    try {
      await callBilling("/api/create-portal-session", session.access_token);
    } catch (err) {
      setMessage({ kind: "error", text: err.message });
      setBusy(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setMessage(null);
  }

  async function forgotPassword() {
    if (!email.trim()) {
      setMessage({
        kind: "info",
        text: "Type your email in the box above first, then click Forgot password again.",
      });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setMessage({
        kind: "info",
        text: "Reset link sent — check your email (and spam folder).",
      });
    } catch (err) {
      setMessage({ kind: "error", text: err.message || "Couldn't send the reset email." });
    } finally {
      setBusy(false);
    }
  }

  const renewDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;
  const isLifetime = subscription?.status === "lifetime";
  const isYear = subscription?.status === "year";
  const isTrial = subscription?.status === "trialing";
  // One-time plans (year/lifetime) have no Stripe subscription to manage.
  const isOneTime = isLifetime || isYear;

  return (
    <main className="container-pn pt-28 pb-20 sm:pt-36">
      <div className="mx-auto max-w-md">
        {checkoutResult === "success" && (
          <div className="anim-fade-up mb-4 flex items-center gap-2.5 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300">
            <Check className="h-4 w-4 shrink-0" />
            You're in — welcome to PrepNova Pro!
            <button
              type="button"
              onClick={() => setParams({}, { replace: true })}
              className="ml-auto text-xs text-emerald-300/70 hover:text-emerald-200"
            >
              dismiss
            </button>
          </div>
        )}
        {checkoutResult === "cancelled" && (
          <div className="anim-fade-up mb-4 flex items-center gap-2.5 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Checkout cancelled — no charge was made.
            <button
              type="button"
              onClick={() => setParams({}, { replace: true })}
              className="ml-auto text-xs text-amber-300/70 hover:text-amber-200"
            >
              dismiss
            </button>
          </div>
        )}

        {message && (
          <div
            role="alert"
            aria-live="assertive"
            className={`anim-fade-up mb-4 rounded-xl border px-4 py-3 text-sm font-medium ${
              message.kind === "error"
                ? "border-rose-400/40 bg-rose-500/10 text-rose-300"
                : "border-electric-400/40 bg-electric-500/10 text-electric-300"
            }`}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="glass p-10 text-center">
            <div className="anim-spin-slow mx-auto h-10 w-10 rounded-full border-4 border-electric-500/20 border-t-electric-400" />
          </div>
        ) : !user ? (
          /* ---------------- Signed out ---------------- */
          <div className="glass p-7 sm:p-9">
            <div className="mb-6 flex rounded-xl bg-white/5 p-1">
              {["signin", "signup"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setMessage(null);
                  }}
                  className={`flex-1 rounded-lg py-2 font-display text-sm font-bold transition-colors ${
                    mode === m ? "bg-electric-500/20 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {m === "signin" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>

            <h1 className="font-display text-2xl font-extrabold text-white">
              {mode === "signin" ? "Welcome back" : "Join PrepNova"}
            </h1>
            <p className="mt-1.5 text-sm text-slate-400">
              {mode === "signin"
                ? "Sign in to manage your plan and unlock AI questions."
                : "Create a free account, then upgrade to Pro for unlimited AI questions."}
            </p>

            <form onSubmit={submitAuth} className="mt-6 space-y-3">
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                aria-label="Email"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-electric-400/70 focus:ring-2 focus:ring-electric-500/30"
              />
              <input
                type="password"
                required
                minLength={8}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "Password (8+ characters)" : "Password"}
                aria-label="Password"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-electric-400/70 focus:ring-2 focus:ring-electric-500/30"
              />
              <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-50">
                {busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>

            {mode === "signin" && (
              <button
                type="button"
                onClick={forgotPassword}
                disabled={busy}
                className="mt-4 w-full text-center text-xs text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline disabled:opacity-50"
              >
                Forgot password?
              </button>
            )}
          </div>
        ) : (
          /* ---------------- Signed in ---------------- */
          <div className="space-y-4">
            <div className="glass flex items-center justify-between p-5">
              <div className="min-w-0">
                <p className="text-xs tracking-wide text-slate-500 uppercase">Signed in as</p>
                <p className="truncate text-sm font-semibold text-white">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={signOut}
                className="text-xs font-medium text-slate-500 hover:text-slate-300"
              >
                Sign out
              </button>
            </div>

            {subscribed ? (
              <div className="glass border-electric-400/40 p-7">
                <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-electric-500 to-cyan-400 px-3.5 py-1.5 font-display text-xs font-bold text-white">
                  <Sparkles className="h-3.5 w-3.5" /> PREPNOVA PRO
                  {isLifetime ? " · LIFETIME" : isYear ? " · 1 YEAR" : ""}
                </span>
                <h1 className="mt-4 font-display text-2xl font-extrabold text-white">
                  You're all set.
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  Unlimited AI-generated questions across every subject.
                  {isLifetime && " Lifetime access — yours forever, no renewals."}
                  {isYear && renewDate && ` 1-year access — runs through ${renewDate}.`}
                  {isTrial && renewDate && ` Free trial active — your first $29 charge is ${renewDate}.`}
                  {subscription?.status === "active" && renewDate && ` Renews ${renewDate}.`}
                  {subscription?.status === "past_due" && (
                    <span className="text-amber-300">
                      {" "}
                      Your last payment failed — update your card to keep Pro.
                    </span>
                  )}
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link to="/select" className="btn-primary flex-1">
                    <Bolt className="h-4 w-4" /> Start practicing
                  </Link>
                  {!isOneTime && (
                    <button
                      type="button"
                      onClick={openPortal}
                      disabled={busy}
                      className="btn-ghost flex-1 disabled:opacity-50"
                    >
                      Manage billing
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass p-7">
                <h1 className="font-display text-2xl font-extrabold text-white">
                  Unlock <span className="text-gradient">PrepNova Pro</span>
                </h1>
                <ul className="mt-5 space-y-2.5">
                  {PERKS.map((perk) => (
                    <li key={perk} className="flex items-start gap-2.5 text-sm text-slate-200">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      {perk}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 space-y-3">
                  {/* Monthly with free trial */}
                  <div className="glow-card rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-baseline justify-between">
                      <span className="font-display font-bold text-white">Monthly</span>
                      <span>
                        <span className="font-display text-2xl font-extrabold text-white">$29</span>
                        <span className="text-sm text-slate-400">/mo</span>
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-electric-200/90">
                      Starts with a 7-day free trial — cancel before it ends and pay nothing.
                    </p>
                    <button
                      type="button"
                      onClick={() => startCheckout("monthly")}
                      disabled={busy}
                      className="btn-ghost mt-4 w-full disabled:opacity-50"
                    >
                      {busy ? "Opening checkout…" : "Start 7-day free trial"}
                    </button>
                  </div>

                  {/* 1 Year — featured */}
                  <div className="glow-card relative rounded-2xl border border-electric-400/60 bg-gradient-to-b from-electric-500/20 to-cyan-400/[0.05] p-5 shadow-[0_0_45px_-12px_rgba(34,211,238,0.45)]">
                    <span className="absolute -top-2.5 right-4 rounded-full bg-gradient-to-r from-electric-500 to-cyan-400 px-2.5 py-0.5 font-display text-[10px] font-bold tracking-wide text-white">
                      BEST VALUE
                    </span>
                    <div className="flex items-baseline justify-between">
                      <span className="font-display font-bold text-white">1 Year</span>
                      <span>
                        <span className="font-display text-2xl font-extrabold text-white">$250</span>
                        <span className="text-sm text-slate-400">/yr</span>
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-electric-200/90">
                      <span className="text-slate-500 line-through">$348/yr</span> — save $98 vs
                      paying monthly. Renews yearly.
                    </p>
                    <button
                      type="button"
                      onClick={() => startCheckout("year")}
                      disabled={busy}
                      className="btn-primary mt-4 w-full disabled:opacity-50"
                    >
                      {busy ? "Opening checkout…" : "Get 1 year"}
                    </button>
                  </div>

                  {/* Lifetime */}
                  <div className="glow-card rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-baseline justify-between">
                      <span className="font-display font-bold text-white">Lifetime</span>
                      <span>
                        <span className="font-display text-2xl font-extrabold text-white">$600</span>
                        <span className="text-sm text-slate-400"> once</span>
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-electric-200/90">
                      Pay once, yours forever. Younger siblings? Pass it down when they're ready for
                      the test.
                    </p>
                    <button
                      type="button"
                      onClick={() => startCheckout("lifetime")}
                      disabled={busy}
                      className="btn-ghost mt-4 w-full disabled:opacity-50"
                    >
                      {busy ? "Opening checkout…" : "Get lifetime"}
                    </button>
                  </div>
                </div>

                <p className="mt-4 text-center text-xs text-slate-500">
                  Secure checkout by Stripe. The sample set is always free.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
