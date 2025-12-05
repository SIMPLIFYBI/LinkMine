"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function EditWorkerForm({ workerId, initial, roleOptions }) {
  const router = useRouter();

  const [displayName, setDisplayName] = useState(initial.display_name);
  const [headline, setHeadline] = useState(initial.headline);
  const [bio, setBio] = useState(initial.bio);
  const [location, setLocation] = useState(initial.location);
  const [selectedRoles, setSelectedRoles] = useState(new Set(initial.roles || []));
  const [availableNow, setAvailableNow] = useState(!!initial.available_now);
  const [availableFrom, setAvailableFrom] = useState(initial.available_from || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const roleBySlug = useMemo(() => {
    const map = new Map();
    for (const r of roleOptions || []) map.set(r.slug, r);
    return map;
  }, [roleOptions]);

  function toggleRole(slug) {
    const next = new Set(selectedRoles);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    setSelectedRoles(next);
  }

  async function onSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    // 1) Update workers
    const { error: wErr } = await supabase
      .from("workers")
      .update({
        display_name: displayName || null,
        headline: headline || null,
        bio: bio || null,
        location: location || null,
      })
      .eq("id", workerId);
    if (wErr) {
      setError(wErr.message);
      setSaving(false);
      return;
    }

    // 2) Upsert availability
    const fromVal = availableFrom ? availableFrom : null;
    const { error: aErr } = await supabase
      .from("worker_availability")
      .upsert(
        [
          {
            worker_id: workerId,
            available_now: availableNow,
            available_from: fromVal,
          },
        ],
        { onConflict: "worker_id" }
      );
    if (aErr) {
      setError(aErr.message);
      setSaving(false);
      return;
    }

    // 3) Sync roles
    const desiredSlugs = Array.from(selectedRoles);
    const desiredIds = desiredSlugs
      .map((s) => roleBySlug.get(s)?.id)
      .filter(Boolean);

    // Fetch current role ids to diff (in case props are stale)
    const { data: currentRows = [], error: curErr } = await supabase
      .from("worker_roles")
      .select("role_category_id")
      .eq("worker_id", workerId);
    if (curErr) {
      setError(curErr.message);
      setSaving(false);
      return;
    }
    const currentIds = new Set((currentRows || []).map((r) => r.role_category_id));

    const desiredIdSet = new Set(desiredIds);
    const toAdd = desiredIds.filter((id) => !currentIds.has(id));
    const toRemove = Array.from(currentIds).filter((id) => !desiredIdSet.has(id));

    if (toRemove.length) {
      const { error: delErr } = await supabase
        .from("worker_roles")
        .delete()
        .eq("worker_id", workerId)
        .in("role_category_id", toRemove);
      if (delErr) {
        setError(delErr.message);
        setSaving(false);
        return;
      }
    }

    if (toAdd.length) {
      const rows = toAdd.map((id) => ({ worker_id: workerId, role_category_id: id }));
      const { error: insErr } = await supabase.from("worker_roles").insert(rows);
      if (insErr) {
        setError(insErr.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    router.push(`/workers/${workerId}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSave} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-slate-300">Display name</label>
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-sky-400/30"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-300">Location</label>
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-sky-400/30"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Perth, WA"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-300">Headline</label>
        <input
          className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-sky-400/30"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Short one-liner about your expertise"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-300">Bio</label>
        <textarea
          className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-sky-400/30"
          rows={6}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell clients about your experience, projects, and what you’re looking for."
        />
      </div>

      <div>
        <div className="text-xs font-semibold text-white">Roles</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {(roleOptions || []).map((r) => {
            const active = selectedRoles.has(r.slug);
            return (
              <button
                key={r.slug}
                type="button"
                onClick={() => toggleRole(r.slug)}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${
                  active
                    ? "border-sky-400/30 bg-sky-500/10 text-sky-100"
                    : "border-white/12 bg-white/[0.06] text-slate-200 hover:bg-white/[0.1]"
                }`}
              >
                {r.name}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold text-white">Availability</div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-slate-100">
            <input
              type="checkbox"
              className="accent-emerald-400"
              checked={availableNow}
              onChange={(e) => {
                const v = e.target.checked;
                setAvailableNow(v);
                if (v) setAvailableFrom("");
              }}
            />
            Available now
          </label>
          <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-slate-100">
            <span className="opacity-80">From</span>
            <input
              type="date"
              value={availableFrom}
              onChange={(e) => {
                setAvailableFrom(e.target.value);
                setAvailableNow(false);
              }}
              className="bg-transparent text-slate-100 outline-none [color-scheme:dark]"
            />
            {availableFrom ? (
              <button
                type="button"
                onClick={() => setAvailableFrom("")}
                className="rounded-md border border-white/10 bg-white/10 px-2 py-0.5 text-[11px] text-slate-200"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/15 hover:border-emerald-400/40 transition disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/workers/${workerId}`)}
          className="rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.07]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}