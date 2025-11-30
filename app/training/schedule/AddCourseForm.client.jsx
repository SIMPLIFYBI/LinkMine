"use client";

import { useEffect, useState } from "react";

export default function AddCourseForm({ consultantId, onDone }) {
  // Course fields
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("Safety");
  const [tags, setTags] = useState("training,safety");
  const [level, setLevel] = useState("Beginner");
  const [duration, setDuration] = useState("6");
  const [deliveryDefault, setDeliveryDefault] = useState("in_person");
  const [desc, setDesc] = useState("");

  // Sessions (multiple)
  const [addSessions, setAddSessions] = useState(true);
  const [sessions, setSessions] = useState([
    {
      key: 1,
      date: "",
      startTime: "",
      endTime: "",
      timezone: "Australia/Perth",
      delivery_method: "in_person",
      location_name: "",
      suburb: "",
      state: "",
      country: "AU",
      join_url: "",
      capacity: "",
      price: "",
      currency: "AUD",
      gst_included: true,
    },
  ]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) {
        setSessions((s) => s.map((r) => ({ ...r, timezone: tz })));
      }
    } catch {}
  }, []);

  function slugify(s) {
    return String(s || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")
      .slice(0, 80);
  }

  function toISO(d, t) {
    if (!d || !t) return null;
    const dt = new Date(`${d}T${t}:00`);
    if (Number.isNaN(dt.getTime())) return null;
    return dt.toISOString();
  }

  function addRow() {
    setSessions((prev) => [
      ...prev,
      {
        key: prev[prev.length - 1]?.key + 1 || 1,
        date: "",
        startTime: "",
        endTime: "",
        timezone: prev[0]?.timezone || "Australia/Perth",
        delivery_method: "in_person",
        location_name: "",
        suburb: "",
        state: "",
        country: "AU",
        join_url: "",
        capacity: "",
        price: "",
        currency: "AUD",
        gst_included: true,
      },
    ]);
  }

  function removeRow(key) {
    setSessions((prev) => prev.filter((r) => r.key !== key));
  }

  function updateRow(key, patch) {
    setSessions((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const body = {
      title: title.trim(),
      slug: slugify(title),
      summary: summary.trim() || null,
      description: desc.trim() || null,
      category: category.trim() || null,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      level: level || null,
      duration_hours: Number.isFinite(Number(duration)) ? Number(duration) : null,
      delivery_default: deliveryDefault,
      status: "published",
    };

    if (!body.title) {
      setBusy(false);
      return setError("Title is required.");
    }

    if (addSessions && sessions.length > 0) {
      const built = [];
      for (const r of sessions) {
        const starts_at = toISO(r.date, r.startTime);
        const ends_at = toISO(r.date, r.endTime);
        if (!starts_at || !ends_at) {
          setBusy(false);
          return setError("Each session needs a date, start and end time.");
        }
        if (new Date(ends_at) <= new Date(starts_at)) {
          setBusy(false);
          return setError("Session end time must be after start time.");
        }
        if (!["in_person", "online", "hybrid"].includes(r.delivery_method)) {
          setBusy(false);
          return setError("Invalid delivery method.");
        }
        built.push({
          starts_at,
          ends_at,
          timezone: r.timezone || null,
          delivery_method: r.delivery_method,
          location_name: r.delivery_method === "online" ? null : (r.location_name || null),
          suburb: r.delivery_method === "online" ? null : (r.suburb || null),
          state: r.delivery_method === "online" ? null : (r.state || null),
          country: r.delivery_method === "online" ? "AU" : (r.country || "AU"),
          join_url: r.delivery_method === "online" || r.delivery_method === "hybrid" ? (r.join_url || null) : null,
          capacity: r.capacity !== "" && Number.isFinite(Number(r.capacity)) ? Number(r.capacity) : null,
          price_cents: r.price !== "" && Number.isFinite(Number(r.price)) ? Math.round(Number(r.price) * 100) : null,
          currency: r.currency || "AUD",
          gst_included: !!r.gst_included,
          status: "scheduled",
        });
      }
      body.sessions = built;
    }

    try {
      const res = await fetch(`/api/consultants/${encodeURIComponent(consultantId)}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Failed to create course");
      onDone?.();
      window.location.reload();
    } catch (err) {
      setError(err.message || "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? <div className="rounded border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</div> : null}

      <div>
        <label className="block text-sm text-slate-200">Title *</label>
        <input className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm text-slate-200">Category</label>
          <input className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white" value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-slate-200">Tags (comma separated)</label>
          <input className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white" value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-200">Summary</label>
        <input className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white" value={summary} onChange={(e) => setSummary(e.target.value)} />
      </div>

      <div>
        <label className="block text-sm text-slate-200">Description</label>
        <textarea className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white" rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm text-slate-200">Level</label>
          <select className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white" value={level} onChange={(e) => setLevel(e.target.value)}>
            <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-200">Duration (hours)</label>
          <input type="number" min="0" step="0.5" className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white" value={duration} onChange={(e) => setDuration(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-slate-200">Default delivery</label>
          <select className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white" value={deliveryDefault} onChange={(e) => setDeliveryDefault(e.target.value)}>
            <option value="in_person">In person</option><option value="online">Online</option><option value="hybrid">Hybrid</option>
          </select>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium text-white">Add sessions now</div>
          <label className="inline-flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" className="h-4 w-4" checked={addSessions} onChange={(e) => setAddSessions(e.target.checked)} />
            Enable
          </label>
        </div>

        {addSessions && (
          <div className="space-y-5">
            {sessions.map((r, idx) => (
              <div key={r.key} className="rounded-md border border-white/10 bg-white/10 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm text-slate-200">Session {idx + 1}</div>
                  {sessions.length > 1 && (
                    <button type="button" onClick={() => removeRow(r.key)} className="text-xs text-red-300 hover:text-red-200">
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm text-slate-200">Date</label>
                    <input type="date" className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white"
                      value={r.date} onChange={(e) => updateRow(r.key, { date: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-200">Start time</label>
                    <input type="time" className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white"
                      value={r.startTime} onChange={(e) => updateRow(r.key, { startTime: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-200">End time</label>
                    <input type="time" className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white"
                      value={r.endTime} onChange={(e) => updateRow(r.key, { endTime: e.target.value })} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 mt-3">
                  <div>
                    <label className="block text-sm text-slate-200">Timezone</label>
                    <input className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white"
                      value={r.timezone} onChange={(e) => updateRow(r.key, { timezone: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-200">Delivery method</label>
                    <select className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white"
                      value={r.delivery_method} onChange={(e) => updateRow(r.key, { delivery_method: e.target.value })}>
                      <option value="in_person">In person</option>
                      <option value="online">Online</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>

                {r.delivery_method !== "online" ? (
                  <div className="grid gap-4 sm:grid-cols-4 mt-3">
                    <div>
                      <label className="block text-sm text-slate-200">Location name</label>
                      <input className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white"
                        value={r.location_name} onChange={(e) => updateRow(r.key, { location_name: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-200">Suburb</label>
                      <input className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white"
                        value={r.suburb} onChange={(e) => updateRow(r.key, { suburb: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-200">State</label>
                      <input className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white"
                        value={r.state} onChange={(e) => updateRow(r.key, { state: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-200">Country</label>
                      <input className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white"
                        value={r.country} onChange={(e) => updateRow(r.key, { country: e.target.value })} />
                    </div>
                  </div>
                ) : (
                  <div className="mt-3">
                    <label className="block text-sm text-slate-200">Join URL</label>
                    <input className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white"
                      value={r.join_url} onChange={(e) => updateRow(r.key, { join_url: e.target.value })} placeholder="https://meet.example.com/abc" />
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-3 mt-3">
                  <div>
                    <label className="block text-sm text-slate-200">Capacity</label>
                    <input type="number" min="0" className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white"
                      value={r.capacity} onChange={(e) => updateRow(r.key, { capacity: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-200">Price (AUD)</label>
                    <input type="number" min="0" step="1" className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white"
                      value={r.price} onChange={(e) => updateRow(r.key, { price: e.target.value })} />
                  </div>
                  <div className="flex items-end justify-between">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                      <input type="checkbox" className="h-4 w-4"
                        checked={r.gst_included} onChange={(e) => updateRow(r.key, { gst_included: e.target.checked })} />
                      GST included
                    </label>
                  </div>
                </div>
              </div>
            ))}

            <button type="button" onClick={addRow}
              className="rounded-md border border-sky-400/30 bg-sky-500/10 px-3 py-1.5 text-sm font-semibold text-sky-100 hover:bg-sky-500/20">
              + Add another session
            </button>
          </div>
        )}
      </div>

      <div className="pt-2">
        <button type="submit" disabled={busy} className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50">
          {busy ? "Creating..." : "Create course"}
        </button>
      </div>
    </form>
  );
}