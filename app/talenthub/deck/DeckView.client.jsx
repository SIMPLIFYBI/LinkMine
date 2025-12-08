"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import EmblaParallax from "./EmblaParallax.client";

const PAGE_SIZE = 50;

export default function DeckView({ initialFilters }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState([]);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);

  const q = searchParams.get("q") ?? initialFilters?.q ?? "";

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        // Base visibility
        let query = supabase
          .from("workers")
          .select("id, display_name, public_profile_name, headline, location")
          .eq("visibility", "public")
          .eq("status", "approved")
          .limit(PAGE_SIZE);

        if (q) query = query.ilike("display_name", `%${q}%`);

        const { data: rows, error: wErr } = await query;
        if (wErr) throw wErr;

        const ids = (rows || []).map((r) => r.id);
        // Availability in bulk
        let availabilityMap = new Map();
        if (ids.length) {
          const { data: avRows, error: aErr } = await supabase
            .from("worker_availability")
            .select("worker_id, available_now, available_from")
            .in("worker_id", ids);
          if (aErr) throw aErr;
          for (const r of avRows || []) availabilityMap.set(r.worker_id, r);
        }

        const merged = (rows || []).map((r) => ({
          ...r,
          availability: availabilityMap.get(r.id) || null,
        }));

        // Experiences (top 3 per worker)
        let expMap = new Map();
        if (ids.length) {
          const { data: expRows, error: xErr } = await supabase
            .from("worker_experiences")
            .select("worker_id, role_title, company, is_current, position, start_date")
            .in("worker_id", ids)
            .order("is_current", { ascending: false })
            .order("position", { ascending: true })
            .order("start_date", { ascending: false });
          if (xErr) throw xErr;
          for (const r of expRows || []) {
            const arr = expMap.get(r.worker_id) || [];
            arr.push(r);
            expMap.set(r.worker_id, arr);
          }
        }

        const mergedWithXp = merged.map((w) => ({
          ...w,
          experiences: (expMap.get(w.id) || []).slice(0, 3),
        }));

        if (!cancelled) {
          setWorkers(mergedWithXp);
          setIndex(0);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load workers");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [q]);

  const current = workers[index];
  const remaining = workers.length - index - 1;

  function next() {
    setIndex((i) => Math.min(i + 1, workers.length));
  }
  function prev() {
    setIndex((i) => Math.max(i - 1, 0));
  }
  function openProfile(id) {
    router.push(`/talenthub/${id}`);
  }

  return (
    <div className="relative">
      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-slate-300">
          Loading…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6 text-rose-100">
          {error}
        </div>
      ) : (
        <EmblaParallax
          slides={workers}
          onOpen={(id) => router.push(`/talenthub/${id}`)}
          renderSlide={(card) => (
            <div className="group relative h-[50vh] md:h-[520px] rounded-[32px] p-[4px] bg-gradient-to-br from-[#3B82F6] via-[#60A5FA] to-[#93C5FD] shadow-[0_8px_24px_rgba(59,130,246,0.28)] ring-1 ring-white/30">
              <div className="h-full w-full rounded-[26px] bg-white/80 backdrop-blur-md border border-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] overflow-hidden">
                <div className="h-full w-full p-2 md:p-6">  {/* tighten inner padding on mobile */}
                  <CardSurface
                    displayName={(card.public_profile_name || card.display_name || "Unnamed")}
                    card={card}
                    availNow={!!card.availability?.available_now}
                    availFrom={
                      card.availability?.available_from
                        ? new Date(card.availability.available_from).toLocaleDateString()
                        : null
                    }
                  />
                </div>
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
}

function Deck({ cards, index, onIndexChange, onOpen, onPrev, onNext, remaining }) {
  const [direction, setDirection] = useState(1); // 1 = next (slide left), -1 = prev (slide right)
  const current = cards[index];
  const prev = index > 0 ? cards[index - 1] : null;
  const next = index + 1 < cards.length ? cards[index + 1] : null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative h-[520px] overflow-visible">
        {/* Left peek (previous) */}
        {prev ? (
          <motion.div
            key={`peek-left-${index}`}
            className="absolute inset-0 select-none"
            style={{ zIndex: 1 }}
            initial={{ x: "-48%", opacity: 0.25, scale: 0.92 }}
            animate={{ x: "-42%", opacity: 0.45, scale: 0.94 }}
            exit={{ x: "-48%", opacity: 0.25, scale: 0.92 }}
            transition={{ type: "tween", duration: 0.25 }}
            onClick={() => {
              setDirection(-1);
              onPrev();
            }}
          >
            <PeekCard card={prev} />
          </motion.div>
        ) : null}

        {/* Center (current, swipeable) */}
        <AnimatePresence custom={direction} initial={false} mode="wait">
          {current ? (
            <SwipeCard
              key={current.id}
              card={current}
              isTop
              direction={direction}
              onOpen={() => onOpen(current.id)}
              onSwiped={(dir) => {
                setDirection(dir);
                if (dir > 0) onNext();
                else onPrev();
              }}
            />
          ) : null}
        </AnimatePresence>

        {/* Right peek (next) */}
        {next ? (
          <motion.div
            key={`peek-right-${index}`}
            className="absolute inset-0 select-none"
            style={{ zIndex: 1 }}
            initial={{ x: "48%", opacity: 0.25, scale: 0.92 }}
            animate={{ x: "42%", opacity: 0.45, scale: 0.94 }}
            exit={{ x: "48%", opacity: 0.25, scale: 0.92 }}
            transition={{ type: "tween", duration: 0.25 }}
            onClick={() => {
              setDirection(1);
              onNext();
            }}
          >
            <PeekCard card={next} />
          </motion.div>
        ) : null}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setDirection(-1);
            onPrev();
          }}
          disabled={index === 0}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 disabled:opacity-40"
        >
          Back
        </button>
        <div className="text-xs text-slate-400">
          {index + 1} / {cards.length} {remaining > 0 ? `(+${remaining} more)` : ""}
        </div>
        <button
          type="button"
          onClick={() => {
            setDirection(1);
            onNext();
          }}
          className="rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-2 text-sm text-sky-100"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function SwipeCard({ card, isTop, onSwiped, onOpen, direction = 1 }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-10, 0, 10]);
  const opacity = useTransform(x, [-220, 0, 220], [0.5, 1, 0.5]);

  const pointerDown = useRef({ x: 0, y: 0, t: 0 });
  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 320 : -320, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -320 : 320, opacity: 0 }),
  };

  function onPointerDown(e) {
    pointerDown.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  }

  function onPointerUp(e) {
    const dx = Math.abs(e.clientX - pointerDown.current.x);
    const dy = Math.abs(e.clientY - pointerDown.current.y);
    const dt = Date.now() - pointerDown.current.t;
    const isClick = dx < 6 && dy < 6 && dt < 250;
    if (isClick) onOpen();
  }

  function onDragEnd(_, info) {
    const threshold = 140;
    if (info.offset.x > threshold || info.offset.x < -threshold) {
      onSwiped(info.offset.x > 0 ? -1 : 1);
    }
  }

  const displayName = card.public_profile_name || card.display_name || "Unnamed";
  const av = card.availability;
  const availNow = !!av?.available_now;
  const availFrom = av?.available_from ? new Date(av.available_from).toLocaleDateString() : null;

  return (
    <motion.div
      className="absolute inset-0 select-none"
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      style={{ zIndex: 2 }}
    >
      <motion.div
        drag={isTop ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        style={{ x, rotate, opacity }}
        onDragEnd={onDragEnd}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        className="group relative h-full rounded-3xl p-[1px] bg-gradient-to-br from-sky-300/40 via-slate-200/40 to-transparent"
      >
        <CardSurface displayName={displayName} card={card} availNow={availNow} availFrom={availFrom} />
      </motion.div>
    </motion.div>
  );
}

