"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { authedFetch } from "@/lib/authedFetch";

export default function ConsultantServicesManager({ consultantId, canEdit = false }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [assigned, setAssigned] = useState([]);      // [{ id, name, slug }]
  const [categories, setCategories] = useState([]);  // [{ id, name, services: [{ id, name, slug }] }]

  const assignedIds = useMemo(() => new Set(assigned.map(s => s.id)), [assigned]);

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return (categories || [])
      .map(c => ({
        ...c,
        services: (c.services || []).filter(s =>
          s.name?.toLowerCase().includes(q) || s.slug?.toLowerCase().includes(q)
        ),
      }))
      .filter(c => (c.services || []).length > 0);
  }, [categories, query]);

  async function fetchJson(input, init) {
    const res = await authedFetch(input, init);
    const text = await res.text().catch(() => "");
    let json = {};
    try { json = text ? JSON.parse(text) : {}; } catch {}
    return { res, json };
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [a, b] = await Promise.all([
          fetchJson(`/api/consultants/${consultantId}/services`, { cache: "no-store" }),
          fetchJson(`/api/directory`, { cache: "no-store" }),
        ]);
        if (!cancelled) {
          setAssigned(a.json?.services || []);
          setCategories(b.json?.categories || []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [consultantId]);

  async function addService(id) {
    if (!canEdit || assignedIds.has(id)) return;
    const res = await authedFetch(`/api/consultants/${consultantId}/services`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ add: [id] }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) return alert(json.error || "Failed to add");
    const svc = categories.flatMap(c => c.services || []).find(s => s.id === id);
    if (svc && !assignedIds.has(id)) setAssigned(prev => [...prev, svc]);
  }

  async function removeService(id) {
    if (!canEdit) return;
    const res = await authedFetch(`/api/consultants/${consultantId}/services`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ remove: [id] }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) return alert(json.error || "Failed to remove");
    setAssigned(prev => prev.filter(s => s.id !== id));
  }

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Services</h2>
        {canEdit && (
          <button
            onClick={() => setOpen(true)}
            className="rounded-md bg-gradient-to-r from-sky-600 to-indigo-600 px-3 py-1.5 text-sm font-medium"
          >
            Manage services
          </button>
        )}
      </div>

      {/* Assigned chips (always visible) */}
      <div className="mt-3 flex flex-wrap gap-2">
        {assigned.length === 0 ? (
          <div className="text-sm text-slate-400">No services listed.</div>
        ) : (
          assigned.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs"
            >
              <Link href={`/consultants?service=${encodeURIComponent(s.slug)}`} className="hover:underline">
                {s.name}
              </Link>
              {canEdit && (
                <button
                  onClick={() => removeService(s.id)}
                  className="text-slate-400 hover:text-white"
                  title="Remove"
                >
                  ×
                </button>
              )}
            </span>
          ))
        )}
      </div>

      {/* Modal picker */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full md:max-w-3xl bg-slate-900/95 border border-white/10 ring-1 ring-white/10 rounded-t-2xl md:rounded-2xl shadow-2xl text-slate-100">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h3 className="text-base font-semibold">Select services</h3>
              <button onClick={() => setOpen(false)} className="text-slate-300 hover:text-white">
                ✕
              </button>
            </div>

            <div className="px-4 py-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search services…"
                className="w-full rounded-md bg-slate-900/60 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
              />

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[60vh] overflow-auto pr-1">
                {loading ? (
                  <div className="text-sm text-slate-400">Loading…</div>
                ) : filteredCategories.length === 0 ? (
                  <div className="text-sm text-slate-400">No matches.</div>
                ) : (
                  filteredCategories.map((cat) => (
                    <div key={cat.id} className="min-w-0">
                      <div className="text-xs uppercase tracking-wide text-slate-400 mb-1.5">{cat.name}</div>
                      <ul className="space-y-1">
                        {(cat.services || []).map((s) => {
                          const selected = assignedIds.has(s.id);
                          return (
                            <li key={s.id}>
                              <button
                                disabled={selected || saving}
                                onClick={() => addService(s.id)}
                                className={`w-full text-left rounded-md px-2 py-1.5 text-sm ${
                                  selected
                                    ? "text-slate-400 bg-white/5 cursor-not-allowed"
                                    : "text-slate-200 hover:bg-white/5 hover:text-white"
                                }`}
                              >
                                {s.name}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:border-white/20 hover:bg-white/10"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}