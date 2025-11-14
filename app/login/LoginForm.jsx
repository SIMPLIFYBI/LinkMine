"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const redirectTo = sp.get("redirect") || "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Forgot password UI
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");

  useEffect(() => {
    // Prefill forgot email with login email if present
    if (email && !forgotEmail) setForgotEmail(email);
  }, [email, forgotEmail]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const sb = supabaseBrowser();
    const { data, error } = await sb.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setSubmitting(false);

    if (error) {
      setError(error.message || "Unable to sign in.");
      return;
    }

    if (!data.session) {
      setError("No session returned.");
      return;
    }

    const userId = data.session.user.id;
    const { data: profile, error: profileError } = await sb
      .from("user_profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      setError(profileError.message || "Unable to load profile.");
      return;
    }

    router.replace(profile ? redirectTo : "/onboarding");
    router.refresh();
  }

  async function handleForgotSubmit(e) {
    e.preventDefault();
    setForgotMessage("");
    setError("");
    setForgotSubmitting(true);
    try {
      const sb = supabaseBrowser();
      const site = process.env.NEXT_PUBLIC_SITE_URL;
      if (!site) {
        throw new Error("Missing NEXT_PUBLIC_SITE_URL");
      }
      const { error } = await sb.auth.resetPasswordForEmail(
        forgotEmail.trim(),
        { redirectTo: `${site}/reset-password` }
      );
      if (error) throw error;
      setForgotMessage("Check your email for a password reset link.");
    } catch (err) {
      setError(err.message || "Could not send reset email.");
    } finally {
      setForgotSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-start justify-center">
      <div className="w-full mx-auto max-w-sm px-4 pt-8 pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
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
            <label className="flex items-center justify-between text-sm text-slate-300">
              <span>Password</span>
              <button
                type="button"
                onClick={() => setShowForgot((v) => !v)}
                className="text-sky-300 hover:underline"
              >
                {showForgot ? "Hide" : "Forgot password?"}
              </button>
            </label>
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

          {error ? <div className="text-sm text-rose-300">{error}</div> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Log in"}
          </button>
        </form>

        {/* Forgot password panel */}
        {showForgot && (
          <form
            onSubmit={handleForgotSubmit}
            className="mt-5 space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div>
              <label className="block text-sm text-slate-300">
                Reset password email
              </label>
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="mt-1 w-full rounded-md bg-slate-900/60 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
                placeholder="you@example.com"
              />
            </div>
            {forgotMessage && (
              <div className="text-sm text-emerald-300">{forgotMessage}</div>
            )}
            <button
              type="submit"
              disabled={forgotSubmitting}
              className="w-full rounded-md bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {forgotSubmitting ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <div className="mt-4 text-sm text-slate-300">
          <span className="mr-1">Need an account?</span>
          <Link href="/signup" className="text-sky-300 hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}