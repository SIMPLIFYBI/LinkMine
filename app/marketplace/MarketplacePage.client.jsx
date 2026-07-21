"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
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
import { formatResourceBytes } from "@/lib/resourceHub";

const DEFAULT_RESOURCE_FORM = {
  title: "",
  categoryId: "",
  resourceType: "hosted",
  resourceFormat: "generic",
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

const RESOURCE_FORMAT_OPTIONS = [
  { value: "website", label: "Website" },
  { value: "repository", label: "Repository" },
  { value: "excel", label: "Excel" },
  { value: "word", label: "Word" },
  { value: "powerpoint", label: "PowerPoint" },
  { value: "script", label: "Script / Code" },
  { value: "app", label: "Application" },
  { value: "pdf", label: "PDF" },
  { value: "generic", label: "Generic resource" },
];

async function readJson(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error || body?.message || "Request failed.");
  }
  return body;
}

const API_TIMEOUT_MS = 15000;

async function withTimeout(path, options) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    return await fetch(path, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function apiGet(path) {
  const response = await withTimeout(path, { cache: "no-store" });
  return readJson(response);
}

async function apiSend(path, method, payload, isFormData = false) {
  const response = await withTimeout(path, {
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

const RESOURCE_TYPE_COLORWAY = {
  hosted: { base: 206, accent: 248, glow: 180 },
  external: { base: 24, accent: 346, glow: 52 },
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
    <div className={[
      "bg-white/12 backdrop-blur-md ring-1 ring-white/35",
      className,
    ].filter(Boolean).join(" ")} style={style}>
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
  const palette = RESOURCE_TYPE_COLORWAY[resource?.resourceType] || RESOURCE_TYPE_COLORWAY.hosted;
  const driftSeed = `${resource?.category?.name || "general"}-${resource?.title || "resource"}`;
  const drift = (hashString(driftSeed) % 28) - 14;
  const hue = (palette.base + drift + 360) % 360;
  const accentHue = (palette.accent + Math.round(drift * 0.7) + 360) % 360;
  const glowHue = (palette.glow + Math.round(drift * 0.5) + 360) % 360;

  return {
    heroBackground: `radial-gradient(circle at 18% 18%, hsla(${glowHue}, 78%, 66%, 0.32), transparent 34%), linear-gradient(135deg, hsla(${hue}, 72%, 54%, 0.92), hsla(${accentHue}, 72%, 32%, 0.78) 58%, rgba(15,23,42,0.96) 100%)`,
    spotlightBackground: `radial-gradient(circle at 78% 22%, hsla(${glowHue}, 88%, 72%, 0.34), transparent 30%), linear-gradient(135deg, hsla(${hue}, 70%, 46%, 0.96), hsla(${accentHue}, 70%, 42%, 0.84))`,
    panelBackground: `radial-gradient(circle at 28% 32%, hsla(${glowHue}, 92%, 74%, 0.36), transparent 24%), radial-gradient(circle at 72% 68%, hsla(${hue}, 94%, 68%, 0.24), transparent 22%), linear-gradient(145deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04))`,
    cardBackground: `radial-gradient(circle at 20% 16%, hsla(${glowHue}, 90%, 72%, 0.28), transparent 28%), linear-gradient(145deg, hsla(${hue}, 58%, 44%, 0.94), hsla(${accentHue}, 64%, 26%, 0.84))`,
    chipBackground: `linear-gradient(135deg, hsla(${glowHue}, 90%, 86%, 0.95), hsla(${hue}, 86%, 70%, 0.88))`,
    outline: `hsla(${glowHue}, 86%, 78%, 0.42)`,
  };
}

function TabButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group whitespace-nowrap border-b-2 border-transparent px-2 py-2 text-center transition sm:rounded-full sm:border sm:px-3.5",
        active
          ? "border-sky-400 bg-transparent text-white shadow-none sm:border-sky-300/40 sm:bg-white sm:text-slate-950 sm:shadow-[0_14px_30px_-24px_rgba(255,255,255,0.95)]"
          : "bg-transparent text-slate-400 hover:text-white sm:border-white/10 sm:bg-white/[0.05] sm:text-slate-300 sm:hover:border-white/20 sm:hover:bg-white/[0.1]",
      ].join(" ")}
    >
      <div className="text-[13px] font-semibold leading-none">{label}</div>
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

  if (name === "payouts") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke={stroke} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
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

function AccountTopTab({ active, label, meta, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group min-w-[132px] rounded-[20px] border px-4 py-3 text-left transition",
        active
          ? "border-white/20 bg-white text-slate-950 shadow-[0_20px_50px_-34px_rgba(255,255,255,0.8)]"
          : "border-white/10 bg-white/[0.04] text-slate-200 hover:border-white/20 hover:bg-white/[0.08]",
      ].join(" ")}
    >
      <div className={active ? "text-[11px] uppercase tracking-[0.2em] text-slate-600" : "text-[11px] uppercase tracking-[0.2em] text-slate-400"}>{meta}</div>
      <div className={active ? "mt-2 text-sm font-semibold text-slate-950" : "mt-2 text-sm font-semibold text-white"}>{label}</div>
    </button>
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
    chip: "border-green-300/30 bg-gradient-to-r from-green-500/25 to-lime-500/20 text-green-50",
    iconWrap: "border-green-200/40 bg-green-300/20",
    iconColor: "text-green-100",
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
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${className} ${theme.chip}`}>
      <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${theme.iconWrap}`}>
        <ResourceFormatGlyph format={safeFormat} className={`h-3.5 w-3.5 ${theme.iconColor}`} />
      </span>
      <span>{RESOURCE_FORMAT_LABELS[safeFormat] || RESOURCE_FORMAT_LABELS.generic}</span>
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
  const accessLabel = resource.resourceType === "external" ? (resource.sourceName || "External source") : "Resource file";
  const priceLabel = resource.priceCents > 0 ? formatMoney(resource.priceCents, resource.currencyCode) : "Free";
  const detailHref = `/marketplace/${resource.id}`;

  return (
    <article className="h-[228px] overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] shadow-[0_18px_48px_-38px_rgba(0,0,0,0.85)] ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_26px_70px_-42px_rgba(0,0,0,0.95)]">
      <div className="relative flex h-full flex-col justify-between p-4 sm:p-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={statusTone(resource.status)}>{resource.status}</Badge>
                <ResourceFormatChip format={resource.resourceFormat} />
              </div>
              {resource.category?.name ? <div className="mt-3 line-clamp-1 max-w-[14rem] text-[11px] uppercase tracking-[0.22em] text-slate-400">{resource.category.name}</div> : null}
              <Link href={detailHref} className="mt-3 block line-clamp-1 text-base font-semibold text-white transition hover:text-sky-100 sm:text-lg">
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
          <div className="flex min-h-[24px] flex-wrap gap-2 text-[11px] text-slate-400">
            {(resource.tags || []).slice(0, 2).map((tag) => (
              <span key={tag.id} className="max-w-[132px] truncate rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
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

function LibraryGalleryCard({ resource }) {
  const detailHref = `/marketplace/${resource.id}`;
  const artwork = getResourceArtwork(resource);
  const priceLabel = resource.priceCents > 0 ? formatMoney(resource.priceCents, resource.currencyCode) : "Free";
  const accessLabel = resource.resourceType === "external" ? (resource.sourceName || "External source") : "Resource file";
  const updatedLabel = formatDate(resource.updatedAt || resource.createdAt);

  return (
    <article
      className={[
        "group relative flex flex-none snap-start overflow-hidden rounded-[30px] border border-white/10 shadow-[0_26px_70px_-42px_rgba(0,0,0,0.95)] ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:border-white/20",
        "h-[392px] w-[320px] lg:w-[320px]",
      ].join(" ")}
      style={{ backgroundImage: artwork.heroBackground }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_38%),linear-gradient(180deg,rgba(15,23,42,0.02),rgba(15,23,42,0.86)_72%)]" />
      <div className="absolute left-5 top-5 flex items-center gap-2">
        <ResourceFormatChip format={resource.resourceFormat} className="bg-slate-950/25" />
        {resource.category?.name ? <span className="rounded-full border border-white/12 bg-slate-950/25 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-100/90">{resource.category.name}</span> : null}
      </div>

      <ResourceOwnerBadge
        resource={resource}
        className="absolute right-5 top-5 flex h-14 w-14 items-center justify-center overflow-hidden rounded-[18px] border border-white/15 text-base font-semibold text-slate-950 shadow-[0_18px_38px_-24px_rgba(0,0,0,0.85)]"
        style={{ backgroundImage: artwork.chipBackground }}
      />

      <div className="relative flex flex-1 flex-col justify-end p-5 lg:p-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/70">In your library</div>
            <div className="mt-2 line-clamp-2 text-[1.8rem] font-semibold leading-tight text-white lg:text-[1.95rem]">{resource.title}</div>
          </div>
          <div className="rounded-[20px] border border-white/12 bg-slate-950/30 px-3 py-2 text-right backdrop-blur-sm">
            <div className="text-sm font-semibold text-white">{priceLabel}</div>
            <div className="mt-1 text-[11px] text-slate-200/80">{resource.downloadCount || 0} downloads</div>
          </div>
        </div>

        <p className="line-clamp-3 max-w-[30ch] text-[15px] leading-7 text-slate-100/88">{resource.summary || accessLabel}</p>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px] text-slate-100/80">
          {(resource.tags || []).slice(0, 3).map((tag) => (
            <span key={tag.id} className="max-w-[120px] truncate rounded-full border border-white/12 bg-slate-950/30 px-3 py-1 backdrop-blur-sm">
              {tag.name}
            </span>
          ))}
          {updatedLabel ? <span className="rounded-full border border-white/12 bg-slate-950/30 px-3 py-1 backdrop-blur-sm">Updated {updatedLabel}</span> : null}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="text-sm text-slate-100/78">{accessLabel}</div>
          <Link href={detailHref} className="rounded-full border border-white/15 bg-white px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-slate-100">
            Open resource
          </Link>
        </div>
      </div>
    </article>
  );
}

function ScrollShelf({ title, subtitle, metaLabel, children }) {
  const railRef = useRef(null);

  function scrollRail(direction) {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: Math.max(rail.clientWidth * 0.82, 320) * direction, behavior: "smooth" });
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.035))] shadow-[0_30px_80px_-44px_rgba(0,0,0,0.75)] ring-1 ring-white/10">
      <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <div className="text-2xl font-semibold text-white">{title}</div>
          {subtitle ? <div className="mt-1 text-sm text-slate-300">{subtitle}</div> : null}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {metaLabel ? <div className="text-sm font-medium text-sky-300">{metaLabel}</div> : null}
          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={() => scrollRail(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-slate-200 transition hover:border-white/20 hover:bg-white/[0.09] hover:text-white"
              aria-label={`Scroll ${title} left`}
            >
              <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12.5 4.5-5 5 5 5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollRail(1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-slate-200 transition hover:border-white/20 hover:bg-white/[0.09] hover:text-white"
              aria-label={`Scroll ${title} right`}
            >
              <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="m7.5 4.5 5 5-5 5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-10 bg-gradient-to-r from-slate-950/50 to-transparent sm:block" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-10 bg-gradient-to-l from-slate-950/50 to-transparent sm:block" />
        <div ref={railRef} className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 py-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-6">
          {children}
        </div>
      </div>
    </section>
  );
}

function MarketplaceShelfCard({ resource }) {
  const detailHref = `/marketplace/${resource.id}`;
  const artwork = getResourceArtwork(resource);
  const priceLabel = resource.priceCents > 0 ? formatMoney(resource.priceCents, resource.currencyCode) : "Free";
  const accessLabel = resource.resourceType === "external" ? (resource.sourceName || "External source") : "Resource file";
  const shellClassName = "h-[320px] w-[320px] lg:w-[320px]";
  const titleClassName = "mt-4 block line-clamp-2 max-w-[15rem] text-[1.35rem] font-semibold leading-tight text-white transition hover:text-sky-100";
  const summaryClassName = "mt-2 line-clamp-2 max-w-[28ch] text-sm leading-6 text-slate-100/82";

  return (
    <article className={["group relative flex flex-none snap-start overflow-hidden rounded-[26px] border border-white/10 shadow-[0_24px_62px_-38px_rgba(0,0,0,0.9)] ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:border-white/20", shellClassName].join(" ")} style={{ backgroundImage: artwork.cardBackground }}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_34%),linear-gradient(180deg,rgba(15,23,42,0.06),rgba(15,23,42,0.84)_76%)]" />
      <ResourceOwnerBadge
        resource={resource}
        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center overflow-hidden rounded-[14px] border border-white/18 text-sm font-semibold text-slate-950 shadow-[0_14px_30px_-18px_rgba(255,255,255,0.8)]"
        style={{ backgroundImage: artwork.chipBackground }}
      />
      <div className="relative flex h-full flex-col justify-between p-4.5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {resource.status !== "approved" ? <Badge tone={statusTone(resource.status)}>{resource.status}</Badge> : null}
            <ResourceFormatChip format={resource.resourceFormat} className="bg-slate-950/25" />
            <span className="line-clamp-1 max-w-[120px] rounded-full border border-white/12 bg-slate-950/25 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-100/90">{resource.category?.name || "Resource"}</span>
          </div>
          <div className="mt-4 text-[11px] uppercase tracking-[0.26em] text-slate-200/78">Marketplace pick</div>
          <Link href={detailHref} className={titleClassName}>
            {resource.title}
          </Link>
          <p className={summaryClassName}>{resource.summary || accessLabel}</p>
        </div>

        <div>
          <div className="flex min-h-[28px] flex-nowrap items-center gap-2 overflow-hidden text-[11px] text-slate-100/76">
            {(resource.tags || []).slice(0, 1).map((tag) => (
              <span key={tag.id} className="max-w-[132px] truncate rounded-full border border-white/12 bg-slate-950/25 px-3 py-1 backdrop-blur-sm">
                {tag.name}
              </span>
            ))}
            <span className="shrink-0 rounded-full border border-white/12 bg-slate-950/25 px-3 py-1 backdrop-blur-sm">{resource.downloadCount || 0} downloads</span>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-white">{priceLabel}</div>
              <div className="mt-1 line-clamp-1 max-w-[160px] text-xs text-slate-100/72">{accessLabel}</div>
            </div>
            <Link href={detailHref} className="rounded-full border border-white/15 bg-white px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-slate-100">
              View resource
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function CategoryShelfCard({ category, onSelect }) {
  const hue = hashString(category.name || "category");
  const accentHue = (hue + 36) % 360;
  const background = `radial-gradient(circle at 22% 20%, hsla(${accentHue}, 92%, 74%, 0.3), transparent 28%), linear-gradient(145deg, hsla(${hue}, 52%, 24%, 0.94), rgba(15,23,42,0.92))`;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative flex h-[188px] w-[320px] flex-none snap-start overflow-hidden rounded-[24px] border border-white/10 text-left shadow-[0_24px_60px_-40px_rgba(0,0,0,0.85)] ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:border-white/20 lg:w-[320px]"
      style={{ backgroundImage: background }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02))]" />
      <div className="relative flex flex-1 flex-col justify-between p-4.5">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-slate-200/80">Category</div>
          <div className="mt-3 line-clamp-2 max-w-[12rem] text-[1.35rem] font-semibold leading-tight text-white">{category.name}</div>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-2xl font-semibold text-white">{category.count}</div>
            <div className="mt-1 text-xs text-slate-200/76">approved resources</div>
          </div>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition group-hover:bg-white/14">
            Open
          </span>
        </div>
      </div>
    </button>
  );
}

