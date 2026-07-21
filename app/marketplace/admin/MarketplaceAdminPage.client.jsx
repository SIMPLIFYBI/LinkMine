"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  function resetMessages() {
    setError("");
    setSuccess("");
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
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Marketplace</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Admin Console</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">Review submissions, approve trusted resources, and keep quality standards consistent.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/marketplace" className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
              Back to marketplace
            </Link>
            <button
              type="button"
              onClick={refreshQueue}
              disabled={loadingQueue || isPending}
              className="rounded-full border border-sky-300/25 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingQueue ? "Refreshing..." : "Refresh queue"}
            </button>
          </div>
        </div>

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

        {error ? <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">{error}</div> : null}
        {success ? <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">{success}</div> : null}

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
                        <Link href={`/marketplace/${resource.id}`} className="rounded-full border border-white/15 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.1]">
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
              <Link href="/marketplace" className="rounded-full border border-white/12 bg-white/[0.05] px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.1]">
                Marketplace home
              </Link>
            </div>
            <p className="mt-3 text-sm text-slate-300">
              Use the marketplace sidebar to jump into Submit, Requests, or My Account flows while keeping this moderation queue open in a separate tab.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
