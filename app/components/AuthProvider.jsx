"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const AuthCtx = createContext({ session: null, user: null, token: null, loading: true });
export function useAuth() { return useContext(AuthCtx); }

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchPatched = useRef(false);

  // Load current session and subscribe to changes
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(data?.session ?? null);
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
    if (fetchPatched.current) return;
    fetchPatched.current = true;

    let currentToken = null;

    const syncToken = async () => {
      const { data } = await supabase.auth.getSession();
      currentToken = data?.session?.access_token || null;
    };
    syncToken();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      currentToken = sess?.access_token || null;
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
    () => ({ session, user: session?.user ?? null, token: session?.access_token ?? null, loading }),
    [session, loading]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}