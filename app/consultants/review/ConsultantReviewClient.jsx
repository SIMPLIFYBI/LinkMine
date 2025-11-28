"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import ReviewList from "./ReviewList";

const CONSULTANT_FIELDS =
  "id, display_name, headline, bio, company, location, created_at, reviewer_notes, status, metadata, claimed_by, user_id";

export default function ConsultantReviewClient() {
  const [state, setState] = useState({
    loading: true,
    user: null,
    consultants: [],
    error: null,
    debug: null,
  });

  const load = useCallback(async () => {
    const sb = supabaseBrowser();
    const { data: sessionData, error: sessionError } = await sb.auth.getSession();
    const user = sessionData?.session?.user ?? null;

    let consultants = [];
    let combinedError = sessionError?.message ?? null;

    if (user) {
      const { data, error } = await sb
        .from("consultants")
        .select(CONSULTANT_FIELDS)
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      consultants = data ?? [];
      combinedError = combinedError ?? error?.message ?? null;
    }

    setState({
      loading: false,
      user,
      consultants,
      error: combinedError,
      debug: {
        user,
        session: sessionData?.session ?? null,
        sessionError: sessionError?.message ?? null,
        consultantCount: consultants.length,
      },
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (state.loading) {
    return (
      <main className="mx-auto w-full max-w-5xl py-16">
        <p className="text-center text-sm text-slate-400">Loading review queue…</p>
      </main>
    );
  }

  if (!state.user) {
    return (
      <main className="mx-auto w-full max-w-5xl space-y-6 py-16">
        <header>
          <h1 className="text-3xl font-semibold text-white">Consultant review</h1>
          <p className="mt-2 text-sm text-slate-400">
            Please sign in to access the review queue.
          </p>
        </header>
        {process.env.NODE_ENV !== "production" && state.debug && (
          <details className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-100">
            <summary className="cursor-pointer font-semibold text-amber-200">
              Auth debug
            </summary>
            <pre className="mt-3 whitespace-pre-wrap break-words text-[11px] text-amber-100/90">
              {JSON.stringify(state.debug, null, 2)}
            </pre>
          </details>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-10 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">Consultant review</h1>
        <p className="text-sm text-slate-400">
          Approve or reject newly submitted consultants.
        </p>
      </header>

      {state.error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          {state.error}
        </div>
      )}

     
      <ReviewList initialConsultants={state.consultants} />
    </main>
  );
}