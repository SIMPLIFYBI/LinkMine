"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const callbackParams = new URLSearchParams(`${window.location.search}&${window.location.hash.replace(/^#/, "")}`);
      const providerError = callbackParams.get("error_description");
      if (providerError) {
        setError(providerError);
        return;
      }

      const code = callbackParams.get("code");
      let { data: sessionData } = await supabase.auth.getSession();
      let session = sessionData.session;

      if (!session && code) {
        const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message || "Unable to complete sign-in.");
          return;
        }

        session = exchangeData.session;
      }

      if (!session) {
        setError("Microsoft did not return a signed-in session. Please try again.");
        return;
      }

      const userId = session.user?.id || null;
      if (!userId) {
        setError("Microsoft did not return a signed-in account. Please try again.");
        return;
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      router.replace(profile?.id ? "/?welcome=1" : "/onboarding");
    })();
  }, [router]);

  return <div style={{ padding: 16 }}>{error || "Completing sign-in…"}</div>;
}