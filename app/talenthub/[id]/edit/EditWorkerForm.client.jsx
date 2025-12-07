"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function EditWorkerForm({ workerId, initial, roleOptions, workingRightsOptions }) {
  const router = useRouter();

  const [displayName, setDisplayName] = useState(initial.display_name);
  const [publicProfileName, setPublicProfileName] = useState(initial.public_profile_name || "");
  const [workingRightsSlug, setWorkingRightsSlug] = useState(initial.working_rights_slug || "");
  const [headline, setHeadline] = useState(initial.headline);
  const [bio, setBio] = useState(initial.bio);
  const [location, setLocation] = useState(initial.location);
  const [selectedRoles, setSelectedRoles] = useState(new Set(initial.roles || []));
  const [availableNow, setAvailableNow] = useState(!!initial.available_now);
  const [availableFrom, setAvailableFrom] = useState(initial.available_from || "");
  const [experiences, setExperiences] = useState(
    Array.isArray(initial.experiences) ? initial.experiences.slice(0, 3) : []
  );
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

  function addExperience() {
    if (experiences.length >= 3) return;
    setExperiences([
      ...experiences,
      { id: undefined, role_title: "", company: "", description: "", position: experiences.length },
    ]);
  }

  function updateExperience(i, patch) {
    setExperiences((prev) => prev.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }

  function removeExperience(i) {
    const next = experiences.filter((_, idx) => idx !== i).map((x, idx) => ({ ...x, position: idx }));
    setExperiences(next);
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
        public_profile_name: publicProfileName || null,
        working_rights_slug: workingRightsSlug || null,
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
      .upsert([{ worker_id: workerId, available_now: availableNow, available_from: fromVal }], {
        onConflict: "worker_id",
      });
    if (aErr) {
      setError(aErr.message);
      setSaving(false);
      return;
    }

    // 3) Replace experiences with edited set (keep it simple and consistent)
    const cleaned = experiences
      .map((e, idx) => ({
        // DO NOT include id for inserts (let bigserial auto-generate)
        worker_id: workerId,
        role_title: (e.role_title || "").trim(),
        company: (e.company || "").trim(),
        description: e.description ? e.description.trim() : null,
        position: idx, // 0..2
      }))
      .filter((e) => e.role_title && e.company)
      .slice(0, 3);

    // Validate: if any row is partially filled, prompt user
    const hasPartial = experiences.some((e) => {
      const r = (e.role_title || "").trim();
      const c = (e.company || "").trim();
      const any = r || c || (e.description || "").trim();
      const ok = r && c;
      return any && !ok;
    });
    if (hasPartial) {
      setError("Each experience must have both Role title and Company, or be left blank.");
      setSaving(false);
      return;
    }

    // Delete all existing experiences for this worker, then insert the cleaned set
    const { error: delErr } = await supabase.from("worker_experiences").delete().eq("worker_id", workerId);
    if (delErr) {
      setError(delErr.message);
      setSaving(false);
      return;
    }
    if (cleaned.length) {
      const { error: insErr } = await supabase
        .from("worker_experiences")
        .insert(cleaned);
      if (insErr) {
        setError(insErr.message);
        setSaving(false);
        return;
      }
    }

    // 4) Sync roles (diff)
    const desiredSlugs = Array.from(selectedRoles);
    const desiredIds = desiredSlugs.map((s) => roleBySlug.get(s)?.id).filter(Boolean);

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
      const { error: delRolesErr } = await supabase
        .from("worker_roles")
        .delete()
        .eq("worker_id", workerId)
        .in("role_category_id", toRemove);
      if (delRolesErr) {
        setError(delRolesErr.message);
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
    router.push(`/talenthub/${workerId}`);
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
          <label className="text-xs font-medium text-slate-300">Public profile name</label>
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-sky-400/30"
            value={publicProfileName}
            onChange={(e) => setPublicProfileName(e.target.value)}
            placeholder="Shown on your public profile"
          />
          <p className="mt-1 text-[11px] text-slate-400">
            Optional. If empty, we’ll show your Display name.
          </p>
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
        <div>
          <label className="text-xs font-medium text-slate-300">Working rights</label>
          <select
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-sky-400/30 [color-scheme:dark]"
            value={workingRightsSlug}
            onChange={(e) => setWorkingRightsSlug(e.target.value)}
          >
            <option value="">Select...</option>
            {(workingRightsOptions || []).map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.name}
              </option>
            ))}
          </select>
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

      <div>
        <h2 className="text-sm font-semibold text-white">Recent experiences</h2>
        <p className="mt-1 text-[11px] text-slate-400">Add up to 3. Role title and Company are required.</p>
        <div className="mt-3 space-y-3">
          {experiences.map((xp, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/12 bg-white/[0.04] p-4 ring-1 ring-white/10"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300">Role title</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-sky-400/30"
                    value={xp.role_title || ""}
                    onChange={(e) => updateExperience(i, { role_title: e.target.value })}
                    placeholder="e.g. Senior Geologist"
                    required={false}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300">Company</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-sky-400/30"
                    value={xp.company || ""}
                    onChange={(e) => updateExperience(i, { company: e.target.value })}
                    placeholder="e.g. CoreYard"
                    required={false}
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="text-xs font-medium text-slate-300">Short description (optional)</label>
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-sky-400/30"
                  value={xp.description || ""}
                  onChange={(e) => updateExperience(i, { description: e.target.value })}
                  placeholder="A sentence about responsibilities, tools, or impact."
                />
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeExperience(i)}
                  className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs text-slate-200 hover:bg-white/[0.1]"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        {experiences.length < 3 ? (
          <button
            type="button"
            onClick={addExperience}
            className="mt-2 rounded-xl border border-sky-400/30 bg-sky-500/10 px-3 py-2 text-sm text-sky-100 hover:bg-sky-500/15 hover:border-sky-400/40 transition"
          >
            Add experience
          </button>
        ) : null}
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
          onClick={() => router.push(`/talenthub/${workerId}`)}
          className="rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 hover:bg-white/[0.07]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}