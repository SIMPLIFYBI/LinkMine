"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ConsultantFavouriteButton from "@/app/components/ConsultantFavouriteButton";
import Link from "next/link";

export default function PermissionsGate({ consultantId, displayName, initialViewsCount = 0 }) {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState({
    isOwner: false,
    isAdmin: false,
    canEdit: false,
    initialFavourite: false,
    // Seed from SSR so it matches the server badge immediately
    viewsCount: initialViewsCount,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        const res = await fetch(`/api/consultants/${consultantId}/permissions`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: "no-store",
        });

        if (!res.ok) {
          if (!cancelled) setLoading(false);
          return;
        }

        const json = await res.json();

        if (!cancelled) {
          setState((s) => ({
            ...s,
            isOwner: !!json.isOwner,
            isAdmin: !!json.isAdmin,
            canEdit: !!json.canEdit,
            initialFavourite: !!json.initialFavourite,
            // Monotonic: never allow a later response to drop below the SSR baseline/current value
            viewsCount: Number.isFinite(json.viewsCount)
              ? Math.max(s.viewsCount, Number(json.viewsCount))
              : s.viewsCount,
          }));
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [consultantId]);

  // Use the state value for rendering (no top-level awaits or direct queries here)
  const { isOwner, isAdmin, canEdit, initialFavourite, viewsCount } = state;

  return (
    <div className="flex flex-col items-end gap-2">
      {/* Views badge (public) */}
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 ring-1 ring-white/10">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 text-slate-300"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 5c4.5 0 8.3 2.9 10 7-1.7 4.1-5.5 7-10 7S3.7 16.1 2 12c1.7-4.1 5.5-7 10-7zm0 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
        </svg>
        <span>{viewsCount.toLocaleString()} views</span>
        <span className="text-xs font-normal text-slate-400/80">• updates every 10 min</span>
      </div>

      {/* Owner/Admin and controls */}
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="min-h-[34px]">
          {loading ? (
            <span className="inline-block h-[28px] w-40 animate-pulse rounded-full bg-white/10" />
          ) : canEdit ? (
            isOwner ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/70 bg-emerald-500/15 px-4 py-1.5 text-sm font-semibold text-emerald-100 shadow-sm ring-1 ring-emerald-300/30">
                You are the owner
              </span>
            ) : (
              // Replaced the "Admin access" pill with a compact icon
              <span
                className="inline-flex h-[28px] w-[28px] items-center justify-center rounded-full border border-sky-300/70 bg-sky-500/15 text-sky-100 shadow-sm ring-1 ring-sky-300/30"
                title="Admin"
                aria-label="Admin"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  {/* shield badge icon */}
                  <path d="M12 2c.3 0 .6.1.8.2l7 3a1 1 0 0 1 .7.94V12c0 3.74-2.55 7.23-7.6 9.74a1 1 0 0 1-.9 0C6.85 19.23 4.3 15.74 4.3 12V6.14a1 1 0 0 1 .7-.94l7-3c.2-.1.5-.2.8-.2zM8.5 12.75l2.75 2.75 4.25-5a1 1 0 1 1 1.5 1.3l-5 5.9a1 1 0 0 1-1.47.05l-3.5-3.5a1 1 0 1 1 1.42-1.42z" />
                </svg>
                <span className="sr-only">Admin</span>
              </span>
            )
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {loading ? (
            <span className="inline-block h-[34px] w-[110px] animate-pulse rounded-full bg-white/10" />
          ) : (
            <>
              {canEdit && (
                <Link
                  href={`/consultants/${consultantId}/edit`}
                  className="inline-flex items-center gap-2 rounded-full border border-sky-400/60 bg-sky-500/15 px-4 py-1.5 text-sm font-semibold text-sky-100 hover:border-sky-300 hover:bg-sky-500/25"
                >
                  Edit profile
                </Link>
              )}
              <ConsultantFavouriteButton
                consultantId={consultantId}
                initialFavourite={initialFavourite}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}