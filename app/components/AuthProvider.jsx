"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { isBlockedEmail } from "@/lib/blockedUsers";

const AUTH_CONNECTIVITY_ERROR = "Unable to reach Supabase authentication. Check the configured Supabase URL and your network connection.";

const AuthCtx = createContext({ session: null, user: null, token: null, loading: true, authError: "" });
export function useAuth() { return useContext(AuthCtx); }

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const fetchPatched = useRef(false);
  const blockedHandled = useRef(false);

  // Load current session and subscribe to changes
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(data?.session ?? null);
        setAuthError("");
      } catch {
        if (!mounted) return;
        setSession(null);
        setAuthError(AUTH_CONNECTIVITY_ERROR);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess ?? null);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  // Patch window.fetch once. Adds Authorization for same-origin /api calls.
  useEffect(() => {
    const email = session?.user?.email || null;
    if (!email) {
      blockedHandled.current = false;
      return;
    }
    if (!isBlockedEmail(email) || blockedHandled.current) return;

    blockedHandled.current = true;
    supabase.auth.signOut().finally(() => {
      setSession(null);
      if (typeof window !== "undefined") {
        window.location.replace("/");
      }
    });
  }, [session]);

  useEffect(() => {
    if (fetchPatched.current) return;
    fetchPatched.current = true;

    let currentToken = null;

    const syncToken = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        currentToken = data?.session?.access_token || null;
        setAuthError("");
      } catch {
        currentToken = null;
        setAuthError((prev) => prev || AUTH_CONNECTIVITY_ERROR);
      }
    };
    syncToken();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      currentToken = sess?.access_token || null;
      setAuthError("");
    });

    const origFetch = window.fetch.bind(window);
    window.fetch = async (input, init = {}) => {
      try {
        const url = typeof input === "string" ? input : input?.url;
        const sameOrigin = typeof url === "string" && (url.startsWith("/") || url.startsWith(location.origin + "/"));
        const isApi = sameOrigin && url.includes("/api/");
        if (isApi) {
          const headers = new Headers(init.headers || {});
          if (currentToken && !headers.has("authorization")) {
            headers.set("authorization", `Bearer ${currentToken}`);
          }
          return origFetch(input, { ...init, headers });
        }
        return origFetch(input, init);
      } catch {
        return origFetch(input, init);
      }
    };

    return () => {
      sub?.subscription?.unsubscribe();
      window.fetch = origFetch;
    };
  }, []);

  const value = useMemo(
    () => ({ session, user: session?.user ?? null, token: session?.access_token ?? null, loading, authError }),
    [session, loading, authError]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}