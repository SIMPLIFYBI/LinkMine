"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Apps24Regular,
  BranchFork24Regular,
  Code24Regular,
  Document24Regular,
  DocumentPdf24Regular,
  DocumentText24Regular,
  Globe24Regular,
  SlideText24Regular,
  TableSimple24Regular,
} from "@fluentui/react-icons";

const RESOURCE_FORMAT_LABELS = {
  website: "Website",
  repository: "Repository",
  excel: "Excel",
  word: "Word",
  powerpoint: "PowerPoint",
  script: "Script",
  app: "App",
  pdf: "PDF",
  generic: "Resource",
};

const RESOURCE_FORMAT_ICONS = {
  website: Globe24Regular,
  repository: BranchFork24Regular,
  excel: TableSimple24Regular,
  word: DocumentText24Regular,
  powerpoint: SlideText24Regular,
  script: Code24Regular,
  app: Apps24Regular,
  pdf: DocumentPdf24Regular,
  generic: Document24Regular,
};

const MAX_FEATURED_RESOURCES = 3;

function ResourceFormatGlyph({ format, className = "h-3.5 w-3.5" }) {
  const Icon = RESOURCE_FORMAT_ICONS[format] || RESOURCE_FORMAT_ICONS.generic;
  return <Icon aria-hidden="true" className={className} />;
}

function ResourceFormatChip({ format }) {
  const safeFormat = format || "generic";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-slate-950/30 px-2.5 py-1 text-[11px] font-semibold text-slate-100">
      <ResourceFormatGlyph format={safeFormat} />
      <span>{RESOURCE_FORMAT_LABELS[safeFormat] || RESOURCE_FORMAT_LABELS.generic}</span>
    </span>
  );
}

