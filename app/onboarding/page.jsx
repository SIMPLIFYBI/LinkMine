"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import {
  USER_TYPE_OPTIONS,
  decodeStoredUserTypes,
  encodeSelectedUserTypes,
} from "@/lib/userTypeSelections";

const organisationSizes = [
  { value: "individual", label: "Individual" },
  { value: "1-8", label: "1–8 people" },
  { value: "8-25", label: "8–25 people" },
  { value: "26-100", label: "26–100 people" },
  { value: "101+", label: "101+ people" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [form, setForm] = useState({
    userTypes: [],
    organisationSize: "",
    organisationName: "",
    profession: "",
    firstName: "", // NEW
    lastName: "", // NEW
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
        .select(
          "user_type, organisation_size, organisation_name, profession"
        )
        .eq("id", currentSession.user.id)
        .maybeSingle();

      if (error) {
        setError(error.message);
      } else if (profile) {
        setForm({
          userTypes: decodeStoredUserTypes(profile.user_type),
          organisationSize: profile.organisation_size ?? "",
          organisationName: profile.organisation_name ?? profile.profession ?? "",
          profession: profile.profession ?? "",
        });
      }

      setSessionChecked(true);
    }

    init();
    return () => {
      active = false;
    };
  }, [router]);

  const isSubmitDisabled = useMemo(() => {
    const hasOrganisationOrProfession = Boolean(form.organisationName?.trim());

    return (
      form.userTypes.length === 0 ||
      !form.organisationSize ||
      !hasOrganisationOrProfession ||
      isPending
    );
  }, [form, isPending]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleUserType(value) {
    setForm((prev) => {
      const exists = prev.userTypes.includes(value);
      return {
        ...prev,
        userTypes: exists
          ? prev.userTypes.filter((item) => item !== value)
          : [...prev.userTypes, value],
      };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    const hasOrganisationOrProfession = Boolean(form.organisationName?.trim());
    if (!hasOrganisationOrProfession) {
      setError("Please add your organisation name or profession.");
      return;
    }

    startTransition(async () => {
      try {
        const sb = supabaseBrowser();
        const { data: { session } } = await sb.auth.getSession();
        const accessToken = session?.access_token;
        if (!accessToken) throw new Error("Not authenticated.");

        // Build payload with only non-empty fields
        const payload = {};
        if (form.userTypes.length > 0) payload.userType = encodeSelectedUserTypes(form.userTypes);
        if (form.organisationSize) payload.organisationSize = form.organisationSize;
        if (form.organisationName?.trim()) payload.organisationName = form.organisationName.trim();
        if (form.firstName?.trim()) payload.firstName = form.firstName.trim();
        if (form.lastName?.trim()) payload.lastName = form.lastName.trim();

        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
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

  async function handleSkip() {
    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        const sb = supabaseBrowser();
        const { data: { session } } = await sb.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) throw new Error("Not authenticated.");

        // Provide valid defaults to satisfy NOT NULL + CHECK constraints
        const { error } = await sb
          .from("user_profiles")
          .upsert(
            {
              id: userId,
              user_type: "unspecified",
              organisation_size: "unspecified",
              profession: "unspecified",
            },
            { onConflict: "id" }
          );

        if (error) throw error;
        router.replace("/?welcome=1");
      } catch (err) {
        setError(err.message || "Unable to skip.");
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
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">Tell us about yourself</h1>
          <p className="mt-3 text-sm leading-6 text-slate-200 sm:text-base">
            These details tailor YouMine to the work, expertise, and opportunities most relevant to you.
          </p>
        </header>
        <div className="relative mt-6 flex items-center gap-3 text-xs text-slate-200">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-200 text-xs font-bold text-slate-950">1</span>
          <span className="font-semibold">Your account setup</span>
          <span className="h-px flex-1 bg-white/15" />
          <span className="text-slate-300">Takes less than a minute</span>
        </div>
      </section>

      <section className="relative mt-5 rounded-[28px] border border-white/10 bg-slate-950/60 p-4 text-slate-100 shadow-[0_30px_70px_-45px_rgba(0,0,0,0.95)] ring-1 ring-white/5 sm:mt-6 sm:p-7">

        <form className="space-y-5" onSubmit={handleSubmit}>
          <fieldset className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
            <legend className="px-1 text-sm font-semibold text-white">
              <span className="inline-flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-300/15 text-xs font-bold text-cyan-100">1</span> I&apos;m here as</span>
            </legend>
            <p className="mt-1 text-xs text-slate-400">Choose every option that describes how you use YouMine.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {USER_TYPE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`group flex min-h-14 cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                    form.userTypes.includes(option.value)
                      ? "border-cyan-200/60 bg-cyan-300/10 text-white shadow-[0_12px_26px_-22px_rgba(34,211,238,0.95)]"
                      : "border-white/10 bg-slate-950/35 text-slate-200 hover:border-cyan-200/30 hover:bg-white/[0.06]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{option.label}</span>
                    <span className="group relative inline-flex">
                      <button
                        type="button"
                        aria-label={`About ${option.label}`}
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/30 text-[11px] font-semibold text-slate-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}
                      >
                        i
                      </button>
                      <span className="pointer-events-none absolute left-1/2 top-7 z-20 hidden w-64 -translate-x-1/2 rounded-lg border border-white/15 bg-slate-900/95 px-3 py-2 text-xs leading-relaxed text-slate-100 shadow-xl group-hover:block group-focus-within:block">
                        {option.helpText}
                      </span>
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    name="userTypes"
                    value={option.value}
                    checked={form.userTypes.includes(option.value)}
                    onChange={() => toggleUserType(option.value)}
                    className="h-4 w-4 accent-cyan-300"
                  />
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
            <legend className="px-1 text-sm font-semibold text-white">
              <span className="inline-flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-300/15 text-xs font-bold text-cyan-100">2</span> Organisation size</span>
            </legend>
            <p className="mt-1 text-xs text-slate-400">This helps us tune recommendations and platform context.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {organisationSizes.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center rounded-xl border px-4 py-3 text-sm transition ${
                    form.organisationSize === option.value
                      ? "border-cyan-200/60 bg-cyan-300/10 text-white"
                      : "border-white/10 bg-slate-950/35 text-slate-200 hover:border-cyan-200/30 hover:bg-white/[0.06]"
                  }`}
                >
                  <input
                    type="radio"
                    name="organisationSize"
                    value={option.value}
                    className="mr-2 accent-cyan-300"
                    checked={form.organisationSize === option.value}
                    onChange={() =>
                      updateField("organisationSize", option.value)
                    }
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-white"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-300/15 text-xs font-bold text-cyan-100">3</span> Your details</div>
            <p className="mt-1 text-xs text-slate-400">Use a recognizable organisation name or professional role.</p>
            <label className="mt-4 flex items-center gap-2 text-sm text-slate-300">
              <span>
                Organisation name or profession
              </span>
              <span className="group relative inline-flex">
                <button
                  type="button"
                  aria-label="Organisation or profession guidance"
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/30 text-[11px] font-semibold text-slate-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                >
                  i
                </button>
                <span className="pointer-events-none absolute left-1/2 top-7 z-20 hidden w-64 -translate-x-1/2 rounded-lg border border-white/15 bg-slate-900/95 px-3 py-2 text-xs leading-relaxed text-slate-100 shadow-xl group-hover:block group-focus-within:block">
                  Add either your organisation name or your profession/role.
                </span>
              </span>
            </label>
            <input
              type="text"
              value={form.organisationName}
              onChange={(e) => updateField("organisationName", e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-500/40 bg-slate-900/80 px-3 py-2.5 text-sm text-white placeholder:text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition focus:border-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-300/25"
              placeholder="YouMine Pty Ltd or Principal Mining Engineer"
            />

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-slate-300">
                First name{" "}
                <span className="text-slate-500">(optional)</span>
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                maxLength={60}
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
          </div>

          {error ? (
            <p className="text-sm text-rose-300">{error}</p>
          ) : null}
          {message ? (
            <p className="text-sm text-emerald-300">{message}</p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col items-start gap-1">
              <button
                type="button"
                onClick={handleSkip}
                className="rounded-full border border-white/15 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                aria-label="Skip onboarding"
              >
                Skip for now
              </button>
              <p className="text-xs text-slate-400">
                You can update these details in the Account page later on.
              </p>
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="min-h-11 rounded-full border border-cyan-100/35 bg-[linear-gradient(135deg,#22d3ee,#0284c7_55%,#1d4ed8)] px-5 py-2.5 text-sm font-bold text-white shadow-[0_16px_34px_-18px_rgba(34,211,238,0.9)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Save profile"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}