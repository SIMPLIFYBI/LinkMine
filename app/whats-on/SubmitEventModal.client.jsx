// filepath: c:\Users\james\supa-login\MineLink\MineLink\app\whats-on\SubmitEventModal.client.jsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

function toLocalInputValue(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function SubmitEventModal({ open, onClose }) {
  const overlayRef = useRef(null);
  const openRef = useRef(open);
  const onCloseRef = useRef(onClose);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");

  const [startsAtLocal, setStartsAtLocal] = useState(() => toLocalInputValue(new Date(Date.now() + 60 * 60 * 1000)));
  const [endsAtLocal, setEndsAtLocal] = useState(() => toLocalInputValue(new Date(Date.now() + 2 * 60 * 60 * 1000)));
  const [timezone, setTimezone] = useState("Australia/Sydney");

  const [delivery, setDelivery] = useState("in_person");
  const [locationName, setLocationName] = useState("");
  const [suburb, setSuburb] = useState("");
  const [stateVal, setStateVal] = useState("NSW");
  const [country, setCountry] = useState("AU");

  const [joinUrl, setJoinUrl] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [organizerUrl, setOrganizerUrl] = useState("");
  const [tagsCsv, setTagsCsv] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [authRequired, setAuthRequired] = useState(false);
  const [needsConsultancy, setNeedsConsultancy] = useState(false); // ✅ NEW

  const tags = useMemo(
    () => tagsCsv.split(",").map((t) => t.trim()).filter(Boolean),
    [tagsCsv]
  );

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && openRef.current) onCloseRef.current?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    setError("");
    setOk("");
    setAuthRequired(false);
    setNeedsConsultancy(false); // ✅ NEW
  }, [open]);

  async function submit() {
    setSaving(true);
    setError("");
    setOk("");
    setAuthRequired(false);
    setNeedsConsultancy(false); // ✅ NEW

    try {
      const starts_at = new Date(startsAtLocal);
      const ends_at = new Date(endsAtLocal);

      if (!title.trim()) throw new Error("Title is required.");
      if (Number.isNaN(starts_at.getTime())) throw new Error("Start date/time is invalid.");
      if (Number.isNaN(ends_at.getTime())) throw new Error("End date/time is invalid.");
      if (!(ends_at > starts_at)) throw new Error("End must be after start.");

      const res = await fetch("/api/event-submissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          summary: summary.trim(),
          description: description.trim(),
          starts_at: starts_at.toISOString(),
          ends_at: ends_at.toISOString(),
          timezone,
          delivery_method: delivery,
          location_name: locationName.trim(),
          suburb: suburb.trim(),
          state: stateVal.trim(),
          country: country.trim(),
          join_url: joinUrl.trim(),
          external_url: externalUrl.trim(),
          organizer_name: organizerName.trim(),
          organizer_url: organizerUrl.trim(),
          tags,
        }),
      });

      const ct = res.headers.get("content-type") || "";
      const json = ct.includes("application/json") ? await res.json() : null;

      if (!res.ok) {
        if (res.status === 401) {
          setAuthRequired(true);
        }

        // ✅ Show CTA only for the "no approved consultancy" case
        const msg = json?.error || `Failed to submit (HTTP ${res.status})`;
        if (res.status === 403 && msg.includes("approved consultancy")) {
          setNeedsConsultancy(true);
        }

        throw new Error(msg);
      }

      setOk("Submitted for review. An admin will approve or deny it.");
      // Keep modal open briefly, then close
      window.setTimeout(() => onClose?.(), 600);
    } catch (e) {
      setError(e.message || "Failed to submit.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`fixed inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        ref={overlayRef}
        onClick={(e) => {
          if (e.target === overlayRef.current) onClose?.();
        }}
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        className={`absolute inset-y-0 right-0 w-full max-w-lg transform bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl ring-1 ring-white/10 transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-start gap-3 border-b border-white/10 bg-slate-900/80 px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="text-base font-semibold text-white">Submit an Event</div>
            <div className="mt-1 text-xs text-slate-400">Your submission will be marked pending until approved.</div>
          </div>
          <button onClick={onClose} className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-200 hover:bg-white/10">
            Close
          </button>
        </div>

        <div className="h-[calc(100%-52px)] overflow-y-auto px-4 py-4">
          {/* ✅ inline auth hint */}
          {authRequired ? (
            <div className="mb-3 rounded border border-sky-400/30 bg-sky-500/10 p-3 text-sm text-sky-100">
              <div className="font-semibold">Login required</div>
              <div className="mt-1 text-sky-100/90">
                You must be logged in to submit an event.{" "}
                <Link href="/login" className="underline underline-offset-2 hover:text-white">
                  Go to login
                </Link>
                .
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="mb-3 rounded border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
              {error}

              {/* ✅ CTA appears without changing the form layout */}
              {needsConsultancy ? (
                <div className="mt-3">
                  <Link
                    href="/consultants/new"
                    className="inline-flex items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
                  >
                    Click here to create a free registered Account
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}

          {ok ? <div className="mb-3 rounded border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">{ok}</div> : null}

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky-500/40"
                placeholder="e.g. Community Meetup"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Summary (optional)</label>
              <input
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky-500/40"
                placeholder="One line description"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px] w-full rounded-md border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky-500/40"
                placeholder="Details, what to bring, who it’s for..."
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">Starts</label>
                <input
                  type="datetime-local"
                  value={startsAtLocal}
                  onChange={(e) => setStartsAtLocal(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky-500/40"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">Ends</label>
                <input
                  type="datetime-local"
                  value={endsAtLocal}
                  onChange={(e) => setEndsAtLocal(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky-500/40"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">Timezone</label>
                <input
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky-500/40"
                  placeholder="Australia/Sydney"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">Delivery</label>
                <select
                  value={delivery}
                  onChange={(e) => setDelivery(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky-500/40"
                >
                  <option value="in_person">In person</option>
                  <option value="online">Online</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">Location name (optional)</label>
                <input
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky-500/40"
                  placeholder="Venue"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">Suburb (optional)</label>
                <input
                  value={suburb}
                  onChange={(e) => setSuburb(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky-500/40"
                  placeholder="Sydney"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">State (optional)</label>
                <input
                  value={stateVal}
                  onChange={(e) => setStateVal(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky-500/40"
                  placeholder="NSW"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">Country</label>
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky-500/40"
                  placeholder="AU"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">External URL (optional)</label>
                <input
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky-500/40"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">Join URL (optional)</label>
                <input
                  value={joinUrl}
                  onChange={(e) => setJoinUrl(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky-500/40"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">Organizer name (optional)</label>
                <input
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky-500/40"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">Organizer URL (optional)</label>
                <input
                  value={organizerUrl}
                  onChange={(e) => setOrganizerUrl(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky-500/40"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Tags (comma separated)</label>
              <input
                value={tagsCsv}
                onChange={(e) => setTagsCsv(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky-500/40"
                placeholder="networking, community"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
                disabled={saving}
              >
                {saving ? "Submitting…" : "Submit event"}
              </button>
            </div>

            <div className="text-xs text-slate-500">
              Note: Submissions are not shown publicly until approved.
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}