"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const userTypes = [
  { value: "consultant", label: "Consultant / Contractor" },
  { value: "client", label: "Client" },
  { value: "both", label: "Both" },
];

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
    userType: "",
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
          userType: profile.user_type ?? "",
          organisationSize: profile.organisation_size ?? "",
          organisationName: profile.organisation_name ?? "",
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
    return (
      !form.userType ||
      !form.organisationSize ||
      !form.profession ||
      isPending
    );
  }, [form, isPending]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    startTransition(async () => {
      try {
        const sb = supabaseBrowser();
        const { data: { session } } = await sb.auth.getSession();
        const accessToken = session?.access_token;
        if (!accessToken) throw new Error("Not authenticated.");

        // Build payload with only non-empty fields
        const payload = {};
        if (form.userType) payload.userType = form.userType;
        if (form.organisationSize) payload.organisationSize = form.organisationSize;
        if (form.organisationName?.trim()) payload.organisationName = form.organisationName.trim();
        if (form.profession?.trim()) payload.profession = form.profession.trim();
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
        setTimeout(() => router.replace("/"), 900);
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
        router.replace("/");
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
    <main className="mx-auto max-w-xl px-4 py-12">
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-slate-100 shadow-lg ring-1 ring-white/5">
        <header className="mb-6 space-y-2">
          <h1 className="text-2xl font-semibold text-white">
            Tell us about yourself
          </h1>
          <p className="text-sm text-slate-300">
            We use this information to tailor your YouMine experience.
          </p>
        </header>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <fieldset>
            <legend className="text-sm font-medium text-white">
              I’m here as a…
            </legend>
            <div className="mt-3 grid gap-2">
              {userTypes.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                    form.userType === option.value
                      ? "border-sky-400/70 bg-sky-500/10 text-white"
                      : "border-white/10 bg-white/[0.02] text-slate-200 hover:border-white/20"
                  }`}
                >
                  <span>{option.label}</span>
                  <input
                    type="radio"
                    name="userType"
                    value={option.value}
                    checked={form.userType === option.value}
                    onChange={() => updateField("userType", option.value)}
                  />
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-white">
              Organisation size
            </legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {organisationSizes.map((option) => (
                <label
                  key={option.value}
                  className={`rounded-xl border px-4 py-3 text-sm transition ${
                    form.organisationSize === option.value
                      ? "border-sky-400/70 bg-sky-500/10 text-white"
                      : "border-white/10 bg-white/[0.02] text-slate-200 hover:border-white/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="organisationSize"
                    value={option.value}
                    className="mr-2"
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

          <div>
            <label className="block text-sm text-slate-300">
              Organisation name{" "}
              <span className="text-slate-500">(optional)</span>
            </label>
            <input
              type="text"
              value={form.organisationName}
              onChange={(e) => updateField("organisationName", e.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
              placeholder="YouMine Pty Ltd"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300">
              Profession / role
            </label>
            <input
              type="text"
              value={form.profession}
              onChange={(e) => updateField("profession", e.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
              placeholder="e.g. Principal Mining Engineer"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
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
                className="mt-1 w-full rounded-md bg-slate-900/60 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
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
                className="mt-1 w-full rounded-md bg-slate-900/60 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
                placeholder="Smith"
              />
            </div>
          </div>

          {error ? (
            <p className="text-sm text-rose-300">{error}</p>
          ) : null}
          {message ? (
            <p className="text-sm text-emerald-300">{message}</p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col items-start gap-1">
              <button
                type="button"
                onClick={handleSkip}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10"
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
              className="rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60"
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