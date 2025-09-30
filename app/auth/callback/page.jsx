"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      // This triggers Supabase to parse the URL and store the session (detectSessionInUrl:true)
      await supabase.auth.getSession();
      // Optional: you can also call supabase.auth.getUser() to force-load user
      await supabase.auth.getUser();
      router.replace("/"); // go home (or /account)
    })();
  }, [router]);

  return <div style={{ padding: 16 }}>Completing sign-in…</div>;
}