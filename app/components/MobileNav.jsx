"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import navTabs from "./navTabs";

export default function MobileNav() {
  const pathname = usePathname();
  const scrollerRef = useRef(null);
  const [showLeftHint, setShowLeftHint] = useState(false);
  const [showRightHint, setShowRightHint] = useState(false);

  const isActive = (href) => pathname === href || pathname?.startsWith(href + "/");

  function onWheel(e) {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      scrollerRef.current?.scrollBy({ left: e.deltaX, behavior: "auto" });
      e.preventDefault();
    }
  }

  function updateHints() {
    const el = scrollerRef.current;
    if (!el) return;
    const atStart = el.scrollLeft <= 1;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
    setShowLeftHint(!atStart);
    setShowRightHint(!atEnd && el.scrollWidth > el.clientWidth + 1);
  }

  useEffect(() => {
    updateHints();
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => updateHints();
    el.addEventListener("scroll", onScroll, { passive: true });
    const onResize = () => updateHints();
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-white/10 bg-slate-900/80 backdrop-blur">
      <div className="mx-auto max-w-screen-xl h-14 flex items-center">
        <div
          ref={scrollerRef}
          onWheel={onWheel}
          onScroll={updateHints}
          className="relative flex items-center h-full gap-2 px-3 flex-1 overflow-x-auto whitespace-nowrap no-scrollbar"
        >
          {/* Left hint */}
          {showLeftHint && (
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-slate-900/80 to-transparent flex items-center justify-start">
              <svg width="16" height="16" viewBox="0 0 20 20" className="ml-1 text-slate-300/70">
                <path fill="currentColor" d="M12.5 5.5L8 10l4.5 4.5" />
              </svg>
            </div>
          )}

          {navTabs.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-none w-28 inline-flex justify-center items-center text-center rounded-full border px-3 py-2 text-sm transition ${
                  active
                    ? "border-sky-400/30 bg-sky-500/10 text-sky-200"
                    : "border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}

          {/* Right hint */}
          {showRightHint && (
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-slate-900/80 to-transparent flex items-center justify-end">
              <svg width="16" height="16" viewBox="0 0 20 20" className="mr-1 text-slate-300/70">
                <path fill="currentColor" d="M7.5 5.5L12 10l-4.5 4.5" />
              </svg>
            </div>
          )}
        </div>
      </div>
      <div className="pb-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}