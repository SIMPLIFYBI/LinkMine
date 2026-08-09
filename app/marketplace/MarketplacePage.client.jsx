"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

const MAX_RESOURCE_PREVIEW_IMAGES = 3;
const MAX_RESOURCE_PREVIEW_IMAGE_BYTES = 5 * 1024 * 1024;
const MARKETPLACE_COVER_EXPANDED_HEIGHT = 450;
const MARKETPLACE_COVER_COLLAPSED_HEIGHT = 86;
const MARKETPLACE_COVER_TRANSITION_MS = 360;
const MARKETPLACE_COVER_BLEND_TIME_MS = 330;
const MARKETPLACE_COVER_SPRING_TIME_CONSTANT_MS = 88;
const DISCOVER_INITIAL_FETCH_LIMIT = 32;
const DISCOVER_BACKGROUND_FETCH_LIMIT = 120;

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

function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function easeOutCubic(value) {
  const t = clamp01(value);
  return 1 - (1 - t) ** 3;
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
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Included</div>
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
  const accessLabel = resource.resourceType === "external" ? (resource.sourceName || "External source") : "Resource file";
  const updatedLabel = formatDate(resource.updatedAt || resource.createdAt);

  return (
    <article
      className={[
        "group relative flex flex-none snap-start overflow-hidden rounded-[30px] border border-white/10 shadow-[0_26px_70px_-42px_rgba(0,0,0,0.95)] ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:border-white/20",
        "h-[372px] w-[286px] sm:h-[392px] sm:w-[320px] lg:w-[320px]",
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

      <div className="relative flex flex-1 flex-col justify-end p-4.5 sm:p-5 lg:p-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/70">In your library</div>
            <div className="mt-2 line-clamp-2 text-[1.35rem] font-semibold leading-tight text-white sm:text-[1.8rem] lg:text-[1.95rem]">{resource.title}</div>
          </div>
          <div className="rounded-[20px] border border-white/12 bg-slate-950/30 px-3 py-2 text-right backdrop-blur-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-100">Included</div>
            <div className="mt-1 text-[11px] text-slate-200/80">{resource.downloadCount || 0} downloads</div>
          </div>
        </div>

        <p className="line-clamp-2 sm:line-clamp-3 max-w-[30ch] text-[14px] leading-6 text-slate-100/88">{resource.summary || accessLabel}</p>

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
  const accessLabel = resource.resourceType === "external" ? (resource.sourceName || "External source") : "Resource file";
  const shellClassName = "h-[304px] w-[286px] sm:h-[320px] sm:w-[320px] lg:w-[320px]";
  const titleClassName = "mt-3.5 block line-clamp-2 max-w-[13.5rem] text-[1.12rem] font-semibold leading-tight text-white transition hover:text-sky-100 sm:mt-4 sm:max-w-[15rem] sm:text-[1.35rem]";
  const summaryClassName = "mt-2 line-clamp-2 max-w-[25ch] text-[13px] leading-5 text-slate-100/82 sm:max-w-[28ch] sm:text-sm sm:leading-6";

  return (
    <article className={["group relative flex flex-none snap-start overflow-hidden rounded-[26px] border border-white/10 shadow-[0_24px_62px_-38px_rgba(0,0,0,0.9)] ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:border-white/20", shellClassName].join(" ")} style={{ backgroundImage: artwork.cardBackground }}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_34%),linear-gradient(180deg,rgba(15,23,42,0.06),rgba(15,23,42,0.84)_76%)]" />
      <ResourceOwnerBadge
        resource={resource}
        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center overflow-hidden rounded-[14px] border border-white/18 text-sm font-semibold text-slate-950 shadow-[0_14px_30px_-18px_rgba(255,255,255,0.8)]"
        style={{ backgroundImage: artwork.chipBackground }}
      />
      <div className="relative flex h-full flex-col justify-between p-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {resource.status !== "approved" ? <Badge tone={statusTone(resource.status)}>{resource.status}</Badge> : null}
            <ResourceFormatChip format={resource.resourceFormat} className="bg-slate-950/25" />
            <span className="line-clamp-1 max-w-[120px] rounded-full border border-white/12 bg-slate-950/25 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-100/90">{resource.category?.name || "Resource"}</span>
          </div>
          <div className="mt-3 text-[10px] uppercase tracking-[0.22em] text-slate-200/78 sm:mt-4 sm:text-[11px] sm:tracking-[0.26em]">Marketplace pick</div>
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
          <div className="mt-3.5 flex items-center justify-between gap-2.5 sm:mt-4 sm:gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-100">Included</div>
              <div className="mt-1 line-clamp-1 max-w-[130px] text-[11px] text-slate-100/72 sm:max-w-[160px] sm:text-xs">{accessLabel}</div>
            </div>
            <Link href={detailHref} className="rounded-full border border-white/15 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-950 transition hover:bg-slate-100 sm:px-4 sm:py-2 sm:text-xs">
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
      className="group relative flex h-[176px] w-[286px] flex-none snap-start overflow-hidden rounded-[24px] border border-white/10 text-left shadow-[0_24px_60px_-40px_rgba(0,0,0,0.85)] ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:border-white/20 sm:h-[188px] sm:w-[320px] lg:w-[320px]"
      style={{ backgroundImage: background }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02))]" />
      <div className="relative flex flex-1 flex-col justify-between p-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-200/80 sm:text-[11px] sm:tracking-[0.24em]">Category</div>
          <div className="mt-2.5 line-clamp-2 max-w-[11rem] text-[1.1rem] font-semibold leading-tight text-white sm:mt-3 sm:max-w-[12rem] sm:text-[1.35rem]">{category.name}</div>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-xl font-semibold text-white sm:text-2xl">{category.count}</div>
            <div className="mt-1 text-[11px] text-slate-200/76 sm:text-xs">approved resources</div>
          </div>
          <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition group-hover:bg-white/14 sm:px-3 sm:text-[11px] sm:tracking-[0.18em]">
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
            Included
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
          <div className="mt-3.5 line-clamp-2 max-w-[13.5rem] text-[1.35rem] font-semibold leading-[1.08] text-white">{resource.title}</div>
          <p className="mt-2 max-w-[16rem] line-clamp-2 text-[13px] leading-5 text-slate-100/84">{resource.summary || resource.description || "Open the resource to review the full pack details."}</p>
          <div className="mt-3.5 flex items-end justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-100">Included</div>
              <div className="mt-1 text-xs text-slate-100/70">{resource.downloadCount || 0} downloads</div>
            </div>
            <Link href={detailHref} className="rounded-full bg-white px-3.5 py-1.5 text-[11px] font-semibold text-slate-950 transition hover:bg-slate-100">
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
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-100/76">{eyebrow}</div>
          <div className="mt-2.5 line-clamp-2 text-[1.18rem] font-semibold leading-[1.12] text-white">{resource.title}</div>
          <div className="mt-1.5 line-clamp-2 text-[13px] leading-5 text-slate-100/80">{resource.summary || "Explore the resource details."}</div>
          <Link href={detailHref} className="mt-3 inline-flex w-fit rounded-full bg-white px-3.5 py-1.5 text-[11px] font-semibold text-slate-950 transition hover:bg-slate-100">
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
    <article className="relative h-[142px] overflow-hidden rounded-[20px] border border-white/10 shadow-[0_18px_44px_-30px_rgba(0,0,0,0.82)] ring-1 ring-white/10" style={{ backgroundImage: artwork.cardBackground }}>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(15,23,42,0.82)_78%)]" />
      <div className="relative flex h-full flex-col justify-between p-3.5">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-100/76">{resource.category?.name || "Resource"}</div>
          <div className="mt-2.5 line-clamp-2 max-w-[10rem] text-[1rem] font-semibold leading-tight text-white">{resource.title}</div>
        </div>
        <Link href={detailHref} className="inline-flex w-fit rounded-full border border-white/15 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-950 transition hover:bg-slate-100">
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

