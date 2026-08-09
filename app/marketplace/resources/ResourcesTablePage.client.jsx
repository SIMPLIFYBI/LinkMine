"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/components/AuthProvider";

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

function categoryTheme(resource) {
  const normalizedType = String(resource?.resourceType || "").toLowerCase();
  const categoryKey = String(resource?.category?.id || resource?.category?.name || "uncategorized");
  const seed = hashSeed(categoryKey);
  const typeHueShift = normalizedType === "hosted" ? 0 : normalizedType === "external" ? 28 : -20;
  const hue = (seed + typeHueShift) % 360;
  const hueMid = (hue + 28) % 360;
  const hueEnd = (hue + 58) % 360;

  return {
    categorySeed: seed,
    hue,
    hueMid,
    hueEnd,
    accent: `linear-gradient(90deg, hsla(${hue}, 90%, 62%, 0.28), hsla(${hueMid}, 86%, 56%, 0.2) 46%, hsla(${hueEnd}, 82%, 54%, 0.08))`,
    pillStyle: {
      borderColor: `hsla(${hue}, 86%, 72%, 0.52)`,
      backgroundColor: `hsla(${hueMid}, 76%, 52%, 0.2)`,
      color: `hsla(${hue}, 100%, 93%, 0.98)`,
    },
    glow: `hsla(${hueMid}, 84%, 58%, 0.16)`,
    contour: `hsla(${hueEnd}, 78%, 70%, 0.2)`,
    motif: seed % 5,
  };
}

function classNames(parts) {
  return parts.filter(Boolean).join(" ");
}

