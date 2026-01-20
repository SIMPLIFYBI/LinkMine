"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function toLocalInputValueFromIso(iso) {
  try {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  } catch {
    return "";
  }
}

export default function EventEditorModal({ open, onClose, eventId, seed, onDeleted }) {
  const overlayRef = useRef(null);
  const openRef = useRef(open);
  const onCloseRef = useRef(onClose);
  const onDeletedRef = useRef(onDeleted);

  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState(seed?.title || "");
  const [summary, setSummary] = useState(seed?.summary || "");
  const [description, setDescription] = useState(seed?.description || "");

  const [startsAtLocal, setStartsAtLocal] = useState(seed?.starts_at ? toLocalInputValueFromIso(seed.starts_at) : "");
  const [endsAtLocal, setEndsAtLocal] = useState(seed?.ends_at ? toLocalInputValueFromIso(seed.ends_at) : "");
  const [timezone, setTimezone] = useState(seed?.timezone || "Australia/Sydney");

  const [delivery, setDelivery] = useState(seed?.delivery_method || "in_person");
  const [locationName, setLocationName] = useState(seed?.location_name || "");
  const [suburb, setSuburb] = useState(seed?.suburb || "");
  const [stateVal, setStateVal] = useState(seed?.state || "NSW");
  const [country, setCountry] = useState(seed?.country || "AU");

  const [joinUrl, setJoinUrl] = useState(seed?.join_url || "");
  const [externalUrl, setExternalUrl] = useState(seed?.external_url || "");
  const [organizerName, setOrganizerName] = useState(seed?.organizer_name || "");
  const [organizerUrl, setOrganizerUrl] = useState(seed?.organizer_url || "");
  const [tagsCsv, setTagsCsv] = useState(Array.isArray(seed?.tags) ? seed.tags.join(", ") : "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const tags = useMemo(() => tagsCsv.split(",").map((t) => t.trim()).filter(Boolean), [tagsCsv]);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    onDeletedRef.current = onDeleted;
  }, [onDeleted]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && openRef.current) onCloseRef.current?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Prefill from API when opening (ensures we have description, etc.)
  useEffect(() => {
    if (!open || !eventId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      setOk("");
      try {
        const res = await fetch(`/api/events/${encodeURIComponent(eventId)}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || "Failed to load event.");

        if (cancelled) return;

        setTitle(json?.title || "");
        setSummary(json?.summary || "");
        setDescription(json?.description || "");

        setStartsAtLocal(json?.starts_at ? toLocalInputValueFromIso(json.starts_at) : "");
        setEndsAtLocal(json?.ends_at ? toLocalInputValueFromIso(json.ends_at) : "");
        setTimezone(json?.timezone || "Australia/Sydney");

        setDelivery(json?.delivery_method || "in_person");
        setLocationName(json?.location_name || "");
        setSuburb(json?.suburb || "");
        setStateVal(json?.state || "NSW");
        setCountry(json?.country || "AU");

        setJoinUrl(json?.join_url || "");
        setExternalUrl(json?.external_url || "");
        setOrganizerName(json?.organizer_name || "");
        setOrganizerUrl(json?.organizer_url || "");
        setTagsCsv(Array.isArray(json?.tags) ? json.tags.join(", ") : "");
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, eventId]);

  function isBlank(v) {
    return v === null || v === undefined || String(v).trim() === "";
  }

  async function save() {
    if (isBlank(summary)) {
      setError("Summary is required.");
      return;
    }
    if (isBlank(description)) {
      setError("Description is required.");
      return;
    }

    setSaving(true);
    setError("");
    setOk("");

    try {
      const starts_at = new Date(startsAtLocal);
      const ends_at = new Date(endsAtLocal);

      if (!title.trim()) throw new Error("Title is required.");
      if (Number.isNaN(starts_at.getTime())) throw new Error("Start date/time is invalid.");
      if (Number.isNaN(ends_at.getTime())) throw new Error("End date/time is invalid.");
      if (!(ends_at > starts_at)) throw new Error("End must be after start.");

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch(`/api/events/${encodeURIComponent(eventId)}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to save.");

      setOk("Saved.");
    } catch (e) {
      setError(e?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function del() {
    if (!eventId) return;
    if (!window.confirm("Delete this event? This cannot be undone.")) return;

    setSaving(true);
    setError("");
    setOk("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch(`/api/events/${encodeURIComponent(eventId)}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to delete.");

      // ✅ tell parent (drawer) that deletion succeeded
      onDeletedRef.current?.();

      // ✅ close the modal (parent may also close the drawer)
      onCloseRef.current?.();
    } catch (e) {
      setError(e?.message || "Failed to delete.");
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
            <div className="text-base font-semibold text-white">Edit Event</div>
            <div className="mt-1 text-xs text-slate-400">Changes apply immediately (including for published events).</div>
          </div>
          <button onClick={onClose} className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-200 hover:bg-white/10">
            Close
          </button>
        </div>

        <div className="h-[calc(100%-52px)] overflow-y-auto px-4 py-4">
          {loading ? <div className="text-sm text-slate-400">Loading…</div> : null}

          {error ? <div className="mb-3 rounded border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</div> : null}
          {ok ? <div className="mb-3 rounded border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">{ok}</div> : null}

          {/* Reused layout from SubmitEventModal */}
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky-500/40"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Summary (optional)</label>
              <input
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky-500/40"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px] w-full rounded-md border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky-500/40"
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
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">Suburb (optional)</label>
                <input
                  value={suburb}
                  onChange={(e) => setSuburb(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky-500/40"
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
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">Country</label>
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky-500/40"
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
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-300">Join URL (optional)</label>
                <input
                  value={joinUrl}
                  onChange={(e) => setJoinUrl(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky-500/40"
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
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Tags (comma separated)</label>
              <input
                value={tagsCsv}
                onChange={(e) => setTagsCsv(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky-500/40"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={del}
                className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/15 disabled:opacity-60"
                disabled={saving}
              >
                Delete
              </button>

              <div className="flex items-center gap-2">
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
                  onClick={save}
                  className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}