function Badge({ children, tone }) {
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${tone}`}>{children}</span>;
}

function statusTone(status) {
  if (["approved", "paid", "active", "available"].includes(status)) {
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
  }
  if (["pending", "draft"].includes(status)) {
    return "border-amber-400/30 bg-amber-500/10 text-amber-100";
  }
  if (["rejected", "failed", "cancelled", "disabled"].includes(status)) {
    return "border-red-400/30 bg-red-500/10 text-red-100";
  }
  return "border-cyan-400/30 bg-cyan-500/10 text-cyan-100";
}

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

async function apiSend(path, method = "GET", payload) {
  const response = await fetch(path, {
    method,
    credentials: "include",
    headers: payload ? { "content-type": "application/json" } : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.ok === false) {
    throw new Error(body?.error || `Request failed: ${response.status}`);
  }

  return body;
}

export default function MarketplaceAdminPageClient({ initialQueue = [], initialCounts = {} }) {
  const [reviewQueue, setReviewQueue] = useState(initialQueue);
  const [counts, setCounts] = useState({
    pending: Number(initialCounts.pending || initialQueue.length || 0),
    approved: Number(initialCounts.approved || 0),
    rejected: Number(initialCounts.rejected || 0),
  });
  const [busyResourceId, setBusyResourceId] = useState(null);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState({
    windowDays: 30,
    totals: {
      totalOpenEvents: 0,
      uniqueOpenersInWindow: 0,
      openEventsInWindow: 0,
    },
    leaderboard: [],
  });
  const [adminSection, setAdminSection] = useState("review");
  const [placementResources, setPlacementResources] = useState([]);
  const [placementSearch, setPlacementSearch] = useState("");
  const [selectedFeaturedIds, setSelectedFeaturedIds] = useState([]);
  const [selectedHomeBannerId, setSelectedHomeBannerId] = useState("");
  const [draggedResourceId, setDraggedResourceId] = useState("");
  const [dropTarget, setDropTarget] = useState("");
  const [loadingPlacements, setLoadingPlacements] = useState(false);
  const [savingPlacements, setSavingPlacements] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  function resetMessages() {
    setError("");
    setSuccess("");
  }

  async function refreshAnalytics({ silent = false } = {}) {
    if (!silent) {
      setLoadingAnalytics(true);
    }

    try {
      const analyticsRes = await apiSend("/api/resources/analytics?limit=8&days=30");
      setAnalytics({
        windowDays: Number(analyticsRes.windowDays || 30),
        totals: {
          totalOpenEvents: Number(analyticsRes?.totals?.totalOpenEvents || 0),
          uniqueOpenersInWindow: Number(analyticsRes?.totals?.uniqueOpenersInWindow || 0),
          openEventsInWindow: Number(analyticsRes?.totals?.openEventsInWindow || 0),
        },
        leaderboard: Array.isArray(analyticsRes.leaderboard) ? analyticsRes.leaderboard : [],
      });
      if (!silent) {
        setSuccess("Analytics refreshed.");
      }
    } catch (nextError) {
      if (!silent) {
        setError(nextError.message || "Unable to refresh analytics.");
      }
    } finally {
      if (!silent) {
        setLoadingAnalytics(false);
      }
    }
  }

  async function refreshQueue() {
    resetMessages();
    setLoadingQueue(true);

    try {
      const reviewRes = await apiSend("/api/resources/review?status=pending&view=card&limit=120");
      setReviewQueue(reviewRes.resources || []);
      setCounts((prev) => ({ ...prev, pending: Number((reviewRes.resources || []).length) }));
      setSuccess("Review queue refreshed.");
    } catch (nextError) {
      setError(nextError.message || "Unable to refresh review queue.");
    } finally {
      setLoadingQueue(false);
    }
  }

  async function refreshPlacements({ silent = false } = {}) {
    if (!silent) {
      resetMessages();
    }
    setLoadingPlacements(true);

    try {
      const placementRes = await apiSend("/api/resources/admin/placements");
      const resources = Array.isArray(placementRes.resources) ? placementRes.resources : [];
      setPlacementResources(resources);
      setSelectedFeaturedIds(resources.filter((resource) => resource.isFeatured).map((resource) => resource.id));
      setSelectedHomeBannerId(placementRes.homeBannerResourceId || "");
      if (!silent) {
        setSuccess("Placement settings refreshed.");
      }
    } catch (nextError) {
      if (!silent) {
        setError(nextError.message || "Unable to refresh placement settings.");
      }
    } finally {
      setLoadingPlacements(false);
    }
  }

  function toggleFeaturedResource(resourceId) {
    resetMessages();
    setSelectedFeaturedIds((prev) => {
      if (prev.includes(resourceId)) {
        return prev.filter((id) => id !== resourceId);
      }
      if (prev.length >= MAX_FEATURED_RESOURCES) {
        setError(`Choose up to ${MAX_FEATURED_RESOURCES} featured resources.`);
        return prev;
      }
      return [...prev, resourceId];
    });
  }

  function assignDraggedResourceToBanner() {
    if (!draggedResourceId) return;
    resetMessages();
    setSelectedHomeBannerId(draggedResourceId);
  }

  function assignDraggedResourceToFeaturedSlot(slotIndex) {
    if (!draggedResourceId) return;

    resetMessages();
    setSelectedFeaturedIds((prev) => {
      const next = [...prev];
      const existingIndex = next.indexOf(draggedResourceId);

      if (existingIndex >= 0) {
        next.splice(existingIndex, 1);
      }

      const boundedSlotIndex = Math.max(0, Math.min(slotIndex, MAX_FEATURED_RESOURCES - 1));
      next.splice(boundedSlotIndex, 0, draggedResourceId);

      return next.slice(0, MAX_FEATURED_RESOURCES);
    });
  }

  function clearFeaturedSlot(slotIndex) {
    resetMessages();
    setSelectedFeaturedIds((prev) => prev.filter((_, index) => index !== slotIndex));
  }

  function handleResourceDragStart(resourceId) {
    setDraggedResourceId(resourceId);
  }

  function handleResourceDragEnd() {
    setDraggedResourceId("");
    setDropTarget("");
  }

  function handleDropTargetEnter(targetKey) {
    setDropTarget(targetKey);
  }

  function handleDropTargetLeave(targetKey) {
    setDropTarget((current) => (current === targetKey ? "" : current));
  }

  async function savePlacements() {
    resetMessages();

    if (selectedFeaturedIds.length > MAX_FEATURED_RESOURCES) {
      setError(`Choose up to ${MAX_FEATURED_RESOURCES} featured resources.`);
      return;
    }

    setSavingPlacements(true);
    try {
      const placementRes = await apiSend("/api/resources/admin/placements", "PUT", {
        featuredResourceIds: selectedFeaturedIds,
        homeBannerResourceId: selectedHomeBannerId || null,
      });

      const resources = Array.isArray(placementRes.resources) ? placementRes.resources : [];
      setPlacementResources(resources);
      setSelectedFeaturedIds(resources.filter((resource) => resource.isFeatured).map((resource) => resource.id));
      setSelectedHomeBannerId(placementRes.homeBannerResourceId || "");
      setSuccess("Placement settings saved.");
    } catch (nextError) {
      setError(nextError.message || "Unable to save placement settings.");
    } finally {
      setSavingPlacements(false);
    }
  }

  const placementResourcesById = useMemo(() => {
    return new Map(placementResources.map((resource) => [resource.id, resource]));
  }, [placementResources]);

  const featuredSelection = useMemo(() => {
    return selectedFeaturedIds
      .map((id) => placementResourcesById.get(id))
      .filter(Boolean);
  }, [placementResourcesById, selectedFeaturedIds]);

  const filteredPlacementResources = useMemo(() => {
    const searchTerm = placementSearch.trim().toLowerCase();
    if (!searchTerm) return placementResources;

    return placementResources.filter((resource) => {
      const source = [resource.title, resource.summary, resource.slug]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return source.includes(searchTerm);
    });
  }, [placementResources, placementSearch]);

  useEffect(() => {
    void refreshAnalytics({ silent: true });
    void refreshPlacements({ silent: true });
  }, []);

  function handleReview(resource, status) {
    resetMessages();
    const rejectionNotes = status === "rejected" ? window.prompt("Add rejection notes for the submitter:", "") || "" : "";

    setBusyResourceId(resource.id);
    startTransition(async () => {
      try {
        await apiSend(`/api/resources/${resource.id}/status`, "PATCH", { status, rejectionNotes });
        setReviewQueue((prev) => prev.filter((item) => item.id !== resource.id));
        setCounts((prev) => ({
          ...prev,
          pending: Math.max(0, Number(prev.pending || 0) - 1),
          approved: status === "approved" ? Number(prev.approved || 0) + 1 : Number(prev.approved || 0),
          rejected: status === "rejected" ? Number(prev.rejected || 0) + 1 : Number(prev.rejected || 0),
        }));
        setSuccess(`Resource ${status}.`);
      } catch (nextError) {
        setError(nextError.message || `Unable to mark resource as ${status}.`);
      } finally {
        setBusyResourceId(null);
      }
    });
  }

  return (
    <main className="w-full px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Vault</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Admin Console</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">Review submissions, approve trusted resources, and keep quality standards consistent.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/vault" className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
              Back to vault
            </Link>
            {adminSection === "review" ? (
              <>
                <button
                  type="button"
                  onClick={refreshQueue}
                  disabled={loadingQueue || isPending}
                  className="rounded-full border border-sky-300/25 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingQueue ? "Refreshing..." : "Refresh queue"}
                </button>
                <button
                  type="button"
                  onClick={() => refreshAnalytics()}
                  disabled={loadingAnalytics || isPending}
                  className="rounded-full border border-cyan-300/25 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingAnalytics ? "Refreshing analytics..." : "Refresh analytics"}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => refreshPlacements()}
                  disabled={loadingPlacements || savingPlacements || isPending}
                  className="rounded-full border border-cyan-300/25 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingPlacements ? "Refreshing placements..." : "Refresh placements"}
                </button>
                <button
                  type="button"
                  onClick={savePlacements}
                  disabled={loadingPlacements || savingPlacements || isPending}
                  className="rounded-full border border-emerald-300/25 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingPlacements ? "Saving..." : "Save placements"}
                </button>
              </>
            )}
          </div>
        </div>

        <section className="rounded-[20px] border border-white/10 bg-white/[0.03] p-2 ring-1 ring-white/10">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setAdminSection("review")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${adminSection === "review" ? "bg-white text-slate-900" : "border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"}`}
            >
              Review
            </button>
            <button
              type="button"
              onClick={() => setAdminSection("placements")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${adminSection === "placements" ? "bg-white text-slate-900" : "border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"}`}
            >
              Placements
            </button>
          </div>
        </section>

        {error ? <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">{error}</div> : null}
        {success ? <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">{success}</div> : null}

        {adminSection === "review" ? (
          <>
            <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-amber-300/25 bg-amber-500/10 p-5 ring-1 ring-amber-300/20">
            <div className="text-xs uppercase tracking-[0.18em] text-amber-200/85">Pending</div>
            <div className="mt-2 text-3xl font-semibold text-amber-50">{counts.pending}</div>
            <div className="mt-1 text-sm text-amber-100/90">Waiting on admin review</div>
          </div>
          <div className="rounded-[24px] border border-emerald-300/25 bg-emerald-500/10 p-5 ring-1 ring-emerald-300/20">
            <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/85">Approved</div>
            <div className="mt-2 text-3xl font-semibold text-emerald-50">{counts.approved}</div>
            <div className="mt-1 text-sm text-emerald-100/90">Live and discoverable</div>
          </div>
          <div className="rounded-[24px] border border-red-300/25 bg-red-500/10 p-5 ring-1 ring-red-300/20">
            <div className="text-xs uppercase tracking-[0.18em] text-red-200/85">Rejected</div>
            <div className="mt-2 text-3xl font-semibold text-red-50">{counts.rejected}</div>
            <div className="mt-1 text-sm text-red-100/90">Needs fixes before approval</div>
          </div>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/10 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">Click-through analytics</h2>
              <p className="mt-1 text-sm text-slate-300">Resource opens and unique users in the last {analytics.windowDays} days.</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Total opens</div>
              <div className="mt-2 text-3xl font-semibold text-white">{analytics.totals.totalOpenEvents}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Opens (30d)</div>
              <div className="mt-2 text-3xl font-semibold text-white">{analytics.totals.openEventsInWindow}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Unique users (30d)</div>
              <div className="mt-2 text-3xl font-semibold text-white">{analytics.totals.uniqueOpenersInWindow}</div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {analytics.leaderboard.length ? (
              analytics.leaderboard.map((item) => (
                <article key={item.resourceId} className="rounded-[20px] border border-white/10 bg-slate-950/25 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">#{item.rank}</div>
                      <div className="mt-1 text-base font-semibold text-white">{item.title}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/vault/${item.resourceId}`} className="rounded-full border border-white/15 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/[0.12]">
                        Open resource
                      </Link>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">{item.totalOpens} total opens</span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">{item.uniqueOpenersInWindow} unique users ({analytics.windowDays}d)</span>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-slate-950/25 px-5 py-8 text-center text-sm text-slate-300">
                No click-through analytics yet.
              </div>
            )}
          </div>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/10 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">Submission Queue</h2>
              <p className="mt-1 text-sm text-slate-300">Pending resources are ordered by oldest submitted first.</p>
            </div>
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{reviewQueue.length} awaiting action</div>
          </div>

          <div className="mt-5 space-y-4">
            {reviewQueue.length ? (
              reviewQueue.map((resource) => {
                const itemBusy = busyResourceId === resource.id;
                return (
                  <article key={resource.id} className="rounded-[24px] border border-white/10 bg-slate-950/35 p-5 ring-1 ring-white/10">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-white">{resource.title}</h3>
                          <Badge tone={statusTone(resource.status)}>{resource.status}</Badge>
                          <ResourceFormatChip format={resource.resourceFormat} />
                        </div>
                        {resource.summary ? <p className="mt-3 text-sm leading-6 text-slate-300">{resource.summary}</p> : null}
                        <div className="mt-3 text-sm text-slate-400">Submitted {formatDate(resource.submittedAt) || formatDate(resource.createdAt) || "recently"}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/vault/${resource.id}`} className="rounded-full border border-white/15 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.1]">
                          Open
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleReview(resource, "approved")}
                          disabled={itemBusy || isPending}
                          className="rounded-full border border-emerald-300/25 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReview(resource, "rejected")}
                          disabled={itemBusy || isPending}
                          className="rounded-full border border-red-300/25 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-[24px] border border-white/10 bg-slate-950/25 px-5 py-8 text-center text-sm text-slate-300">
                No resources are waiting for review.
              </div>
            )}
          </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/10">
            <h2 className="text-base font-semibold text-white">Moderator Checklist</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li>Confirm title, summary, and category clearly match the resource content.</li>
              <li>Verify external links and documents open safely and match the submitted description.</li>
              <li>Reject with actionable notes when a pack needs quality or compliance fixes.</li>
            </ul>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/10">
            <h2 className="text-base font-semibold text-white">Admin Shortcuts</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/vault" className="rounded-full border border-white/12 bg-white/[0.05] px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.1]">
                Vault home
              </Link>
            </div>
            <p className="mt-3 text-sm text-slate-300">
              Use the vault sidebar to jump into Submit, Requests, or My Vault flows while keeping this moderation queue open in a separate tab.
            </p>
          </div>
            </section>
          </>
        ) : null}

        {adminSection === "placements" ? (
          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/10 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-white">All resources</h2>
                  <p className="mt-1 text-sm text-slate-300">Drag a resource from this list into the drop zones on the right.</p>
                </div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{placementResources.length} approved resources</div>
              </div>

              <div className="mt-4">
                <label htmlFor="placements-search" className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  Search resources
                </label>
                <input
                  id="placements-search"
                  value={placementSearch}
                  onChange={(event) => setPlacementSearch(event.target.value)}
                  placeholder="Search title, summary, or slug"
                  className="mt-2 w-full rounded-2xl border border-white/12 bg-slate-950/35 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/45"
                />
              </div>

              <div className="mt-4 max-h-[560px] space-y-3 overflow-y-auto pr-1">
                {filteredPlacementResources.length ? (
                  filteredPlacementResources.map((resource) => {
                    const isFeatured = selectedFeaturedIds.includes(resource.id);
                    const isHomeBanner = selectedHomeBannerId === resource.id;
                    const isDragging = draggedResourceId === resource.id;

                    return (
                      <article
                        key={resource.id}
                        draggable
                        onDragStart={() => handleResourceDragStart(resource.id)}
                        onDragEnd={handleResourceDragEnd}
                        className={`cursor-grab rounded-[20px] border bg-slate-950/30 p-4 active:cursor-grabbing ${isDragging ? "border-sky-300/45 ring-1 ring-sky-300/25" : "border-white/10"}`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="max-w-2xl">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-white">{resource.title}</div>
                              <ResourceFormatChip format={resource.resourceFormat} />
                            </div>
                            {resource.summary ? <p className="mt-2 text-sm text-slate-300">{resource.summary}</p> : null}
                            <div className="mt-2 text-xs text-slate-500">{resource.slug}</div>
                          </div>
                          <Link href={`/vault/${resource.id}`} className="rounded-full border border-white/15 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/[0.12]">
                            Open
                          </Link>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                          {isHomeBanner ? <span className="rounded-full border border-sky-300/35 bg-sky-500/15 px-2.5 py-1 font-semibold text-sky-100">Top banner</span> : null}
                          {isFeatured ? <span className="rounded-full border border-emerald-300/35 bg-emerald-500/15 px-2.5 py-1 font-semibold text-emerald-100">Featured lane</span> : null}
                          {!isHomeBanner && !isFeatured ? <span className="text-slate-400">Unassigned</span> : null}
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="rounded-[20px] border border-white/10 bg-slate-950/25 px-5 py-8 text-center text-sm text-slate-300">
                    No approved resources match your search.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <section className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/10">
                <h3 className="text-base font-semibold text-white">Top banner resource</h3>
                <p className="mt-1 text-sm text-slate-300">Drop one resource here to appear in the large banner on Vault Home.</p>
                <div
                  onDragOver={(event) => event.preventDefault()}
                  onDragEnter={() => handleDropTargetEnter("banner")}
                  onDragLeave={() => handleDropTargetLeave("banner")}
                  onDrop={(event) => {
                    event.preventDefault();
                    assignDraggedResourceToBanner();
                    handleResourceDragEnd();
                  }}
                  className={`mt-4 rounded-2xl border px-4 py-4 text-sm transition ${dropTarget === "banner" ? "border-sky-300/45 bg-sky-500/10 text-sky-100" : "border-white/10 bg-slate-950/25 text-slate-200"}`}
                >
                  {selectedHomeBannerId
                    ? (placementResourcesById.get(selectedHomeBannerId)?.title || "Selected resource")
                    : "Drop resource here"}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={savePlacements}
                    disabled={loadingPlacements || savingPlacements || isPending}
                    className="rounded-full border border-emerald-300/25 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingPlacements ? "Saving..." : "Save placements"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedHomeBannerId("")}
                    className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
                  >
                    Clear top banner
                  </button>
                </div>
              </section>

              <section className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/10">
                <h3 className="text-base font-semibold text-white">Featured lane slots</h3>
                <p className="mt-1 text-sm text-slate-300">Drop resources into slots 1-{MAX_FEATURED_RESOURCES} for the featured lane.</p>
                <div className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">{featuredSelection.length} / {MAX_FEATURED_RESOURCES} assigned</div>

                <div className="mt-4 space-y-2">
                  {Array.from({ length: MAX_FEATURED_RESOURCES }).map((_, index) => {
                    const resource = featuredSelection[index] || null;
                    const targetKey = `featured-${index}`;

                    return (
                      <div
                        key={targetKey}
                        onDragOver={(event) => event.preventDefault()}
                        onDragEnter={() => handleDropTargetEnter(targetKey)}
                        onDragLeave={() => handleDropTargetLeave(targetKey)}
                        onDrop={(event) => {
                          event.preventDefault();
                          assignDraggedResourceToFeaturedSlot(index);
                          handleResourceDragEnd();
                        }}
                        className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-3 transition ${dropTarget === targetKey ? "border-emerald-300/45 bg-emerald-500/10" : "border-white/10 bg-slate-950/25"}`}
                      >
                        <div>
                          <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Slot {index + 1}</div>
                          <div className="mt-1 text-sm font-semibold text-white">{resource ? resource.title : "Drop resource here"}</div>
                          {resource ? <div className="text-xs text-slate-400">{resource.slug}</div> : null}
                        </div>
                        {resource ? (
                          <button
                            type="button"
                            onClick={() => clearFeaturedSlot(index)}
                            className="rounded-full border border-red-300/25 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-100 transition hover:bg-red-500/15"
                          >
                            Clear
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

