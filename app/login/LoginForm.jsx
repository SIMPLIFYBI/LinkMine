"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const redirectTo = useMemo(() => sp.get("redirect") || "/account", [sp]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const sb = supabaseBrowser();
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err.message || "Login failed");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold text-slate-50">Welcome back</h1>
        <p className="text-sm text-slate-300">
          Sign in to manage your jobs and saved consultants.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <label className="grid gap-1 text-sm">
          <span>Email</span>
          <input
            type="email"
            className="rounded border border-white/10 bg-slate-900/70 px-3 py-2"
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span>Password</span>
          <input
            type="password"
            className="rounded border border-white/10 bg-slate-900/70 px-3 py-2"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-sky-500 px-3 py-2 font-medium text-slate-900 hover:bg-sky-400 disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-300">
        New to YouMine?{" "}
        <Link href="/signup" className="font-semibold text-sky-300 hover:text-sky-200">
          Create an account
        </Link>
      </p>
    </div>
  );
}