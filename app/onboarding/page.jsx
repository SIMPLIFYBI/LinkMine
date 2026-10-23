"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function OnboardingPage() {
  const router = useRouter();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [form, setForm] = useState({
    organisationName: "",
    firstName: "",
    lastName: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;

    async function init() {
      const sb = supabaseBrowser();
      const { data } = await sb.auth.getSession();
      const currentSession = data?.session;

      if (!active) return;

      if (!currentSession?.user?.id) {
        router.replace("/signup");
        return;
      }

      const { data: profile, error } = await sb
        .from("user_profiles")
        .select("organisation_name, first_name, last_name")
        .eq("id", currentSession.user.id)
        .maybeSingle();

      if (error) {
        setError(error.message);
      } else if (profile) {
        setForm({
          organisationName: profile.organisation_name ?? "",
          firstName: profile.first_name ?? "",
          lastName: profile.last_name ?? "",
        });
      }

      setSessionChecked(true);
    }

    init();
    return () => {
      active = false;
    };
  }, [router]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.firstName.trim()) {
      setError("Please add your first name.");
      return;
    }

    startTransition(async () => {
      try {
        const sb = supabaseBrowser();
        const { data: { session } } = await sb.auth.getSession();
        const accessToken = session?.access_token;
        if (!accessToken) throw new Error("Not authenticated.");

        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            organisationName: form.organisationName.trim(),
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Could not save profile.");
        }

        setMessage("Profile saved! Redirecting…");
        setTimeout(() => router.replace("/?welcome=1"), 900);
      } catch (err) {
        setError(err.message || "Unable to save your profile.");
      }
    });
  }

  if (!sessionChecked) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-4">
        <p className="text-sm text-slate-300">Preparing your onboarding…</p>
      </main>
    );
  }

  return (
    <main className="relative mx-auto max-w-3xl overflow-hidden px-4 py-8 sm:py-12">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-64 w-[34rem] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
      <section className="relative overflow-hidden rounded-[28px] border border-cyan-200/20 bg-[linear-gradient(135deg,rgba(8,30,51,0.98),rgba(8,51,75,0.93)_56%,rgba(10,39,67,0.96))] px-6 py-7 text-slate-100 shadow-[0_32px_80px_-45px_rgba(14,165,233,0.85)] sm:px-8">
        <div aria-hidden="true" className="absolute -right-10 -top-14 h-48 w-48 rounded-full border border-cyan-100/20 bg-cyan-200/10" />
        <header className="relative max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100/25 bg-cyan-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-100">
            A little context goes a long way
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">What should we call you?</h1>
          <p className="mt-3 text-sm leading-6 text-slate-200 sm:text-base">
            A few details help make your YouMine account feel personal. You can create a public profile whenever you are ready.
          </p>
        </header>
        <div className="relative mt-6 flex items-center gap-3 text-xs text-slate-200">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-200 text-xs font-bold text-slate-950">1</span>
          <span className="font-semibold">Your account</span>
          <span className="h-px flex-1 bg-white/15" />
          <span className="text-slate-300">Takes a moment</span>
        </div>
      </section>

      <section className="relative mt-5 rounded-[28px] border border-white/10 bg-slate-950/60 p-4 text-slate-100 shadow-[0_30px_70px_-45px_rgba(0,0,0,0.95)] ring-1 ring-white/5 sm:mt-6 sm:p-7">

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-white"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-300/15 text-xs font-bold text-cyan-100">1</span> Your details</div>
            <p className="mt-1 text-xs text-slate-400">This is private account information, not a public profile.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-slate-300">
                First name <span className="text-rose-300">*</span>
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                maxLength={60}
                required
                className="mt-1 w-full rounded-xl border border-slate-500/40 bg-slate-900/80 px-3 py-2.5 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-cyan-200 focus:ring-2 focus:ring-cyan-300/25"
                placeholder="Jane"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300">
                Last name{" "}
                <span className="text-slate-500">(optional)</span>
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                maxLength={60}
                className="mt-1 w-full rounded-xl border border-slate-500/40 bg-slate-900/80 px-3 py-2.5 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-cyan-200 focus:ring-2 focus:ring-cyan-300/25"
                placeholder="Smith"
              />
            </div>
          </div>
            <div className="mt-4">
              <label className="block text-sm text-slate-300">
                Organisation <span className="text-slate-500">(optional)</span>
              </label>
              <input
                type="text"
                value={form.organisationName}
                onChange={(e) => updateField("organisationName", e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-500/40 bg-slate-900/80 px-3 py-2.5 text-sm text-white placeholder:text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition focus:border-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-300/25"
                placeholder="Organisation name"
              />
            </div>
          </div>

          {error ? (
            <p className="text-sm text-rose-300">{error}</p>
          ) : null}
          {message ? (
            <p className="text-sm text-emerald-300">{message}</p>
          ) : null}

          <div className="flex justify-end border-t border-white/10 pt-5">
            <button
              type="submit"
              disabled={isPending || !form.firstName.trim()}
              className="min-h-11 rounded-full border border-cyan-100/35 bg-[linear-gradient(135deg,#22d3ee,#0284c7_55%,#1d4ed8)] px-5 py-2.5 text-sm font-bold text-white shadow-[0_16px_34px_-18px_rgba(34,211,238,0.9)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Continue to YouMine"
            >
              {isPending ? "Saving…" : "Continue"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}