function PeekCard({ card }) {
  const displayName = card.public_profile_name || card.display_name || "Unnamed";
  const av = card.availability;
  const availNow = !!av?.available_now;
  const availFrom = av?.available_from ? new Date(av.available_from).toLocaleDateString() : null;
  return (
    <div className="relative h-full rounded-3xl p-[1px] bg-gradient-to-br from-sky-300/25 via-slate-200/25 to-transparent opacity-70">
      <CardSurface displayName={displayName} card={card} availNow={availNow} availFrom={availFrom} muted />
    </div>
  );
}

function CardSurface({ displayName, card, availNow, availFrom, muted = false }) {
  return (
    <div className="relative h-full rounded-3xl bg-white/70 backdrop-blur-md border border-white/40 p-0 shadow-sm overflow-hidden">
      {/* Responsive layout: stack on mobile, grid on desktop */}
      <div className="flex h-full flex-col md:grid md:grid-cols-[200px_1fr] gap-3 md:gap-4">
        {/* Top image (stacked on mobile) / left image (desktop) */}
        <div className="flex items-start justify-center md:justify-start p-3 md:p-4">
          <div className="h-[104px] w-[104px] md:h-[176px] md:w-[176px] rounded-2xl border border-slate-200 bg-sky-50 p-2 md:p-3 flex items-center justify-center">
            <div className="h-full w-full rounded-xl border border-sky-200 bg-sky-100 text-sky-700 text-xl md:text-4xl font-bold flex items-center justify-center">
              {initials(displayName)}
            </div>
          </div>
        </div>

        {/* Content column — mobile: full width below image */}
        <div className="min-w-0 flex flex-col px-3 md:px-0">
          {/* Header row */}
          <div className="pt-1 md:pt-4 md:px-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={`truncate text-[15px] md:text-lg font-semibold ${muted ? "text-slate-700" : "text-slate-900"}`}>
                {displayName}
              </h3>
              {availNow ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/60 bg-emerald-100/70 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Available now
                </span>
              ) : availFrom ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/60 bg-amber-100/70 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                  From {availFrom}
                </span>
              ) : null}
            </div>

            {card.headline ? (
              <p className={`mt-1 line-clamp-2 md:line-clamp-3 text-[13px] md:text-sm ${muted ? "text-slate-500" : "text-slate-600"}`}>
                {card.headline}
              </p>
            ) : null}
          </div>

          {/* Experiences list */}
          {(card.experiences || []).length ? (
            <ul className="mt-2 md:mt-3 space-y-2 md:px-4">
              {card.experiences.slice(0, 3).map((xp, i) => (
                <li key={`${card.id}-xp-${i}`} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-300" />
                  <div className="min-w-0">
                    <div className={`text-[13px] md:text-sm font-medium ${muted ? "text-slate-700" : "text-slate-900"}`}>
                      {xp.role_title}
                      {xp.company ? <span className="text-slate-500 font-normal"> · {xp.company}</span> : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {/* Footer */}
          <div className="mt-3 md:mt-4 border-t border-slate-200 pt-2 md:pt-3 md:px-4 flex items-center justify-between">
            {card.location ? (
              <div className={`inline-flex items-center gap-2 text-[11px] md:text-xs ${muted ? "text-slate-500" : "text-slate-600"}`}>
                <LocationDot />
                <span className="truncate">{card.location}</span>
              </div>
            ) : (
              <span />
            )}
            <div className={`inline-flex items-center gap-2 text-[11px] md:text-xs ${muted ? "text-sky-600/70" : "text-sky-700"} opacity-80`}>
              View profile
              <ArrowNarrowRight />
            </div>
          </div>
        </div>
      </div>

      {/* Subtle bottom shine */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-70" />
    </div>
  );
}

function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => (p[0] || "").toUpperCase()).join("");
}

function ArrowNarrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" className="text-sky-700">
      <path fill="currentColor" d="M11 5l4 5-4 5v-3H5v-4h6V5z" />
    </svg>
  );
}

function LocationDot() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" className="text-slate-500">
      <path
        fill="currentColor"
        d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"
      />
    </svg>
  );
}