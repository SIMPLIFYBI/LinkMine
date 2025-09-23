"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import navTabs from "./navTabs";

export default function MobileNav() {
  const pathname = usePathname();
  const scrollerRef = useRef(null);

  const accountTab = navTabs.find((t) => t.href === "/account");
  const tabs = navTabs.filter((t) => t.href !== "/account");
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
          className="
            flex items-center h-full gap-1 px-2 flex-1
            overflow-x-auto whitespace-nowrap no-scrollbar
          "
        >
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`
                inline-flex items-center justify-center shrink-0
                px-3 py-2 text-sm rounded-md
                ${isActive(t.href) ? "text-sky-200 bg-white/5" : "text-slate-300 hover:text-white hover:bg-white/5"}
              `}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {accountTab && (
          <Link
            href={accountTab.href}
            className={`
              inline-flex items-center justify-center h-full px-4 border-l border-white/10 shrink-0
              ${isActive(accountTab.href) ? "text-sky-200 bg-white/5" : "text-slate-300 hover:text-white hover:bg-white/5"}
            `}
            aria-label="Account"
          >
            {accountTab.label}
          </Link>
        )}
      </div>
      <div className="pb-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}