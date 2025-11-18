"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function ClaimProfileModal({
  consultantId,
  contactEmail,
  onClose,
  onSuccess
}) {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stageMsg, setStageMsg] = useState("");
  const [error, setError] = useState("");

  // Prefill from existing profile if available
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const sb = supabaseBrowser();
        const { data: sess } = await sb.auth.getSession();
        const u = sess?.session?.user;
        if (!u) return;
        if (!active) return;
        setUserEmail(u.email || "");
        // Attempt to fetch existing profile to prefill names if already set
        const { data: profile } = await sb
          .from("user_profiles")
          .select("first_name, last_name")
          .eq("id", u.id)
          .maybeSingle();
        if (profile) {
          if (profile.first_name) setFirstName(profile.first_name);
          if (profile.last_name) setLastName(profile.last_name);
        }
      } catch {
        /* silent */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const close = useCallback(() => {
    if (!busy) onClose?.();
  }, [busy, onClose]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setStageMsg("");

    if (!userEmail) {
      router.replace(`/login?redirect=/consultants/${consultantId}`);
      return;
    }
    if (!firstName.trim() || !lastName.trim() || !password) {
      setError("All fields are required.");
      return;
    }
    if (!consent) {
      setError("Please confirm you are authorized to claim this profile.");
      return;
    }

    setBusy(true);
    try {
      const sb = supabaseBrowser();

      // Re-authenticate with password
      setStageMsg("Verifying credentials…");
      const { data: signInData, error: signInErr } = await sb.auth.signInWithPassword({
        email: userEmail.trim(),
        password
      });
      if (signInErr || !signInData.session) {
        throw new Error(signInErr?.message || "Password verification failed.");
      }

      const accessToken = signInData.session.access_token;

      // Fetch existing profile row for required fields
      setStageMsg("Updating profile details…");
      const { data: existingProfile } = await sb
        .from("user_profiles")
        .select("user_type, organisation_size, organisation_name, profession")
        .eq("id", signInData.session.user.id)
        .maybeSingle();

      if (existingProfile) {
        // Patch names along with required existing fields
        const patchRes = await fetch("/api/profile", {
          method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`
            },
          body: JSON.stringify({
            userType: existingProfile.user_type,
            organisationSize: existingProfile.organisation_size,
            organisationName: existingProfile.organisation_name,
            profession: existingProfile.profession,
            firstName: firstName.trim(),
            lastName: lastName.trim()
          })
        });
        if (!patchRes.ok) {
          const body = await patchRes.json().catch(() => ({}));
          throw new Error(body.error || "Failed updating profile names.");
        }
      }
      // else: skip name patch (user hasn't onboarded yet)

      if (!contactEmail) {
        throw new Error("No contact email is stored for this profile.");
      }

      setStageMsg("Sending claim email…");
      const claimRes = await fetch(`/api/consultants/${consultantId}/request-claim`, {
        method: "POST",
        credentials: "include"
      });
      const claimBody = await claimRes.json().catch(() => ({}));
      if (!claimRes.ok) {
        throw new Error(claimBody.error || "Failed to send claim email.");
      }

      setStageMsg("Claim email sent. Check your inbox.");
      onSuccess?.();
    } catch (err) {
      setError(err.message || "Unexpected error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={close}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-slate-800/90 p-6 shadow-xl ring-1 ring-white/15">
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Claim this profile
          </h2>
          <button
            onClick={close}
            disabled={busy}
            aria-label="Close"
            className="rounded-md border border-white/10 bg-white/10 p-2 text-slate-200 hover:bg-white/15 active:scale-95 disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          YouMine publishes profiles from business records and publicly available
          information. We’ve matched the most accurate contact email currently on file:
          <strong className="ml-1 text-sky-300">{contactEmail || "—"}</strong>.
          A secure claim link will be sent to this address. Only someone with access
          to that inbox can complete the claim. If this email is incorrect, please
          contact support so we can review and update it before proceeding.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
                First name
              </label>
              <input
                type="text"
                required
                maxLength={60}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 w-full rounded-md bg-slate-900/60 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
                placeholder="Jane"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
                Last name
              </label>
              <input
                type="text"
                required
                maxLength={60}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 w-full rounded-md bg-slate-900/60 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
                placeholder="Smith"
              />
            </div>
          </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
                Password (re-enter)
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md bg-slate-900/60 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

          <label className="flex items-start gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border border-white/20 bg-slate-900/60 text-sky-500 focus:ring-2 focus:ring-sky-500/40"
            />
            <span>
              I confirm I’m authorized to claim and manage this profile on behalf of
              the organization, and agree that YouMine may record this action.
            </span>
          </label>

          {error && <div className="text-sm text-rose-300">{error}</div>}
          {stageMsg && !error && (
            <div className="text-sm text-sky-300">{stageMsg}</div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:from-sky-500 hover:to-indigo-500 disabled:opacity-60"
            >
              {busy ? "Processing…" : "Send claim link"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={close}
              className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}