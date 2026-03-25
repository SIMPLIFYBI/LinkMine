"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";

const EXPORT_WIDTH = 1080;
const EXPORT_HEIGHT = 1350;
const PREVIEW_SCALE = 0.38;

function formatNumber(value) {
  return new Intl.NumberFormat("en-AU").format(value || 0);
}

function formatGeneratedAt(value) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0 4-4m-4 4-4-4M4 17.5v.5A2 2 0 0 0 6 20h12a2 2 0 0 0 2-2v-.5" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" />
    </svg>
  );
}

function NoticeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="mt-0.5 h-4 w-4 flex-none" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v5m0 3h.01M10.29 3.86l-7.5 13A1 1 0 0 0 3.67 18h16.66a1 1 0 0 0 .87-1.5l-7.5-13a1 1 0 0 0-1.74 0Z" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3H5a2 2 0 0 0-2 2v3m16 0V5a2 2 0 0 0-2-2h-3M8 21H5a2 2 0 0 1-2-2v-3m16 0v3a2 2 0 0 1-2 2h-3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9 3 3m18 18-6-6m0-6 6-6M3 21l6-6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function TabButton({ active, label, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-2xl border px-4 py-3 text-left transition",
        active
          ? "border-cyan-300/50 bg-cyan-400/15 text-white shadow-[0_20px_60px_-30px_rgba(34,211,238,0.85)]"
          : "border-white/10 bg-slate-950/45 text-slate-300 hover:border-white/20 hover:bg-white/5 hover:text-white",
      ].join(" ")}
    >
      <div className="text-sm font-semibold">{label}</div>
      <div className="mt-1 text-xs leading-5 text-slate-400">{description}</div>
    </button>
  );
}

function PreviewShell({ children, previewRef, onOpen, title }) {
  return (
    <div className="overflow-x-auto rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Preview</div>
          <div className="mt-1 text-sm font-medium text-slate-100">{title}</div>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
        >
          <ExpandIcon />
          Full screen
        </button>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen();
          }
        }}
        aria-label={`Open ${title} preview full screen`}
        className="cursor-zoom-in rounded-[1.5rem] outline-none ring-0 transition hover:scale-[1.005] focus-visible:ring-2 focus-visible:ring-cyan-300/50"
      >
        <div style={{ width: EXPORT_WIDTH * PREVIEW_SCALE, height: EXPORT_HEIGHT * PREVIEW_SCALE }}>
          <div style={{ transform: `scale(${PREVIEW_SCALE})`, transformOrigin: "top left" }}>
            <div ref={previewRef} style={{ width: EXPORT_WIDTH, height: EXPORT_HEIGHT }}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FullscreenPreview({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-xl sm:p-8" onClick={onClose}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_26%),radial-gradient(circle_at_bottom,rgba(251,191,36,0.08),transparent_22%)]" />
      <div
        className="relative max-h-[96vh] w-full max-w-[min(90vw,1100px)] overflow-auto rounded-[2rem] border border-white/10 bg-slate-950/70 p-4 shadow-[0_40px_140px_-40px_rgba(8,145,178,0.85)] backdrop-blur-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Full screen preview</div>
            <div className="mt-1 text-base font-medium text-white">{title}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/12"
          >
            <CloseIcon />
            Close
          </button>
        </div>

        <div className="overflow-auto rounded-[1.5rem] border border-white/10 bg-black/20 p-2 sm:p-4">
          <div className="mx-auto w-full max-w-[1080px]">{children}</div>
        </div>
      </div>
    </div>
  );
}

