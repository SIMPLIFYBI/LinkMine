"use client";

import { useEffect, useMemo, useState } from "react";

export default function JobsBuilder() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [location, setLocation] = useState("");
  const [categories, setCategories] = useState([]);
  const [serviceSlug, setServiceSlug] = useState("");
  const [loadingConsultants, setLoadingConsultants] = useState(false);
  const [consultants, setConsultants] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/directory", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!cancelled) setCategories(json.categories || []);
    })();
    return () => { cancelled = true; };
  }, []);

  const allServices = useMemo(
    () => categories.flatMap((c) => (c.services || []).map((s) => ({ ...s, category: c.name }))),
    [categories]
  );

  async function loadConsultants(slug) {
    setLoadingConsultants(true);
    setConsultants([]);
    setSelected(new Set());
    try {
      const res = await fetch(`/api/consultants/by-service?service=${encodeURIComponent(slug)}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      setConsultants(json.consultants || []);
    } finally {
      setLoadingConsultants(false);
    }
  }

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(consultants.map((c) => c.id)));
  }
  function clearAll() {
    setSelected(new Set());
  }

  async function createJob() {
    const payload = {
      title,
      description: desc,
      location,
      service_slug: serviceSlug || "",
      consultant_ids: Array.from(selected),
    };
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      alert(json.error || "Failed to create job");
      return;
    }
    // reset and notify table to reload
    setTitle(""); setDesc(""); setLocation(""); setServiceSlug(""); setConsultants([]); setSelected(new Set());
    window.dispatchEvent(new CustomEvent("jobs:refresh"));
  }

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-[420px,1fr]">
      <section className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Job title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Open pit LOM schedule review"
            className="w-full rounded-md bg-slate-900/60 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Description</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={6}
            placeholder="Briefly describe scope, deliverables and timeline…"
            className="w-full rounded-md bg-slate-900/60 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Location (optional)</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Perth, WA"
            className="w-full rounded-md bg-slate-900/60 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Required service</label>
          <select
            value={serviceSlug}
            onChange={(e) => {
              const slug = e.target.value;
              setServiceSlug(slug);
              if (slug) loadConsultants(slug);
              else setConsultants([]);
            }}
            className="w-full rounded-md bg-slate-900/60 border border-white/10 px-3 py-2 text-sm"
          >
            <option value="">Select a service…</option>
            {categories.map((cat) => (
              <optgroup key={cat.id} label={cat.name}>
                {(cat.services || []).map((s) => (
                  <option key={s.id} value={s.slug}>{s.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-400">
            {serviceSlug
              ? `${consultants.length} consultant${consultants.length === 1 ? "" : "s"} match this service`
              : "Choose a service to load matching consultants"}
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            disabled={!title || !serviceSlug || selected.size === 0}
            onClick={createJob}
            className={`rounded-md px-3 py-2 text-sm font-medium ${!title || !serviceSlug || selected.size === 0
              ? "bg-white/5 text-slate-400 cursor-not-allowed"
              : "bg-sky-600 text-white hover:bg-sky-500"
            }`}
          >
            Create job
          </button>
          <button
            type="button"
            onClick={() => {
              setTitle(""); setDesc(""); setLocation(""); setServiceSlug(""); setConsultants([]); setSelected(new Set()); setPreview(null);
            }}
            className="rounded-md px-3 py-2 text-sm border border-white/10 bg-white/5"
          >
            Reset
          </button>
        </div>

        {preview && (
          <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3 text-xs">
            <div className="font-semibold mb-1">Payload preview</div>
            <pre className="whitespace-pre-wrap">{JSON.stringify(preview, null, 2)}</pre>
          </div>
        )}
      </section>

      <section className="min-w-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Matching consultants</h2>
          <div className="flex items-center gap-2">
            <button onClick={selectAll} disabled={consultants.length === 0} className="text-sm text-slate-300 hover:text-white">
              Select all
            </button>
            <button onClick={clearAll} disabled={selected.size === 0} className="text-sm text-slate-300 hover:text-white">
              Clear
            </button>
          </div>
        </div>

        <div className="mt-3 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {loadingConsultants ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 rounded-lg border border-white/10 bg-white/5 animate-pulse" />
            ))
          ) : consultants.length === 0 ? (
            <div className="text-sm text-slate-400">
              {serviceSlug ? "No consultants found for this service." : "Choose a service to see consultants."}
            </div>
          ) : (
            consultants.map((c) => {
              const checked = selected.has(c.id);
              return (
                <label key={c.id} className="rounded-lg border border-white/10 bg-white/5 p-3 flex gap-3 items-start cursor-pointer hover:border-white/20">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(c.id)}
                    className="mt-1 accent-sky-500"
                  />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{c.display_name || c.company}</div>
                    {c.headline && <div className="text-xs text-slate-400 truncate">{c.headline}</div>}
                    <div className="text-xs text-slate-400">
                      {[c.company, c.location].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                </label>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}