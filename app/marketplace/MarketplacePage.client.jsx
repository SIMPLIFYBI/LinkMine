"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useAuth } from "@/app/components/AuthProvider";
import { formatResourceBytes } from "@/lib/resourceHub";

const DEFAULT_RESOURCE_FORM = {
  title: "",
  categoryId: "",
  resourceType: "hosted",
  summary: "",
  description: "",
  sourceName: "",
  sourceUrl: "",
  licenseName: "",
  licenseUrl: "",
  tagIds: [],
  submitForReview: false,
};

const DEFAULT_REQUEST_FORM = {
  title: "",
  specifications: "",
  bountyCents: "",
};

const DEFAULT_PAYOUT_FORM = {
  provider: "stripe_connect",
  providerAccountId: "",
  countryCode: "AU",
  currencyCode: "AUD",
};

async function readJson(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error || body?.message || "Request failed.");
  }
  return body;
}

async function apiGet(path) {
  const response = await fetch(path, { cache: "no-store" });
  return readJson(response);
}

async function apiSend(path, method, payload, isFormData = false) {
  const response = await fetch(path, {
    method,
    headers: isFormData ? undefined : { "Content-Type": "application/json" },
    body: payload == null ? undefined : isFormData ? payload : JSON.stringify(payload),
  });
  return readJson(response);
}

function formatMoney(cents, currencyCode = "AUD") {
  const amount = Number(cents || 0) / 100;
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: currencyCode || "AUD",
    maximumFractionDigits: 0,
  }).format(amount);
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

function statusTone(status) {
  if (status === "approved" || status === "paid" || status === "active" || status === "available") {
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
  }
  if (status === "pending" || status === "draft") {
    return "border-amber-400/30 bg-amber-500/10 text-amber-100";
  }
  if (status === "rejected" || status === "failed" || status === "cancelled" || status === "disabled") {
    return "border-red-400/30 bg-red-500/10 text-red-100";
  }
  return "border-cyan-400/30 bg-cyan-500/10 text-cyan-100";
}

function TabButton({ active, label, hint, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group rounded-full border px-4 py-3 text-left transition",
        active
          ? "border-sky-300/40 bg-white text-slate-950 shadow-[0_20px_45px_-32px_rgba(255,255,255,0.95)]"
          : "border-white/10 bg-white/[0.05] text-slate-300 hover:border-white/20 hover:bg-white/[0.1] hover:text-white",
      ].join(" ")}
    >
      <div className="text-sm font-semibold">{label}</div>
      <div className={`mt-1 text-xs ${active ? "text-slate-600" : "text-slate-400 group-hover:text-slate-300"}`}>{hint}</div>
    </button>
  );
}

function MarketplaceNavIcon({ name, active }) {
  const stroke = active ? "currentColor" : "rgba(148,163,184,0.95)";

  if (name === "discover") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7" fill="none" stroke={stroke} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M6.5 10.5V20h11V10.5" />
      </svg>
    );
  }

  if (name === "submit") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7" fill="none" stroke={stroke} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="5" width="16" height="14" rx="2.5" />
        <path d="M8 9h8" />
        <path d="M8 13h5" />
        <path d="M15.5 15.5v-4" />
        <path d="M13.5 13.5h4" />
      </svg>
    );
  }

  if (name === "requests") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7" fill="none" stroke={stroke} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 8h10" />
        <path d="M7 12h7" />
        <path d="M7 16h6" />
        <path d="M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-4 3v-5H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      </svg>
    );
  }

  if (name === "review") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7" fill="none" stroke={stroke} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 12 2 2 4-5" />
        <path d="M12 3l7 3v5c0 5-3.4 8.4-7 10-3.6-1.6-7-5-7-10V6l7-3Z" />
      </svg>
    );
  }

  if (name === "library") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7" fill="none" stroke={stroke} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5.5 5.5h3v13h-3z" />
        <path d="M10.5 4.5h3v14h-3z" />
        <path d="m16.5 6 2.5-.5 1.5 12.5-2.5.5z" />
      </svg>
    );
  }

  if (name === "orders") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7" fill="none" stroke={stroke} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7.5h16" />
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="M7 15h4" />
        <path d="M15 15h2" />
      </svg>
    );
  }

  if (name === "payouts") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7" fill="none" stroke={stroke} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18" />
        <path d="M16 7.5c0-1.7-1.8-3-4-3s-4 1.3-4 3 1.8 3 4 3 4 1.3 4 3-1.8 3-4 3-4-1.3-4-3" />
      </svg>
    );
  }

  return null;
}

function SidebarTabButton({ active, label, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group relative flex w-full flex-col items-center justify-center gap-2 rounded-[18px] border px-2 py-3 text-center transition",
        active
          ? "border-slate-200/80 bg-white text-sky-600 shadow-[0_18px_45px_-34px_rgba(255,255,255,0.95)]"
          : "border-transparent bg-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.05] hover:text-white",
      ].join(" ")}
    >
      <span
        className={[
          "absolute left-0 top-1/2 h-10 w-1 -translate-y-1/2 rounded-full transition",
          active ? "bg-sky-500 opacity-100" : "bg-transparent opacity-0 group-hover:opacity-40",
        ].join(" ")}
      />
      <span className={["flex h-12 w-12 items-center justify-center rounded-2xl border transition", active ? "border-sky-100 bg-sky-50" : "border-white/10 bg-white/[0.04] group-hover:border-white/20 group-hover:bg-white/[0.08]"].join(" ")}>
        <MarketplaceNavIcon name={icon} active={active} />
      </span>
      <span className={`text-[11px] font-medium leading-4 ${active ? "text-slate-700" : "text-slate-400 group-hover:text-slate-200"}`}>{label}</span>
    </button>
  );
}

