"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import ReviewList from "./ReviewList";
import EventReviewList from "./EventReviewList";

const CONSULTANT_FIELDS =
  "id, display_name, headline, bio, company, location, created_at, reviewer_notes, status, metadata, claimed_by, user_id";

const EVENT_FIELDS =
  "id, submitted_at, submitted_by, title, summary, starts_at, ends_at, timezone, delivery_method, location_name, suburb, state, country, join_url, external_url, organizer_name, organizer_url, tags, status";

export default function ConsultantReviewClient() {
  const [tab, setTab] = useState("consultants"); // "consultants" | "events"

  const [state, setState] = useState({
    loading: true,
    user: null,
    consultants: [],
    eventSubmissions: [],
    error: null,
    debug: null,
  });

  const load = useCallback(async () => {
    const sb = supabaseBrowser();
    const { data: sessionData, error: sessionError } = await sb.auth.getSession();
    const user = sessionData?.session?.user ?? null;

    let consultants = [];
    let eventSubmissions = [];
    let combinedError = sessionError?.message ?? null;

    if (user) {
      const { data: cData, error: cErr } = await sb
        .from("consultants")
        .select(CONSULTANT_FIELDS)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (cErr) combinedError = combinedError || cErr.message;
      consultants = cData || [];

      const { data: eData, error: eErr } = await sb
        .from("event_submissions")
        .select(EVENT_FIELDS)
        .eq("status", "pending")
        .order("submitted_at", { ascending: false });

      if (eErr) combinedError = combinedError || eErr.message;
      eventSubmissions = eData || [];
    }

    setState({
      loading: false,
      user,
      consultants,
      eventSubmissions,
      error: combinedError,
      debug: null,
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(
    () => ({
      consultants: state.consultants?.length || 0,
      events: state.eventSubmissions?.length || 0,
    }),
    [state.consultants, state.eventSubmissions]
  );

  if (state.loading) {
    return (
      <main className="mx-auto w-full max-w-5xl space-y-10 py-12">
        <div className="text-sm text-slate-300">Loading…</div>
      </main>
    );
  }

  if (!state.user) {
    return (
      <main className="mx-auto w-full max-w-5xl space-y-10 py-12">
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
          Please sign in to access admin review.
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">Admin review</h1>
        <p className="text-sm text-slate-400">Approve or deny submissions.</p>
      </header>

      {state.error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          {state.error}
        </div>
      )}

      <nav className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("consultants")}
          className={
            tab === "consultants"
              ? "rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white"
              : "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
          }
        >
          Consultant submissions ({counts.consultants})
        </button>
        <button
          type="button"
          onClick={() => setTab("events")}
          className={
            tab === "events"
              ? "rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white"
              : "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
          }
        >
          Event submissions ({counts.events})
        </button>
      </nav>

      {tab === "consultants" ? (
        <ReviewList initialConsultants={state.consultants} />
      ) : (
        <EventReviewList initialEvents={state.eventSubmissions} />
      )}
    </main>
  );
}