function PromoRailCard({ resource, variant = "compact" }) {
  const detailHref = `/marketplace/${resource.id}`;
  const artwork = getResourceArtwork(resource);
  const shellClassName = "h-[228px] w-[320px]";

  return (
    <article className={["group relative flex flex-none snap-start overflow-hidden rounded-[24px] border border-white/10 shadow-[0_20px_56px_-34px_rgba(0,0,0,0.82)] ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:border-white/20", shellClassName].join(" ")} style={{ backgroundImage: variant === "spotlight" ? artwork.spotlightBackground : artwork.cardBackground }}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_34%),linear-gradient(180deg,rgba(15,23,42,0.08),rgba(15,23,42,0.82)_76%)]" />
      <ResourceOwnerBadge
        resource={resource}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center overflow-hidden rounded-[13px] border border-white/18 text-sm font-semibold text-slate-950 shadow-[0_14px_30px_-18px_rgba(255,255,255,0.75)]"
        style={{ backgroundImage: artwork.chipBackground }}
      />
      <div className="relative flex flex-1 flex-col justify-between p-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-slate-100/78">{variant === "spotlight" ? "Spotlight" : (resource.category?.name || "Resource")}</div>
          <Link href={detailHref} className="mt-3 block line-clamp-2 max-w-[12rem] text-[1.2rem] font-semibold leading-tight text-white transition hover:text-sky-100">
            {resource.title}
          </Link>
          <p className="mt-2 line-clamp-3 max-w-[24ch] text-sm leading-6 text-slate-100/84">
            {resource.summary || "Open the resource to review the pack or linked source details."}
          </p>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div className="rounded-full border border-white/12 bg-slate-950/28 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-100/88">
            {resource.priceCents > 0 ? formatMoney(resource.priceCents, resource.currencyCode) : "Free"}
          </div>
          <Link href={detailHref} className="rounded-full border border-white/15 bg-white px-3.5 py-2 text-[11px] font-semibold text-slate-950 transition hover:bg-slate-100">
            Open
          </Link>
        </div>
      </div>
    </article>
  );
}

