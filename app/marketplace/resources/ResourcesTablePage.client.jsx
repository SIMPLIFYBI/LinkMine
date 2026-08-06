"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const SORTABLE_COLUMNS = [
  { key: "title", label: "Title" },
  { key: "download_count", label: "Downloads" },
  { key: "updated_at", label: "Updated" },
  { key: "created_at", label: "Created" },
];

const RESOURCE_TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "hosted", label: "Hosted" },
  { value: "external", label: "External" },
];

const PAGE_SIZE_OPTIONS = [25, 50, 100];

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatNumber(value) {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed)) return "0";
  return parsed.toLocaleString("en-AU");
}

function toDisplayLabel(value, fallback = "-") {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  return raw
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function typeTheme(type) {
  const normalized = String(type || "").toLowerCase();
  if (normalized === "hosted") {
    return {
      accent: "from-sky-400/28 via-cyan-300/20 to-sky-400/8",
      pill: "border-sky-300/45 bg-sky-400/18 text-sky-100",
    };
  }

  if (normalized === "external") {
    return {
      accent: "from-emerald-400/28 via-teal-300/18 to-emerald-400/8",
      pill: "border-emerald-300/45 bg-emerald-400/18 text-emerald-100",
    };
  }

  return {
    accent: "from-violet-400/22 via-indigo-300/16 to-violet-400/8",
    pill: "border-violet-300/35 bg-violet-400/15 text-violet-100",
  };
}

function classNames(parts) {
  return parts.filter(Boolean).join(" ");
}

async function readJson(response) {
  const raw = await response.text();
  let body = {};
  if (raw) {
    try {
      body = JSON.parse(raw);
    } catch {
      body = {};
    }
  }

  if (!response.ok) {
    throw new Error(body?.error || body?.message || raw || "Request failed.");
  }

  return body;
}

export default function ResourcesTablePageClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [resources, setResources] = useState([]);
  const [paging, setPaging] = useState({ page: 1, limit: 25, hasMore: false });

  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({
    q: "",
    type: "",
    categoryId: "",
    sortBy: "updated_at",
    sortDir: "desc",
    page: 1,
    limit: 25,
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setFilters((prev) => ({ ...prev, q: searchInput.trim(), page: 1 }));
    }, 240);
    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        params.set("page", String(filters.page));
        params.set("limit", String(filters.limit));
        params.set("sortBy", filters.sortBy);
        params.set("sortDir", filters.sortDir);
        if (filters.type) params.set("type", filters.type);
        if (filters.categoryId) params.set("categoryId", filters.categoryId);
        if (filters.q) params.set("q", filters.q);

        const [categoriesRes, resourcesRes] = await Promise.all([
          fetch("/api/resources/categories", { cache: "no-store", signal: controller.signal }).then(readJson),
          fetch(`/api/resources?${params.toString()}`, { cache: "no-store", signal: controller.signal }).then(readJson),
        ]);

        setCategories(categoriesRes.categories || []);
        setResources(resourcesRes.resources || []);
        setPaging(resourcesRes.paging || { page: filters.page, limit: filters.limit, hasMore: false });
      } catch (nextError) {
        if (nextError?.name === "AbortError") return;
        setError(nextError.message || "Unable to load resources.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    return () => controller.abort();
  }, [filters]);

  const categoryOptions = useMemo(() => {
    const sorted = [...categories].sort((left, right) => String(left?.name || "").localeCompare(String(right?.name || "")));
    return [{ id: "", name: "All categories" }, ...sorted];
  }, [categories]);

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }

  function toggleSort(columnKey) {
    setFilters((prev) => {
      const same = prev.sortBy === columnKey;
      const nextDir = same ? (prev.sortDir === "asc" ? "desc" : "asc") : "desc";
      return {
        ...prev,
        sortBy: columnKey,
        sortDir: nextDir,
        page: 1,
      };
    });
  }

  function nextPage() {
    if (!paging.hasMore) return;
    setFilters((prev) => ({ ...prev, page: prev.page + 1 }));
  }

  function prevPage() {
    if (filters.page <= 1) return;
    setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }));
  }

  return (
    <main className="w-full px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="relative overflow-hidden rounded-[32px] border border-white/12 bg-[linear-gradient(140deg,rgba(10,20,38,0.95),rgba(15,31,53,0.92)_45%,rgba(8,47,73,0.78))] px-6 py-6 shadow-[0_42px_120px_-72px_rgba(2,6,23,0.95)] ring-1 ring-white/10 sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-14 -left-14 h-52 w-52 rounded-full bg-sky-500/20 blur-3xl" />

          <div className="relative z-10 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-slate-300/90">Marketplace Index</div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">View All Resources</h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-200/85">
                A high-speed index of marketplace resources with powerful filters, server-side sorting, and pagination.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/marketplace"
                className="rounded-full border border-white/20 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.12]"
              >
                Back to marketplace
              </Link>
            </div>
          </div>
        </div>

        <section className="rounded-[28px] border border-white/10 bg-slate-950/45 p-4 ring-1 ring-white/10 sm:p-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <label className="xl:col-span-2">
              <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-400">Search</span>
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Title, summary, description"
                className="h-10 w-full rounded-xl border border-white/12 bg-slate-950/55 px-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-sky-300/45 focus:ring-2 focus:ring-sky-400/20"
              />
            </label>

            <label>
              <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-400">Type</span>
              <select
                value={filters.type}
                onChange={(event) => updateFilter("type", event.target.value)}
                className="h-10 w-full rounded-xl border border-white/12 bg-slate-950/55 px-3 text-sm text-white outline-none transition focus:border-sky-300/45 focus:ring-2 focus:ring-sky-400/20"
              >
                {RESOURCE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value || "all"} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-400">Category</span>
              <select
                value={filters.categoryId}
                onChange={(event) => updateFilter("categoryId", event.target.value)}
                className="h-10 w-full rounded-xl border border-white/12 bg-slate-950/55 px-3 text-sm text-white outline-none transition focus:border-sky-300/45 focus:ring-2 focus:ring-sky-400/20"
              >
                {categoryOptions.map((category) => (
                  <option key={category.id || "all"} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-slate-400">Rows</span>
              <select
                value={filters.limit}
                onChange={(event) => updateFilter("limit", Number(event.target.value) || 25)}
                className="h-10 w-full rounded-xl border border-white/12 bg-slate-950/55 px-3 text-sm text-white outline-none transition focus:border-sky-300/45 focus:ring-2 focus:ring-sky-400/20"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>{size} / page</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/45 px-3 py-2.5">
              <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Sort by</span>
              {SORTABLE_COLUMNS.map((column) => {
                const active = filters.sortBy === column.key;
                const arrow = active ? (filters.sortDir === "asc" ? "↑" : "↓") : "↕";
                return (
                  <button
                    key={column.key}
                    type="button"
                    onClick={() => toggleSort(column.key)}
                    className={classNames([
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                      active
                        ? "border-sky-300/50 bg-sky-400/18 text-sky-100"
                        : "border-white/14 bg-white/[0.04] text-slate-300 hover:border-white/28 hover:bg-white/[0.1] hover:text-white",
                    ])}
                  >
                    <span>{column.label}</span>
                    <span className="text-[11px]">{arrow}</span>
                  </button>
                );
              })}
            </div>

            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-12 text-center text-sm text-slate-300">Loading resources...</div>
            ) : error ? (
              <div className="rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-12 text-center text-sm text-red-100">{error}</div>
            ) : resources.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-12 text-center text-sm text-slate-300">No resources matched your filters.</div>
            ) : (
              <div className="grid gap-3 sm:gap-4">
                {resources.map((resource) => {
                  const theme = typeTheme(resource.resourceType);
                  const summary = String(resource.summary || resource.description || "").trim();

                  return (
                    <article
                      key={resource.id}
                      className="group relative overflow-hidden rounded-[22px] border border-white/12 bg-[linear-gradient(145deg,rgba(15,23,42,0.92),rgba(17,24,39,0.88)_45%,rgba(3,13,30,0.9))] p-[1px] shadow-[0_24px_68px_-44px_rgba(2,6,23,0.9)] transition hover:-translate-y-0.5 hover:border-white/24 hover:shadow-[0_34px_86px_-44px_rgba(14,165,233,0.45)]"
                    >
                      <div className={classNames([
                        "pointer-events-none absolute inset-0 bg-gradient-to-r opacity-80",
                        theme.accent,
                      ])} />
                      <div className="relative rounded-[21px] bg-slate-950/78 p-4 sm:p-5">
                        <div
                          aria-hidden
                          className="pointer-events-none absolute inset-0 opacity-45"
                          style={{
                            backgroundImage:
                              "linear-gradient(120deg,rgba(255,255,255,0.06),transparent 42%), repeating-linear-gradient(0deg,rgba(148,163,184,0.07) 0px, rgba(148,163,184,0.07) 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg,rgba(148,163,184,0.05) 0px, rgba(148,163,184,0.05) 1px, transparent 1px, transparent 20px)",
                          }}
                        />
                        <div
                          aria-hidden
                          className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full border border-white/10 bg-white/[0.04] blur-2xl"
                        />
                        <div
                          aria-hidden
                          className="pointer-events-none absolute -left-10 bottom-[-58px] h-36 w-36 rounded-full border border-white/10 bg-white/[0.03] blur-2xl"
                        />

                        <div className="relative z-10">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                <span className={classNames([
                                  "rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                                  theme.pill,
                                ])}>
                                  {toDisplayLabel(resource.resourceType, "Unknown")}
                                </span>
                                <span className="rounded-full border border-white/14 bg-white/[0.05] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-200">
                                  {toDisplayLabel(resource.resourceFormat, "Generic")}
                                </span>
                                <span className="rounded-full border border-white/14 bg-white/[0.05] px-2.5 py-1 text-[11px] text-slate-300">
                                  {resource.category?.name || "Uncategorized"}
                                </span>
                              </div>

                              <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">{resource.title || "Untitled resource"}</h2>
                              <p className="mt-2 text-sm leading-6 text-slate-300/90">
                                {summary || "Open this resource to view full details, attachments, and usage guidance."}
                              </p>
                            </div>

                            <Link
                              href={`/marketplace/${resource.id}`}
                              className="inline-flex items-center rounded-full border border-white/18 bg-white/[0.08] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:border-sky-200/45 hover:bg-sky-400/20"
                            >
                              Open resource
                            </Link>
                          </div>

                          <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
                            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
                              <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Downloads</div>
                              <div className="mt-1 text-base font-semibold text-white">{formatNumber(resource.downloadCount)}</div>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
                              <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Updated</div>
                              <div className="mt-1 text-sm font-semibold text-slate-100">{formatDate(resource.updatedAt)}</div>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
                              <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Created</div>
                              <div className="mt-1 text-sm font-semibold text-slate-100">{formatDate(resource.createdAt)}</div>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
                              <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Resource ID</div>
                              <div className="mt-1 truncate text-xs font-semibold text-slate-200">{resource.id}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
              Page {filters.page} • {resources.length} shown
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prevPage}
                disabled={filters.page <= 1 || loading}
                className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={nextPage}
                disabled={!paging.hasMore || loading}
                className="rounded-full border border-sky-300/30 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/18 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
