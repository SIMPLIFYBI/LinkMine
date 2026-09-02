"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { useAuth } from "@/app/components/AuthProvider";

const SORTABLE_COLUMNS = [
  { key: "title", label: "Title" },
  { key: "download_count", label: "Opens" },
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

function classNames(parts) {
  return parts.filter(Boolean).join(" ");
}

const RESOURCE_TYPE_COLORWAY = {
  hosted: { base: 206, accent: 248, glow: 180 },
  external: { base: 24, accent: 346, glow: 52 },
};

const RESOURCE_FORMAT_COLORWAY = {
  website: { base: 191, accent: 204, glow: 188 },
  repository: { base: 156, accent: 173, glow: 148 },
  excel: { base: 128, accent: 96, glow: 112 },
  word: { base: 216, accent: 236, glow: 206 },
  powerpoint: { base: 24, accent: 40, glow: 32 },
  script: { base: 268, accent: 304, glow: 286 },
  app: { base: 336, accent: 351, glow: 324 },
  pdf: { base: 5, accent: 350, glow: 14 },
  generic: { base: 210, accent: 222, glow: 198 },
};

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 360;
  }
  return hash;
}

function getResourceMonogram(resource) {
  return String(resource?.title || "RM")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "RM";
}

function getConsultantIconUrl(resource) {
  const iconUrl = String(resource?.consultantIconUrl || "").trim();
  return iconUrl || null;
}

function ResourceOwnerBadge({ resource, className, style, imageClassName = "h-full w-full object-cover" }) {
  const [imageLoadError, setImageLoadError] = useState(false);
  const iconUrl = getConsultantIconUrl(resource);
  const canShowImage = Boolean(iconUrl && !imageLoadError);

  return (
    <div className={classNames([
      "bg-white/12 backdrop-blur-md ring-1 ring-white/35",
      className,
    ])} style={style}>
      {canShowImage ? (
        <img
          src={iconUrl}
          alt="Consultant icon"
          loading="lazy"
          className={imageClassName}
          onError={() => setImageLoadError(true)}
        />
      ) : (
        getResourceMonogram(resource)
      )}
    </div>
  );
}

function getResourceArtwork(resource) {
  const formatKey = resource?.resourceFormat || "generic";
  const palette = RESOURCE_FORMAT_COLORWAY[formatKey] || RESOURCE_TYPE_COLORWAY[resource?.resourceType] || RESOURCE_TYPE_COLORWAY.hosted;
  const typeBias = resource?.resourceType === "external" ? 12 : 0;
  const driftSeed = `${resource?.category?.name || "general"}-${resource?.title || "resource"}`;
  const drift = (hashString(driftSeed) % 28) - 14;
  const hue = (palette.base + drift + typeBias + 360) % 360;
  const accentHue = (palette.accent + Math.round(drift * 0.7) + Math.round(typeBias * 0.55) + 360) % 360;
  const glowHue = (palette.glow + Math.round(drift * 0.5) + Math.round(typeBias * 0.45) + 360) % 360;

  return {
    cardBackground: `radial-gradient(circle at 20% 16%, hsla(${glowHue}, 90%, 72%, 0.28), transparent 28%), linear-gradient(145deg, hsla(${hue}, 58%, 44%, 0.94), hsla(${accentHue}, 64%, 26%, 0.84))`,
    chipBackground: `linear-gradient(135deg, hsla(${glowHue}, 90%, 86%, 0.95), hsla(${hue}, 86%, 70%, 0.88))`,
  };
}

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

