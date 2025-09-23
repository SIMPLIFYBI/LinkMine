"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabaseClient";
import { redirectTo } from "@/lib/siteUrl";

export const dynamic = "force-dynamic";

export default function AuthPage() {
  return (
    <div className="min-h-[calc(100vh-56px)] mx-auto max-w-screen-sm px-4 pt-8 pb-[calc(64px+env(safe-area-inset-bottom))]">
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-6 ring-1 ring-white/5">
        <Suspense fallback={<div style={{ padding: 36 }}>Loading…</div>}>
          <AuthInner />
        </Suspense>
      </div>
    </div>
  );
}

function AuthInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionEmail, setSessionEmail] = useState(null);

  useEffect(() => {
    let mounted = true;

    const errorDescription = searchParams.get("error_description");
    if (errorDescription) toast.error(errorDescription);

    // Handle magic link callback (?code=...)
    const code = searchParams.get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(window.location.href).then(({ error }) => {
        if (error) toast.error(error.message);
        else {
          toast.success("Signed in");
          router.replace("/account");
        }
      });
    }

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setSessionEmail(data?.user?.email ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user?.email ?? null);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [router, searchParams]);

  const sendMagicLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo("/auth") },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Email sent. Check your inbox to complete sign up / sign in.");
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) return toast.error(error.message);
    toast.success("Signed out");
    router.push("/");
  };

  return (
    <main style={{ maxWidth: 420, margin: "0 auto", padding: 36, fontFamily: "system-ui" }}>
      <h1>Authenticate</h1>
      {sessionEmail ? (
        <div style={{ marginTop: 16 }}>
          <p>Signed in as {sessionEmail}</p>
          <button onClick={signOut} style={{ marginTop: 12, padding: "10px 12px", border: "1px solid #ddd", borderRadius: 6 }}>
            Sign out
          </button>
        </div>
      ) : (
        <form onSubmit={sendMagicLink} style={{ display: "grid", gap: 12, marginTop: 16 }}>
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 6 }}
          />
          <button disabled={loading} style={{ padding: "10px 14px", borderRadius: 6, background: "#111827", color: "#fff", border: 0 }}>
            {loading ? "Sending…" : "Email me a magic link"}
          </button>
          <p style={{ color: "#6b7280", fontSize: 13 }}>
            You’ll receive an email to confirm your address and complete sign up / sign in.
          </p>
        </form>
      )}
    </main>
  );
}