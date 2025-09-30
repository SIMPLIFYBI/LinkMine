"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthFetchProvider() {
  const installed = useRef(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    if (installed.current) return;
    installed.current = true;

    let currentToken = null;

    async function refreshToken() {
      const { data } = await supabase.auth.getSession();
      currentToken = data?.session?.access_token || null;
      setToken(currentToken);
    }

    // Initial token + subscribe to auth changes
    refreshToken();
    const { data: sub } = supabase.auth.onAuthStateChange(() => refreshToken());

    // Patch window.fetch to always add Authorization for same-origin /api requests
    const origFetch = window.fetch.bind(window);
    window.fetch = async (input, init = {}) => {
      try {
        const url = typeof input === "string" ? input : input.url;
        const sameOrigin =
          typeof url === "string" &&
          (url.startsWith("/") || url.startsWith(location.origin + "/"));
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

  return null;
}