export default function MarketplacePageClient() {
  const { session, loading: authLoading, authError } = useAuth();
  const signedIn = Boolean(session);
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [accountPaging, setAccountPaging] = useState({
    library: { limit: 0, hasMore: false },
    created: { limit: 0, hasMore: false },
    tags: { limit: 0, hasMore: false },
  });

  const [resourceForm, setResourceForm] = useState(DEFAULT_RESOURCE_FORM);
  const [requestForm, setRequestForm] = useState(DEFAULT_REQUEST_FORM);
  const [resourceFile, setResourceFile] = useState(null);
  const [resourcePreviewImages, setResourcePreviewImages] = useState([]);
  const [discoverFilter, setDiscoverFilter] = useState({ search: "", type: "", categoryId: "" });
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileHeroIndex, setMobileHeroIndex] = useState(0);
  const [accountArea, setAccountArea] = useState("library");
  const [coverProgress, setCoverProgress] = useState(0);
  const [coverCollapsed, setCoverCollapsed] = useState(false);
  const [coverExpandedHeight, setCoverExpandedHeight] = useState(MARKETPLACE_COVER_EXPANDED_HEIGHT);
  const coverProgressTargetRef = useRef(0);
  const coverProgressCurrentRef = useRef(0);
  const coverProgressFrameRef = useRef(null);
  const coverProgressLastTimestampRef = useRef(0);
  const mobileHeroTouchStartXRef = useRef(null);
  const mobileHeroTouchDeltaXRef = useRef(0);
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
        apiGet(`/api/resources?view=card&limit=${DISCOVER_INITIAL_FETCH_LIMIT}`),
      ]);

      const initialResources = resourcesRes.resources || [];
      setCategories(categoriesRes.categories || []);
      setResources(initialResources);
      setCanCreateResources(Boolean(resourcesRes.canCreateResources));
      setCreateResourceRequirementMessage(resourcesRes.createResourceRequirementMessage || "");
      setLoadedTabs((prev) => ({ ...prev, discover: true }));

      if (resourcesRes?.paging?.hasMore && DISCOVER_BACKGROUND_FETCH_LIMIT > DISCOVER_INITIAL_FETCH_LIMIT) {
        void (async () => {
          try {
            const fullResourcesRes = await apiGet(`/api/resources?view=card&limit=${DISCOVER_BACKGROUND_FETCH_LIMIT}`);
            const fullResources = fullResourcesRes.resources || [];
            setResources((current) => (fullResources.length > current.length ? fullResources : current));
          } catch {
            // Keep initial fast payload if the background refresh fails.
          }
        })();
      }
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
        setMyResources(accountRes.myResources || []);
        setTags(accountRes.tags || []);
        setAccountPaging(accountRes.paging || {
          library: { limit: 0, hasMore: false },
          created: { limit: 0, hasMore: false },
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
      setAccountPaging({
        library: { limit: 0, hasMore: false },
        created: { limit: 0, hasMore: false },
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
    const requestedTab = String(searchParams.get("tab") || "").toLowerCase();
    if (!requestedTab) return;

    if (requestedTab === "admin") {
      if (isAdmin) {
        router.push("/marketplace/admin");
      }
      return;
    }

    const allowedTabs = new Set(["discover", "submit", "requests", "account"]);
    if (!allowedTabs.has(requestedTab)) return;

    if (!signedIn && requestedTab !== "discover") {
      if (activeTab !== "discover") {
        setActiveTab("discover");
      }
      return;
    }

    if (activeTab !== requestedTab) {
      setActiveTab(requestedTab);
    }
  }, [activeTab, isAdmin, router, searchParams, signedIn]);

  useEffect(() => {
    if (activeTab !== "discover") {
      setMobileSearchOpen(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "discover") {
      setCoverCollapsed(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!signedIn && activeTab !== "discover") {
      setMobileNavOpen(false);
    }
  }, [activeTab, signedIn]);

  useEffect(() => {
    function handleMarketplaceSearchToggle() {
      if (activeTab !== "discover") return;
      setMobileSearchOpen((current) => !current);
    }

    window.addEventListener("marketplace:search-toggle", handleMarketplaceSearchToggle);
    return () => window.removeEventListener("marketplace:search-toggle", handleMarketplaceSearchToggle);
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
      teamResources: sorted.filter((resource) => !resource.ownedByUser),
    };
  }, [library]);

  useEffect(() => {
    if (!mobileHeroResources.length) {
      setMobileHeroIndex(0);
      return;
    }

    setMobileHeroIndex((currentIndex) => (currentIndex >= mobileHeroResources.length ? 0 : currentIndex));
  }, [mobileHeroResources]);

  const handleMobileHeroTouchStart = useCallback((event) => {
    if (activeTab !== "discover" || mobileHeroResources.length < 2) return;
    mobileHeroTouchStartXRef.current = event.changedTouches?.[0]?.clientX ?? null;
    mobileHeroTouchDeltaXRef.current = 0;
  }, [activeTab, mobileHeroResources.length]);

  const handleMobileHeroTouchMove = useCallback((event) => {
    if (mobileHeroTouchStartXRef.current == null) return;
    const currentX = event.changedTouches?.[0]?.clientX;
    if (typeof currentX !== "number") return;
    mobileHeroTouchDeltaXRef.current = currentX - mobileHeroTouchStartXRef.current;
  }, []);

  const handleMobileHeroTouchEnd = useCallback(() => {
    if (activeTab !== "discover" || mobileHeroResources.length < 2) {
      mobileHeroTouchStartXRef.current = null;
      mobileHeroTouchDeltaXRef.current = 0;
      return;
    }

    const SWIPE_THRESHOLD = 40;
    const deltaX = mobileHeroTouchDeltaXRef.current;

    if (deltaX <= -SWIPE_THRESHOLD) {
      setMobileHeroIndex((currentIndex) => (currentIndex + 1) % mobileHeroResources.length);
    } else if (deltaX >= SWIPE_THRESHOLD) {
      setMobileHeroIndex((currentIndex) => (currentIndex - 1 + mobileHeroResources.length) % mobileHeroResources.length);
    }

    mobileHeroTouchStartXRef.current = null;
    mobileHeroTouchDeltaXRef.current = 0;
  }, [activeTab, mobileHeroResources.length]);

  useEffect(() => {
    if (activeTab !== "discover") {
      if (coverProgressFrameRef.current != null) {
        window.cancelAnimationFrame(coverProgressFrameRef.current);
        coverProgressFrameRef.current = null;
      }
      coverProgressTargetRef.current = 1;
      coverProgressCurrentRef.current = 1;
      setCoverProgress(1);
      return undefined;
    }

    function animateCoverProgress() {
      if (coverProgressFrameRef.current != null) return;

      const tick = (timestamp) => {
        const lastTs = coverProgressLastTimestampRef.current || timestamp;
        const dt = Math.max(0, timestamp - lastTs);
        coverProgressLastTimestampRef.current = timestamp;

        const current = coverProgressCurrentRef.current;
        const target = coverProgressTargetRef.current;
        const delta = target - current;
        const blend = 1 - Math.exp(-dt / MARKETPLACE_COVER_SPRING_TIME_CONSTANT_MS);

        if (Math.abs(delta) < 0.0015) {
          coverProgressCurrentRef.current = target;
          setCoverProgress(target);
          coverProgressFrameRef.current = null;
          coverProgressLastTimestampRef.current = 0;
          return;
        }

        const next = current + delta * blend;
        coverProgressCurrentRef.current = next;
        setCoverProgress(next);
        coverProgressFrameRef.current = window.requestAnimationFrame(tick);
      };

      coverProgressFrameRef.current = window.requestAnimationFrame(tick);
    }

    function syncCoverProgressFromToggle() {
      const nextProgress = coverCollapsed ? 1 : 0;
      coverProgressTargetRef.current = nextProgress;
      animateCoverProgress();
    }

    syncCoverProgressFromToggle();
    return () => {
      if (coverProgressFrameRef.current != null) {
        window.cancelAnimationFrame(coverProgressFrameRef.current);
        coverProgressFrameRef.current = null;
      }
      coverProgressLastTimestampRef.current = 0;
    };
  }, [activeTab, coverCollapsed]);

  useEffect(() => {
    coverProgressCurrentRef.current = coverProgress;
  }, [coverProgress]);

  useEffect(() => {
    if (activeTab !== "discover") return undefined;
    setCoverExpandedHeight(MARKETPLACE_COVER_EXPANDED_HEIGHT);
    return undefined;
  }, [activeTab]);

  const tabs = useMemo(() => {
    if (!signedIn) {
      return [
        { key: "discover", label: "Home", hint: "Browse approved hosted packs and external sources.", icon: "discover", group: "primary" },
        { key: "all-resources", label: "All Resources", hint: "Browse the full marketplace resource index.", icon: "orders", group: "primary", href: "/marketplace/resources" },
      ];
    }

    const baseTabs = [
      { key: "discover", label: "Home", hint: "Browse approved hosted packs and external sources.", icon: "discover", group: "primary" },
      { key: "all-resources", label: "All Resources", hint: "Browse the full marketplace resource index.", icon: "orders", group: "primary", href: "/marketplace/resources" },
      { key: "submit", label: "Submit", hint: "Create hosted or external listings and send them for review.", icon: "submit", group: "primary" },
      { key: "requests", label: "Requests", hint: "Track industry requests and completion workflows.", icon: "requests", group: "primary" },
      { key: "account", label: "My Account", hint: "Manage your library and created marketplace resources.", icon: "library", group: "secondary" },
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
  ]), [library.length, myResources.length]);

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
      setMobileNavOpen(false);
      router.push(tab.href);
      return;
    }

    setMobileNavOpen(false);
    setActiveTab(tab.key);
  }

  function collapseMarketplaceCover() {
    setCoverCollapsed(true);
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

  function handlePreviewImagesChange(event) {
    const files = Array.from(event.target.files || []);

    if (files.length > MAX_RESOURCE_PREVIEW_IMAGES) {
      setError(`You can upload up to ${MAX_RESOURCE_PREVIEW_IMAGES} preview images.`);
      setResourcePreviewImages(files.slice(0, MAX_RESOURCE_PREVIEW_IMAGES));
      return;
    }

    const tooLarge = files.find((file) => file.size > MAX_RESOURCE_PREVIEW_IMAGE_BYTES);
    if (tooLarge) {
      setError(`\"${tooLarge.name}\" is too large. Max ${Math.round(MAX_RESOURCE_PREVIEW_IMAGE_BYTES / (1024 * 1024))} MB per image.`);
      event.target.value = "";
      setResourcePreviewImages([]);
      return;
    }

    setResourcePreviewImages(files);
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

        if (resourcePreviewImages.length) {
          const imagesForm = new FormData();
          resourcePreviewImages.forEach((image) => imagesForm.append("images", image));
          await apiSend(`/api/resources/${createResult.resource.id}/images`, "POST", imagesForm, true);
        }

        setResourceForm(DEFAULT_RESOURCE_FORM);
        setResourceFile(null);
        setResourcePreviewImages([]);
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
          bountyCents: 0,
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
        setSuccess("Access has been granted.");
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

  const coverHeight = Math.round(
    coverExpandedHeight -
    (coverExpandedHeight - MARKETPLACE_COVER_COLLAPSED_HEIGHT) * coverProgress
  );
  const coverVisualProgress = easeOutCubic(coverProgress);
  const coverHeroOpacity = clamp01(1 - coverVisualProgress * 1.35);
  const coverHeroScale = 1 - coverVisualProgress * 0.05;
  const coverBgBlur = `${Math.round(coverVisualProgress * 16)}px`;
  const compactHeaderOpacity = clamp01((coverVisualProgress - 0.14) / 0.58);

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
                    active={tab.key === activeTab}
                    label={tab.label}
                    icon={tab.icon}
                    onClick={() => handleTabSelect(tab)}
                  />
                ))}
              </div>
            </aside>

            {activeTab === "discover" && mobileSearchOpen ? (
              <div className="mb-3 pl-12 pr-1 pt-2">
                <div className="relative rounded-2xl border border-white/15 bg-white/[0.08] px-2 py-2 shadow-[0_16px_36px_-24px_rgba(14,165,233,0.45)] backdrop-blur-xl ring-1 ring-white/15">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="pointer-events-none absolute left-5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                  <TextInput
                    value={discoverFilter.search}
                    onChange={(event) => setDiscoverFilter((prev) => ({ ...prev, search: event.target.value }))}
                    placeholder="Search marketplace"
                    className="h-10 rounded-full border-white/10 bg-slate-950/65 pl-11 pr-10 text-[13px]"
                  />
                  {discoverFilter.search ? (
                    <button
                      type="button"
                      onClick={() => setDiscoverFilter((prev) => ({ ...prev, search: "" }))}
                      className="absolute right-4 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-slate-200"
                      aria-label="Clear search"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 6l12 12" />
                        <path d="M18 6 6 18" />
                      </svg>
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-3 min-w-0 lg:mt-0">
          {activeTab === "discover" ? (
            <section
              className={[
                "sticky top-[calc(56px+env(safe-area-inset-top))] z-20 mb-6 overflow-hidden border border-white/15 shadow-[0_38px_120px_-68px_rgba(15,23,42,0.88)] ring-1 ring-white/10",
                coverCollapsed
                  ? "-mx-4 rounded-none border-x-0 sm:mx-0 sm:rounded-[34px] sm:border-x"
                  : "rounded-[34px]",
              ].join(" ")}
              style={{
                height: `${coverHeight}px`,
                willChange: "height, transform, filter, opacity",
                transition: `height ${MARKETPLACE_COVER_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
                background: "linear-gradient(170deg, rgba(2,6,23,0.94), rgba(15,23,42,0.9) 46%, rgba(30,41,59,0.86) 100%)",
              }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  transform: `scale(${coverHeroScale})`,
                  filter: `blur(${coverBgBlur}) saturate(${1 + coverVisualProgress * 0.08})`,
                  willChange: "transform, filter",
                  transition: `transform ${MARKETPLACE_COVER_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), filter ${MARKETPLACE_COVER_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
                  background:
                    "radial-gradient(circle at 14% 18%, rgba(59,130,246,0.34), transparent 28%), radial-gradient(circle at 82% 18%, rgba(34,211,238,0.26), transparent 34%), radial-gradient(circle at 60% 82%, rgba(244,114,182,0.16), transparent 30%)",
                }}
              />

              <div className="absolute left-0 right-0 top-0 z-30 px-4 py-2.5 sm:px-6">
                <div
                  className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-2.5 py-2 backdrop-blur-2xl"
                  style={{
                    opacity: compactHeaderOpacity,
                    transform: `translateY(${(1 - compactHeaderOpacity) * -10}px)`,
                    willChange: "opacity, transform",
                    transition: `opacity ${MARKETPLACE_COVER_BLEND_TIME_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1), transform ${MARKETPLACE_COVER_BLEND_TIME_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
                  }}
                >
                  <div className="hidden min-w-0 pr-1 sm:block">
                    <div className="text-xs font-semibold text-white">Marketplace</div>
                  </div>

                  <div className="flex w-full items-center gap-2 sm:hidden">
                    <div className="flex min-w-0 flex-1 items-center rounded-full border border-white/15 bg-slate-950/62 px-2.5 py-1.5">
                      <div className="relative min-w-0 flex-1">
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="pointer-events-none absolute left-1.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="7" />
                          <path d="m20 20-3.5-3.5" />
                        </svg>
                        <input
                          value={discoverFilter.search}
                          onChange={(event) => setDiscoverFilter((prev) => ({ ...prev, search: event.target.value }))}
                          placeholder="Search marketplace"
                          className="h-7 w-full bg-transparent pl-7 pr-2 text-[13px] text-slate-100 placeholder:text-slate-300/80 outline-none"
                        />
                      </div>

                      <div className="mx-1 h-5 w-px bg-white/18" />

                      <div className="relative w-[8.9rem]">
                        <select
                          value={discoverFilter.categoryId}
                          onChange={(event) => setDiscoverFilter((prev) => ({ ...prev, categoryId: event.target.value }))}
                          className="h-7 w-full appearance-none bg-transparent pl-2 pr-6 text-[12px] font-semibold text-slate-100 outline-none"
                          aria-label="Filter by category"
                        >
                          <option value="">All categories</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))}
                        </select>
                        <svg viewBox="0 0 20 20" aria-hidden="true" className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m5.5 7.5 4.5 5 4.5-5" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="relative hidden min-w-[220px] flex-1 sm:block">
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="7" />
                      <path d="m20 20-3.5-3.5" />
                    </svg>
                    <TextInput
                      value={discoverFilter.search}
                      onChange={(event) => setDiscoverFilter((prev) => ({ ...prev, search: event.target.value }))}
                      placeholder="Search marketplace"
                      className="h-9 rounded-full border-white/15 bg-slate-950/65 pl-9 pr-3 text-[12px]"
                    />
                  </div>

                  <span className="hidden rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-200 md:inline-flex">Home / Discover</span>
                </div>
              </div>

              <div
                className="relative z-10 flex h-full flex-col px-5 pb-4 pt-12 sm:px-7 sm:pb-6 sm:pt-14"
                style={{
                  opacity: coverHeroOpacity,
                  transform: `translateY(${coverVisualProgress * -40}px)`,
                  willChange: "opacity, transform",
                  transition: `opacity ${MARKETPLACE_COVER_BLEND_TIME_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1), transform ${MARKETPLACE_COVER_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
                }}
              >
                <div className="mx-auto w-full max-w-5xl">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-slate-300/85">Marketplace</div>
                  <h1 className="mt-3.5 max-w-4xl text-3xl font-semibold leading-[1.1] tracking-[-0.015em] text-white sm:text-4xl lg:text-5xl">
                    Discover the Mining Industry&apos;s Digital Marketplace
                  </h1>
                  <p className="mt-3.5 max-w-2xl text-sm leading-6 text-slate-200/90 sm:text-base">
                    Find practical templates, field-ready workflows, and specialist resources curated for mining teams across planning, geology, operations, and delivery.
                  </p>

                  <div className="mt-5 max-w-[66rem] rounded-[24px] border border-white/16 bg-white/[0.08] p-1.5 shadow-[0_24px_44px_-32px_rgba(56,189,248,0.5)] backdrop-blur-2xl">
                    <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
                      <div className="relative min-w-0 flex-1">
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="pointer-events-none absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-200" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="7" />
                          <path d="m20 20-3.5-3.5" />
                        </svg>
                        <TextInput
                          value={discoverFilter.search}
                          onChange={(event) => setDiscoverFilter((prev) => ({ ...prev, search: event.target.value }))}
                          placeholder="Search packs, templates, workflows, references, and field resources"
                          className="h-10 rounded-full border-white/10 bg-slate-950/65 pl-12 pr-4 text-[13px]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={collapseMarketplaceCover}
                      className="group inline-flex items-center gap-2 rounded-full border border-sky-200/30 bg-[linear-gradient(135deg,rgba(56,189,248,0.26),rgba(14,116,144,0.35))] px-3.5 py-2 text-white shadow-[0_14px_34px_-18px_rgba(56,189,248,0.75)] ring-1 ring-white/20 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-sky-100/40 hover:shadow-[0_20px_44px_-20px_rgba(56,189,248,0.9)]"
                      aria-label="Collapse marketplace banner"
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/95">Collapse</span>
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/25 bg-white/15">
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 transition group-hover:translate-y-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </span>
                      <span className="h-1.5 w-6 rounded-full bg-white/70" />
                      <span className="h-1.5 w-6 rounded-full bg-white/50" />
                      <span className="h-1.5 w-6 rounded-full bg-white/35" />
                      <span className="sr-only">Collapse header to compact search bar</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {!signedIn ? (
            <section className="mb-6 overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] px-5 py-5 ring-1 ring-white/10">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">Marketplace</div>
                  <div className="mt-2 text-2xl font-semibold text-white">Browse approved industry resources without signing in.</div>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
                    Sign in to download resources, manage your library, and submit resource packs.
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
            <section
              className="space-y-4 lg:hidden"
              onTouchStart={handleMobileHeroTouchStart}
              onTouchMove={handleMobileHeroTouchMove}
              onTouchEnd={handleMobileHeroTouchEnd}
            >
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
                            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-100">Included</div>
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

            <div className="flex justify-center">
              <Link
                href="/marketplace/resources"
                className="inline-flex items-center rounded-full border border-sky-300/25 bg-sky-500/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-sky-100 transition hover:bg-sky-500/22"
              >
                View all resources
              </Link>
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
                  <Field label="Preview images" hint="Optional. Up to 3 images, JPG/PNG/WEBP, max 5 MB each.">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handlePreviewImagesChange}
                      className="block w-full rounded-2xl border border-dashed border-white/15 bg-slate-950/60 px-4 py-4 text-sm text-slate-300"
                    />
                    {resourcePreviewImages.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {resourcePreviewImages.map((image) => (
                          <span key={`${image.name}-${image.size}`} className="inline-flex max-w-full items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
                            <span className="truncate">{image.name}</span>
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </Field>
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
                    <div className="mt-2">10 active hosted resources, 25 MB max hosted pack size, up to 3 preview images (5 MB each), and 250 MB total hosted storage per user.</div>
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
            <SectionCard title="My Account" subtitle="Move between your library and created listings with a single account workspace.">
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
                        title="Shared with you"
                        subtitle="Resources added by other contributors that you can access from your library."
                        items={libraryShelves.teamResources}
                        emptyTitle="No shared resources yet."
                        emptyBody="Resources shared by other contributors will appear here when available."
                      />
                    </div>
                  ) : (
                    <EmptyState title="Your library is empty." body="Resources will appear here once you gain access." />
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
                        <div>Open request</div>
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
