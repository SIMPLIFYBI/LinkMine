"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { getAuthRedirectUrl, isNativeAppRuntime } from "@/lib/mobileRuntime";

export default function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const redirectTo = sp.get("redirect") || "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [oauthSubmitting, setOauthSubmitting] = useState(false);
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

  async function handleOAuthSignIn(provider, providerName) {
    setError("");
    setOauthSubmitting(true);

    const redirectTo = isNativeAppRuntime()
      ? getAuthRedirectUrl()
      : `${window.location.origin}/auth/callback`;
    const { error: oauthError } = await supabaseBrowser().auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });

    if (oauthError) {
      setOauthSubmitting(false);
      setError(oauthError.message || `Unable to continue with ${providerName}.`);
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

          <div className="flex items-center gap-3 py-1" aria-hidden="true">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-slate-400">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <button
            type="button"
            onClick={() => handleOAuthSignIn("google", "Google")}
            disabled={submitting || oauthSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-white/15 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100 disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
              <path fill="#4285F4" d="M21.35 12.23c0-.71-.06-1.4-.18-2.05H12v3.87h5.24a4.48 4.48 0 0 1-1.94 2.94v2.51h3.23c1.89-1.74 2.82-4.31 2.82-7.27Z" />
              <path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.35l-3.23-2.51c-.9.6-2.05.96-3.22.96-2.48 0-4.58-1.68-5.33-3.94H3.33v2.59A9.75 9.75 0 0 0 12 21.75Z" />
              <path fill="#FBBC05" d="M6.67 13.91A5.86 5.86 0 0 1 6.37 12c0-.66.11-1.3.3-1.91V7.5H3.33A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.08 4.5l3.34-2.59Z" />
              <path fill="#EA4335" d="M12 6.15c1.52 0 2.88.52 3.95 1.54l2.96-2.96C16.84 2.8 14.63 1.75 12 1.75A9.75 9.75 0 0 0 3.33 7.5l3.34 2.59C7.42 7.83 9.52 6.15 12 6.15Z" />
            </svg>
            {oauthSubmitting ? "Redirecting…" : "Continue with Google"}
          </button>

          <button
            type="button"
            onClick={() => handleOAuthSignIn("azure", "Microsoft")}
            disabled={submitting || oauthSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-white/15 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100 disabled:opacity-60"
          >
            <span className="grid grid-cols-2 gap-px" aria-hidden="true">
              <span className="h-2 w-2 bg-[#f25022]" />
              <span className="h-2 w-2 bg-[#7fba00]" />
              <span className="h-2 w-2 bg-[#00a4ef]" />
              <span className="h-2 w-2 bg-[#ffb900]" />
            </span>
            {oauthSubmitting ? "Redirecting…" : "Continue with Microsoft"}
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