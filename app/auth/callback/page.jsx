"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [msg, setMsg] = useState("Completing sign-in...");

  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setMsg("Signed in. Redirecting...");
        router.replace("/account");
      }
    });

    // Fallback if redirect has token_hash (verification link)
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type");
    (async () => {
      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ type, token_hash });
        if (!error) router.replace("/account");
      }
    })();

    return () => sub.data?.subscription?.unsubscribe();
  }, [router, searchParams]);

  return (
    <main style={{ padding: 36, fontFamily: "system-ui" }}>
      <h1>Auth callback</h1>
      <p>{msg}</p>
    </main>
  );
}