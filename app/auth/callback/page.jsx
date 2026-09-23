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

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || null;
      if (!userId) {
        router.replace("/");
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

  return <div style={{ padding: 16 }}>Completing sign-in…</div>;
}