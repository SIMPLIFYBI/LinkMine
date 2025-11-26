"use client";
import { useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function WelcomeEmailPing() {
  useEffect(() => {
    let mounted = true;
    (async () => {
      const sb = supabaseBrowser();
      const { data } = await sb.auth.getSession();
      const token = data?.session?.access_token;
      if (!mounted || !token) return;
      fetch("/api/welcome", { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    })();
    return () => { mounted = false; };
  }, []);
  return null;
}