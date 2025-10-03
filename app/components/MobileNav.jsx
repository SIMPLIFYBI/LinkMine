"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import navTabs from "./navTabs";

export default function MobileNav() {
  const pathname = usePathname();
  const scrollerRef = useRef(null);

  const isActive = (href) => pathname === href || pathname?.startsWith(href + "/");

  function onWheel(e) {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      scrollerRef.current?.scrollBy({ left: e.deltaX, behavior: "auto" });
      e.preventDefault();
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-white/10 bg-slate-900/80 backdrop-blur">
      <div className="mx-auto max-w-screen-xl h-14 flex items-center">
        <div
          ref={scrollerRef}
          onWheel={onWheel}
          className="flex items-center h-full gap-2 px-3 flex-1 overflow-x-auto whitespace-nowrap no-scrollbar"
        >
          {navTabs.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`rounded-full border px-3 py-2 text-sm transition ${
                  active
                    ? "border-sky-400/30 bg-sky-500/10 text-sky-200"
                    : "border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="pb-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}