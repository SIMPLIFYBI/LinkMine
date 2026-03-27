"use client";

import { useEffect, useRef, useState } from "react";

function Badge({ children, tone = "neutral" }) {
  const classes = {
    neutral: "border-white/12 bg-white/[0.05] text-slate-200",
    now: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
    later: "border-amber-400/30 bg-amber-500/10 text-amber-100",
    accent: "border-cyan-300/30 bg-cyan-400/10 text-cyan-100",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium ${classes[tone] || classes.neutral}`}>
      {children}
    </span>
  );
}

function WorkerDetailModal({ worker, onClose }) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  if (!worker) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-xl" onClick={onClose}>
      <div
        className="relative max-h-[90vh] w-full max-w-3xl overflow-auto rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(7,20,34,0.94),rgba(8,17,28,0.96))] p-6 text-slate-100 shadow-[0_36px_120px_-44px_rgba(8,145,178,0.8)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/[0.12]"
        >
          Close
        </button>

        <div className="pr-20">
          <p className="section-label">Profile summary</p>
          <h2 className="mt-4 text-3xl font-semibold text-white">{worker.displayName}</h2>
          <p className="mt-2 text-lg text-slate-200">{worker.headline}</p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Badge tone="accent">{worker.location}</Badge>
          {worker.availability ? <Badge tone={worker.availability.tone}>{worker.availability.label}</Badge> : null}
          {worker.workingRights ? <Badge>{worker.workingRights}</Badge> : null}
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">CV snapshot</h3>
            <p className="mt-4 text-sm leading-7 text-slate-200">{worker.bioPreview}</p>

            <div className="mt-6">
              <h4 className="text-sm font-semibold text-white">Recent experience</h4>
              <div className="mt-3 space-y-3">
                {worker.experiences.length ? worker.experiences.map((experience, index) => (
                  <article key={`${worker.id}-detail-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">{experience.roleTitle}</div>
                        {experience.company ? <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">{experience.company}</div> : null}
                      </div>
                      {experience.dateRange ? <div className="text-xs text-slate-400">{experience.dateRange}</div> : null}
                    </div>
                    {experience.description ? <p className="mt-3 text-sm leading-6 text-slate-300">{experience.description}</p> : null}
                  </article>
                )) : (
                  <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">
                    No experience added yet.
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Roles</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {worker.roles.length ? worker.roles.map((role) => (
                  <Badge key={`${worker.id}-${role.slug || role.name}`}>{role.name}</Badge>
                )) : <div className="text-sm text-slate-400">No roles added.</div>}
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-300/16 bg-cyan-400/[0.05] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-100/80">Hiring read</div>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                Strong fit for a fast first-pass review. The deck is designed to answer: should this person move to shortlist?
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function WorkerCard({ worker, onOpen, className = "", compact = false, cardRef = null }) {

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={onOpen}
      className={`group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(7,20,34,0.98),rgba(8,17,28,0.98))] text-left shadow-[0_30px_110px_-48px_rgba(8,145,178,0.85)] transition hover:-translate-y-1 hover:border-cyan-300/30 hover:shadow-[0_36px_130px_-50px_rgba(8,145,178,0.95)] ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_26%),radial-gradient(circle_at_82%_14%,rgba(56,189,248,0.16),transparent_20%)]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:34px_34px]" />

      <div className={`relative flex h-full flex-col ${compact ? "p-5" : "p-6 sm:p-8"}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-label">Candidate deck</p>
            <h2 className={`${compact ? "mt-3 text-2xl" : "mt-4 text-3xl sm:text-[2.2rem]"} font-semibold tracking-tight text-white`}>{worker.displayName}</h2>
            <p className={`${compact ? "mt-2 line-clamp-2 text-sm" : "mt-2 text-sm sm:text-base"} max-w-2xl leading-7 text-slate-200`}>{worker.headline}</p>
          </div>
          <span className="rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100 transition group-hover:bg-white/[0.12]">
            Open
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Badge tone="accent">{worker.location}</Badge>
          {worker.availability ? <Badge tone={worker.availability.tone}>{worker.availability.label}</Badge> : null}
          {worker.workingRights ? <Badge>{worker.workingRights}</Badge> : null}
        </div>

        <div className={`mt-6 grid flex-1 gap-5 ${compact ? "grid-cols-1" : "md:grid-cols-[1.05fr_0.95fr]"}`}>
          <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Brief CV overview</div>
            <p className={`${compact ? "line-clamp-4" : ""} mt-4 text-sm leading-7 text-slate-200`}>{worker.bioPreview}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {worker.roles.slice(0, 4).map((role) => (
                <div key={`${worker.id}-${role.slug || role.name}`} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200">
                  {role.name}
                </div>
              ))}
              {!worker.roles.length ? (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-3 text-sm text-slate-400 sm:col-span-2">
                  No roles linked yet.
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Recent experience</div>
              <div className="text-xs text-slate-500">{compact ? "Top 2" : "Top 3"}</div>
            </div>

            <div className="mt-4 space-y-3">
              {worker.experiences.length ? worker.experiences.slice(0, compact ? 2 : 3).map((experience, index) => (
                <article key={`${worker.id}-${index}`} className="rounded-2xl border border-white/10 bg-black/15 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{experience.roleTitle}</div>
                      {experience.company ? <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">{experience.company}</div> : null}
                    </div>
                    {experience.dateRange ? <div className="text-xs text-slate-400">{experience.dateRange}</div> : null}
                  </div>
                  {experience.description ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">{experience.description}</p> : null}
                </article>
              )) : (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-sm text-slate-400">
                  No experience entries yet.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs uppercase tracking-[0.18em] text-slate-400">
          <span>Swipe or scroll</span>
          <span>Tap to open</span>
        </div>
      </div>
    </button>
  );
}

export default function TalentHubDeck({ workers }) {
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef(null);
  const itemRefs = useRef([]);
  const selectedWorker = workers.find((worker) => worker.id === selectedWorkerId) || null;

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, workers.length);
  }, [workers.length]);

  useEffect(() => {
    const container = trackRef.current;
    if (!container) return undefined;

    let frame = null;

    function updateActiveCard() {
      frame = null;
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.left + (containerRect.width / 2);

      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      itemRefs.current.forEach((element, index) => {
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const cardCenter = rect.left + (rect.width / 2);
        const distance = Math.abs(cardCenter - containerCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveIndex((current) => (current === closestIndex ? current : closestIndex));
    }

    function onScroll() {
      if (frame != null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateActiveCard);
    }

    updateActiveCard();
    container.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      container.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame != null) cancelAnimationFrame(frame);
    };
  }, [workers.length]);

  function scrollToIndex(index) {
    const boundedIndex = Math.max(0, Math.min(index, workers.length - 1));
    const element = itemRefs.current[boundedIndex];
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    setActiveIndex(boundedIndex);
  }

  if (!workers.length) {
    return (
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] px-6 py-16 text-center text-slate-300 shadow-[0_28px_80px_-44px_rgba(15,23,42,0.9)]">
        <h2 className="text-xl font-semibold text-white">No workers are live yet.</h2>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          The tables are ready, but there are no approved public workers to render in the deck yet.
        </p>
      </div>
    );
  }

  return (
    <>
      <div>
        <section className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.54),rgba(2,6,23,0.12))] px-4 py-6 shadow-[0_36px_110px_-54px_rgba(8,145,178,0.95)] sm:px-6 sm:py-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.1),transparent_18%)]" />
          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex - 1)}
            disabled={activeIndex === 0}
            className="absolute left-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-slate-950/72 text-slate-100 backdrop-blur-xl transition hover:bg-slate-900/90 disabled:cursor-not-allowed disabled:opacity-30 md:inline-flex"
            aria-label="Show previous worker"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex + 1)}
            disabled={activeIndex === workers.length - 1}
            className="absolute right-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-slate-950/72 text-slate-100 backdrop-blur-xl transition hover:bg-slate-900/90 disabled:cursor-not-allowed disabled:opacity-30 md:inline-flex"
            aria-label="Show next worker"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" />
            </svg>
          </button>

          <div className="relative talenthub-carousel-mask">
            <div
              ref={trackRef}
              className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto px-[10vw] py-2 scroll-smooth md:px-[16vw]"
            >
              {workers.map((worker, index) => (
                <WorkerCard
                  key={worker.id}
                  worker={worker}
                  compact={false}
                  className={`h-[620px] w-[78vw] min-w-[78vw] shrink-0 snap-center md:h-[640px] md:w-[68vw] md:min-w-[68vw] xl:w-[58vw] xl:min-w-[58vw] transition duration-300 ${activeIndex === index ? "scale-100 opacity-100" : "scale-[0.92] opacity-45"}`}
                  onOpen={() => setSelectedWorkerId(worker.id)}
                  cardRef={(element) => {
                    itemRefs.current[index] = element;
                  }}
                />
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-3 md:hidden">
            <button
              type="button"
              onClick={() => scrollToIndex(activeIndex - 1)}
              disabled={activeIndex === 0}
              className="rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => scrollToIndex(activeIndex + 1)}
              disabled={activeIndex === workers.length - 1}
              className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/16 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-400">
            {workers.map((worker, index) => (
              <button
                key={`${worker.id}-dot`}
                type="button"
                onClick={() => scrollToIndex(index)}
                aria-label={`Jump to ${worker.displayName}`}
                className={`h-2.5 rounded-full transition ${activeIndex === index ? "w-8 bg-cyan-300" : "w-2.5 bg-white/20 hover:bg-white/35"}`}
              />
            ))}
          </div>
        </section>
      </div>

      <WorkerDetailModal worker={selectedWorker} onClose={() => setSelectedWorkerId(null)} />
    </>
  );
}