"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { authedFetch } from "@/lib/authedFetch";

function marketLabel(value) {
  return value === "oil_gas" ? "Oil & Gas" : "Mining";
}

function marketQueryValue(value) {
  return value === "oil_gas" ? "oil-gas" : "mining";
}

export default function ConsultantServicesManager({ consultantId, canEdit = false }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [activeMarket, setActiveMarket] = useState("mining");
  const [assigned, setAssigned] = useState([]);      // [{ id, name, slug, market }]
  const [categoriesByMarket, setCategoriesByMarket] = useState({ mining: [], oil_gas: [] });

  const assignedIds = useMemo(() => new Set(assigned.map(s => s.id)), [assigned]);
  const categories = categoriesByMarket[activeMarket] || [];

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
        const [a, miningDirectory, oilGasDirectory] = await Promise.all([
          fetchJson(`/api/consultants/${consultantId}/services`, { cache: "no-store" }),
          fetchJson(`/api/directory?market=mining`, { cache: "no-store" }),
          fetchJson(`/api/directory?market=oil-gas`, { cache: "no-store" }),
        ]);
        if (!cancelled) {
          const assignedServices = a.json?.services || [];
          setAssigned(assignedServices);
          setCategoriesByMarket({
            mining: miningDirectory.json?.categories || [],
            oil_gas: oilGasDirectory.json?.categories || [],
          });
          if (assignedServices.some((service) => service.market === "oil_gas") && !assignedServices.some((service) => service.market !== "oil_gas")) {
            setActiveMarket("oil_gas");
          }
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
    const svc = Object.values(categoriesByMarket).flatMap((marketCategories) =>
      (marketCategories || []).flatMap(c => c.services || [])
    ).find(s => s.id === id);
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
              <Link href={`/consultants?market=${marketQueryValue(s.market)}&service=${encodeURIComponent(s.slug)}`} className="hover:underline">
                {s.name}
              </Link>
              <span className="text-slate-500">· {marketLabel(s.market)}</span>
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
              <div className="mb-3 inline-flex rounded-full border border-white/15 bg-slate-950/60 p-1">
                {["mining", "oil_gas"].map((market) => {
                  const active = market === activeMarket;
                  return (
                    <button
                      key={market}
                      type="button"
                      onClick={() => setActiveMarket(market)}
                      className={[
                        "rounded-full px-4 py-2 text-xs font-semibold transition",
                        active
                          ? market === "oil_gas"
                            ? "bg-amber-400 text-slate-950"
                            : "bg-sky-400 text-slate-950"
                          : "text-slate-300 hover:bg-white/10 hover:text-white",
                      ].join(" ")}
                    >
                      {marketLabel(market)}
                    </button>
                  );
                })}
              </div>

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${marketLabel(activeMarket)} services…`}
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
                                className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm ${
                                  selected
                                    ? "text-slate-400 bg-white/5 cursor-not-allowed"
                                    : "text-slate-200 hover:bg-white/5 hover:text-white"
                                }`}
                              >
                                <span className="min-w-0 truncate">{s.name}</span>
                                {selected && (
                                  <span className="inline-flex items-center gap-1 text-emerald-300" aria-label="Already added">
                                    <span aria-hidden="true">✓</span>
                                  </span>
                                )}
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