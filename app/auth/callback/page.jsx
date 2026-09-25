"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Check, LoaderCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    (async () => {
      const callbackParams = new URLSearchParams(`${window.location.search}&${window.location.hash.replace(/^#/, "")}`);
      const providerError = callbackParams.get("error_description");
      if (providerError) {
        setError(providerError);
        return;
      }

      const code = callbackParams.get("code");
      let { data: sessionData } = await supabase.auth.getSession();
      let session = sessionData.session;

      if (!session && code) {
        const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message || "Unable to complete sign-in.");
          return;
        }

        session = exchangeData.session;
      }

      if (!session) {
        setError("The sign-in provider did not return a signed-in session. Please try again.");
        return;
      }

      const userId = session.user?.id || null;
      if (!userId) {
        setError("The sign-in provider did not return a signed-in account. Please try again.");
        return;
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      setComplete(true);
      router.replace(profile?.id ? "/?welcome=1" : "/onboarding");
    })();
  }, [router]);

  const isError = Boolean(error);
  const title = isError ? "Sign-in needs another try" : complete ? "You're signed in" : "Signing you in";
  const detail = isError
    ? error
    : complete
      ? "Taking you to your account."
      : "Securing your session and preparing your account.";

  return (
    <main className="flex min-h-[calc(100vh-56px)] items-center justify-center px-4 py-12">
      <section className="w-full max-w-sm text-center" aria-live="polite">
        <div
          className={[
            "mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border shadow-lg",
            isError
              ? "border-rose-400/30 bg-rose-400/10 text-rose-300"
              : complete
                ? "border-emerald-400/35 bg-emerald-400/10 text-emerald-300"
                : "border-sky-400/30 bg-sky-400/10 text-sky-300",
          ].join(" ")}
        >
          {isError ? (
            <AlertCircle className="h-8 w-8" aria-hidden="true" />
          ) : complete ? (
            <Check className="h-8 w-8 animate-[pulse_0.55s_ease-out]" aria-hidden="true" />
          ) : (
            <LoaderCircle className="h-8 w-8 animate-spin" aria-hidden="true" />
          )}
        </div>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-50">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>

        {isError ? (
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500"
          >
            Back to login
          </Link>
        ) : (
          <div className="mx-auto mt-7 h-1 w-28 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
            <div
              className={[
                "h-full rounded-full bg-sky-400 transition-all duration-500",
                complete ? "w-full" : "w-2/3 animate-pulse",
              ].join(" ")}
            />
          </div>
        )}
      </section>
    </main>
  );
}