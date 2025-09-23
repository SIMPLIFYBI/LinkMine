"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
      if (!data.session) router.replace("/auth");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) router.replace("/auth");
    });
    return () => { mounted = false; sub?.subscription?.unsubscribe?.(); };
  }, [router]);

  const signOut = async () => { await supabase.auth.signOut(); router.replace("/auth"); };

  if (loading) return <main style={{ padding: 36 }}>Loading…</main>;
  return (
    <main style={{ padding: 36 }}>
      <h1>Account</h1>
      <p>You are signed in as {session?.user?.email}</p>
      <button onClick={signOut} style={{ marginTop: 16, padding: "10px 14px", borderRadius: 6, border: "1px solid #ddd" }}>Sign out</button>
    </main>
  );
}