const RESOURCE_FORMAT_THEME = {
  website: {
    chip: "border-cyan-300/30 bg-gradient-to-r from-cyan-500/25 to-sky-500/20 text-cyan-50",
    iconWrap: "border-cyan-200/40 bg-cyan-300/20",
    iconColor: "text-cyan-100",
  },
  repository: {
    chip: "border-emerald-300/30 bg-gradient-to-r from-emerald-500/25 to-teal-500/20 text-emerald-50",
    iconWrap: "border-emerald-200/40 bg-emerald-300/20",
    iconColor: "text-emerald-100",
  },
  excel: {
    chip: "border-lime-300/30 bg-gradient-to-r from-lime-500/25 to-green-500/20 text-lime-50",
    iconWrap: "border-lime-200/40 bg-lime-300/20",
    iconColor: "text-lime-100",
  },
  word: {
    chip: "border-blue-300/30 bg-gradient-to-r from-blue-500/25 to-indigo-500/20 text-blue-50",
    iconWrap: "border-blue-200/40 bg-blue-300/20",
    iconColor: "text-blue-100",
  },
  powerpoint: {
    chip: "border-orange-300/30 bg-gradient-to-r from-orange-500/25 to-amber-500/20 text-orange-50",
    iconWrap: "border-orange-200/40 bg-orange-300/20",
    iconColor: "text-orange-100",
  },
  script: {
    chip: "border-violet-300/30 bg-gradient-to-r from-violet-500/25 to-fuchsia-500/20 text-violet-50",
    iconWrap: "border-violet-200/40 bg-violet-300/20",
    iconColor: "text-violet-100",
  },
  app: {
    chip: "border-pink-300/30 bg-gradient-to-r from-pink-500/25 to-rose-500/20 text-pink-50",
    iconWrap: "border-pink-200/40 bg-pink-300/20",
    iconColor: "text-pink-100",
  },
  pdf: {
    chip: "border-red-300/30 bg-gradient-to-r from-red-500/25 to-rose-500/20 text-red-50",
    iconWrap: "border-red-200/40 bg-red-300/20",
    iconColor: "text-red-100",
  },
  generic: {
    chip: "border-slate-300/30 bg-gradient-to-r from-slate-600/35 to-slate-500/20 text-slate-100",
    iconWrap: "border-slate-200/35 bg-slate-300/20",
    iconColor: "text-slate-100",
  },
};

function ResourceFormatGlyph({ format, className = "h-3.5 w-3.5" }) {
  const Icon = RESOURCE_FORMAT_ICONS[format] || RESOURCE_FORMAT_ICONS.generic;
  return <Icon aria-hidden="true" className={className} />;
}

function ResourceFormatChip({ format, className = "" }) {
  const safeFormat = format || "generic";
  const theme = RESOURCE_FORMAT_THEME[safeFormat] || RESOURCE_FORMAT_THEME.generic;
  return (
    <span className={classNames(["inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold", className, theme.chip])}>
      <span className={classNames(["inline-flex h-5 w-5 items-center justify-center rounded-full border", theme.iconWrap])}>
        <ResourceFormatGlyph format={safeFormat} className={classNames(["h-3.5 w-3.5", theme.iconColor])} />
      </span>
      <span>{RESOURCE_FORMAT_LABELS[safeFormat] || RESOURCE_FORMAT_LABELS.generic}</span>
    </span>
  );
}

