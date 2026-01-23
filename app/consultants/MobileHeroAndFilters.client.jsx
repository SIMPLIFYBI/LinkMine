"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import NameSearch from "./NameSearch.client.jsx";
import ServiceFilter from "./ServiceFilter.client.jsx";
import ServiceSlugFilter from "./ServiceSlugFilter.client.jsx";
import ProviderKindFilter from "@/app/consultants/ProviderKindFilter.client";
import AddConsultantButton from "@/app/components/consultants/AddConsultantButton";

export default function MobileHeroAndFilters({
  categories,
  services,
  q,
  activeService,
  activeCategory,
  hasActive,
  consultantsCount
}) {
  const [open, setOpen] = useState(false);
  const [floatingVisible, setFloatingVisible] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const kind = searchParams?.get("kind") || "";
  const kindLabel =
    kind === "operational" ? "Operational Services" :
    kind === "professional" ? "Professional Services" :
    kind === "both" ? "Both" : "";
  const anyActive = hasActive || !!kind;
  const sheetRef = useRef(null);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // Click outside to close
  useEffect(() => {
    function onClick(e) {
      if (!open) return;
      if (sheetRef.current && !sheetRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const handleReset = useCallback(() => {
    setOpen(false);
    router.push("/consultants");
  }, [router]);

  // Accessibility: close on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Scroll direction detection to fade floating button
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const dy = y - lastY;

        // Small threshold to avoid jitter
        if (Math.abs(dy) > 6) {
          if (y > 24 && dy > 0) {
            // Scrolling down
            setFloatingVisible(false);
          } else if (dy < 0) {
            // Scrolling up
            setFloatingVisible(true);
          }
        }

        lastY = y;
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const showFloating = open || floatingVisible;

  return (
    // Full-width strip on mobile: cancel page padding
    <div className="md:hidden relative -mx-6">
      {/* Hero strip */}
      <div
        className="
          relative overflow-hidden
          border-y border-white/10
          bg-gradient-to-br from-slate-950 via-slate-900/90 to-slate-800/90
          px-6 py-6
          backdrop-blur-xl shadow-lg ring-1 ring-white/10
        "
        style={{
          paddingTop: "max(1rem, env(safe-area-inset-top, 0px))",
        }}
      >
        {/* Ambient glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -left-24 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        </div>

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Mining Consultants
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-300">
              Browse vetted consultants & contractors. Tap filters to refine by
              discipline, category, or name.
            </p>

            {/* CTA pill */}
            <div className="mt-4">
              <AddConsultantButton
                className="
                  relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold text-white
                  bg-white/5 backdrop-blur-sm border border-white/15
                  before:absolute before:inset-0 before:rounded-full before:border before:border-transparent
                  before:bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.35),transparent_60%)]
                  hover:bg-white/10 hover:border-white/25 transition
                  shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_4px_12px_-2px_rgba(0,0,0,0.4)]
                  active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-sky-500/40
                "
              >
                <span className="relative flex items-center">
                  <span className="mr-1 inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 shadow-sm" />
                  Add your profile
                </span>
              </AddConsultantButton>
            </div>
          </div>

          {/* Removed inline filter trigger to “detach” it from the hero */}
        </div>

        {anyActive ? (
          <div className="relative mt-3 text-[11px] text-slate-300">
            {q && <span>Name “{q}” • </span>}
            {activeService && <span>Service {activeService.name} • </span>}
            {!activeService && activeCategory && <span>Category {activeCategory.name} • </span>}
            {kind && <span>Type {kindLabel} • </span>}
            <span>
              {consultantsCount} result{consultantsCount === 1 ? "" : "s"}
            </span>
            <button
              onClick={handleReset}
              className="ml-2 text-sky-300 underline-offset-2 hover:underline"
            >
              Reset
            </button>
          </div>
        ) : null}
      </div>

      {/* Floating quick filter icon: persistent, fade on scroll, top-right (lowered & modern gradient) */}
      <div
        className="fixed right-6 z-40 md:hidden"
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 8.25rem)" }} // was 4.25rem
      >
        <button
          aria-label="Open filters"
          onClick={() => setOpen(true)}
          className={`
            group relative inline-flex h-12 w-12 items-center justify-center rounded-2xl
            border border-white/20
            bg-[linear-gradient(135deg,#0ea5e9_0%,#6366f1_48%,#8b5cf6_80%,#ec4899_115%)]
            text-white
            shadow-[0_4px_16px_-2px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.06)]
            backdrop-blur-md
            transition
            hover:shadow-[0_6px_20px_-2px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.1)]
            hover:brightness-110
            active:scale-95 active:shadow-[0_3px_10px_-2px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.08)]
            focus:outline-none focus:ring-2 focus:ring-sky-400/50
            ${showFloating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}
          `}
          style={{ transitionProperty: "opacity, transform, box-shadow, filter" }}
        >
          <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-70 mix-blend-screen
            bg-[radial-gradient(circle_at_30%_28%,rgba(255,255,255,0.35),transparent_60%)]" />
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            className="relative transition group-hover:scale-110 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
          >
            <path
              d="M4 5h16M7 12h10M10 19h4"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Overlay & Sheet */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
        />
        <div
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          className={`
            absolute inset-x-0 bottom-0 flex max-h-[88%] flex-col overflow-hidden
            rounded-t-3xl border border-white/10
            bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-slate-800/90
            backdrop-blur-xl shadow-2xl transition-transform duration-300
            ${open ? "translate-y-0" : "translate-y-full"}
          `}
        >
          {/* Handle */}
          <div className="flex items-center justify-between px-6 pt-5">
            <div className="mx-auto h-1.5 w-12 rounded-full bg-white/15" />
            <button
              onClick={() => setOpen(false)}
              aria-label="Close filters"
              className="absolute right-4 top-4 rounded-lg border border-white/10 bg-white/10 p-2 text-slate-200 backdrop-blur-sm hover:bg-white/15 active:scale-95"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Search</h2>
              <NameSearch initialValue={q} onApplied={() => setOpen(false)} />
            </div>
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Category</h2>
              <ServiceFilter categories={categories} activeSlug={activeCategory?.slug || ""} />
            </div>
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Service</h2>
              <ServiceSlugFilter services={services} activeSlug={activeService?.slug || ""} />
            </div>
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Provider type</h2>
              <ProviderKindFilter />
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-300">
              {q && (
                <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 font-medium text-sky-200">
                  Name “{q}”
                </span>
              )}
              {activeService && (
                <span className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 font-medium text-indigo-200">
                  Service: {activeService.name}
                </span>
              )}
              {!activeService && activeCategory && (
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 font-medium text-emerald-200">
                  Category: {activeCategory.name}
                </span>
              )}
              {kind && (
                <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1 font-medium text-fuchsia-200">
                  Type: {kindLabel}
                </span>
              )}
              {anyActive && (
                <button
                  onClick={handleReset}
                  className="rounded-full border border-white/15 bg-white/10 px-3 py-1 font-medium text-slate-200 hover:bg-white/15 transition"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Inline CTA pill inside sheet */}
            <div className="pt-2">
              <AddConsultantButton
                className="
                  group relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold
                  bg-gradient-to-r from-sky-600/70 via-indigo-600/70 to-purple-600/70
                  text-white shadow-md backdrop-blur-sm border border-white/10
                  hover:from-sky-500/80 hover:to-purple-500/80 hover:border-white/20
                  transition focus:outline-none focus:ring-2 focus:ring-sky-500/40 active:scale-[0.96]
                "
              >
                <span className="relative flex items-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mr-1">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Add your profile
                </span>
              </AddConsultantButton>
            </div>
          </div>

          <div className="border-t border-white/10 bg-gradient-to-r from-slate-900/90 to-slate-800/90 px-6 py-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {consultantsCount} result{consultantsCount === 1 ? "" : "s"}
              </span>
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:from-sky-500 hover:to-indigo-500 active:scale-95 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}