"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { getAuthRedirectUrl, isNativeAppRuntime } from "@/lib/mobileRuntime";

function SignupForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const redirectTo = sp.get("redirect") || "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [oauthSubmitting, setOauthSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // If already signed in, skip this page
  useEffect(() => {
    const sb = supabaseBrowser();
    sb.auth.getSession().then(({ data }) => {
      if (data?.session) router.replace(redirectTo);
    });
  }, [router, redirectTo]);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    if (!agree) {
      setSubmitting(false);
      setError("Please accept the Terms and Privacy Policy to continue.");
      return;
    }

    const sb = supabaseBrowser();
    const emailRedirectBase =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL;

    if (!emailRedirectBase) {
      setSubmitting(false);
      setError("Missing app URL for email confirmation redirect.");
      return;
    }

    const { data, error } = await sb.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${emailRedirectBase}/onboarding`,
      },
    });
    setSubmitting(false);

    if (error) return setError(error.message || "Unable to sign up.");

    // Try sign-in
    const { error: signInError, data: signInData } = await sb.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    
    if (signInError && signInError.message?.toLowerCase().includes("invalid login credentials")) {
      setError("You already have an account. Reset your password.");
      return;
    }

    // NEW: Send welcome email after successful signup
    if (signInData?.session) {
      try {
        await fetch("/api/welcome", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${signInData.session.access_token}`,
          },
        });
      } catch (e) {
        console.error("welcome email trigger error:", e);
      }
    }

    setMessage("Check your email to confirm your account, then sign in.");
  }

  async function handleOAuthSignUp(provider, providerName) {
    setError("");
    setMessage("");

    if (!agree) {
      setError("Please accept the Terms and Privacy Policy to continue.");
      return;
    }

    setOauthSubmitting(true);
    const oauthRedirectTo = isNativeAppRuntime()
      ? getAuthRedirectUrl()
      : `${window.location.origin}/auth/callback`;
    const { error: oauthError } = await supabaseBrowser().auth.signInWithOAuth({
      provider,
      options: { redirectTo: oauthRedirectTo },
    });

    if (oauthError) {
      setOauthSubmitting(false);
      setError(oauthError.message || `Unable to continue with ${providerName}.`);
    }
  }

  return (
    <div className="auth-shell mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-slate-950/55 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl sm:p-9">
      <section>
        <div className="mx-auto w-full max-w-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">Free to join</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">Create your account</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">It takes less than a minute.</p>
        <form onSubmit={onSubmit} className="mt-7 space-y-4">
          <div>
            <label className="block text-sm text-slate-300">Email</label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3.5 py-3 text-sm outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-500/25"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300">Password</label>
            <input
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3.5 py-3 text-sm outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-500/25"
              placeholder="••••••••"
            />
          </div>

          {/* Terms and Privacy consent */}
          <div className="mt-2">
            <label className="flex items-start gap-3 text-sm text-slate-300">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-slate-900/60 text-sky-500 focus:ring-sky-500/40"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                aria-describedby="tos-privacy-help"
                required
              />
              <span>
                I have read and agree to the{" "}
                <Link href="/terms" className="text-sky-300 underline">Terms & Conditions</Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-sky-300 underline">Privacy Policy</Link>.
              </span>
            </label>
            <p id="tos-privacy-help" className="mt-1 text-xs text-slate-400">
              You can withdraw consent where applicable; see our Privacy Policy for details.
            </p>
          </div>

          {error && <div className="text-sm text-rose-300">{error}</div>}
          {message && <div className="text-sm text-emerald-300">{message}</div>}

          <button
            type="submit"
            disabled={submitting || !agree}
            className="group flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-950/25 transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Create free account"}
            {!submitting && <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />}
          </button>

          <div className="flex items-center gap-3 py-1" aria-hidden="true">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-slate-400">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <button
            type="button"
            onClick={() => handleOAuthSignUp("google", "Google")}
            disabled={submitting || oauthSubmitting || !agree}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100 disabled:opacity-60"
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
            onClick={() => handleOAuthSignUp("azure", "Microsoft")}
            disabled={submitting || oauthSubmitting || !agree}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100 disabled:opacity-60"
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

          <div className="mt-6 border-t border-white/10 pt-5 text-center text-sm text-slate-300">
            <span className="mr-1">Already have an account?</span>
            <Link href="/login" className="font-medium text-sky-300 hover:text-sky-200 hover:underline">Log in</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function SignupPage() {
  return (
    <main className="px-4 py-6 sm:px-6 sm:py-10 lg:py-14">
      <Suspense fallback={null}>
        <SignupForm />
      </Suspense>
    </main>
  );
}