const RESOURCE_FORMAT_CARD_VARIANTS = {
  website: {
    orbClass: "-right-10 top-3 h-24 w-24 rounded-full border border-cyan-100/35 bg-cyan-200/18 backdrop-blur-md",
    blockClass: "bottom-[-10%] right-[14%] h-20 w-20 rotate-[16deg] rounded-[22px] border border-cyan-100/30 bg-cyan-950/24",
    titleRowClass: "min-h-[3.4rem] pr-14 sm:min-h-[3.75rem]",
    summaryClass: "mt-3 line-clamp-2 max-w-[28ch] text-[13px] leading-5 text-slate-100/82 sm:text-sm sm:leading-6",
  },
  repository: {
    orbClass: "-right-11 top-2 h-24 w-24 rounded-[28px] border border-emerald-100/30 bg-emerald-200/16 backdrop-blur-md",
    blockClass: "bottom-[-12%] right-[20%] h-16 w-24 -rotate-[11deg] rounded-[16px] border border-emerald-100/25 bg-emerald-950/26",
    titleRowClass: "min-h-[3.4rem] pr-14 sm:min-h-[3.75rem]",
    summaryClass: "mt-3 line-clamp-2 max-w-[26ch] text-[13px] leading-5 text-slate-100/82 sm:text-sm sm:leading-6",
  },
  excel: {
    orbClass: "-right-9 top-3 h-20 w-20 rounded-[20px] border border-green-100/32 bg-green-200/16 backdrop-blur-md",
    blockClass: "bottom-[-14%] right-[16%] h-20 w-20 rotate-[4deg] rounded-[12px] border border-green-100/24 bg-green-950/28",
    titleRowClass: "min-h-[3.1rem] pr-14 sm:min-h-[3.45rem]",
    summaryClass: "mt-3 line-clamp-2 max-w-[25ch] text-[13px] leading-5 text-slate-100/82 sm:text-sm sm:leading-6",
  },
  word: {
    orbClass: "-right-10 top-3 h-24 w-24 rounded-full border border-blue-100/35 bg-blue-200/16 backdrop-blur-md",
    blockClass: "bottom-[-12%] right-[16%] h-16 w-24 rotate-[8deg] rounded-[20px] border border-blue-100/26 bg-blue-950/24",
    titleRowClass: "min-h-[3.4rem] pr-14 sm:min-h-[3.75rem]",
    summaryClass: "mt-3 line-clamp-2 max-w-[29ch] text-[13px] leading-5 text-slate-100/82 sm:text-sm sm:leading-6",
  },
  powerpoint: {
    orbClass: "-right-8 top-3 h-20 w-20 rounded-full border border-orange-100/35 bg-orange-200/16 backdrop-blur-md",
    blockClass: "bottom-[-10%] right-[14%] h-[4.5rem] w-[5.5rem] -rotate-[14deg] rounded-[16px] border border-orange-100/26 bg-orange-950/26",
    titleRowClass: "min-h-[3.2rem] pr-14 sm:min-h-[3.55rem]",
    summaryClass: "mt-3 line-clamp-2 max-w-[24ch] text-[13px] leading-5 text-slate-100/82 sm:text-sm sm:leading-6",
  },
  script: {
    orbClass: "-right-10 top-2 h-24 w-24 rounded-[24px] border border-violet-100/34 bg-violet-200/16 backdrop-blur-md",
    blockClass: "bottom-[-14%] right-[18%] h-[4.5rem] w-20 rotate-[24deg] rounded-[12px] border border-violet-100/24 bg-violet-950/30",
    titleRowClass: "min-h-[3.1rem] pr-14 sm:min-h-[3.5rem]",
    summaryClass: "mt-3 line-clamp-2 max-w-[25ch] text-[13px] leading-5 text-slate-100/82 sm:text-sm sm:leading-6",
  },
  app: {
    orbClass: "-right-10 top-3 h-24 w-24 rounded-[30px] border border-pink-100/34 bg-pink-200/16 backdrop-blur-md",
    blockClass: "bottom-[-12%] right-[16%] h-[4.25rem] w-24 -rotate-[9deg] rounded-[18px] border border-pink-100/26 bg-pink-950/28",
    titleRowClass: "min-h-[3.2rem] pr-14 sm:min-h-[3.6rem]",
    summaryClass: "mt-3 line-clamp-2 max-w-[25ch] text-[13px] leading-5 text-slate-100/82 sm:text-sm sm:leading-6",
  },
  pdf: {
    orbClass: "-right-9 top-3 h-20 w-20 rounded-[18px] border border-rose-100/34 bg-rose-200/16 backdrop-blur-md",
    blockClass: "bottom-[-12%] right-[16%] h-20 w-20 rotate-[9deg] rounded-[16px] border border-rose-100/26 bg-rose-950/28",
    titleRowClass: "min-h-[3.15rem] pr-14 sm:min-h-[3.5rem]",
    summaryClass: "mt-3 line-clamp-2 max-w-[24ch] text-[13px] leading-5 text-slate-100/82 sm:text-sm sm:leading-6",
  },
  generic: {
    orbClass: "-right-10 top-3 h-24 w-24 rounded-full border border-slate-100/30 bg-slate-200/12 backdrop-blur-md",
    blockClass: "bottom-[-10%] right-[16%] h-[4.75rem] w-[5.5rem] rotate-[8deg] rounded-[16px] border border-slate-100/24 bg-slate-950/30",
    titleRowClass: "min-h-[3.3rem] pr-14 sm:min-h-[3.65rem]",
    summaryClass: "mt-3 line-clamp-2 max-w-[26ch] text-[13px] leading-5 text-slate-100/82 sm:text-sm sm:leading-6",
  },
};

