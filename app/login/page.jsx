"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const redirectTo = sp.get("redirect") || "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // If already signed in, skip this page
  useEffect(() => {
    const sb = supabaseBrowser();
    sb.auth.getSession().then(({ data }) => {
      if (data?.session) {
        router.replace(redirectTo);
      }
    });
  }, [router, redirectTo]);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const sb = supabaseBrowser();
    const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    setSubmitting(false);
    if (error) {
      setError(error.message || "Unable to sign in.");
      return;
    }
    // Refresh and redirect
    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-start justify-center">
      <div className="w-full mx-auto max-w-sm px-4 pt-8 pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
        <p className="text-slate-300 mt-1">Use your email and password.</p>

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <div>
            <label className="block text-sm text-slate-300">Email</label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md bg-slate-900/60 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md bg-slate-900/60 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-sm text-rose-300">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-4 text-sm text-slate-300">
          <span className="mr-1">New here?</span>
          <Link href="/signup" className="text-sky-300 hover:underline">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