function PromoRail({ spotlightResource, supportingResources }) {
  const railRef = useRef(null);
  const items = [spotlightResource, ...supportingResources].filter(Boolean);

  function scrollRail(direction) {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: Math.max(rail.clientWidth * 0.9, 240) * direction, behavior: "smooth" });
  }

  if (!items.length) {
    return <div className="rounded-[30px] border border-dashed border-white/10 bg-white/[0.03] px-5 py-8 text-sm text-slate-300">Add more approved resources to populate the spotlight rail.</div>;
  }

  return (
    <section className="overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] ring-1 ring-white/10">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
        <div>
          <div className="text-base font-semibold text-white">Featured lane</div>
          <div className="mt-1 text-xs text-slate-400">Mixed promo picks beside the main hero.</div>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={() => scrollRail(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-slate-200 transition hover:border-white/20 hover:bg-white/[0.09] hover:text-white"
            aria-label="Scroll featured lane left"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12.5 4.5-5 5 5 5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scrollRail(1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-slate-200 transition hover:border-white/20 hover:bg-white/[0.09] hover:text-white"
            aria-label="Scroll featured lane right"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="m7.5 4.5 5 5-5 5" />
            </svg>
          </button>
        </div>
      </div>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-8 bg-gradient-to-r from-slate-950/55 to-transparent sm:block" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-8 bg-gradient-to-l from-slate-950/55 to-transparent sm:block" />
        <div ref={railRef} className="flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-4 py-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((resource, index) => (
            <PromoRailCard key={resource.id} resource={resource} variant={index === 0 ? "spotlight" : "compact"} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CreatedResourceCard({ resource, onEdit, onSubmitForReview, onArchive }) {
  const artwork = getResourceArtwork(resource);

  return (
    <article className="flex h-[430px] flex-col overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] shadow-[0_24px_60px_-40px_rgba(0,0,0,0.88)] ring-1 ring-white/10">
      <div className="relative h-32 border-b border-white/10" style={{ backgroundImage: artwork.heroBackground }}>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.02))]" />
        <div className="relative flex h-full items-start justify-between p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone(resource.status)}>{resource.status}</Badge>
            <ResourceFormatChip format={resource.resourceFormat} className="bg-slate-950/25" />
          </div>
          <ResourceOwnerBadge
            resource={resource}
            className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-[14px] border border-white/20 text-sm font-semibold text-slate-950 shadow-[0_14px_28px_-16px_rgba(255,255,255,0.75)]"
            style={{ backgroundImage: artwork.chipBackground }}
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4.5">
        <div>
          <div className="line-clamp-1 max-w-[16rem] text-[11px] uppercase tracking-[0.22em] text-slate-400">{resource.category?.name || "Uncategorised"}</div>
          <div className="mt-2 line-clamp-2 text-lg font-semibold text-white">{resource.title}</div>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-300">{resource.summary || resource.description || "Add a summary to improve how this resource appears in the storefront."}</p>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onEdit(resource);
            }}
            className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-white/[0.08] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.14] sm:hidden"
          >
            Open full editor
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">Updated {formatDate(resource.updatedAt) || "Recently"}</span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">{resource.downloadCount || 0} downloads</span>
        </div>
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onEdit(resource);
            }}
            className="hidden rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 sm:inline-flex"
          >
            Edit resource
          </button>
          {resource.status === "draft" ? (
            <button type="button" onClick={() => onSubmitForReview(resource)} className="rounded-full border border-sky-300/25 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/15">
              Submit for review
            </button>
          ) : null}
          <button type="button" onClick={() => onArchive(resource)} className="rounded-full border border-red-300/25 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/15">
            Archive
          </button>
        </div>
      </div>
    </article>
  );
}

function MobileHeroCard({ resource }) {
  const artwork = getResourceArtwork(resource);
  const detailHref = `/marketplace/${resource.id}`;

  return (
    <article className="relative h-[252px] overflow-hidden rounded-[24px] border border-white/10 shadow-[0_22px_56px_-36px_rgba(0,0,0,0.9)] ring-1 ring-white/10" style={{ backgroundImage: artwork.heroBackground }}>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08),rgba(15,23,42,0.74)_68%)]" />
      <div className="relative h-full p-4.5">
        <ResourceOwnerBadge
          resource={resource}
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center overflow-hidden rounded-[14px] border border-white/18 text-sm font-semibold text-slate-950 shadow-[0_14px_30px_-18px_rgba(255,255,255,0.8)]"
          style={{ backgroundImage: artwork.chipBackground }}
        />
        <div className="flex h-full flex-col justify-end">
          <div className="flex flex-wrap items-center gap-2">
            {resource.status !== "approved" ? <Badge tone={statusTone(resource.status)}>{resource.status}</Badge> : null}
            <ResourceFormatChip format={resource.resourceFormat} className="bg-slate-950/28" />
            <span className="rounded-full border border-white/12 bg-slate-950/28 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-100/90">{resource.category?.name || "Resource"}</span>
          </div>
          <div className="mt-4 line-clamp-2 max-w-[14rem] text-[1.55rem] font-semibold leading-[1.1] text-white">{resource.title}</div>
          <p className="mt-3 max-w-[16rem] text-sm leading-6 text-slate-100/84">{resource.summary || resource.description || "Open the resource to review the full pack details."}</p>
          <div className="mt-5 flex items-end justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-white">{resource.priceCents > 0 ? formatMoney(resource.priceCents, resource.currencyCode) : "Free"}</div>
              <div className="mt-1 text-xs text-slate-100/70">{resource.downloadCount || 0} downloads</div>
            </div>
            <Link href={detailHref} className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-slate-100">
              Open
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function MobilePromoBillboard({ resource, eyebrow = "Featured" }) {
  const artwork = getResourceArtwork(resource);
  const detailHref = `/marketplace/${resource.id}`;

  return (
    <article className="relative h-[206px] overflow-hidden rounded-[22px] border border-white/10 shadow-[0_20px_50px_-34px_rgba(0,0,0,0.86)] ring-1 ring-white/10" style={{ backgroundImage: artwork.panelBackground }}>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.1),rgba(15,23,42,0.82)_74%)]" />
      <div className="relative h-full p-4.5">
        <div className="absolute inset-y-0 right-0 w-[48%] opacity-85" style={{ backgroundImage: artwork.cardBackground }} />
        <div className="absolute inset-y-0 right-0 w-[48%] bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02))]" />
        <div className="relative flex h-full max-w-[52%] flex-col justify-end">
          <div className="text-[11px] uppercase tracking-[0.24em] text-slate-100/76">{eyebrow}</div>
          <div className="mt-3 line-clamp-2 text-[1.35rem] font-semibold leading-[1.12] text-white">{resource.title}</div>
          <div className="mt-2 line-clamp-3 text-sm leading-6 text-slate-100/80">{resource.summary || "Explore the resource details."}</div>
          <Link href={detailHref} className="mt-4 inline-flex w-fit rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-slate-100">
            View resource
          </Link>
        </div>
      </div>
    </article>
  );
}