function SectionCard({ title, subtitle, actions, children }) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.035))] shadow-[0_30px_80px_-44px_rgba(0,0,0,0.75)] backdrop-blur-sm ring-1 ring-white/10">
      <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <div className="text-lg font-semibold text-white">{title}</div>
          {subtitle ? <div className="mt-1 text-sm text-slate-300">{subtitle}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

function StoreStat({ label, value, accent }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.08] p-5 backdrop-blur-sm">
      <div className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</div>
      <div className="mt-3 flex items-end gap-2">
        <div className="text-3xl font-semibold text-white">{value}</div>
        <div className={`mb-1 h-2 w-16 rounded-full ${accent}`} />
      </div>
    </div>
  );
}

function Badge({ children, tone }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${tone}`}>
      {children}
    </span>
  );
}

function EmptyState({ title, body }) {
  return (
    <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] px-5 py-8 text-sm text-slate-300">
      <div className="font-semibold text-white">{title}</div>
      <div className="mt-2 max-w-2xl text-slate-400">{body}</div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-slate-200">{label}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function TextInput(props) {
  return <input {...props} className={`w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/40 focus:ring-2 focus:ring-sky-500/30 ${props.className || ""}`} />;
}

function TextArea(props) {
  return <textarea {...props} className={`w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/40 focus:ring-2 focus:ring-sky-500/30 ${props.className || ""}`} />;
}

function Select(props) {
  return <select {...props} className={`w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/40 focus:ring-2 focus:ring-sky-500/30 ${props.className || ""}`} />;
}

function ResourceCard({ resource, onSubmitForReview, onArchive, actionLabel = "View details" }) {
  const accessLabel = resource.resourceType === "external" ? (resource.sourceName || "External source") : "Hosted pack";
  const priceLabel = resource.priceCents > 0 ? formatMoney(resource.priceCents, resource.currencyCode) : "Free";
  const detailHref = `/marketplace/${resource.id}`;

  return (
    <article className="min-h-[188px] overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] shadow-[0_18px_48px_-38px_rgba(0,0,0,0.85)] ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_26px_70px_-42px_rgba(0,0,0,0.95)]">
      <div className="relative flex h-full flex-col justify-between p-4 sm:p-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={statusTone(resource.status)}>{resource.status}</Badge>
                <Badge tone="border-white/10 bg-white/[0.08] text-slate-100">{resource.resourceType}</Badge>
              </div>
              {resource.category?.name ? <div className="mt-3 text-[11px] uppercase tracking-[0.22em] text-slate-400">{resource.category.name}</div> : null}
              <Link href={detailHref} className="mt-3 block truncate text-base font-semibold text-white transition hover:text-sky-100 sm:text-lg">
                {resource.title}
              </Link>
              <p className="mt-2 line-clamp-2 text-sm text-slate-400">{resource.summary || accessLabel}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/35 px-3 py-2 text-right">
              <div className="text-sm font-semibold text-white">{priceLabel}</div>
              <div className="mt-1 text-[11px] text-slate-400">{resource.downloadCount || 0} downloads</div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-end justify-between gap-3">
          <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
            {(resource.tags || []).slice(0, 2).map((tag) => (
              <span key={tag.id} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                {tag.name}
              </span>
            ))}
          </div>
            <Link href={detailHref} className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-slate-100">
            {actionLabel}
            </Link>
        </div>

          {(resource.status === "draft" || onArchive) ? (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
              {resource.status === "draft" ? (
                <button
                  type="button"
                  onClick={() => onSubmitForReview(resource)}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/[0.08]"
                >
                  Submit for review
                </button>
              ) : null}
              {onArchive ? (
                <button
                  type="button"
                  onClick={() => onArchive(resource)}
                  className="rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-100 transition hover:bg-red-500/15"
                >
                  Archive
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
    </article>
  );
}

export default function MarketplacePageClient() {
  const { session, loading: authLoading, authError } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [canCreateResources, setCanCreateResources] = useState(false);
  const [createResourceRequirementMessage, setCreateResourceRequirementMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("discover");
  const [busyAction, startBusyAction] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [resources, setResources] = useState([]);
  const [myResources, setMyResources] = useState([]);
  const [library, setLibrary] = useState([]);
  const [requests, setRequests] = useState([]);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payoutAccount, setPayoutAccount] = useState(null);
  const [payoutLedger, setPayoutLedger] = useState([]);

  const [resourceForm, setResourceForm] = useState(DEFAULT_RESOURCE_FORM);
  const [requestForm, setRequestForm] = useState(DEFAULT_REQUEST_FORM);
  const [payoutForm, setPayoutForm] = useState(DEFAULT_PAYOUT_FORM);
  const [resourceFile, setResourceFile] = useState(null);
  const [discoverFilter, setDiscoverFilter] = useState({ type: "", categoryId: "" });

  async function loadAll(currentSession) {
    if (!currentSession) return;
    setLoading(true);
    setError("");
    try {
      const [
        categoriesRes,
        tagsRes,
        resourcesRes,
        mineRes,
        libraryRes,
        requestsRes,
        ordersRes,
        payoutAccountRes,
        payoutLedgerRes,
        reviewRes,
      ] = await Promise.all([
        apiGet("/api/resources/categories"),
        apiGet("/api/resources/tags"),
        apiGet("/api/resources"),
        apiGet("/api/resources?mine=1"),
        apiGet("/api/resources/library"),
        apiGet("/api/resources/requests"),
        apiGet("/api/resources/orders"),
        apiGet("/api/resources/payout-account"),
        apiGet("/api/resources/payouts/ledger"),
        apiGet("/api/resources/review?status=pending").catch(() => ({ resources: [] })),
      ]);

      setCategories(categoriesRes.categories || []);
      setTags(tagsRes.tags || []);
      setResources(resourcesRes.resources || []);
      setMyResources(mineRes.resources || []);
      setLibrary(libraryRes.resources || []);
      setRequests(requestsRes.requests || []);
      setOrders(ordersRes.orders || []);
      setPayoutAccount(payoutAccountRes.payoutAccount || null);
      setPayoutLedger(payoutLedgerRes.ledger || []);
      setReviewQueue(reviewRes.resources || []);
    } catch (nextError) {
      setError(nextError.message || "Unable to load marketplace data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    function clearMarketplaceState() {
      setIsAdmin(false);
      setCanCreateResources(false);
      setCreateResourceRequirementMessage("");
      setResources([]);
      setMyResources([]);
      setLibrary([]);
      setRequests([]);
      setOrders([]);
      setPayoutAccount(null);
      setPayoutLedger([]);
      setReviewQueue([]);
    }

    async function syncMarketplace() {
      setCanCreateResources(Boolean(resourcesRes.canCreateResources));
      setCreateResourceRequirementMessage(resourcesRes.createResourceRequirementMessage || "");
      if (authLoading) return;

      if (!session) {
        if (!mounted) return;
        clearMarketplaceState();
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const adminCheck = await fetch("/api/resources/review?status=pending", { cache: "no-store" });
        if (!mounted) return;
        setIsAdmin(adminCheck.ok);
        await loadAll(session);
      } catch (nextError) {
        if (!mounted) return;
        setError(nextError.message || "Unable to load marketplace data.");
        setLoading(false);
      }
    }

    syncMarketplace();

    return () => {
      mounted = false;
    };
  }, [authLoading, session]);

  useEffect(() => {
    if (payoutAccount) {
      setPayoutForm({
        provider: payoutAccount.provider || "stripe_connect",
        providerAccountId: payoutAccount.providerAccountId || "",
        countryCode: payoutAccount.countryCode || "AU",
        currencyCode: payoutAccount.currencyCode || "AUD",
      });
    }
  }, [payoutAccount]);

  const discoverResources = useMemo(() => {
    return resources.filter((resource) => {
      if (discoverFilter.type && resource.resourceType !== discoverFilter.type) return false;
      if (discoverFilter.categoryId && resource.categoryId !== discoverFilter.categoryId) return false;
      return true;
    });
  }, [discoverFilter, resources]);

  const featuredResources = useMemo(() => discoverResources.slice(0, 3), [discoverResources]);

  const trendingResources = useMemo(() => {
    return [...discoverResources]
      .sort((left, right) => (Number(right.downloadCount || 0) - Number(left.downloadCount || 0)) || right.updatedAt?.localeCompare?.(left.updatedAt || "") || 0)
      .slice(0, 4);
  }, [discoverResources]);

  const tabs = useMemo(() => {
    const baseTabs = [
      { key: "discover", label: "Home", hint: "Browse approved hosted packs and external sources.", icon: "discover", group: "primary" },
      { key: "submit", label: "Submit", hint: "Create hosted or external listings and send them for review.", icon: "submit", group: "primary" },
      { key: "requests", label: "Requests", hint: "Track industry requests and bounty opportunities.", icon: "requests", group: "primary" },
      { key: "library", label: "Library", hint: "See resources you own or have access to.", icon: "library", group: "secondary" },
      { key: "orders", label: "Orders", hint: "Review draft and settled marketplace orders.", icon: "orders", group: "secondary" },
      { key: "payouts", label: "Payouts", hint: "Manage payout account details and seller ledger entries.", icon: "payouts", group: "secondary" },
    ];
    if (isAdmin) {
      baseTabs.splice(3, 0, { key: "review", label: "Review", hint: "Approve or reject pending marketplace submissions.", icon: "review", group: "primary" });
    }
    return baseTabs;
  }, [isAdmin]);

  const primaryTabs = useMemo(() => tabs.filter((tab) => tab.group === "primary"), [tabs]);
  const secondaryTabs = useMemo(() => tabs.filter((tab) => tab.group === "secondary"), [tabs]);

  const categoryHighlights = useMemo(() => {
    return categories
      .map((category) => ({
        ...category,
        count: resources.filter((resource) => resource.categoryId === category.id).length,
      }))
      .filter((category) => category.count > 0)
      .sort((left, right) => right.count - left.count)
      .slice(0, 6);
  }, [categories, resources]);

  async function refreshAll() {
    if (session) {
      await loadAll(session);
    }
  }

  function resetMessages() {
    setError("");
    setSuccess("");
  }

  async function handleAccess(resource) {
    resetMessages();
    try {
      const body = await apiSend(`/api/resources/${resource.id}/access`, "POST");
      const targetUrl = body.signedUrl || body.sourceUrl;
      if (!targetUrl) throw new Error("No access URL returned.");
      window.open(targetUrl, "_blank", "noopener,noreferrer");
      if (activeTab === "discover" || activeTab === "library") {
        await refreshAll();
      }
    } catch (nextError) {
      setError(nextError.message || "Unable to open resource.");
    }
  }

  function toggleTag(tagId) {
    setResourceForm((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId],
    }));
  }

  async function handleResourceSubmit(event) {
    event.preventDefault();
    resetMessages();

    if (!canCreateResources) {
      setError(createResourceRequirementMessage || "You need an approved consultant or service provider profile before you can publish marketplace resources.");
      return;
    }

    if (!resourceForm.title.trim()) {
      setError("Title is required.");
      return;
    }

    if (resourceForm.resourceType === "external" && !resourceForm.sourceUrl.trim()) {
      setError("External resources require a source URL.");
      return;
    }

    if (resourceForm.resourceType === "hosted" && resourceForm.submitForReview && !resourceFile) {
      setError("Hosted resources need a pack upload before they can be sent for review.");
      return;
    }

    startBusyAction(async () => {
      try {
        const createResult = await apiSend("/api/resources", "POST", {
          resource: {
            title: resourceForm.title,
            categoryId: resourceForm.categoryId || null,
            resourceType: resourceForm.resourceType,
            summary: resourceForm.summary,
            description: resourceForm.description,
            sourceName: resourceForm.sourceName,
            sourceUrl: resourceForm.sourceUrl,
            licenseName: resourceForm.licenseName,
            licenseUrl: resourceForm.licenseUrl,
            tagIds: resourceForm.tagIds,
            status: resourceForm.submitForReview ? "pending" : "draft",
          },
        });

        if (resourceForm.resourceType === "hosted" && resourceFile) {
          const form = new FormData();
          form.append("file", resourceFile);
          await apiSend(`/api/resources/${createResult.resource.id}/upload`, "POST", form, true);
        }

        setResourceForm(DEFAULT_RESOURCE_FORM);
        setResourceFile(null);
        setSuccess("Marketplace resource created.");
        await refreshAll();
        setActiveTab("library");
      } catch (nextError) {
        setError(nextError.message || "Unable to create resource.");
      }
    });
  }

  async function handleSubmitForReview(resource) {
    resetMessages();
    startBusyAction(async () => {
      try {
        await apiSend(`/api/resources/${resource.id}`, "PATCH", { resource: { status: "pending" } });
        setSuccess("Resource submitted for review.");
        await refreshAll();
      } catch (nextError) {
        setError(nextError.message || "Unable to submit resource for review.");
      }
    });
  }

  async function handleArchive(resource) {
    resetMessages();
    startBusyAction(async () => {
      try {
        await apiSend(`/api/resources/${resource.id}`, "DELETE");
        setSuccess("Resource archived.");
        await refreshAll();
      } catch (nextError) {
        setError(nextError.message || "Unable to archive resource.");
      }
    });
  }

  async function handleReview(resource, status) {
    resetMessages();
    const rejectionNotes = status === "rejected" ? window.prompt("Add rejection notes for the submitter:", "") || "" : "";
    startBusyAction(async () => {
      try {
        await apiSend(`/api/resources/${resource.id}/status`, "PATCH", { status, rejectionNotes });
        setSuccess(`Resource ${status}.`);
        await refreshAll();
      } catch (nextError) {
        setError(nextError.message || `Unable to mark resource as ${status}.`);
      }
    });
  }

  async function handleRequestSubmit(event) {
    event.preventDefault();
    resetMessages();
    if (!requestForm.title.trim() || !requestForm.specifications.trim()) {
      setError("Request title and specifications are required.");
      return;
    }

    startBusyAction(async () => {
      try {
        await apiSend("/api/resources/requests", "POST", {
          title: requestForm.title,
          specifications: requestForm.specifications,
          bountyCents: requestForm.bountyCents ? Math.round(Number(requestForm.bountyCents) * 100) : 0,
        });
        setRequestForm(DEFAULT_REQUEST_FORM);
        setSuccess("Resource request created.");
        await refreshAll();
      } catch (nextError) {
        setError(nextError.message || "Unable to create request.");
      }
    });
  }

  async function updateRequestStatus(requestId, status) {
    resetMessages();
    startBusyAction(async () => {
      try {
        await apiSend(`/api/resources/requests/${requestId}`, "PATCH", { status });
        setSuccess(`Request updated to ${status}.`);
        await refreshAll();
      } catch (nextError) {
        setError(nextError.message || "Unable to update request.");
      }
    });
  }

  async function handleCreateOrder(resource) {
    resetMessages();
    startBusyAction(async () => {
      try {
        const result = await apiSend("/api/resources/orders", "POST", { resourceIds: [resource.id] });
        setSuccess(result.order.totalCents > 0 ? "Order draft created." : "Free order completed and access granted.");
        await refreshAll();
        setActiveTab("orders");
      } catch (nextError) {
        setError(nextError.message || "Unable to create order.");
      }
    });
  }

  async function handleOrderStatus(orderId, status) {
    resetMessages();
    startBusyAction(async () => {
      try {
        await apiSend(`/api/resources/orders/${orderId}`, "PATCH", { status, paymentProvider: "manual" });
        setSuccess(`Order marked ${status}.`);
        await refreshAll();
      } catch (nextError) {
        setError(nextError.message || `Unable to mark order ${status}.`);
      }
    });
  }

  async function handleSavePayoutAccount(event) {
    event.preventDefault();
    resetMessages();

    startBusyAction(async () => {
      try {
        await apiSend("/api/resources/payout-account", "PUT", payoutForm);
        setSuccess("Payout account saved.");
        await refreshAll();
      } catch (nextError) {
        setError(nextError.message || "Unable to save payout account.");
      }
    });
  }

  if (!session && !loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.035))] shadow-[0_32px_90px_-48px_rgba(0,0,0,0.85)] ring-1 ring-white/10 sm:p-0">
          <div className="grid gap-6 px-6 py-8 sm:px-8 lg:grid-cols-[1.4fr,0.9fr] lg:px-10 lg:py-10">
            <div>
              <div className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">Marketplace</div>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Browse industry tools, templates, packs, and external references in a cleaner store-style library.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                Sign in to access approved resources, submit files for review, and manage the resources connected to your account.
              </p>
              {authError ? <div className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">{authError}</div> : null}
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/login?redirect=%2Fmarketplace" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
                  Sign in
                </Link>
                <Link href="/signup?redirect=%2Fmarketplace" className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
                  Create account
                </Link>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <StoreStat label="Discovery" value="Browse" accent="bg-sky-400" />
              <StoreStat label="Access" value="Secure" accent="bg-emerald-400" />
              <StoreStat label="Workflow" value="Submit" accent="bg-cyan-300" />
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="w-full px-0 py-0 lg:min-h-[calc(100vh-8rem)]">
      <div className="lg:flex lg:items-start">
        <aside className="hidden lg:block lg:w-24 lg:flex-none xl:w-28">
          <div className="sticky top-[88px] flex h-[calc(100vh-104px)] flex-col border-r border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(15,23,42,0.9))] px-3 py-5 shadow-[20px_0_60px_-45px_rgba(0,0,0,0.9)]">
            <div className="flex justify-center pb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-white/10 bg-white/[0.06] text-xs font-semibold uppercase tracking-[0.2em] text-white">
                LM
              </div>
            </div>

            <div className="space-y-2 border-t border-white/10 pt-5">
              {primaryTabs.map((tab) => (
                <SidebarTabButton
                  key={tab.key}
                  active={tab.key === activeTab}
                  label={tab.label}
                  icon={tab.icon}
                  onClick={() => setActiveTab(tab.key)}
                />
              ))}
            </div>

            <div className="mt-auto space-y-2 border-t border-white/10 pt-5">
              {secondaryTabs.map((tab) => (
                <SidebarTabButton
                  key={tab.key}
                  active={tab.key === activeTab}
                  label={tab.label}
                  icon={tab.icon}
                  onClick={() => setActiveTab(tab.key)}
                />
              ))}
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
          <div className="overflow-x-auto pb-1 lg:hidden">
            <div className="flex min-w-max gap-3">
              {tabs.map((tab) => (
                <TabButton
                  key={tab.key}
                  active={tab.key === activeTab}
                  label={tab.label}
                  hint={tab.hint}
                  onClick={() => setActiveTab(tab.key)}
                />
              ))}
            </div>
          </div>

          <div className="mt-5 min-w-0 lg:mt-0">
          {error ? <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">{error}</div> : null}
          {authError && session ? <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">{authError}</div> : null}
          {success ? <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">{success}</div> : null}
          {loading ? <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-6 text-sm text-slate-300">Loading marketplace data...</div> : null}

          <div className="space-y-6">
        {activeTab === "discover" ? (
          <>
            <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr),340px]">
              <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.3),rgba(15,23,42,0.94)_38%,rgba(255,255,255,0.03)_100%)] px-6 py-6 shadow-[0_24px_70px_-46px_rgba(56,189,248,0.55)] ring-1 ring-white/10">
                <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-300">Featured</div>
                <div className="mt-4 text-2xl font-semibold text-white">Marketplace picks for mining teams, planners, and field workflows.</div>
                <div className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                  Browse promoted packs, trusted external references, and practical templates from the right-hand storefront while the left rail keeps the workspace navigation fixed.
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {featuredResources.length ? featuredResources.map((resource) => (
                    <div key={resource.id} className="rounded-[24px] border border-white/10 bg-white/[0.06] p-4 ring-1 ring-white/10">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-white">{resource.title}</div>
                          <div className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">{resource.category?.name || resource.resourceType}</div>
                        </div>
                        <Badge tone={statusTone(resource.status)}>{resource.status}</Badge>
                      </div>
                      <div className="mt-3 text-sm leading-6 text-slate-300">{resource.summary || "Open the resource to view the full pack or source details."}</div>
                    </div>
                  )) : (
                    <div className="md:col-span-3 rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] px-5 py-6 text-sm text-slate-300">
                      Featured resources will appear here once approved items are available.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <section className="rounded-[28px] border border-white/10 bg-white/[0.05] px-5 py-5 ring-1 ring-white/10">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Trending</div>
                  <div className="mt-4 space-y-3">
                    {trendingResources.length ? trendingResources.map((resource, index) => (
                      <div key={resource.id} className="rounded-[20px] border border-white/10 bg-slate-950/35 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-xs uppercase tracking-[0.18em] text-sky-300">#{index + 1}</div>
                            <div className="mt-1 text-sm font-semibold text-white">{resource.title}</div>
                          </div>
                          <div className="text-right text-xs text-slate-400">{resource.downloadCount || 0} downloads</div>
                        </div>
                      </div>
                    )) : <div className="text-sm text-slate-400">Trending resources will appear once usage data builds up.</div>}
                  </div>
                </section>

                <section className="rounded-[28px] border border-white/10 bg-white/[0.05] px-5 py-5 ring-1 ring-white/10">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Categories</div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    {categoryHighlights.length ? categoryHighlights.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setDiscoverFilter((prev) => ({ ...prev, categoryId: category.id }))}
                        className="rounded-[20px] border border-white/10 bg-slate-950/35 px-4 py-3 text-left transition hover:border-white/20 hover:bg-white/[0.08]"
                      >
                        <div className="text-sm font-semibold text-white">{category.name}</div>
                        <div className="mt-1 text-xs text-slate-400">{category.count} resources</div>
                      </button>
                    )) : <div className="text-sm text-slate-400">Categories will populate here once resources are approved.</div>}
                  </div>
                </section>
              </div>
            </section>

            <SectionCard
              title="Discover resources"
              subtitle="Approved hosted packs and curated external industry sources."
              actions={
                <>
                  <Select value={discoverFilter.type} onChange={(event) => setDiscoverFilter((prev) => ({ ...prev, type: event.target.value }))} className="min-w-[160px]">
                    <option value="">All access types</option>
                    <option value="hosted">Hosted</option>
                    <option value="external">External</option>
                  </Select>
                  <Select value={discoverFilter.categoryId} onChange={(event) => setDiscoverFilter((prev) => ({ ...prev, categoryId: event.target.value }))} className="min-w-[180px]">
                    <option value="">All categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </Select>
                </>
              }
            >
              {discoverResources.length ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  {discoverResources.map((resource) => (
                    <div key={resource.id}>
                      <ResourceCard resource={resource} />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No resources match this filter." body="Adjust the type or category filter, or start the collection by creating your first hosted or external listing." />
              )}
            </SectionCard>
          </>
        ) : null}

        {activeTab === "submit" ? (
          <SectionCard title="Create a marketplace resource" subtitle="Submit a hosted pack or an external listing. Hosted packs can stay draft until the file is uploaded.">
            {canCreateResources ? (
              <form className="grid gap-5 lg:grid-cols-[1.2fr,0.8fr]" onSubmit={handleResourceSubmit}>
                <div className="space-y-5">
                  <Field label="Title">
                    <TextInput value={resourceForm.title} onChange={(event) => setResourceForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="Open pit drill and blast sign-off pack" required />
                  </Field>
                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Category">
                      <Select value={resourceForm.categoryId} onChange={(event) => setResourceForm((prev) => ({ ...prev, categoryId: event.target.value }))}>
                        <option value="">Select category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Resource type">
                      <Select value={resourceForm.resourceType} onChange={(event) => setResourceForm((prev) => ({ ...prev, resourceType: event.target.value }))}>
                        <option value="hosted">Hosted pack</option>
                        <option value="external">External source</option>
                      </Select>
                    </Field>
                  </div>
                  <Field label="Summary">
                    <TextArea rows={3} value={resourceForm.summary} onChange={(event) => setResourceForm((prev) => ({ ...prev, summary: event.target.value }))} placeholder="Explain the practical use of this file pack or source." />
                  </Field>
                  <Field label="Description">
                    <TextArea rows={6} value={resourceForm.description} onChange={(event) => setResourceForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="Add context, expected use, assumptions, and what a downloader should know before opening the files." />
                  </Field>
                  {resourceForm.resourceType === "external" ? (
                    <div className="grid gap-5 md:grid-cols-2">
                      <Field label="Source name">
                        <TextInput value={resourceForm.sourceName} onChange={(event) => setResourceForm((prev) => ({ ...prev, sourceName: event.target.value }))} placeholder="Queensland Government open data" />
                      </Field>
                      <Field label="Source URL">
                        <TextInput value={resourceForm.sourceUrl} onChange={(event) => setResourceForm((prev) => ({ ...prev, sourceUrl: event.target.value }))} placeholder="https://..." />
                      </Field>
                    </div>
                  ) : (
                    <Field label="Hosted pack upload" hint="ZIP, PDF, Office docs, text, and JSON are supported in this first pass.">
                      <input
                        type="file"
                        onChange={(event) => setResourceFile(event.target.files?.[0] || null)}
                        className="block w-full rounded-2xl border border-dashed border-white/15 bg-slate-950/60 px-4 py-4 text-sm text-slate-300"
                      />
                    </Field>
                  )}
                </div>

                <div className="space-y-5">
                  <Field label="License name">
                    <TextInput value={resourceForm.licenseName} onChange={(event) => setResourceForm((prev) => ({ ...prev, licenseName: event.target.value }))} placeholder="Internal use only" />
                  </Field>
                  <Field label="License URL">
                    <TextInput value={resourceForm.licenseUrl} onChange={(event) => setResourceForm((prev) => ({ ...prev, licenseUrl: event.target.value }))} placeholder="https://..." />
                  </Field>
                  <Field label="Tags" hint="Pick a few tags so people can discover the resource more easily.">
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => {
                        const active = resourceForm.tagIds.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleTag(tag.id)}
                            className={[
                              "rounded-full border px-3 py-2 text-xs font-semibold transition",
                              active
                                ? "border-sky-300/30 bg-sky-500/12 text-sky-100"
                                : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06]",
                            ].join(" ")}
                          >
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                  <label className="flex items-start gap-3 rounded-[24px] border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={resourceForm.submitForReview}
                      onChange={(event) => setResourceForm((prev) => ({ ...prev, submitForReview: event.target.checked }))}
                      className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950/70 text-sky-500"
                    />
                    <span>
                      <span className="block font-semibold text-white">Send this resource for review immediately</span>
                      <span className="mt-1 block text-slate-400">Hosted resources need a file upload before they can move into review.</span>
                    </span>
                  </label>
                  <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(56,189,248,0.08),rgba(15,23,42,0.58))] p-4 text-sm text-slate-300">
                    <div className="font-semibold text-white">Launch limits currently applied</div>
                    <div className="mt-2">10 active hosted resources, 25 MB max hosted pack size, and 250 MB total hosted storage per user.</div>
                  </div>
                  <button
                    type="submit"
                    disabled={busyAction}
                    className="w-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:from-sky-400 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busyAction ? "Saving resource..." : "Create resource"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="rounded-[28px] border border-amber-400/20 bg-[linear-gradient(180deg,rgba(245,158,11,0.12),rgba(15,23,42,0.6))] p-6 text-sm text-slate-300 ring-1 ring-amber-300/10">
                <div className="text-lg font-semibold text-white">Marketplace publishing is currently limited to approved service providers</div>
                <p className="mt-3 max-w-2xl leading-7 text-slate-300">
                  {createResourceRequirementMessage || "You need an approved consultant or service provider profile before you can publish marketplace resources."}
                </p>
                <div className="mt-5">
                  <Link href="/account?tab=consultants" className="inline-flex rounded-full border border-white/10 bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
                    Set up my service provider profile
                  </Link>
                </div>
              </div>
            )}

            <div className="mt-8">
              <div className="mb-4 text-sm font-semibold text-white">My resources</div>
              {myResources.length ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  {myResources.map((resource) => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      onSubmitForReview={handleSubmitForReview}
                      onArchive={handleArchive}
                      actionLabel="View details"
                    />
                  ))}
                </div>
              ) : (
                <EmptyState title="No managed resources yet." body="Create a hosted pack or an external listing to start building your marketplace presence." />
              )}
            </div>
          </SectionCard>
        ) : null}

        {activeTab === "library" ? (
          <SectionCard title="My library" subtitle="Resources you own, bought, or received through free and request-based access.">
            {library.length ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {library.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            ) : (
              <EmptyState title="Your library is empty." body="Free resources and future paid resources will appear here once you gain access." />
            )}
          </SectionCard>
        ) : null}

        {activeTab === "requests" ? (
          <SectionCard title="Resource requests" subtitle="Track open requests, claims, and completed fulfilment paths.">
            <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
              <form className="space-y-4 rounded-[26px] border border-white/10 bg-white/[0.03] p-5" onSubmit={handleRequestSubmit}>
                <Field label="Request title">
                  <TextInput value={requestForm.title} onChange={(event) => setRequestForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="Queensland open pit drill pattern spreadsheet" />
                </Field>
                <Field label="Specifications">
                  <TextArea rows={6} value={requestForm.specifications} onChange={(event) => setRequestForm((prev) => ({ ...prev, specifications: event.target.value }))} placeholder="Describe the required file, intended workflow, expected format, and any constraints." />
                </Field>
                <Field label="Bounty amount" hint="Optional. Stored as cents on the backend.">
                  <TextInput value={requestForm.bountyCents} onChange={(event) => setRequestForm((prev) => ({ ...prev, bountyCents: event.target.value }))} placeholder="0" type="number" min="0" step="1" />
                </Field>
                <button type="submit" disabled={busyAction} className="w-full rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50">
                  Create request
                </button>
              </form>
              <div className="space-y-4">
                {requests.length ? requests.map((request) => (
                  <article key={request.id} className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/10">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-white">{request.title}</h3>
                          <Badge tone={statusTone(request.status)}>{request.status}</Badge>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-300">{request.specifications}</p>
                      </div>
                      <div className="text-right text-sm text-slate-400">
                        <div>{request.bountyCents > 0 ? formatMoney(request.bountyCents, request.currencyCode) : "No bounty yet"}</div>
                        <div className="mt-1">{formatDate(request.createdAt) || "Recently"}</div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {request.status === "open" ? (
                        <button type="button" onClick={() => updateRequestStatus(request.id, "claimed")} className="rounded-full border border-sky-300/25 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/15">
                          Claim request
                        </button>
                      ) : null}
                      {request.status === "claimed" ? (
                        <button type="button" onClick={() => updateRequestStatus(request.id, "completed")} className="rounded-full border border-emerald-300/25 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15">
                          Mark completed
                        </button>
                      ) : null}
                      {(request.status === "open" || request.status === "claimed") ? (
                        <button type="button" onClick={() => updateRequestStatus(request.id, "cancelled")} className="rounded-full border border-red-300/25 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/15">
                          Cancel
                        </button>
                      ) : null}
                    </div>
                  </article>
                )) : <EmptyState title="No requests yet." body="Use requests to seed the marketplace with practical file demand before creators publish the finished asset." />}
              </div>
            </div>
          </SectionCard>
        ) : null}

        {activeTab === "review" && isAdmin ? (
          <SectionCard title="Admin review queue" subtitle="Approve or reject pending resource submissions.">
            {reviewQueue.length ? (
              <div className="space-y-4">
                {reviewQueue.map((resource) => (
                  <article key={resource.id} className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/10">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-white">{resource.title}</h3>
                          <Badge tone={statusTone(resource.status)}>{resource.status}</Badge>
                          <Badge tone="border-white/10 bg-white/[0.06] text-slate-200">{resource.resourceType}</Badge>
                        </div>
                        {resource.summary ? <p className="mt-3 text-sm leading-6 text-slate-300">{resource.summary}</p> : null}
                        <div className="mt-3 text-sm text-slate-400">Submitted {formatDate(resource.submittedAt) || formatDate(resource.createdAt) || "recently"}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => handleReview(resource, "approved")} className="rounded-full border border-emerald-300/25 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15">
                          Approve
                        </button>
                        <button type="button" onClick={() => handleReview(resource, "rejected")} className="rounded-full border border-red-300/25 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/15">
                          Reject
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState title="No resources are waiting for review." body="Once contributors submit hosted or external resources for approval, they will appear here." />
            )}
          </SectionCard>
        ) : null}

        {activeTab === "orders" ? (
          <SectionCard title="Orders" subtitle="Track free completions now and manual payment state changes before live checkout exists.">
            {orders.length ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <article key={order.id} className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/10">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-white">Order {order.id.slice(0, 8)}</h3>
                          <Badge tone={statusTone(order.status)}>{order.status}</Badge>
                        </div>
                        <div className="mt-3 space-y-2 text-sm text-slate-300">
                          {order.items.map((item) => (
                            <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                              <div className="font-medium text-white">{item.resource?.title || "Resource"}</div>
                              <div className="mt-1 text-slate-400">{formatMoney(item.lineTotalCents, item.currencyCode)} · seller net {formatMoney(item.sellerNetCents, item.currencyCode)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="min-w-[220px] rounded-[24px] border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
                        <div className="flex items-center justify-between"><span>Total</span><span className="font-semibold text-white">{formatMoney(order.totalCents, order.currencyCode)}</span></div>
                        <div className="mt-2 flex items-center justify-between"><span>Platform fee</span><span>{formatMoney(order.platformFeeCents, order.currencyCode)}</span></div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {isAdmin && order.status !== "paid" ? (
                            <button type="button" onClick={() => handleOrderStatus(order.id, "paid")} className="rounded-full border border-emerald-300/25 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15">
                              Mark paid
                            </button>
                          ) : null}
                          {order.status === "draft" || order.status === "pending" ? (
                            <button type="button" onClick={() => handleOrderStatus(order.id, "cancelled")} className="rounded-full border border-red-300/25 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/15">
                              Cancel
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState title="No orders yet." body="Paid flows are scaffolded, and free resources can already issue zero-dollar orders where needed." />
            )}
          </SectionCard>
        ) : null}

        {activeTab === "payouts" ? (
          <SectionCard title="Payout readiness" subtitle="Store seller payout account details and inspect the ledger created by manual paid order settlement.">
            <div className="grid gap-6 lg:grid-cols-[0.85fr,1.15fr]">
              <form className="space-y-4 rounded-[26px] border border-white/10 bg-white/[0.03] p-5" onSubmit={handleSavePayoutAccount}>
                <Field label="Provider">
                  <TextInput value={payoutForm.provider} onChange={(event) => setPayoutForm((prev) => ({ ...prev, provider: event.target.value }))} />
                </Field>
                <Field label="Provider account id">
                  <TextInput value={payoutForm.providerAccountId} onChange={(event) => setPayoutForm((prev) => ({ ...prev, providerAccountId: event.target.value }))} placeholder="acct_..." />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Country code">
                    <TextInput value={payoutForm.countryCode} onChange={(event) => setPayoutForm((prev) => ({ ...prev, countryCode: event.target.value.toUpperCase() }))} maxLength={2} />
                  </Field>
                  <Field label="Currency">
                    <TextInput value={payoutForm.currencyCode} onChange={(event) => setPayoutForm((prev) => ({ ...prev, currencyCode: event.target.value.toUpperCase() }))} maxLength={3} />
                  </Field>
                </div>
                <button type="submit" disabled={busyAction} className="w-full rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50">
                  Save payout account
                </button>
                {payoutAccount ? <div className="rounded-[22px] border border-emerald-300/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">Current status: {payoutAccount.status}</div> : null}
              </form>
              <div>
                {payoutLedger.length ? (
                  <div className="space-y-4">
                    {payoutLedger.map((entry) => (
                      <article key={entry.id} className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/10">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-base font-semibold text-white">{entry.entryType}</div>
                              <Badge tone={statusTone(entry.status)}>{entry.status}</Badge>
                            </div>
                            <div className="mt-3 text-sm text-slate-400">Available {formatDate(entry.availableAt) || "when settled"}</div>
                          </div>
                          <div className="text-right text-sm text-slate-300">
                            <div className="font-semibold text-white">{formatMoney(entry.netCents, entry.currencyCode)}</div>
                            <div className="mt-1">Gross {formatMoney(entry.grossCents, entry.currencyCode)}</div>
                            <div className="mt-1">Fee {formatMoney(entry.platformFeeCents, entry.currencyCode)}</div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No payout ledger entries yet." body="When paid orders are manually marked settled, seller earnings will appear here and can later feed a live payout system." />
                )}
              </div>
            </div>
          </SectionCard>
        ) : null}
      </div>
        </div>
      </div>
      </div>
    </main>
  );
}
