"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import ReviewList from "./ReviewList";
import EventReviewList from "./EventReviewList";
import JobReviewList from "./JobReviewList";

const CONSULTANT_FIELDS =
  "id, display_name, headline, bio, company, location, created_at, reviewer_notes, status, metadata, claimed_by, user_id";

const EVENT_FIELDS =
  "id, submitted_at, submitted_by, title, summary, starts_at, ends_at, timezone, delivery_method, location_name, suburb, state, country, join_url, external_url, organizer_name, organizer_url, tags, status";

const JOB_FIELDS =
  "id, title, description, location, company, listing_type, close_date, contact_email, contact_name, recipient_ids, created_at, status, created_by";

export default function ConsultantReviewClient({
  initialTab = "consultants",
  availableTabs = ["consultants", "events", "jobs"],
  heading = "Admin review",
  description = "Approve or deny submissions.",
}) {
  const [tab, setTab] = useState(initialTab);

  const [state, setState] = useState({
    loading: true,
    user: null,
    consultants: [],
    eventSubmissions: [],
    jobs: [],
    error: null,
    debug: null,
  });

  const load = useCallback(async () => {
    const sb = supabaseBrowser();
    const { data: sessionData, error: sessionError } = await sb.auth.getSession();
    const user = sessionData?.session?.user ?? null;

    let consultants = [];
    let eventSubmissions = [];
    let jobs = [];
    let combinedError = sessionError?.message ?? null;

    if (user) {
      const [consultantRes, eventRes, jobRes] = await Promise.all([
        sb
          .from("consultants")
          .select(CONSULTANT_FIELDS)
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
        sb
          .from("event_submissions")
          .select(EVENT_FIELDS)
          .eq("status", "pending")
          .order("submitted_at", { ascending: false }),
        sb
          .from("jobs")
          .select(JOB_FIELDS)
          .neq("status", "deleted")
          .order("created_at", { ascending: false }),
      ]);

      if (consultantRes.error) combinedError = combinedError || consultantRes.error.message;
      if (eventRes.error) combinedError = combinedError || eventRes.error.message;
      if (jobRes.error) combinedError = combinedError || jobRes.error.message;

      consultants = consultantRes.data || [];
      eventSubmissions = eventRes.data || [];
      jobs = jobRes.data || [];
    }

    setState({
      loading: false,
      user,
      consultants,
      eventSubmissions,
      jobs,
      error: combinedError,
      debug: null,
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!availableTabs.includes(tab)) {
      setTab(initialTab);
      return;
    }
    if (tab !== initialTab && availableTabs.length === 1) {
      setTab(initialTab);
    }
  }, [availableTabs, initialTab, tab]);

  const counts = useMemo(
    () => ({
      consultants: state.consultants?.length || 0,
      events: state.eventSubmissions?.length || 0,
      jobs: state.jobs?.filter((job) => job.status === "pending").length || 0,
    }),
    [state.consultants, state.eventSubmissions, state.jobs]
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
        <h1 className="text-3xl font-semibold text-white">{heading}</h1>
        <p className="text-sm text-slate-400">{description}</p>
      </header>

      {state.error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          {state.error}
        </div>
      )}

      {availableTabs.length > 1 ? (
        <nav className="flex flex-wrap gap-2">
          {availableTabs.includes("consultants") ? (
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
          ) : null}
          {availableTabs.includes("events") ? (
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
          ) : null}
          {availableTabs.includes("jobs") ? (
            <button
              type="button"
              onClick={() => setTab("jobs")}
              className={
                tab === "jobs"
                  ? "rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white"
                  : "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
              }
            >
              Jobs ({counts.jobs})
            </button>
          ) : null}
        </nav>
      ) : null}

      {tab === "consultants" ? (
        <ReviewList initialConsultants={state.consultants} />
      ) : tab === "jobs" ? (
        <JobReviewList initialJobs={state.jobs} />
      ) : (
        <EventReviewList initialEvents={state.eventSubmissions} />
      )}
    </main>
  );
}