function MobileMiniPromoCard({ resource }) {
  const artwork = getResourceArtwork(resource);
  const detailHref = `/marketplace/${resource.id}`;

  return (
    <article className="relative h-[132px] overflow-hidden rounded-[20px] border border-white/10 shadow-[0_18px_44px_-30px_rgba(0,0,0,0.82)] ring-1 ring-white/10" style={{ backgroundImage: artwork.cardBackground }}>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(15,23,42,0.82)_78%)]" />
      <div className="relative h-full p-3.5">
        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-100/76">{resource.category?.name || "Resource"}</div>
        <div className="mt-8 line-clamp-2 max-w-[10rem] text-[1.05rem] font-semibold leading-tight text-white">{resource.title}</div>
        <Link href={detailHref} className="mt-3 inline-flex rounded-full border border-white/15 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-950 transition hover:bg-slate-100">
          Open
        </Link>
      </div>
    </article>
  );
}

function GalleryShelf({ title, subtitle, items, emptyTitle, emptyBody }) {
  const railRef = useRef(null);

  function scrollRail(direction) {
    const rail = railRef.current;
    if (!rail) return;
    const amount = Math.max(rail.clientWidth * 0.82, 280) * direction;
    rail.scrollBy({ left: amount, behavior: "smooth" });
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-white">{title}</div>
          {subtitle ? <div className="mt-1 text-sm text-slate-400">{subtitle}</div> : null}
        </div>
        {items.length ? (
          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={() => scrollRail(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-slate-200 transition hover:border-white/20 hover:bg-white/[0.09] hover:text-white"
              aria-label={`Scroll ${title} left`}
            >
              <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12.5 4.5-5 5 5 5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollRail(1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-slate-200 transition hover:border-white/20 hover:bg-white/[0.09] hover:text-white"
              aria-label={`Scroll ${title} right`}
            >
              <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="m7.5 4.5 5 5-5 5" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>

      {items.length ? (
        <div className="relative -mx-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-10 bg-gradient-to-r from-slate-950/50 to-transparent sm:block" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-10 bg-gradient-to-l from-slate-950/50 to-transparent sm:block" />
          <div ref={railRef} className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-3 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {items.map((resource, index) => (
              <LibraryGalleryCard key={resource.id} resource={resource} />
            ))}
          </div>
        </div>
      ) : (
        <EmptyState title={emptyTitle} body={emptyBody} />
      )}
    </section>
  );
}

function DiscoverListRow({ resource }) {
  const detailHref = `/marketplace/${resource.id}`;
  const artwork = getResourceArtwork(resource);
  const priceLabel = resource.priceCents > 0 ? formatMoney(resource.priceCents, resource.currencyCode) : "Free";
  const accessLabel = resource.resourceType === "external" ? (resource.sourceName || "External source") : "Resource file";
  const metaLabel = resource.category?.name || accessLabel;
  const updatedLabel = formatDate(resource.updatedAt || resource.createdAt);

  return (
    <article
      className="h-[188px] overflow-hidden rounded-[24px] border border-white/10 shadow-[0_18px_48px_-38px_rgba(0,0,0,0.85)] ring-1 ring-white/10 transition hover:border-white/20 hover:bg-white/[0.06]"
      style={{ backgroundImage: artwork.panelBackground }}
    >
      <div className="flex gap-3.5 p-3.5 sm:items-center sm:gap-4 sm:p-4">
        <div className="flex min-w-0 flex-1 gap-3.5 sm:items-center sm:gap-4">
          <ResourceOwnerBadge
            resource={resource}
            className="flex h-[72px] w-[72px] flex-none items-center justify-center overflow-hidden rounded-[20px] border border-white/12 text-base font-semibold text-slate-950 shadow-[0_16px_36px_-24px_rgba(0,0,0,0.8)] sm:h-16 sm:w-16"
            style={{ backgroundImage: artwork.chipBackground }}
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {resource.status !== "approved" ? <Badge tone={statusTone(resource.status)}>{resource.status}</Badge> : null}
              <ResourceFormatChip format={resource.resourceFormat} className="bg-slate-950/40" />
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{metaLabel}</div>
            </div>
            <Link href={detailHref} className="mt-2 block line-clamp-2 text-[15px] font-semibold leading-5 text-white transition hover:text-sky-100 sm:line-clamp-1 sm:text-lg sm:leading-6">
              {resource.title}
            </Link>
            <p className="mt-1.5 line-clamp-1 max-w-2xl text-sm leading-5 text-slate-400 sm:line-clamp-2 sm:leading-6">{resource.summary || accessLabel}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
              {(resource.tags || []).slice(0, 3).map((tag) => (
                <span key={tag.id} className="max-w-[112px] truncate rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
                  {tag.name}
                </span>
              ))}
              {updatedLabel ? <span className="rounded-full border border-transparent bg-slate-950/35 px-3 py-1">Updated {updatedLabel}</span> : null}
            </div>
          </div>
        </div>

        <div className="flex min-w-[88px] flex-col items-end justify-between gap-2 sm:min-w-[148px] sm:justify-center">
          <div className="text-right">
            <div className="text-base font-semibold text-white sm:text-lg">{priceLabel}</div>
            <div className="mt-1 text-xs text-slate-400">{resource.downloadCount || 0} downloads</div>
          </div>
          <Link href={detailHref} className="rounded-full bg-white px-3.5 py-2 text-[11px] font-semibold text-slate-950 transition hover:bg-slate-100 sm:px-4 sm:text-xs">
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function MarketplacePageClient() {
  const { session, loading: authLoading, authError } = useAuth();
  const signedIn = Boolean(session);
  const router = useRouter();
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
  const [orders, setOrders] = useState([]);
  const [payoutAccount, setPayoutAccount] = useState(null);
  const [payoutLedger, setPayoutLedger] = useState([]);
  const [accountPaging, setAccountPaging] = useState({
    library: { limit: 0, hasMore: false },
    created: { limit: 0, hasMore: false },
    orders: { limit: 0, hasMore: false },
    payoutLedger: { limit: 0, hasMore: false },
    tags: { limit: 0, hasMore: false },
  });

  const [resourceForm, setResourceForm] = useState(DEFAULT_RESOURCE_FORM);
  const [requestForm, setRequestForm] = useState(DEFAULT_REQUEST_FORM);
  const [payoutForm, setPayoutForm] = useState(DEFAULT_PAYOUT_FORM);
  const [resourceFile, setResourceFile] = useState(null);
  const [discoverFilter, setDiscoverFilter] = useState({ search: "", type: "", categoryId: "" });
  const [mobileFilterPanel, setMobileFilterPanel] = useState(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileHeroIndex, setMobileHeroIndex] = useState(0);
  const [accountArea, setAccountArea] = useState("library");
  const [loadedTabs, setLoadedTabs] = useState({
    discover: false,
    submit: false,
    requests: false,
    account: false,
  });

  const loadPublicData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [categoriesRes, resourcesRes] = await Promise.all([
        apiGet("/api/resources/categories"),
        apiGet("/api/resources?view=card&limit=120"),
      ]);

      setCategories(categoriesRes.categories || []);
      setResources(resourcesRes.resources || []);
      setCanCreateResources(Boolean(resourcesRes.canCreateResources));
      setCreateResourceRequirementMessage(resourcesRes.createResourceRequirementMessage || "");
      setLoadedTabs((prev) => ({ ...prev, discover: true }));
    } catch (nextError) {
      setError(nextError.message || "Unable to load marketplace data.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAdminStatus = useCallback(async (currentSession) => {
    if (!currentSession) {
      setIsAdmin(false);
      return;
    }

    try {
      await apiGet("/api/resources/review?status=pending");
      setIsAdmin(true);
    } catch {
      setIsAdmin(false);
    }
  }, []);

  const loadTabData = useCallback(async (tabKey, currentSession, { force = false } = {}) => {
    if (!currentSession || tabKey === "discover") return;
    if (!force && loadedTabs[tabKey]) return;

    setLoading(true);
    setError("");

    try {
      if (tabKey === "submit") {
        const [tagsRes, mineRes] = await Promise.all([
          apiGet("/api/resources/tags"),
          apiGet("/api/resources?mine=1"),
        ]);

        setTags(tagsRes.tags || []);
        setMyResources(mineRes.resources || []);
      }

      if (tabKey === "requests") {
        const requestsRes = await apiGet("/api/resources/requests");
        setRequests(requestsRes.requests || []);
      }

      if (tabKey === "account") {
        const accountRes = await apiGet("/api/resources/account?libraryLimit=120&createdLimit=120&ordersLimit=120&payoutLedgerLimit=160&tagsLimit=120");
        setLibrary(accountRes.library || []);
        setOrders(accountRes.orders || []);
        setMyResources(accountRes.myResources || []);
        setTags(accountRes.tags || []);
        setPayoutAccount(accountRes.payoutAccount || null);
        setPayoutLedger(accountRes.payoutLedger || []);
        setAccountPaging(accountRes.paging || {
          library: { limit: 0, hasMore: false },
          created: { limit: 0, hasMore: false },
          orders: { limit: 0, hasMore: false },
          payoutLedger: { limit: 0, hasMore: false },
          tags: { limit: 0, hasMore: false },
        });
      }

      setLoadedTabs((prev) => ({ ...prev, [tabKey]: true }));
    } catch (nextError) {
      setError(nextError.message || "Unable to load marketplace data.");
    } finally {
      setLoading(false);
    }
  }, [loadedTabs]);

  useEffect(() => {
    let mounted = true;

    function clearPrivateMarketplaceState() {
      setIsAdmin(false);
      setCanCreateResources(false);
      setCreateResourceRequirementMessage("");
      setMyResources([]);
      setLibrary([]);
      setRequests([]);
      setOrders([]);
      setPayoutAccount(null);
      setPayoutLedger([]);
      setAccountPaging({
        library: { limit: 0, hasMore: false },
        created: { limit: 0, hasMore: false },
        orders: { limit: 0, hasMore: false },
        payoutLedger: { limit: 0, hasMore: false },
        tags: { limit: 0, hasMore: false },
      });
      setLoadedTabs({
        discover: false,
        submit: false,
        requests: false,
        account: false,
      });
    }

    async function syncMarketplace() {
      if (authLoading) return;

      if (!session) {
        if (!mounted) return;
        clearPrivateMarketplaceState();
        await loadPublicData();
        return;
      }

      try {
        if (!mounted) return;
        await loadPublicData();
        void loadAdminStatus(session);
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
  }, [authLoading, loadAdminStatus, loadPublicData, session]);

  useEffect(() => {
    if (authLoading || !session || activeTab === "discover") return;

    void loadTabData(activeTab, session);
  }, [activeTab, authLoading, loadTabData, session]);

  useEffect(() => {
    if (!signedIn && activeTab !== "discover") {
      setActiveTab("discover");
    }
  }, [activeTab, signedIn]);

  useEffect(() => {
    if (!payoutAccount) return;

    setPayoutForm({
      provider: payoutAccount.provider || "stripe_connect",
      providerAccountId: payoutAccount.providerAccountId || "",
      countryCode: payoutAccount.countryCode || "AU",
      currencyCode: payoutAccount.currencyCode || "AUD",
    });
  }, [payoutAccount]);

  useEffect(() => {
    if (activeTab !== "discover") {
      setMobileFilterPanel(null);
      setMobileSearchOpen(false);
    }
  }, [activeTab]);

  const discoverResources = useMemo(() => {
    const searchTerm = discoverFilter.search.trim().toLowerCase();

    return resources.filter((resource) => {
      if (searchTerm) {
        const searchSource = [
          resource.title,
          resource.summary,
          resource.description,
          resource.category?.name,
          ...(resource.tags || []).map((tag) => tag.name),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchSource.includes(searchTerm)) return false;
      }
      if (discoverFilter.type && resource.resourceType !== discoverFilter.type) return false;
      if (discoverFilter.categoryId && resource.categoryId !== discoverFilter.categoryId) return false;
      return true;
    });
  }, [discoverFilter, resources]);

  const featuredResources = useMemo(() => discoverResources.slice(0, 3), [discoverResources]);
  const mobileHeroResources = useMemo(() => discoverResources.slice(0, 5), [discoverResources]);

  const trendingResources = useMemo(() => {
    return [...discoverResources]
      .sort((left, right) => (Number(right.downloadCount || 0) - Number(left.downloadCount || 0)) || right.updatedAt?.localeCompare?.(left.updatedAt || "") || 0)
      .slice(0, 4);
  }, [discoverResources]);

  const heroResource = useMemo(() => featuredResources[0] || discoverResources[0] || null, [discoverResources, featuredResources]);

  const spotlightResource = useMemo(() => {
    const spotlightPool = [...featuredResources.slice(1), ...trendingResources, ...discoverResources];
    return spotlightPool.find((resource) => resource.id !== heroResource?.id) || null;
  }, [discoverResources, featuredResources, heroResource?.id, trendingResources]);

  const supportingResources = useMemo(() => {
    const blockedIds = new Set([heroResource?.id, spotlightResource?.id].filter(Boolean));
    return discoverResources.filter((resource) => !blockedIds.has(resource.id)).slice(0, 2);
  }, [discoverResources, heroResource?.id, spotlightResource?.id]);
  const homeShelfResources = useMemo(() => {
    const blockedIds = new Set([heroResource?.id, spotlightResource?.id].filter(Boolean));
    return discoverResources.filter((resource) => !blockedIds.has(resource.id)).slice(0, 8);
  }, [discoverResources, heroResource?.id, spotlightResource?.id]);
  const mobileHeroResource = useMemo(() => {
    if (!mobileHeroResources.length) return heroResource;
    return mobileHeroResources[mobileHeroIndex] || mobileHeroResources[0];
  }, [heroResource, mobileHeroIndex, mobileHeroResources]);
  const mobilePromoResources = useMemo(() => {
    const candidates = [spotlightResource, ...supportingResources, ...trendingResources].filter(Boolean);
    const seen = new Set();
    return candidates.filter((resource) => {
      if (seen.has(resource.id) || resource.id === mobileHeroResource?.id) return false;
      seen.add(resource.id);
      return true;
    });
  }, [mobileHeroResource?.id, spotlightResource, supportingResources, trendingResources]);

  const heroArtwork = useMemo(() => (heroResource ? getResourceArtwork(heroResource) : null), [heroResource]);
  const spotlightArtwork = useMemo(() => (spotlightResource ? getResourceArtwork(spotlightResource) : null), [spotlightResource]);
  const libraryShelves = useMemo(() => {
    const sorted = [...library].sort(
      (left, right) =>
        new Date(right.updatedAt || right.createdAt || 0).getTime() - new Date(left.updatedAt || left.createdAt || 0).getTime()
    );

    return {
      recentlyAdded: sorted,
      purchased: sorted.filter((resource) => !resource.ownedByUser && Number(resource.priceCents || 0) > 0),
      freeAccess: sorted.filter((resource) => !resource.ownedByUser && Number(resource.priceCents || 0) === 0),
    };
  }, [library]);

  useEffect(() => {
    if (!mobileHeroResources.length) {
      setMobileHeroIndex(0);
      return;
    }

    setMobileHeroIndex((currentIndex) => (currentIndex >= mobileHeroResources.length ? 0 : currentIndex));
  }, [mobileHeroResources]);

  useEffect(() => {
    if (activeTab !== "discover" || mobileHeroResources.length < 2) return undefined;

    const timer = window.setInterval(() => {
      setMobileHeroIndex((currentIndex) => (currentIndex + 1) % mobileHeroResources.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [activeTab, mobileHeroResources]);

  const tabs = useMemo(() => {
    if (!signedIn) {
      return [
        { key: "discover", label: "Home", hint: "Browse approved hosted packs and external sources.", icon: "discover", group: "primary" },
      ];
    }

    const baseTabs = [
      { key: "discover", label: "Home", hint: "Browse approved hosted packs and external sources.", icon: "discover", group: "primary" },
      { key: "submit", label: "Submit", hint: "Create hosted or external listings and send them for review.", icon: "submit", group: "primary" },
      { key: "requests", label: "Requests", hint: "Track industry requests and bounty opportunities.", icon: "requests", group: "primary" },
      { key: "account", label: "My Account", hint: "Manage your library, orders, and user-specific marketplace activity.", icon: "library", group: "secondary" },
    ];
    if (isAdmin) {
      baseTabs.push({ key: "admin", label: "Admin", hint: "Review submissions and manage marketplace administration.", icon: "review", group: "secondary", href: "/marketplace/admin" });
    }
    return baseTabs;
  }, [isAdmin, signedIn]);

  const primaryTabs = useMemo(() => tabs.filter((tab) => tab.group === "primary"), [tabs]);
  const secondaryTabs = useMemo(() => tabs.filter((tab) => tab.group === "secondary"), [tabs]);
  const accountAreas = useMemo(() => ([
    { key: "library", label: "Library", meta: `${library.length} items` },
    { key: "created", label: "Created", meta: `${myResources.length} resources` },
    { key: "orders", label: "Orders", meta: `${orders.length} orders` },
    { key: "payouts", label: "Payouts", meta: payoutLedger.length ? `${payoutLedger.length} entries` : "Seller details" },
  ]), [library.length, myResources.length, orders.length, payoutLedger.length]);

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

  function invalidateTabs(tabKeys) {
    setLoadedTabs((prev) => {
      const next = { ...prev };
      tabKeys.forEach((key) => {
        next[key] = false;
      });
      return next;
    });
  }

  async function refreshMarketplace(tabKey = activeTab, { refreshDiscover = true } = {}) {
    if (refreshDiscover) {
      await loadPublicData();
    }

    if (session && tabKey !== "discover") {
      await loadTabData(tabKey, session, { force: true });
    }
  }

  function resetMessages() {
    setError("");
    setSuccess("");
  }

  function handleTabSelect(tab) {
    if (tab?.href) {
      router.push(tab.href);
      return;
    }

    setActiveTab(tab.key);
  }

  function beginEditResource(resource) {
    if (!resource?.id) return;
    router.push(`/marketplace/${resource.id}/edit`);
  }

  async function handleAccess(resource) {
    resetMessages();
    try {
      const body = await apiSend(`/api/resources/${resource.id}/access`, "POST");
      const targetUrl = body.signedUrl || body.sourceUrl;
      if (!targetUrl) throw new Error("No access URL returned.");
      window.open(targetUrl, "_blank", "noopener,noreferrer");
      if (activeTab === "discover" || activeTab === "account") {
        invalidateTabs(["account"]);
        await refreshMarketplace(activeTab);
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

    if (!resourceForm.resourceFormat) {
      setError("Resource format is required.");
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
            resourceFormat: resourceForm.resourceFormat,
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
        invalidateTabs(["submit", "account"]);
        await refreshMarketplace("account");
        setActiveTab("account");
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
        invalidateTabs(["submit"]);
        await refreshMarketplace("submit");
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
        invalidateTabs(["submit", "account"]);
        await refreshMarketplace("submit");
      } catch (nextError) {
        setError(nextError.message || "Unable to archive resource.");
      }
    });
  }

  async function handleSavePayoutAccount(event) {
    event.preventDefault();
    resetMessages();

    startBusyAction(async () => {
      try {
        const result = await apiSend("/api/resources/payout-account", "PUT", payoutForm);
        if (result?.payoutAccount) {
          setPayoutAccount(result.payoutAccount);
        }
        setSuccess("Payout details saved.");
      } catch (nextError) {
        setError(nextError.message || "Unable to save payout details.");
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
        invalidateTabs(["requests"]);
        await refreshMarketplace("requests", { refreshDiscover: false });
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
        invalidateTabs(["requests"]);
        await refreshMarketplace("requests", { refreshDiscover: false });
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
        invalidateTabs(["account"]);
        await refreshMarketplace("account", { refreshDiscover: false });
        setActiveTab("account");
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
        invalidateTabs(["account"]);
        await refreshMarketplace("account", { refreshDiscover: false });
      } catch (nextError) {
        setError(nextError.message || `Unable to mark order ${status}.`);
      }
    });
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
                  active={tab.key === activeTab}
                  label={tab.label}
                  icon={tab.icon}
                  onClick={() => handleTabSelect(tab)}
                />
              ))}
            </div>

            <div className="mt-auto space-y-1 border-t border-white/10 pt-3.5">
              {secondaryTabs.map((tab) => (
                <SidebarTabButton
                  key={tab.key}
                  active={tab.key === activeTab}
                  label={tab.label}
                  icon={tab.icon}
                  onClick={() => handleTabSelect(tab)}
                />
              ))}
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 px-4 pb-6 pt-0 sm:px-6 sm:pb-6 sm:pt-0 lg:px-6 lg:py-7 xl:px-8">
          <div className="sticky top-[64px] z-30 -mx-4 bg-[linear-gradient(180deg,rgba(2,6,23,0.97),rgba(2,6,23,0.9))] px-4 pb-1 pt-0 backdrop-blur-md sm:-mx-6 sm:px-6 lg:hidden">
            <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-max gap-4 border-b border-white/10 px-1 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)]">
              {tabs.map((tab) => (
                <TabButton
                  key={tab.key}
                  active={tab.key === activeTab}
                  label={tab.label}
                  onClick={() => handleTabSelect(tab)}
                />
              ))}
              </div>
            </div>
          </div>

          <div className="mt-5 min-w-0 lg:mt-0">
          {!signedIn ? (
            <section className="mb-6 overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] px-5 py-5 ring-1 ring-white/10">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">Marketplace</div>
                  <div className="mt-2 text-2xl font-semibold text-white">Browse approved industry resources without signing in.</div>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
                    Sign in to download resources, manage your library, submit resource packs, and access seller workflows.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/login?redirect=%2Fmarketplace" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
                    Sign in
                  </Link>
                  <Link href="/signup?redirect=%2Fmarketplace" className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
                    Create account
                  </Link>
                </div>
              </div>
            </section>
          ) : null}
          {error ? <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">{error}</div> : null}
          {authError && session ? <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">{authError}</div> : null}
          {success ? <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">{success}</div> : null}
          {loading ? <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-6 text-sm text-slate-300">Loading marketplace data...</div> : null}

          <div className="space-y-6">
        {activeTab === "discover" ? (
          <>
            <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.035))] p-3.5 shadow-[0_28px_80px_-48px_rgba(0,0,0,0.82)] ring-1 ring-white/10 sm:p-4">
              <div className="space-y-3 lg:hidden">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMobileSearchOpen((current) => !current)}
                    className={["flex h-11 w-11 flex-none items-center justify-center rounded-full border transition", mobileSearchOpen ? "border-sky-300/40 bg-white text-slate-950" : "border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/[0.09]"] .join(" ")}
                    aria-label="Toggle search"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="7" />
                      <path d="m20 20-3.5-3.5" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileFilterPanel((current) => (current === "filters" ? null : "filters"))}
                    className={["flex h-11 w-11 flex-none items-center justify-center rounded-full border transition", mobileFilterPanel === "filters" ? "border-sky-300/40 bg-white text-slate-950" : "border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/[0.09]"] .join(" ")}
                    aria-label="Toggle access filters"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 7h16" />
                      <path d="M7 12h10" />
                      <path d="M10 17h4" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileFilterPanel((current) => (current === "categories" ? null : "categories"))}
                    className={["flex h-11 w-11 flex-none items-center justify-center rounded-full border transition", mobileFilterPanel === "categories" ? "border-sky-300/40 bg-white text-slate-950" : "border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/[0.09]"] .join(" ")}
                    aria-label="Toggle category filters"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="5" width="6" height="6" rx="1.5" />
                      <rect x="14" y="5" width="6" height="6" rx="1.5" />
                      <rect x="4" y="13" width="6" height="6" rx="1.5" />
                      <rect x="14" y="13" width="6" height="6" rx="1.5" />
                    </svg>
                  </button>
                </div>

                {mobileSearchOpen ? (
                  <div className="relative">
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="7" />
                      <path d="m20 20-3.5-3.5" />
                    </svg>
                    <TextInput
                      value={discoverFilter.search}
                      onChange={(event) => setDiscoverFilter((prev) => ({ ...prev, search: event.target.value }))}
                      placeholder="Search"
                      className="h-10 rounded-full border-white/10 bg-slate-950/72 pl-11 pr-10 text-[13px]"
                    />
                    {discoverFilter.search ? (
                      <button
                        type="button"
                        onClick={() => setDiscoverFilter((prev) => ({ ...prev, search: "" }))}
                        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-slate-200"
                        aria-label="Clear search"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 6l12 12" />
                          <path d="M18 6 6 18" />
                        </svg>
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {mobileFilterPanel ? (
                  <div className="space-y-3 rounded-[22px] border border-white/10 bg-slate-950/42 p-3.5 backdrop-blur-sm">
                    {mobileFilterPanel === "filters" ? (
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: "All", value: "" },
                          { label: "External", value: "external" },
                        ].map((option) => {
                          const active = discoverFilter.type === option.value;
                          return (
                            <button
                              key={option.label}
                              type="button"
                              onClick={() => setDiscoverFilter((prev) => ({ ...prev, type: option.value }))}
                              className={[
                                "rounded-full border px-3.5 py-2 text-sm font-semibold transition",
                                active ? "border-sky-300/40 bg-white text-slate-950" : "border-white/10 bg-white/[0.04] text-slate-200",
                              ].join(" ")}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setDiscoverFilter((prev) => ({ ...prev, categoryId: "" }))}
                          className={[
                            "rounded-full border px-3.5 py-2 text-sm font-semibold transition",
                            !discoverFilter.categoryId ? "border-sky-300/40 bg-white text-slate-950" : "border-white/10 bg-white/[0.04] text-slate-200",
                          ].join(" ")}
                        >
                          All categories
                        </button>
                        {categoryHighlights.map((category) => {
                          const active = discoverFilter.categoryId === category.id;
                          return (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() => setDiscoverFilter((prev) => ({ ...prev, categoryId: category.id }))}
                              className={[
                                "rounded-full border px-3.5 py-2 text-sm font-semibold transition",
                                active ? "border-sky-300/40 bg-white text-slate-950" : "border-white/10 bg-white/[0.04] text-slate-200",
                              ].join(" ")}
                            >
                              {category.name}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {(discoverFilter.search || discoverFilter.type || discoverFilter.categoryId) ? (
                      <button
                        type="button"
                        onClick={() => {
                          setDiscoverFilter({ search: "", type: "", categoryId: "" });
                          setMobileFilterPanel(null);
                        }}
                        className="text-sm font-semibold text-sky-200"
                      >
                        Clear filters
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="hidden flex-col gap-2.5 lg:flex xl:flex-row xl:items-center">
                <div className="relative flex-1">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                  <TextInput
                    value={discoverFilter.search}
                    onChange={(event) => setDiscoverFilter((prev) => ({ ...prev, search: event.target.value }))}
                    placeholder="Search packs, templates, workflows, references, and field resources"
                    className="h-12 rounded-full border-white/10 bg-slate-950/80 pl-11 pr-4 text-[15px]"
                  />
                </div>
                <div className="flex flex-col gap-2.5 sm:flex-row xl:flex-none">
                  <Select value={discoverFilter.type} onChange={(event) => setDiscoverFilter((prev) => ({ ...prev, type: event.target.value }))} className="h-12 min-w-[158px] rounded-full border-white/10 bg-slate-950/80 text-[13px]">
                    <option value="">All access types</option>
                    <option value="external">External</option>
                  </Select>
                  <Select value={discoverFilter.categoryId} onChange={(event) => setDiscoverFilter((prev) => ({ ...prev, categoryId: event.target.value }))} className="h-12 min-w-[176px] rounded-full border-white/10 bg-slate-950/80 text-[13px]">
                    <option value="">All categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </Select>
                  {(discoverFilter.search || discoverFilter.type || discoverFilter.categoryId) ? (
                    <button
                      type="button"
                      onClick={() => setDiscoverFilter({ search: "", type: "", categoryId: "" })}
                      className="h-12 rounded-full border border-white/10 bg-white/[0.04] px-4.5 text-[13px] font-semibold text-white transition hover:bg-white/[0.08]"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>

            </section>

            <section className="space-y-4 lg:hidden">
              {mobileHeroResource ? <MobileHeroCard resource={mobileHeroResource} /> : null}

              {mobileHeroResources.length > 1 ? (
                <div className="flex items-center justify-center gap-2">
                  {mobileHeroResources.map((resource, index) => (
                    <button
                      key={resource.id}
                      type="button"
                      onClick={() => setMobileHeroIndex(index)}
                      className={index === mobileHeroIndex ? "h-2.5 w-2.5 rounded-full bg-slate-200" : "h-2 w-2 rounded-full bg-slate-500/60 transition hover:bg-slate-300/80"}
                      aria-label={`Show featured resource ${index + 1}`}
                    />
                  ))}
                </div>
              ) : null}

              {mobilePromoResources[0] ? <MobilePromoBillboard resource={mobilePromoResources[0]} eyebrow="Spotlight" /> : null}

              <div className="grid grid-cols-2 gap-3.5">
                {mobilePromoResources.slice(1, 3).map((resource) => (
                  <MobileMiniPromoCard key={resource.id} resource={resource} />
                ))}
              </div>
            </section>

            <section className="hidden gap-3.5 lg:grid lg:grid-cols-[minmax(0,1.62fr),320px] xl:grid-cols-[minmax(0,1.72fr),332px]">
              {heroResource ? (
                <article className="relative overflow-hidden rounded-[24px] border border-white/10 shadow-[0_18px_52px_-36px_rgba(0,0,0,0.52)] ring-1 ring-white/10" style={{ backgroundImage: heroArtwork?.heroBackground }}>
                  <div className="relative min-h-[336px] overflow-hidden p-5 sm:p-6">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />
                    <div className="absolute -right-10 top-5 h-32 w-32 rounded-full border border-white/15 bg-white/10 backdrop-blur-md" />
                    <div className="absolute bottom-[-8%] right-[18%] h-28 w-28 rounded-[30px] border border-white/15 bg-slate-950/18 rotate-12" />
                    <ResourceOwnerBadge
                      resource={heroResource}
                      className="absolute left-7 top-7 flex h-14 w-14 items-center justify-center overflow-hidden rounded-[18px] border border-white/20 text-base font-semibold text-slate-950 shadow-[0_10px_26px_-12px_rgba(255,255,255,0.7)]"
                      style={{ backgroundImage: heroArtwork?.chipBackground }}
                    />
                    <div className="relative z-10 flex h-full flex-col justify-between gap-8 pt-16">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={statusTone(heroResource.status)}>{heroResource.status}</Badge>
                          <ResourceFormatChip format={heroResource.resourceFormat} />
                          {heroResource.category?.name ? <Badge tone="border-sky-300/20 bg-sky-500/10 text-sky-100">{heroResource.category.name}</Badge> : null}
                        </div>
                        <div className="mt-6 max-w-[34rem]">
                          <div className="text-[11px] uppercase tracking-[0.28em] text-slate-200">Featured pack</div>
                          <div className="mt-3 max-w-[28rem] text-[2rem] font-semibold tracking-tight text-white sm:text-[2.35rem]">{heroResource.title}</div>
                          <p className="mt-3 line-clamp-2 max-w-[23rem] text-sm leading-5 text-slate-100/85 sm:text-[14px]">{heroResource.summary || heroResource.description || "Open the resource to review the full pack details."}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-end justify-between gap-3.5">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <div className="rounded-[18px] border border-white/10 bg-slate-950/24 px-3.5 py-2.5 text-sm text-slate-100 backdrop-blur-sm">
                            <div className="font-semibold text-white">{heroResource.priceCents > 0 ? formatMoney(heroResource.priceCents, heroResource.currencyCode) : "Free"}</div>
                            <div className="mt-1 text-xs text-slate-300/80">{heroResource.downloadCount || 0} downloads</div>
                          </div>
                          <div className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-slate-100">
                            {heroResource.resourceType === "external" ? (heroResource.sourceName || "External reference") : "Resource file"}
                          </div>
                        </div>
                        <Link href={`/marketplace/${heroResource.id}`} className="rounded-full bg-white px-4.5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 hover:shadow-[0_12px_24px_-14px_rgba(255,255,255,0.65)]">
                          View resource
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              ) : (
                <EmptyState title="No featured resources available." body="Approved resources that match your current filters will appear here." />
              )}

              <PromoRail spotlightResource={spotlightResource} supportingResources={supportingResources} />
            </section>

            <div className="lg:hidden">
              <ScrollShelf
                title="More to explore"
                subtitle="Swipe through new marketplace picks."
                metaLabel="Storefront lane"
              >
                {homeShelfResources.length ? homeShelfResources.map((resource) => (
                    <MarketplaceShelfCard key={resource.id} resource={resource} />
                )) : <div className="py-2 text-sm text-slate-400">New resources will appear here as the approved catalogue grows.</div>}
              </ScrollShelf>
            </div>

            <div className="hidden lg:block">
            <ScrollShelf
              title="Fresh in marketplace"
              subtitle="A billboard-style shelf with consistent card sizes for cleaner scanning."
              metaLabel="Storefront lane"
            >
              {homeShelfResources.length ? homeShelfResources.map((resource) => (
                <MarketplaceShelfCard key={resource.id} resource={resource} />
              )) : <div className="py-2 text-sm text-slate-400">New resources will appear here as the approved catalogue grows.</div>}
            </ScrollShelf>
            </div>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1.32fr),minmax(0,1fr)]">
              <ScrollShelf title="Trending resources" subtitle="High-activity items presented as a card rail for quick scanning." metaLabel="Top activity">
                {trendingResources.length ? trendingResources.map((resource) => (
                  <MarketplaceShelfCard key={resource.id} resource={resource} />
                )) : <div className="py-2 text-sm text-slate-400">Trending resources will appear once usage data builds up.</div>}
              </ScrollShelf>

              <ScrollShelf title="Browse categories" subtitle="Jump into the strongest parts of the catalogue with one tap." metaLabel="Quick filters">
                {categoryHighlights.length ? categoryHighlights.map((category) => (
                  <CategoryShelfCard
                    key={category.id}
                    category={category}
                    onSelect={() => setDiscoverFilter((prev) => ({ ...prev, categoryId: category.id }))}
                  />
                )) : <div className="py-2 text-sm text-slate-400">Categories will populate here once resources are approved.</div>}
              </ScrollShelf>
            </section>

            <SectionCard
              title="Discover resources"
              subtitle="Approved hosted packs and curated external industry sources, kept as a denser browse-all list below the hero shelves."
            >
              {discoverResources.length ? (
                <div className="space-y-3">
                  {discoverResources.map((resource) => (
                    <DiscoverListRow key={resource.id} resource={resource} />
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
                  <Field label="Resource format" hint="Used to display the marketplace icon for this resource.">
                    <Select value={resourceForm.resourceFormat} onChange={(event) => setResourceForm((prev) => ({ ...prev, resourceFormat: event.target.value }))} required>
                      {RESOURCE_FORMAT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </Select>
                  </Field>
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
                    Open consultant settings
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

        {activeTab === "account" ? (
          <div className="space-y-6">
            <SectionCard title="My Account" subtitle="Move between your library, created listings, orders, and payout setup with a single account workspace.">
              <div className="space-y-6">
                <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="flex min-w-max gap-3">
                    {accountAreas.map((area) => (
                      <AccountTopTab
                        key={area.key}
                        active={accountArea === area.key}
                        label={area.label}
                        meta={area.meta}
                        onClick={() => setAccountArea(area.key)}
                      />
                    ))}
                  </div>
                </div>

                {accountArea === "library" ? (
                  library.length ? (
                    <div className="space-y-4">
                      {accountPaging.library?.hasMore ? (
                        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-xs text-cyan-100">
                          Showing the most recent {accountPaging.library.limit} library items for faster loading.
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(14,165,233,0.14),rgba(15,23,42,0.22))] px-4 py-3 text-sm text-slate-200 sm:px-5">
                        <div>
                          <div className="font-semibold text-white">Gallery view</div>
                          <div className="mt-1 text-slate-300">Your library uses curated one-row shelves with a featured lead card and quick-scroll controls.</div>
                        </div>
                        <div className="hidden rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 sm:block">
                          {library.length} items
                        </div>
                      </div>

                      <GalleryShelf
                        title="Recently added"
                        subtitle="Your newest or most recently updated resources in a consistent visual layout."
                        items={libraryShelves.recentlyAdded}
                        emptyTitle="No library items yet."
                        emptyBody="Resources will appear here once you gain access or publish them yourself."
                      />

                      <GalleryShelf
                        title="Purchased"
                        subtitle="Resources you unlocked through paid marketplace orders."
                        items={libraryShelves.purchased}
                        emptyTitle="No purchased resources yet."
                        emptyBody="Paid resources you acquire will collect here for quick return visits."
                      />

                      <GalleryShelf
                        title="Free access"
                        subtitle="Free entitlements and resources available without a paid order."
                        items={libraryShelves.freeAccess}
                        emptyTitle="No free-access resources yet."
                        emptyBody="Free packs and no-cost access will appear here when available."
                      />
                    </div>
                  ) : (
                    <EmptyState title="Your library is empty." body="Free resources and future paid resources will appear here once you gain access." />
                  )
                ) : null}

                {accountArea === "created" ? (
                  <div className="space-y-4">
                    {accountPaging.created?.hasMore ? (
                      <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-xs text-cyan-100">
                        Showing the most recent {accountPaging.created.limit} created resources for faster loading.
                      </div>
                    ) : null}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300 ring-1 ring-white/10">
                      Select Edit resource on any card to open the full-page editor.
                    </div>
                    {myResources.length ? myResources.map((resource) => (
                      <CreatedResourceCard
                        key={resource.id}
                        resource={resource}
                        onEdit={beginEditResource}
                        onSubmitForReview={handleSubmitForReview}
                        onArchive={handleArchive}
                      />
                    )) : <EmptyState title="No created resources yet." body="Create a hosted pack or external listing in Submit, then manage its metadata here." />}
                  </div>
                ) : null}

                {accountArea === "orders" ? (
                  orders.length ? (
                    <div className="space-y-4">
                      {accountPaging.orders?.hasMore ? (
                        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-xs text-cyan-100">
                          Showing the most recent {accountPaging.orders.limit} orders for faster loading.
                        </div>
                      ) : null}
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
                  )
                ) : null}

                {accountArea === "payouts" ? (
                  <div className="grid gap-6 xl:grid-cols-[0.82fr,1.18fr]">
                    {accountPaging.payoutLedger?.hasMore ? (
                      <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-xs text-cyan-100 xl:col-span-2">
                        Showing the most recent {accountPaging.payoutLedger.limit} payout entries for faster loading.
                      </div>
                    ) : null}
                    <form className="space-y-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/10" onSubmit={handleSavePayoutAccount}>
                      <div>
                        <div className="text-lg font-semibold text-white">Payout profile</div>
                        <div className="mt-2 text-sm text-slate-400">Keep seller payout details in one clean place and let settlement history sit beside it.</div>
                      </div>
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
                      {payoutAccount ? <div className="rounded-[22px] border border-emerald-300/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">Current status: {payoutAccount.status}</div> : null}
                      <button type="submit" disabled={busyAction} className="w-full rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60">
                        Save payout details
                      </button>
                    </form>

                    <div className="space-y-4">
                      {payoutLedger.length ? payoutLedger.map((entry) => (
                        <article key={entry.id} className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/10">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-base font-semibold text-white">{entry.entryType}</div>
                                <Badge tone={statusTone(entry.status)}>{entry.status}</Badge>
                              </div>
                              <div className="mt-2 text-sm text-slate-400">Available {formatDate(entry.availableAt) || "when settled"}</div>
                            </div>
                            <div className="text-right text-sm text-slate-300">
                              <div className="font-semibold text-white">{formatMoney(entry.netCents, entry.currencyCode)}</div>
                              <div className="mt-1">Gross {formatMoney(entry.grossCents, entry.currencyCode)}</div>
                              <div className="mt-1">Fee {formatMoney(entry.platformFeeCents, entry.currencyCode)}</div>
                            </div>
                          </div>
                        </article>
                      )) : <EmptyState title="No payout entries yet." body="Once paid orders settle into the seller ledger, they will appear here alongside your payout profile." />}
                    </div>
                  </div>
                ) : null}
              </div>
            </SectionCard>
          </div>
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

      </div>
        </div>
      </div>
      </div>
    </main>
  );
}
