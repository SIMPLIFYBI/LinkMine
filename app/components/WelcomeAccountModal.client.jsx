"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

function SparkIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M12 2l1.7 4.8L18.5 8l-4.8 1.2L12 14l-1.7-4.8L5.5 8l4.8-1.2L12 2z" fill="currentColor" />
      <path d="M18.5 14.5l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9.9-2.4z" fill="currentColor" />
      <path d="M4.5 14.5l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7.7-1.7z" fill="currentColor" />
    </svg>
  );
}

function VaultIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M3 10.5L12 4l9 6.5V19a2 2 0 01-2 2H5a2 2 0 01-2-2v-8.5z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.5 13.2h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="13.2" r="2.8" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function ProfileIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5.5 19.5a6.5 6.5 0 0113 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M17 5.5l1.3 1.3 2.2-2.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TickIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M5 12.5l4.2 4.2L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function WelcomeAccountModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [canCreateProfile, setCanCreateProfile] = useState(true);
  const [sessionUserId, setSessionUserId] = useState("");

  const shouldOpen = useMemo(() => searchParams?.get("welcome") === "1", [searchParams]);

  function seenKeyForUser(userId) {
    return `youmine:welcome-seen:${userId}`;
  }

  function markSeen(userId) {
    if (!userId || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(seenKeyForUser(userId), "1");
    } catch {}
  }

  function hasSeen(userId) {
    if (!userId || typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(seenKeyForUser(userId)) === "1";
    } catch {
      return false;
    }
  }

  function trackCta(choice) {
    if (typeof window === "undefined" || typeof window.gtag !== "function") return;
    window.gtag("event", "welcome_modal_cta_click", {
      cta_choice: choice,
      surface: "home_welcome_modal",
    });
  }

  useEffect(() => {
    let active = true;

    async function init() {
      if (!shouldOpen) return;

      try {
        const sb = supabaseBrowser();
        const { data } = await sb.auth.getSession();
        const userId = data?.session?.user?.id;
        if (!userId || !active) return;

        if (hasSeen(userId)) {
          router.replace("/");
          return;
        }

        setSessionUserId(userId);

        const { data: ownedProfile } = await sb
          .from("consultants")
          .select("id")
          .or(`user_id.eq.${userId},claimed_by.eq.${userId}`)
          .neq("status", "rejected")
          .limit(1)
          .maybeSingle();

        if (!active) return;

        setCanCreateProfile(!ownedProfile?.id);
        setOpen(true);
      } catch {
        if (!active) return;
        setCanCreateProfile(true);
        setOpen(true);
      }
    }

    init();

    return () => {
      active = false;
    };
  }, [shouldOpen]);

  function closeModal() {
    markSeen(sessionUserId);
    setOpen(false);
    router.replace("/");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto p-3 sm:items-center sm:p-6">
      <div
        className="welcome-modal-backdrop absolute inset-0 bg-slate-950/75 backdrop-blur-[3px]"
        onClick={closeModal}
        aria-hidden="true"
      />

      <section className="welcome-modal-sheet relative my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl overflow-y-auto rounded-2xl border border-cyan-200/30 bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,0.25),transparent_40%),radial-gradient(circle_at_90%_12%,rgba(20,184,166,0.22),transparent_42%),linear-gradient(155deg,#081528_0%,#0a2036_55%,#0b2840_100%)] p-4 text-slate-100 shadow-[0_30px_100px_-30px_rgba(2,12,27,0.95)] ring-1 ring-white/20 sm:max-h-[calc(100dvh-3rem)] sm:rounded-[28px] sm:p-8">
        <div className="welcome-modal-glow-one pointer-events-none absolute -top-24 -right-20 h-56 w-56 rounded-full border border-cyan-300/25 bg-cyan-300/10 blur-sm" aria-hidden="true" />
        <div className="welcome-modal-glow-two pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full border border-sky-200/25 bg-sky-300/10 blur-sm" aria-hidden="true" />

        <button
          type="button"
          onClick={closeModal}
          className="absolute right-4 top-4 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-100 transition hover:bg-white/15"
          aria-label="Close welcome message"
        >
          Close
        </button>

        <div className="relative">
          <div className="welcome-modal-item welcome-modal-item-1 inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
            <SparkIcon className="h-4 w-4" />
            Welcome to YouMine
          </div>

          <h2 className="welcome-modal-item welcome-modal-item-2 mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Your account is live. Here is what that means.
          </h2>

          <p className="welcome-modal-item welcome-modal-item-3 mt-3 max-w-2xl text-sm leading-7 text-slate-200 sm:text-[15px]">
            A YouMine account lets you sign in, browse every area of the platform, open vault resources, contact consultants, and engage with other users. This is your secure login identity.
          </p>

          <div className="welcome-modal-item welcome-modal-item-4 mt-5 grid gap-3 sm:grid-cols-2">
            <article className="rounded-2xl border border-emerald-200/25 bg-emerald-400/10 p-4">
              <div className="flex items-center gap-2 text-emerald-100">
                <VaultIcon className="h-5 w-5" />
                <h3 className="text-sm font-bold uppercase tracking-[0.14em]">Account access</h3>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-emerald-50/95">
                <li className="flex items-start gap-2"><TickIcon className="mt-0.5 h-4 w-4 text-emerald-200" />Browse platform sections and vault content</li>
                <li className="flex items-start gap-2"><TickIcon className="mt-0.5 h-4 w-4 text-emerald-200" />Message and engage with other users</li>
                <li className="flex items-start gap-2"><TickIcon className="mt-0.5 h-4 w-4 text-emerald-200" />Save activity under your private account</li>
              </ul>
            </article>

            <article className="rounded-2xl border border-sky-200/30 bg-sky-400/10 p-4">
              <div className="flex items-center gap-2 text-sky-100">
                <ProfileIcon className="h-5 w-5" />
                <h3 className="text-sm font-bold uppercase tracking-[0.14em]">Public profile</h3>
              </div>
              <p className="mt-3 text-sm leading-6 text-sky-50/95">
                A creator or consultant profile is separate from your account. It is your public presence where companies and users discover you, review your expertise, and contact you.
              </p>
            </article>
          </div>

          <div className="welcome-modal-item welcome-modal-item-5 mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={canCreateProfile ? "/consultants/new" : "/account"}
              onClick={() => {
                markSeen(sessionUserId);
                trackCta("create_public_profile");
              }}
              className="inline-flex items-center justify-center rounded-full border border-cyan-200/50 bg-[linear-gradient(130deg,#22d3ee,#38bdf8_42%,#0284c7)] px-6 py-3 text-sm font-bold text-slate-950 shadow-[0_18px_40px_-20px_rgba(34,211,238,0.9)] transition hover:brightness-110"
            >
              {canCreateProfile ? "Create a public profile" : "Open profile workspace"}
            </Link>

            <Link
              href="/vault"
              onClick={() => {
                markSeen(sessionUserId);
                trackCta("start_browsing");
              }}
              className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/18"
            >
              Start browsing
            </Link>
          </div>

          <p className="welcome-modal-item welcome-modal-item-6 mt-3 text-xs text-slate-300/90">
            You can create your public profile now or anytime later from your account area.
          </p>
        </div>
      </section>
    </div>
  );
}
