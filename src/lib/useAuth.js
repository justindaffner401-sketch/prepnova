import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase.js";
import { isEntitled } from "./entitlement.js";

/**
 * Auth + subscription state. Safe to call when Supabase isn't configured —
 * everything just stays null/false.
 */
export function useAuth() {
  const [session, setSession] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(Boolean(supabase));

  const fetchSubscription = useCallback(async (sess) => {
    if (!supabase || !sess?.user) {
      setSubscription(null);
      return null;
    }
    const { data } = await supabase
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", sess.user.id)
      .maybeSingle();
    setSubscription(data ?? null);
    return data ?? null;
  }, []);

  useEffect(() => {
    if (!supabase) return undefined;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      fetchSubscription(data.session).finally(() => setLoading(false));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      fetchSubscription(sess);
    });
    return () => listener.subscription.unsubscribe();
  }, [fetchSubscription]);

  return {
    user: session?.user ?? null,
    session,
    subscription,
    subscribed: isEntitled(subscription),
    loading,
    refreshSubscription: () => fetchSubscription(session),
  };
}