function getResourceCardStyle(format) {
  return RESOURCE_FORMAT_CARD_VARIANTS[format] || RESOURCE_FORMAT_CARD_VARIANTS.generic;
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState("");
  const [authPromptResourceHref, setAuthPromptResourceHref] = useState("");
  const [authPromptVisible, setAuthPromptVisible] = useState(false);
  const authPromptCloseTimeoutRef = useRef(null);
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

    async function loadCategories() {
      try {
        const categoriesRes = await fetch("/api/resources/categories", {
          signal: controller.signal,
        }).then(readJson);
        setCategories(categoriesRes.categories || []);
      } catch (nextError) {
        if (nextError?.name === "AbortError") return;
      }
    }

    void loadCategories();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      if (hasLoadedOnce) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
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

        const resourcesRes = await fetch(`/api/resources?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        }).then(readJson);

        setResources(resourcesRes.resources || []);
        setPaging(resourcesRes.paging || { page: filters.page, limit: filters.limit, hasMore: false });
        setHasLoadedOnce(true);
      } catch (nextError) {
        if (nextError?.name === "AbortError") return;
        setError(nextError.message || "Unable to load resources.");
      } finally {
        setLoading(false);
        setIsRefreshing(false);
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
        { key: "discover", label: "Home", icon: "discover", group: "primary", href: "/vault?tab=discover" },
        { key: "all-resources", label: "All Resources", icon: "orders", group: "primary", href: "/vault/resources", active: true },
      ];
    }

    const baseTabs = [
      { key: "discover", label: "Home", icon: "discover", group: "primary", href: "/vault?tab=discover" },
      { key: "all-resources", label: "All Resources", icon: "orders", group: "primary", href: "/vault/resources", active: true },
      { key: "submit", label: "Create", icon: "submit", group: "primary", href: "/vault?tab=submit" },
      { key: "requests", label: "Requests", icon: "requests", group: "primary", href: "/vault?tab=requests" },
      { key: "account", label: "My Vault", icon: "library", group: "secondary", href: "/vault?tab=account" },
    ];

    if (isAdmin) {
      baseTabs.push({ key: "admin", label: "Admin", icon: "review", group: "secondary", href: "/vault/admin" });
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

  function handleResourceOpenIntent(event, href) {
    if (signedIn) return;
    event.preventDefault();
    if (authPromptCloseTimeoutRef.current != null) {
      window.clearTimeout(authPromptCloseTimeoutRef.current);
      authPromptCloseTimeoutRef.current = null;
    }
    setAuthPromptResourceHref(href);
  }

  function closeAuthPrompt() {
    setAuthPromptVisible(false);
    if (authPromptCloseTimeoutRef.current != null) {
      window.clearTimeout(authPromptCloseTimeoutRef.current);
    }
    authPromptCloseTimeoutRef.current = window.setTimeout(() => {
      setAuthPromptResourceHref("");
      authPromptCloseTimeoutRef.current = null;
    }, 200);
  }

  useEffect(() => {
    if (!authPromptResourceHref) {
      setAuthPromptVisible(false);
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setAuthPromptVisible(true);
    });

    function handleEscape(event) {
      if (event.key === "Escape") {
        closeAuthPrompt();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [authPromptResourceHref]);

  useEffect(() => {
    return () => {
      if (authPromptCloseTimeoutRef.current != null) {
        window.clearTimeout(authPromptCloseTimeoutRef.current);
      }
    };
  }, []);

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
              aria-label={mobileNavOpen ? "Collapse vault navigation" : "Expand vault navigation"}
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
                aria-label="Close vault navigation"
              />
            ) : null}

            <aside
              className={[
                "fixed bottom-0 left-0 top-[56px] z-40 w-[248px] border-r border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.98),rgba(2,6,23,0.92))] px-3 pb-4 pt-3 shadow-[24px_0_56px_-30px_rgba(0,0,0,0.92)] backdrop-blur-xl transition-transform duration-300",
                mobileNavOpen ? "translate-x-0" : "-translate-x-full",
              ].join(" ")}
            >
              <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">Vault</div>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-200"
                  aria-label="Collapse vault navigation"
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

        <section className="sticky top-[calc(56px+env(safe-area-inset-top))] z-20 -mx-4 border-y border-white/12 bg-[linear-gradient(170deg,rgba(2,6,23,0.94),rgba(15,23,42,0.9)_46%,rgba(30,41,59,0.86)_100%)] px-4 py-2.5 shadow-[0_20px_48px_-34px_rgba(15,23,42,0.88)] backdrop-blur-2xl sm:mx-0 sm:rounded-2xl sm:border sm:px-3 sm:py-3 md:hidden">
          <div className="flex w-full items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center rounded-full border border-white/15 bg-slate-950/62 px-2.5 py-1.5">
              <div className="relative min-w-0 flex-1">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="pointer-events-none absolute left-1.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search resources"
                  className="h-7 w-full bg-transparent pl-7 pr-2 text-[13px] text-slate-100 placeholder:text-slate-300/80 outline-none"
                />
              </div>

              <div className="mx-1 h-5 w-px bg-white/18" />

              <div className="relative w-[8.9rem]">
                <select
                  value={filters.categoryId}
                  onChange={(event) => updateFilter("categoryId", event.target.value)}
                  className="h-7 w-full appearance-none bg-transparent pl-2 pr-6 text-[12px] font-semibold text-slate-100 outline-none"
                  aria-label="Filter by category"
                >
                  {categoryOptions.map((category) => (
                    <option key={category.id || "all"} value={category.id}>{category.name}</option>
                  ))}
                </select>
                <svg viewBox="0 0 20 20" aria-hidden="true" className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5.5 7.5 4.5 5 4.5-5" />
                </svg>
              </div>
            </div>
          </div>
        </section>

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
                const arrow = active ? (filters.sortDir === "asc" ? "\u2191" : "\u2193") : "\u2195";
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

            {isRefreshing ? (
              <div className="rounded-xl border border-sky-300/25 bg-sky-500/10 px-3 py-2 text-xs text-sky-100">
                Refreshing resources...
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-12 text-center text-sm text-slate-300">Loading resources...</div>
            ) : error && resources.length === 0 ? (
              <div className="rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-12 text-center text-sm text-red-100">{error}</div>
            ) : resources.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-12 text-center text-sm text-slate-300">No resources matched your filters.</div>
            ) : (
              <div className="grid gap-3 sm:gap-4">
                {resources.map((resource) => {
                  const artwork = getResourceArtwork(resource);
                  const cardStyle = getResourceCardStyle(resource.resourceFormat);
                  const summary = String(resource.summary || resource.description || "").trim();
                  const actionLabel = resource.resourceType === "hosted" ? "Download resource" : "Open resource";
                  const accessLabel = resource.resourceType === "external"
                    ? (resource.sourceName || "External source")
                    : "Resource file";
                  const detailHref = `/vault/${resource.id}`;

                  return (
                    <article
                      key={resource.id}
                      className="group relative flex h-[304px] overflow-hidden rounded-[26px] border border-white/10 shadow-[0_24px_62px_-38px_rgba(0,0,0,0.9)] ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:border-white/20"
                      style={{ backgroundImage: artwork.cardBackground }}
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_34%),linear-gradient(180deg,rgba(15,23,42,0.06),rgba(15,23,42,0.84)_76%)]" />
                      <div className={["pointer-events-none absolute", cardStyle.orbClass].join(" ")} />
                      <div className={["pointer-events-none absolute", cardStyle.blockClass].join(" ")} />
                      <ResourceOwnerBadge
                        resource={resource}
                        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center overflow-hidden rounded-[14px] border border-white/18 text-sm font-semibold text-slate-950 shadow-[0_14px_30px_-18px_rgba(255,255,255,0.8)]"
                        style={{ backgroundImage: artwork.chipBackground }}
                      />
                      <div className="relative flex h-full w-full flex-col justify-between p-4">
                        <div>
                          <div className={cardStyle.titleRowClass}>
                            <Link
                              href={detailHref}
                              onClick={(event) => handleResourceOpenIntent(event, detailHref)}
                              className="block line-clamp-2 text-[1.12rem] font-semibold leading-tight text-white transition hover:text-sky-100 sm:text-[1.3rem]"
                            >
                              {resource.title || "Untitled resource"}
                            </Link>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-4">
                            <ResourceFormatChip format={resource.resourceFormat} className="bg-slate-950/25" />
                            <span className="rounded-full border border-white/14 bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-slate-300">
                              {resource.category?.name || "Uncategorized"}
                            </span>
                          </div>
                          <p className={cardStyle.summaryClass}>
                            {summary || "Open this resource to view full details, attachments, and usage guidance."}
                          </p>
                        </div>

                        <div>
                          <div className="min-h-[28px] text-[11px] text-slate-100/76">{resource.openCount ?? resource.downloadCount ?? 0} opens</div>
                          <div className="mt-3.5 flex items-center justify-between gap-2.5 sm:mt-4 sm:gap-3">
                            <div>
                              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-100">Included</div>
                              <div className="mt-1 line-clamp-1 max-w-[130px] text-[11px] text-slate-100/72 sm:max-w-[160px] sm:text-xs">{accessLabel}</div>
                            </div>
                            <Link
                              href={detailHref}
                              onClick={(event) => handleResourceOpenIntent(event, detailHref)}
                              className="group relative inline-flex items-center justify-center gap-1.5 rounded-full border border-sky-200/45 bg-[linear-gradient(135deg,rgba(56,189,248,0.95),rgba(59,130,246,0.92)_46%,rgba(14,165,233,0.95))] px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white shadow-[0_14px_30px_-14px_rgba(14,165,233,0.95)] ring-1 ring-white/30 transition duration-200 hover:-translate-y-0.5 hover:border-sky-100/60 hover:brightness-105 hover:shadow-[0_20px_38px_-16px_rgba(14,165,233,1)]"
                            >
                              <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.24),transparent_48%)]" aria-hidden="true" />
                              <span className="relative">{actionLabel}</span>
                              <span className="relative text-sm leading-none transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">↗</span>
                            </Link>
                          </div>
                        </div>
                      </div>

                      <Link
                        href={detailHref}
                        onClick={(event) => handleResourceOpenIntent(event, detailHref)}
                        className="absolute inset-0 z-0"
                        aria-label={`${actionLabel} ${resource.title || "resource"}`}
                      >
                        <span className="sr-only">{actionLabel}</span>
                      </Link>

                      <div className="relative z-10">
                        <Link
                          href={detailHref}
                          onClick={(event) => handleResourceOpenIntent(event, detailHref)}
                          className="sr-only"
                        >
                          {actionLabel}
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {error && resources.length > 0 ? (
              <div className="rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
              Page {filters.page} {" \u2022 "} {resources.length} shown
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prevPage}
                disabled={filters.page <= 1 || loading || isRefreshing}
                className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={nextPage}
                disabled={!paging.hasMore || loading || isRefreshing}
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

      {authPromptResourceHref ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4 py-6">
          <button
            type="button"
            onClick={closeAuthPrompt}
            className={[
              "absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] transition-opacity duration-200",
              authPromptVisible ? "opacity-100" : "opacity-0",
            ].join(" ")}
            aria-label="Close sign in prompt"
          />
          <section className={[
            "relative w-full max-w-xl overflow-hidden rounded-[28px] border border-white/20 bg-[linear-gradient(155deg,rgba(56,189,248,0.18),rgba(15,23,42,0.9)_42%,rgba(2,6,23,0.94)_100%)] p-6 shadow-[0_42px_110px_-48px_rgba(0,0,0,0.95)] ring-1 ring-sky-200/35 backdrop-blur-2xl transition-all duration-200 sm:p-7",
            authPromptVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.98] opacity-0",
          ].join(" ")}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-100/90">Account required</div>
            <div className="mt-2 text-2xl font-semibold leading-tight text-white">Sign in or create an account to open this resource.</div>
            <p className="mt-3 text-sm leading-7 text-slate-200/90">
              You can browse all listings while signed out. Opening resource details requires an account.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={`/login?redirect=${encodeURIComponent(authPromptResourceHref)}`} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
                Sign in
              </Link>
              <Link href={`/signup?redirect=${encodeURIComponent(authPromptResourceHref)}`} className="rounded-full border border-white/20 bg-white/[0.08] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.14]">
                Create account
              </Link>
              <button
                type="button"
                onClick={closeAuthPrompt}
                className="rounded-full border border-white/14 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.1]"
              >
                Not now
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