function hashSeed(value) {
  const source = String(value || "resource");
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = ((hash << 5) - hash + source.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

function cardArtwork(resource, theme) {
  const seed = theme.categorySeed ?? hashSeed(resource?.category?.id || resource?.category?.name || "resource");
  const angle = 132 + (seed % 18) - 9;
  const bendA = 18 + (seed % 20);
  const bendB = 58 + (seed % 22);
  const motif =
    theme.motif === 0
      ? "linear-gradient(116deg, transparent 26%, rgba(255,255,255,0.08) 26%, rgba(255,255,255,0.08) 35%, transparent 35%, transparent 64%, rgba(255,255,255,0.07) 64%, rgba(255,255,255,0.07) 73%, transparent 73%)"
      : theme.motif === 1
        ? "radial-gradient(circle at 18% 20%, rgba(255,255,255,0.11) 0%, transparent 36%), radial-gradient(circle at 82% 74%, rgba(255,255,255,0.1) 0%, transparent 34%)"
        : theme.motif === 2
          ? "conic-gradient(from 210deg at 18% 82%, rgba(255,255,255,0.12), transparent 22%, rgba(255,255,255,0.08) 34%, transparent 54%, rgba(255,255,255,0.06) 72%, transparent 100%)"
          : theme.motif === 3
            ? "linear-gradient(140deg, transparent 24%, rgba(255,255,255,0.08) 24%, rgba(255,255,255,0.08) 32%, transparent 32%, transparent 68%, rgba(255,255,255,0.07) 68%, rgba(255,255,255,0.07) 76%, transparent 76%)"
            : "radial-gradient(72% 68% at 82% 18%, rgba(255,255,255,0.12) 0%, transparent 58%), linear-gradient(132deg, transparent 0%, transparent 58%, rgba(255,255,255,0.07) 58%, rgba(255,255,255,0.07) 76%, transparent 76%)";

  return {
    panel: `linear-gradient(${angle}deg, hsla(${theme.hue}, 30%, 18%, 0.9), hsla(${theme.hueMid}, 28%, 14%, 0.9) 52%, hsla(${theme.hueEnd}, 34%, 11%, 0.93))`,
    strata: `linear-gradient(${angle + 20}deg, transparent ${bendA}%, rgba(255,255,255,0.07) ${bendA}%, rgba(255,255,255,0.07) ${bendA + 8}%, transparent ${bendA + 8}%, transparent ${bendB}%, rgba(255,255,255,0.06) ${bendB}%, rgba(255,255,255,0.06) ${bendB + 7}%, transparent ${bendB + 7}%)`,
    contour: `radial-gradient(140% 92% at 10% 0%, ${theme.contour} 0%, transparent 62%), radial-gradient(130% 88% at 92% 100%, ${theme.contour} 0%, transparent 58%)`,
    motif,
  };
}

function cardVariantClasses(theme) {
  switch (theme.motif) {
    case 0:
      return {
        outer: "rounded-[28px] border-white/16 hover:border-white/28 hover:shadow-[0_34px_86px_-44px_rgba(244,114,182,0.46)]",
        inner: "rounded-[27px]",
        cta: "rounded-full border-white/18 bg-white/[0.08] hover:border-pink-200/50 hover:bg-pink-400/20",
      };
    case 1:
      return {
        outer: "rounded-[14px] border-white/18 hover:border-white/30 hover:shadow-[0_34px_86px_-44px_rgba(16,185,129,0.46)]",
        inner: "rounded-[13px]",
        cta: "rounded-md border-emerald-200/30 bg-emerald-400/14 hover:border-emerald-200/55 hover:bg-emerald-300/20",
      };
    case 2:
      return {
        outer: "rounded-[24px] border-white/14 hover:border-white/24 hover:shadow-[0_34px_86px_-44px_rgba(14,165,233,0.5)]",
        inner: "rounded-[23px]",
        cta: "rounded-[10px] border-sky-200/30 bg-sky-400/14 hover:border-sky-200/55 hover:bg-sky-300/22",
      };
    case 3:
      return {
        outer: "rounded-[20px] border-white/20 hover:border-white/35 hover:shadow-[0_34px_86px_-44px_rgba(245,158,11,0.5)]",
        inner: "rounded-[19px]",
        cta: "rounded-full border-amber-200/30 bg-amber-400/14 hover:border-amber-200/55 hover:bg-amber-300/22",
      };
    default:
      return {
        outer: "rounded-[32px] border-white/16 hover:border-white/30 hover:shadow-[0_34px_86px_-44px_rgba(168,85,247,0.5)]",
        inner: "rounded-[31px]",
        cta: "rounded-[14px] border-violet-200/30 bg-violet-400/14 hover:border-violet-200/55 hover:bg-violet-300/22",
      };
  }
}

function CategoryDecor({ theme }) {
  switch (theme.motif) {
    case 0:
      return (
        <>
          <div aria-hidden className="pointer-events-none absolute -right-8 top-4 h-24 w-56 rotate-[-14deg] rounded-[18px] border border-white/12 bg-white/[0.02]" />
          <div aria-hidden className="pointer-events-none absolute left-[-6%] top-[58%] h-14 w-44 rotate-[8deg] rounded-[12px] border border-white/8 bg-slate-900/20" />
        </>
      );
    case 1:
      return (
        <>
          <div aria-hidden className="pointer-events-none absolute right-6 top-5 h-20 w-20 rounded-full border border-white/18" />
          <div aria-hidden className="pointer-events-none absolute right-10 top-9 h-12 w-12 rounded-full border border-white/16" />
          <div aria-hidden className="pointer-events-none absolute left-3 bottom-3 h-8 w-24 border border-white/10 bg-white/[0.02]" style={{ clipPath: "polygon(8% 0%,100% 0%,92% 100%,0% 100%)" }} />
        </>
      );
    case 2:
      return (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute right-6 top-4 h-24 w-24 border border-white/12 bg-white/[0.02]"
            style={{ clipPath: "polygon(25% 8%,75% 8%,92% 50%,75% 92%,25% 92%,8% 50%)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute left-4 bottom-4 h-14 w-14 border border-white/10 bg-white/[0.02]"
            style={{ clipPath: "polygon(22% 8%,78% 8%,92% 50%,78% 92%,22% 92%,8% 50%)" }}
          />
        </>
      );
    case 3:
      return (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-45"
            style={{ backgroundImage: "radial-gradient(140% 90% at 20% 100%, rgba(255,255,255,0.1), transparent 56%), radial-gradient(120% 82% at 74% 100%, rgba(255,255,255,0.08), transparent 58%)" }}
          />
          <div aria-hidden className="pointer-events-none absolute right-5 bottom-4 h-10 w-32 border border-white/10 bg-white/[0.02]" style={{ clipPath: "polygon(10% 0%,100% 0%,90% 100%,0% 100%)" }} />
        </>
      );
    default:
      return (
        <>
          <div aria-hidden className="pointer-events-none absolute right-6 top-5 h-24 w-8 border border-white/10 bg-white/[0.02]" style={{ clipPath: "polygon(28% 0%,100% 0%,72% 100%,0% 100%)" }} />
          <div aria-hidden className="pointer-events-none absolute right-18 top-9 h-18 w-6 border border-white/8 bg-white/[0.02]" style={{ clipPath: "polygon(28% 0%,100% 0%,72% 100%,0% 100%)" }} />
          <div aria-hidden className="pointer-events-none absolute right-28 top-14 h-12 w-5 border border-white/8 bg-white/[0.015]" style={{ clipPath: "polygon(28% 0%,100% 0%,72% 100%,0% 100%)" }} />
        </>
      );
  }
}

function MobileSidebarTabButton({ active, label, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition",
        active
          ? "border-sky-300/45 bg-white text-slate-950 shadow-[0_14px_34px_-22px_rgba(255,255,255,0.85)]"
          : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.08] hover:text-white",
      ].join(" ")}
    >
      {icon ? (
        <span className="inline-flex h-4.5 w-4.5 items-center justify-center">
          <MarketplaceNavIcon name={icon} active={active} />
        </span>
      ) : null}
      <span className="text-[13px] font-semibold leading-none">{label}</span>
    </button>
  );
}

function MarketplaceNavIcon({ name, active }) {
  const stroke = active ? "currentColor" : "rgba(148,163,184,0.95)";

  if (name === "discover") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke={stroke} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M6.5 10.5V20h11V10.5" />
      </svg>
    );
  }

  if (name === "submit") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke={stroke} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
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
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke={stroke} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 8h10" />
        <path d="M7 12h7" />
        <path d="M7 16h6" />
        <path d="M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-4 3v-5H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      </svg>
    );
  }

  if (name === "review") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke={stroke} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 12 2 2 4-5" />
        <path d="M12 3l7 3v5c0 5-3.4 8.4-7 10-3.6-1.6-7-5-7-10V6l7-3Z" />
      </svg>
    );
  }

  if (name === "library") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke={stroke} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5.5 5.5h3v13h-3z" />
        <path d="M10.5 4.5h3v14h-3z" />
        <path d="m16.5 6 2.5-.5 1.5 12.5-2.5.5z" />
      </svg>
    );
  }

  if (name === "orders") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke={stroke} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7.5h16" />
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="M7 15h4" />
        <path d="M15 15h2" />
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
        "group relative flex w-full flex-col items-center justify-center gap-1 rounded-[15px] border px-1 py-2 text-center transition",
        active
          ? "border-slate-200/80 bg-white text-sky-600 shadow-[0_18px_45px_-34px_rgba(255,255,255,0.95)]"
          : "border-transparent bg-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.05] hover:text-white",
      ].join(" ")}
    >
      <span
        className={[
          "absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full transition",
          active ? "bg-sky-500 opacity-100" : "bg-transparent opacity-0 group-hover:opacity-40",
        ].join(" ")}
      />
      <span className={["flex h-9 w-9 items-center justify-center rounded-[13px] border transition", active ? "border-sky-100 bg-sky-50" : "border-white/10 bg-white/[0.04] group-hover:border-white/20 group-hover:bg-white/[0.08]"].join(" ")}>
        <MarketplaceNavIcon name={icon} active={active} />
      </span>
      <span className={`text-[9px] font-medium leading-[1.05] ${active ? "text-slate-700" : "text-slate-400 group-hover:text-slate-200"}`}>{label}</span>
    </button>
  );
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
  const { session } = useAuth();
  const signedIn = Boolean(session);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
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
    let cancelled = false;

    async function syncAdminStatus() {
      if (!signedIn) {
        setIsAdmin(false);
        return;
      }

      try {
        const response = await fetch("/api/resources/review?status=pending", { cache: "no-store" });
        if (!cancelled) {
          setIsAdmin(response.ok);
        }
      } catch {
        if (!cancelled) {
          setIsAdmin(false);
        }
      }
    }

    void syncAdminStatus();
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

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

  const tabs = useMemo(() => {
    if (!signedIn) {
      return [
        { key: "discover", label: "Home", icon: "discover", group: "primary", href: "/marketplace?tab=discover" },
        { key: "all-resources", label: "All Resources", icon: "orders", group: "primary", href: "/marketplace/resources", active: true },
      ];
    }

    const baseTabs = [
      { key: "discover", label: "Home", icon: "discover", group: "primary", href: "/marketplace?tab=discover" },
      { key: "all-resources", label: "All Resources", icon: "orders", group: "primary", href: "/marketplace/resources", active: true },
      { key: "submit", label: "Submit", icon: "submit", group: "primary", href: "/marketplace?tab=submit" },
      { key: "requests", label: "Requests", icon: "requests", group: "primary", href: "/marketplace?tab=requests" },
      { key: "account", label: "My Account", icon: "library", group: "secondary", href: "/marketplace?tab=account" },
    ];

    if (isAdmin) {
      baseTabs.push({ key: "admin", label: "Admin", icon: "review", group: "secondary", href: "/marketplace/admin" });
    }
    return baseTabs;
  }, [isAdmin, signedIn]);

  const primaryTabs = useMemo(() => tabs.filter((tab) => tab.group === "primary"), [tabs]);
  const secondaryTabs = useMemo(() => tabs.filter((tab) => tab.group === "secondary"), [tabs]);

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
    <main className="w-full px-0 py-0 lg:min-h-[calc(100vh-8rem)]">
      <div className="lg:flex lg:items-start">
        <aside className="hidden lg:block lg:w-[72px] lg:flex-none lg:self-stretch lg:border-r lg:border-white/10 lg:bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(15,23,42,0.9))] xl:w-20">
          <div className="sticky top-[88px] flex h-[calc(100vh-104px)] flex-col px-1.5 py-3.5 shadow-[20px_0_60px_-45px_rgba(0,0,0,0.9)]">
            <div className="flex justify-center pb-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-[13px] border border-white/10 bg-white/[0.06] text-[9px] font-semibold uppercase tracking-[0.16em] text-white">
                LM
              </div>
            </div>

            <div className="space-y-1 border-t border-white/10 pt-3.5">
              {primaryTabs.map((tab) => (
                <SidebarTabButton
                  key={tab.key}
                  active={Boolean(tab.active)}
                  label={tab.label}
                  icon={tab.icon}
                  onClick={() => window.location.assign(tab.href)}
                />
              ))}
            </div>

            <div className="mt-auto space-y-1 border-t border-white/10 pt-3.5">
              {secondaryTabs.map((tab) => (
                <SidebarTabButton
                  key={tab.key}
                  active={Boolean(tab.active)}
                  label={tab.label}
                  icon={tab.icon}
                  onClick={() => window.location.assign(tab.href)}
                />
              ))}
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 px-4 pb-6 pt-0 sm:px-6 sm:pb-6 sm:pt-0 lg:px-6 lg:py-7 xl:px-8">
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setMobileNavOpen((current) => !current)}
              className="fixed left-3 top-[72px] z-40 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-slate-900/75 text-slate-100 shadow-[0_18px_38px_-22px_rgba(0,0,0,0.75)] backdrop-blur-md"
              aria-label={mobileNavOpen ? "Collapse marketplace navigation" : "Expand marketplace navigation"}
            >
              {mobileNavOpen ? (
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 6 9 12l6 6" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </svg>
              )}
            </button>

            {mobileNavOpen ? (
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="fixed inset-0 z-30 bg-black/45"
                aria-label="Close marketplace navigation"
              />
            ) : null}

            <aside
              className={[
                "fixed bottom-0 left-0 top-[56px] z-40 w-[248px] border-r border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.98),rgba(2,6,23,0.92))] px-3 pb-4 pt-3 shadow-[24px_0_56px_-30px_rgba(0,0,0,0.92)] backdrop-blur-xl transition-transform duration-300",
                mobileNavOpen ? "translate-x-0" : "-translate-x-full",
              ].join(" ")}
            >
              <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">Marketplace</div>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-200"
                  aria-label="Collapse marketplace navigation"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 6 9 12l6 6" />
                  </svg>
                </button>
              </div>

              <div className="space-y-1.5">
                {tabs.map((tab) => (
                  <MobileSidebarTabButton
                    key={tab.key}
                    active={Boolean(tab.active)}
                    label={tab.label}
                    icon={tab.icon}
                    onClick={() => {
                      setMobileNavOpen(false);
                      window.location.assign(tab.href);
                    }}
                  />
                ))}
              </div>
            </aside>
          </div>

          <div className="space-y-6">
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
          <div className="hidden gap-3 md:grid md:grid-cols-2 xl:grid-cols-5">
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
            <div className="hidden flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/45 px-3 py-2.5 md:flex">
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
                  const theme = categoryTheme(resource);
                  const artwork = cardArtwork(resource, theme);
                  const variant = cardVariantClasses(theme);
                  const summary = String(resource.summary || resource.description || "").trim();
                  const resourceImages = Array.isArray(resource.resourceImages)
                    ? resource.resourceImages.filter((image) => image?.url)
                    : [];
                  const leadImage = resourceImages[0] || null;
                  const detailHref = `/marketplace/${resource.id}`;

                  return (
                    <article
                      key={resource.id}
                      className={classNames([
                        "group relative h-[308px] overflow-hidden border bg-[linear-gradient(145deg,rgba(15,23,42,0.92),rgba(17,24,39,0.88)_45%,rgba(3,13,30,0.9))] p-[1px] shadow-[0_24px_68px_-44px_rgba(2,6,23,0.9)] transition hover:-translate-y-0.5 sm:h-[308px]",
                        variant.outer,
                      ])}
                    >
                      <div className="pointer-events-none absolute inset-0 opacity-58" style={{ backgroundImage: theme.accent }} />
                      <div
                        className={classNames([
                          "relative h-full p-3.5 sm:p-5",
                          "pb-28 pr-30 sm:pb-26 sm:pr-34",
                          variant.inner,
                        ])}
                        style={{ backgroundImage: artwork.panel }}
                      >
                        <div
                          aria-hidden
                          className="pointer-events-none absolute inset-0 opacity-38"
                          style={{
                            backgroundImage: `linear-gradient(120deg,rgba(255,255,255,0.08),transparent 42%), ${artwork.strata}, ${artwork.contour}`,
                          }}
                        />
                        <div
                          aria-hidden
                          className="pointer-events-none absolute inset-0 opacity-28"
                          style={{ backgroundImage: artwork.motif }}
                        />
                        <CategoryDecor theme={theme} />
                        <div
                          aria-hidden
                          className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full border border-white/8 blur-xl"
                          style={{ backgroundColor: theme.glow }}
                        />
                        <div
                          aria-hidden
                          className="pointer-events-none absolute -left-8 bottom-[-52px] h-28 w-28 rounded-full border border-white/8 bg-white/[0.015] blur-xl"
                        />

                        <div className="relative z-10 h-full">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1 pr-28 sm:pr-0">
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                <span
                                  className="rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
                                  style={theme.pillStyle}
                                >
                                  {toDisplayLabel(resource.resourceType, "Unknown")}
                                </span>
                                <span className="rounded-full border border-white/14 bg-white/[0.05] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-200">
                                  {toDisplayLabel(resource.resourceFormat, "Generic")}
                                </span>
                                <span className="rounded-full border border-white/14 bg-white/[0.05] px-2.5 py-1 text-[11px] text-slate-300">
                                  {resource.category?.name || "Uncategorized"}
                                </span>
                              </div>

                              <h2 className="line-clamp-3 text-base font-semibold tracking-tight text-white sm:text-xl">{resource.title || "Untitled resource"}</h2>
                              <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-slate-300/90">
                                {summary || "Open this resource to view full details, attachments, and usage guidance."}
                              </p>
                            </div>
                          </div>

                        </div>

                        {leadImage ? (
                          <Link
                            href={detailHref}
                            aria-label={`Open ${resource.title || "resource"}`}
                            className="absolute bottom-1 right-1 z-20 block"
                          >
                            <div className="relative h-[96px] w-[96px] sm:h-[104px] sm:w-[104px]">
                              {resourceImages.length > 1 ? (
                                <>
                                  <div aria-hidden className="absolute left-2 top-2 h-full w-full rounded-[12px] border border-white/10 bg-slate-900/45" />
                                  <div aria-hidden className="absolute left-1 top-1 h-full w-full rounded-[12px] border border-white/10 bg-slate-900/32" />
                                </>
                              ) : null}
                              <div className="relative h-full w-full overflow-hidden rounded-[12px] border border-white/16 bg-slate-900/62">
                                <img
                                  src={leadImage.url}
                                  alt={leadImage.alt || "Resource preview image"}
                                  loading="lazy"
                                  className="h-full w-full object-cover"
                                />
                                {resourceImages.length > 1 ? (
                                  <div className="absolute right-1.5 top-1.5 rounded-[8px] bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
                                    +{resourceImages.length - 1}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </Link>
                        ) : null}

                        <Link
                          href={detailHref}
                          className="absolute right-3 top-3 z-30 inline-flex items-center rounded-[10px] border border-sky-300/65 bg-sky-400 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-950 transition hover:bg-sky-300"
                        >
                          Open resource
                        </Link>
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
      </div>
      </div>
    </main>
  );
}
