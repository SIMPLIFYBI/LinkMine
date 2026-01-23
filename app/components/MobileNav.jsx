"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import navTabs from "./navTabs";

function Icon({ name, active }) {
  const cls = active ? "text-white" : "text-slate-300";
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", className: cls, "aria-hidden": true };

  switch (name) {
    case "home":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 10v10h14V10" />
        </svg>
      );
    case "briefcase":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 6h4a2 2 0 0 1 2 2v2H8V8a2 2 0 0 1 2-2Z" />
          <path d="M4 10h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8Z" />
        </svg>
      );
    case "users":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="3" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a3 3 0 0 1 0 5.74" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 2v4M16 2v4" />
          <path d="M3 10h18" />
          <path d="M5 6h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
        </svg>
      );
    case "pulse":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12h4l2-6 4 12 2-6h6" />
        </svg>
      );
    case "info":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      );
    case "user":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21a8 8 0 1 0-16 0" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    default:
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M12 4h9" />
          <path d="M3 12h18" />
        </svg>
      );
  }
}

function pickIconForTab(tab) {
  const href = String(tab?.href || "").toLowerCase();
  const label = String(tab?.label || "").toLowerCase();

  if (href === "/" || label.includes("home")) return "home";
  if (href.includes("jobs") || label.includes("job")) return "briefcase";
  if (href.includes("consultant") || label.includes("consultant")) return "users";
  if (href.includes("whats-on") || href.includes("what") || label.includes("what")) return "calendar";
  if (href.includes("activity") || label.includes("activity")) return "pulse";
  if (href.includes("account") || label.includes("account")) return "user";
  if (href.includes("about") || label.includes("about")) return "info";
  return "home";
}

export default function MobileNav() {
  const pathname = usePathname();
  const scrollerRef = useRef(null);
  const rafRef = useRef(null);

  const [leftFade, setLeftFade] = useState(0);
  const [rightFade, setRightFade] = useState(0);

  const isActive = (href) => pathname === href || pathname?.startsWith(href + "/");

  function computeFades() {
    const el = scrollerRef.current;
    if (!el) return;

    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const left = Math.max(0, el.scrollLeft);
    const remainingRight = Math.max(0, maxScroll - left);

    // how quickly the edge fade appears/disappears
    const FADE_PX = 72;

    const l = maxScroll <= 0 ? 0 : Math.max(0, Math.min(1, left / FADE_PX));
    const r = maxScroll <= 0 ? 0 : Math.max(0, Math.min(1, remainingRight / FADE_PX));

    setLeftFade(l);
    setRightFade(r);
  }

  function schedule() {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      computeFades();
    });
  }

  useEffect(() => {
    computeFades();
    const el = scrollerRef.current;
    if (!el) return;

    const onScroll = () => schedule();
    el.addEventListener("scroll", onScroll, { passive: true });

    const onResize = () => schedule();
    window.addEventListener("resize", onResize);

    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
      {/* glass shell */}
      <div className="border-t border-white/10 bg-slate-950/55 backdrop-blur-xl shadow-[0_-12px_48px_-28px_rgba(0,0,0,0.6)]">
        <div className="mx-auto max-w-screen-xl">
          <div className="relative h-14">
            {/* edge fades (no arrow overlay) */}
            <div
              className="pointer-events-none absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-slate-950/80 to-transparent transition-opacity"
              style={{ opacity: leftFade }}
            />
            <div
              className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-slate-950/80 to-transparent transition-opacity"
              style={{ opacity: rightFade }}
            />

            <div
              ref={scrollerRef}
              onScroll={schedule}
              className="no-scrollbar flex h-full items-center gap-1 overflow-x-auto px-2"
            >
              {(navTabs ?? []).map((tab) => {
                const active = isActive(tab.href);
                const iconName = pickIconForTab(tab);

                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "relative flex-none",
                      "h-12 w-[76px]",
                      "rounded-xl",
                      "grid place-items-center",
                      "transition",
                      active
                        ? "bg-white/[0.08] ring-1 ring-white/15"
                        : "bg-transparent hover:bg-white/[0.06]",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50",
                    ].join(" ")}
                  >
                    <div className="flex flex-col items-center justify-center leading-none">
                      <div className="relative">
                        <Icon name={iconName} active={active} />
                        {/* removed the active blue dot */}
                      </div>

                      <div
                        className={[
                          "mt-1 text-[10px] font-semibold tracking-tight",
                          active ? "text-white" : "text-slate-300",
                        ].join(" ")}
                      >
                        {tab.label}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* safe-area */}
          <div className="pb-[env(safe-area-inset-bottom)]" />
        </div>
      </div>
    </nav>
  );
}