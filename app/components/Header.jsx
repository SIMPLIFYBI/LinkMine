"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import navTabs from "./navTabs";
import UserPill from "./UserPill";
import Logo from "@/app/components/Logo";
import { useTheme } from "@/app/components/ThemeProvider";
import MarketToggle from "@/app/components/MarketToggle.client";

export default function Header({ currentMarket = "mining" }) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const isMarketplaceRoute = pathname === "/marketplace" || pathname?.startsWith("/marketplace/");

  function triggerMarketplaceSearchToggle() {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("marketplace:search-toggle"));
  }

  return (
    <header className="sticky top-0 z-40 pt-[env(safe-area-inset-top)]">
      <div
        className={isLight
          ? "border-b border-slate-200/80 bg-white/78 backdrop-blur-xl shadow-[0_1px_0_0_rgba(148,163,184,0.18)]"
          : "border-b border-white/10 bg-slate-950/60 backdrop-blur-xl shadow-[0_1px_0_0_rgba(255,255,255,0.06)]"}
      >
        <div className="mx-auto flex h-14 max-w-screen-xl items-center gap-3 px-4">
          {/* Left */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Logo className="select-none" variant={currentMarket === "both" ? "split-both" : "default"} />
            {isMarketplaceRoute ? (
              <Link
                href="/marketplace"
                className={[
                  "group relative inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition",
                  isLight
                    ? "border-slate-300/90 bg-gradient-to-r from-slate-100 to-white text-slate-800 shadow-[0_10px_22px_-16px_rgba(15,23,42,0.35)] hover:border-sky-300/80 hover:text-sky-700"
                    : "border-white/15 bg-gradient-to-r from-sky-500/18 via-cyan-400/12 to-emerald-400/18 text-slate-100 shadow-[0_10px_26px_-16px_rgba(14,165,233,0.45)] hover:border-sky-300/40 hover:text-white",
                ].join(" ")}
                aria-label="Marketplace home"
              >
                <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">Marketplace</span>
              </Link>
            ) : (
              <MarketToggle market={currentMarket} />
            )}
          </div>

          {/* Center (desktop) */}
          <nav className="hidden md:flex flex-1 items-center justify-center gap-6">
            {(navTabs ?? []).map((t) => {
              const active = pathname === t.href || pathname?.startsWith(t.href + "/");

              return (
                <Link
                  key={t.href}
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "relative text-sm font-medium tracking-tight transition-colors",
                    isLight ? "text-slate-600 hover:text-slate-950" : "text-slate-300 hover:text-white",
                    active ? (isLight ? "text-slate-950" : "text-white") : "",
                    // underline accent
                    active
                      ? "after:absolute after:left-0 after:right-0 after:-bottom-2 after:h-px after:bg-gradient-to-r after:from-sky-400 after:to-indigo-400 after:opacity-100"
                      : "after:absolute after:left-0 after:right-0 after:-bottom-2 after:h-px after:bg-white/0 after:opacity-0 hover:after:bg-white/20 hover:after:opacity-100",
                  ].join(" ")}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>

          {/* Right */}
          <div className="ml-auto flex items-center gap-2">
            {isMarketplaceRoute ? (
              <button
                type="button"
                onClick={triggerMarketplaceSearchToggle}
                className={[
                  "inline-flex h-9 w-9 items-center justify-center rounded-full border transition md:hidden",
                  isLight
                    ? "border-slate-300/80 bg-white/80 text-slate-700 hover:border-sky-300/70 hover:text-sky-700"
                    : "border-white/15 bg-white/[0.06] text-slate-200 hover:border-sky-300/50 hover:text-white",
                ].join(" ")}
                aria-label="Toggle marketplace search"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
              </button>
            ) : null}
            <UserPill />
          </div>
        </div>
      </div>
    </header>
  );
}