function StatChip({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 backdrop-blur-sm">
      <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function WhatsOnPreview({ data }) {
  return (
    <div className="relative h-full overflow-hidden rounded-[40px] bg-[#071821] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.28),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(251,191,36,0.18),transparent_30%),linear-gradient(160deg,#071821_0%,#0f172a_42%,#071521_100%)]" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.09)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="relative flex h-full flex-col px-20 py-20">
        <div className="flex items-start justify-between gap-10">
          <div>
            <div className="text-[22px] uppercase tracking-[0.42em] text-cyan-200/85">YouMine weekly</div>
            <h2 className="mt-6 max-w-[620px] text-[74px] font-semibold leading-[0.95] tracking-[-0.05em]">
              What’s on over the next four weeks
            </h2>
            <p className="mt-5 text-[28px] text-slate-300">{data.windowLabel}</p>
          </div>
          <div className="w-[250px] rounded-[28px] border border-white/10 bg-white/8 p-6 backdrop-blur-sm">
            <div className="text-[14px] uppercase tracking-[0.3em] text-slate-300">Live now</div>
            <div className="mt-4 text-[66px] font-semibold leading-none">{formatNumber(data.totalCount)}</div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-[18px] text-slate-200">
              <div className="rounded-2xl bg-[#0f2530] px-4 py-3">
                <div className="text-[12px] uppercase tracking-[0.22em] text-cyan-200/80">Training</div>
                <div className="mt-2 text-[28px] font-semibold">{formatNumber(data.trainingCount)}</div>
              </div>
              <div className="rounded-2xl bg-[#182634] px-4 py-3">
                <div className="text-[12px] uppercase tracking-[0.22em] text-amber-200/80">Events</div>
                <div className="mt-2 text-[28px] font-semibold">{formatNumber(data.eventCount)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-4 gap-4">
          {data.weekBuckets.map((bucket) => (
            <div key={bucket.label} className="rounded-[26px] border border-white/10 bg-white/6 px-5 py-5 backdrop-blur-sm">
              <div className="text-[12px] uppercase tracking-[0.24em] text-slate-400">Week</div>
              <div className="mt-3 text-[18px] font-medium text-white">{bucket.label}</div>
              <div className="mt-6 text-[48px] font-semibold leading-none text-cyan-200">{formatNumber(bucket.count)}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex-1 rounded-[34px] border border-white/10 bg-black/20 p-7 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="text-[14px] uppercase tracking-[0.32em] text-slate-400">Next on the calendar</div>
            <div className="text-[16px] text-slate-400">youmine.io/whats-on</div>
          </div>

          <div className="mt-6 space-y-4">
            {data.items.length ? data.items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-[120px_1fr_240px] items-start gap-5 rounded-[24px] border border-white/8 bg-white/6 px-5 py-5">
                <div>
                  <div className="inline-flex rounded-full border border-white/10 px-3 py-1 text-[12px] uppercase tracking-[0.2em] text-slate-300">
                    {item.type}
                  </div>
                  <div className="mt-4 text-[28px] font-semibold leading-none text-cyan-200">{String(index + 1).padStart(2, "0")}</div>
                </div>
                <div>
                  <div className="text-[28px] font-semibold leading-tight text-white">{item.title}</div>
                  <div className="mt-2 text-[18px] text-slate-300">{item.sourceLabel}</div>
                </div>
                <div className="text-right">
                  <div className="text-[17px] font-medium text-amber-100">{item.dateLabel}</div>
                  <div className="mt-2 text-[15px] text-slate-400">{item.location}</div>
                  {item.deliveryMethod ? <div className="mt-2 text-[13px] uppercase tracking-[0.22em] text-slate-500">{item.deliveryMethod}</div> : null}
                </div>
              </div>
            )) : (
              <div className="rounded-[24px] border border-dashed border-white/15 px-6 py-10 text-center text-[24px] text-slate-400">
                No upcoming items are live right now.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConsultantFeaturePreview({ data }) {
  return (
    <div className="relative h-full overflow-hidden rounded-[40px] bg-[#140f10] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.28),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(249,115,22,0.26),transparent_24%),linear-gradient(160deg,#1a1315_0%,#120f22_52%,#090d14_100%)]" />
      <div className="absolute left-[-120px] top-[190px] h-[420px] w-[420px] rounded-full border border-white/10 bg-white/5 blur-3xl" />
      <div className="relative flex h-full flex-col px-20 py-20">
        <div className="flex items-start justify-between gap-10">
          <div className="max-w-[700px]">
            <div className="text-[22px] uppercase tracking-[0.42em] text-amber-200/90">Featured consultant</div>
            <h2 className="mt-8 text-[86px] font-semibold leading-[0.92] tracking-[-0.06em]">{data.name}</h2>
            <p className="mt-6 max-w-[620px] text-[32px] leading-[1.2] text-slate-200">{data.headline}</p>
          </div>
          <div className="flex h-[160px] w-[160px] items-center justify-center overflow-hidden rounded-[32px] border border-white/10 bg-white/10 p-6">
            {data.logoUrl ? (
              <img src={data.logoUrl} alt={data.name} className="max-h-full max-w-full object-contain" crossOrigin="anonymous" />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-[24px] bg-white/8 text-[54px] font-semibold text-amber-100">
                {data.name?.slice(0, 1) || "Y"}
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 grid grid-cols-[1.3fr_0.9fr] gap-8">
          <div className="rounded-[34px] border border-white/10 bg-black/20 p-8 backdrop-blur-sm">
            <div className="text-[14px] uppercase tracking-[0.32em] text-slate-400">Capability snapshot</div>
            <div className="mt-6 flex flex-wrap gap-4">
              {data.services.length ? data.services.map((service) => (
                <div key={service} className="rounded-full border border-amber-200/20 bg-amber-300/10 px-5 py-3 text-[20px] font-medium text-amber-50">
                  {service}
                </div>
              )) : (
                <div className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-[20px] text-slate-300">
                  Mining consulting
                </div>
              )}
            </div>

            <div className="mt-10 rounded-[28px] border border-white/10 bg-white/5 px-6 py-6 text-[24px] leading-[1.45] text-slate-200">
              {data.joinedLabel || "Approved consultant"}
            </div>
          </div>

          <div className="rounded-[34px] border border-white/10 bg-white/7 p-8 backdrop-blur-sm">
            <div className="text-[14px] uppercase tracking-[0.32em] text-slate-400">Profile details</div>
            <div className="mt-6 space-y-5">
              <div>
                <div className="text-[12px] uppercase tracking-[0.22em] text-slate-500">Location</div>
                <div className="mt-2 text-[28px] font-semibold text-white">{data.location || "Australia / remote"}</div>
              </div>
              <div>
                <div className="text-[12px] uppercase tracking-[0.22em] text-slate-500">Link</div>
                <div className="mt-2 break-all text-[20px] text-amber-100">youmine.io{data.profileUrl}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto rounded-[34px] border border-white/10 bg-gradient-to-r from-amber-400/18 to-orange-400/12 px-8 py-7 backdrop-blur-sm">
          <div className="text-[16px] uppercase tracking-[0.34em] text-amber-100/80">Discover specialist talent</div>
          <div className="mt-3 text-[36px] font-semibold tracking-[-0.04em] text-white">
            Explore vetted mining consultants and contractors on YouMine.
          </div>
        </div>
      </div>
    </div>
  );
}

function JobsPreview({ data }) {
  return (
    <div className="relative h-full overflow-hidden rounded-[40px] bg-[#08131a] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(45,212,191,0.2),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(14,165,233,0.24),transparent_24%),linear-gradient(165deg,#08131a_0%,#0f172a_52%,#081014_100%)]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(135deg,rgba(255,255,255,0.09)_25%,transparent_25%),linear-gradient(225deg,rgba(255,255,255,0.09)_25%,transparent_25%),linear-gradient(315deg,rgba(255,255,255,0.09)_25%,transparent_25%),linear-gradient(45deg,rgba(255,255,255,0.09)_25%,transparent_25%)] [background-position:22px_0,22px_0,0_0,0_0] [background-size:44px_44px]" />
      <div className="relative flex h-full flex-col px-20 py-20">
        <div className="flex items-end justify-between gap-8">
          <div>
            <div className="text-[22px] uppercase tracking-[0.42em] text-teal-100/85">Jobs posted</div>
            <h2 className="mt-6 text-[84px] font-semibold leading-[0.92] tracking-[-0.06em]">New roles on YouMine</h2>
            <p className="mt-5 max-w-[650px] text-[28px] leading-[1.3] text-slate-300">{data.windowLabel}</p>
          </div>
          <div className="grid w-[280px] gap-4">
            <div className="rounded-[28px] border border-white/10 bg-white/10 px-6 py-5 backdrop-blur-sm">
              <div className="text-[12px] uppercase tracking-[0.24em] text-slate-400">Last 7 days</div>
              <div className="mt-3 text-[58px] font-semibold leading-none text-teal-200">{formatNumber(data.recentCount)}</div>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-[#08232b] px-6 py-5">
              <div className="text-[12px] uppercase tracking-[0.24em] text-slate-400">Open now</div>
              <div className="mt-3 text-[58px] font-semibold leading-none text-white">{formatNumber(data.openCount)}</div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex-1 rounded-[34px] border border-white/10 bg-black/18 p-8 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="text-[14px] uppercase tracking-[0.32em] text-slate-400">Recent live jobs</div>
            <div className="text-[16px] text-slate-400">youmine.io/jobs</div>
          </div>

          <div className="mt-6 space-y-4">
            {data.items.length ? data.items.map((job) => (
              <div key={job.id} className="grid grid-cols-[1.1fr_220px_200px] gap-5 rounded-[26px] border border-white/8 bg-white/6 px-6 py-5">
                <div>
                  <div className="text-[30px] font-semibold leading-tight text-white">{job.title}</div>
                  <div className="mt-2 text-[18px] text-slate-300">{job.company}</div>
                </div>
                <div>
                  <div className="text-[12px] uppercase tracking-[0.22em] text-slate-500">Service</div>
                  <div className="mt-2 text-[20px] text-teal-100">{job.service}</div>
                </div>
                <div className="text-right">
                  <div className="text-[18px] font-medium text-amber-100">{job.location}</div>
                  <div className="mt-2 text-[14px] uppercase tracking-[0.2em] text-slate-500">Posted {job.dateLabel}</div>
                </div>
              </div>
            )) : (
              <div className="rounded-[24px] border border-dashed border-white/15 px-6 py-10 text-center text-[24px] text-slate-400">
                No open jobs were available when this post was generated.
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 rounded-[34px] border border-teal-300/20 bg-teal-400/10 px-8 py-7 backdrop-blur-sm">
          <div className="text-[15px] uppercase tracking-[0.3em] text-teal-100/80">Call to action</div>
          <div className="mt-3 text-[34px] font-semibold tracking-[-0.04em] text-white">
            Browse the board or post a mining role directly through YouMine.
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsPreview({ data }) {
  return (
    <div className="relative h-full overflow-hidden rounded-[40px] bg-[#120d1d] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(192,132,252,0.18),transparent_28%),radial-gradient(circle_at_84%_12%,rgba(59,130,246,0.26),transparent_26%),linear-gradient(160deg,#120d1d_0%,#19172b_50%,#0c1220_100%)]" />
      <div className="absolute right-[-120px] top-[120px] h-[380px] w-[380px] rounded-full border border-white/10 bg-white/5 blur-3xl" />
      <div className="relative flex h-full flex-col px-20 py-20">
        <div>
          <div className="text-[22px] uppercase tracking-[0.42em] text-sky-100/85">Site analytics</div>
          <h2 className="mt-6 max-w-[760px] text-[82px] font-semibold leading-[0.92] tracking-[-0.06em]">
            A live snapshot of platform activity
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-6">
          {data.metrics.map((metric) => (
            <div key={metric.label} className="rounded-[32px] border border-white/10 bg-white/8 px-8 py-8 backdrop-blur-sm">
              <div className="text-[13px] uppercase tracking-[0.26em] text-slate-400">{metric.label}</div>
              <div className="mt-4 text-[64px] font-semibold leading-none text-white">{formatNumber(metric.value)}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-4 gap-4">
          {data.supporting.map((metric) => (
            <div key={metric.label} className="rounded-[24px] border border-white/10 bg-[#121b2a] px-5 py-5">
              <div className="text-[12px] uppercase tracking-[0.24em] text-slate-500">{metric.label}</div>
              <div className="mt-3 text-[34px] font-semibold leading-none text-sky-100">{formatNumber(metric.value)}</div>
            </div>
          ))}
        </div>

        <div className="mt-auto rounded-[34px] border border-white/10 bg-gradient-to-r from-sky-500/16 via-indigo-400/10 to-fuchsia-400/12 px-8 py-7 backdrop-blur-sm">
          <div className="text-[15px] uppercase tracking-[0.3em] text-sky-100/75">Platform momentum</div>
          <div className="mt-3 text-[34px] font-semibold leading-[1.15] tracking-[-0.04em] text-white">
            YouMine continues connecting mining consultants, jobs, training, and industry events in one place.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminSocialStudio({ data }) {
  const [activeTab, setActiveTab] = useState("whatsOn");
  const [selectedConsultantId, setSelectedConsultantId] = useState(data.consultantFeature.selectedId || "");
  const [status, setStatus] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const previewRefs = useRef({});

  useEffect(() => {
    if (!isFullscreenOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsFullscreenOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreenOpen]);

  const activeConsultantFeature = useMemo(() => {
    if (!data.consultantFeature?.byId) return data.consultantFeature?.active;
    return data.consultantFeature.byId[selectedConsultantId] || data.consultantFeature.active;
  }, [data.consultantFeature, selectedConsultantId]);

  const tabs = useMemo(
    () => [
      {
        id: "whatsOn",
        label: "What’s On",
        description: "4-week look-ahead across events and training.",
        caption: data.whatsOn.caption,
        insights: [
          `${formatNumber(data.whatsOn.totalCount)} upcoming calendar items in the next four weeks`,
          `${formatNumber(data.whatsOn.trainingCount)} training sessions and ${formatNumber(data.whatsOn.eventCount)} events`,
          `Window: ${data.whatsOn.windowLabel}`,
        ],
        content: <WhatsOnPreview data={data.whatsOn} />,
      },
      {
        id: "consultantFeature",
        label: "Consultant Feature",
        description: "Rotating featured consultant profile card.",
        caption: activeConsultantFeature?.caption || "",
        insights: [
          activeConsultantFeature?.name || "Feature unavailable",
          activeConsultantFeature?.location || "Australia / remote",
          activeConsultantFeature?.services?.length ? activeConsultantFeature.services.join(" • ") : "General mining support",
        ],
        content: <ConsultantFeaturePreview data={activeConsultantFeature} />,
      },
      {
        id: "jobs",
        label: "Jobs Posted",
        description: "Recent jobs and current board activity.",
        caption: data.jobs.caption,
        insights: [
          `${formatNumber(data.jobs.recentCount)} new jobs in the last 7 days`,
          `${formatNumber(data.jobs.openCount)} open jobs on the board`,
          data.jobs.windowLabel,
        ],
        content: <JobsPreview data={data.jobs} />,
      },
      {
        id: "analytics",
        label: "Site Analytics",
        description: "Platform totals for consultants, users, views, and enquiries.",
        caption: data.analytics.caption,
        insights: data.analytics.metrics.map((metric) => `${metric.label}: ${formatNumber(metric.value)}`),
        content: <AnalyticsPreview data={data.analytics} />,
      },
    ],
    [activeConsultantFeature, data]
  );

  const active = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  async function handleDownload() {
    const node = previewRefs.current[active.id];
    if (!node) return;

    setIsDownloading(true);
    setStatus("");

    try {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#08131a",
      });

      const link = document.createElement("a");
      link.download = `${active.id}-${new Date(data.generatedAt).toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
      setStatus("PNG downloaded.");
    } catch (error) {
      setStatus(error.message || "Download failed.");
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleCopyCaption() {
    try {
      await navigator.clipboard.writeText(active.caption || "");
      setStatus("Caption copied.");
    } catch (error) {
      setStatus(error.message || "Could not copy caption.");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/50 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Post types</div>
          <div className="mt-4 grid gap-3">
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                active={tab.id === active.id}
                label={tab.label}
                description={tab.description}
                onClick={() => setActiveTab(tab.id)}
              />
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/50 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Actions</div>
          {active.id === "consultantFeature" && data.consultantFeature.options?.length ? (
            <div className="mt-4">
              <label className="block text-[11px] uppercase tracking-[0.24em] text-slate-500">Choose consultant</label>
              <select
                value={selectedConsultantId}
                onChange={(event) => setSelectedConsultantId(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/40"
              >
                {data.consultantFeature.options.map((option) => (
                  <option key={option.id} value={option.id} className="bg-slate-950 text-slate-100">
                    {option.name}{option.location ? ` • ${option.location}` : ""}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="mt-4 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <DownloadIcon />
              {isDownloading ? "Preparing PNG..." : "Download PNG"}
            </button>
            <button
              type="button"
              onClick={handleCopyCaption}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
            >
              <CopyIcon />
              Copy caption
            </button>
          </div>
          {status ? <div className="mt-3 text-sm text-cyan-100">{status}</div> : null}
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/50 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Post notes</div>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            {active.insights.map((insight) => (
              <div key={insight} className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 leading-6">
                {insight}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/50 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Export copy</div>
          <pre className="mt-4 whitespace-pre-wrap rounded-2xl border border-white/8 bg-black/20 px-4 py-4 text-sm leading-6 text-slate-300">
            {active.caption}
          </pre>
          <div className="mt-4 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-500">
            Refreshed {formatGeneratedAt(data.generatedAt)}
          </div>
        </div>

        {data.warnings?.length ? (
          <div className="rounded-[1.75rem] border border-amber-300/20 bg-amber-500/10 p-5 text-sm text-amber-100">
            <div className="flex items-start gap-3 font-medium text-amber-50">
              <NoticeIcon />
              Partial data warnings
            </div>
            <div className="mt-3 space-y-2 leading-6">
              {data.warnings.map((warning) => (
                <div key={warning}>{warning}</div>
              ))}
            </div>
          </div>
        ) : null}
      </aside>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border border-white/10 bg-slate-950/50 px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Current post</div>
            <div className="mt-2 text-2xl font-semibold text-white">{active.label}</div>
          </div>

          <div className="grid min-w-[280px] grid-cols-3 gap-3">
            {active.insights.slice(0, 3).map((insight, index) => (
              <StatChip key={`${active.id}-${index}`} label={`Note ${index + 1}`} value={insight} />
            ))}
          </div>
        </div>

        <PreviewShell
          previewRef={(node) => {
            previewRefs.current[active.id] = node;
          }}
          onOpen={() => setIsFullscreenOpen(true)}
          title={active.label}
        >
          {active.content}
        </PreviewShell>
      </section>

      {isFullscreenOpen ? (
        <FullscreenPreview title={active.label} onClose={() => setIsFullscreenOpen(false)}>
          {active.content}
        </FullscreenPreview>
      ) : null}
    </div>
  );
}
