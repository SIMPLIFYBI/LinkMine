"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId } from "react";
import navTabs from "./navTabs";
import UserPill from "./UserPill";
import Logo from "@/app/components/Logo";
import { useTheme } from "@/app/components/ThemeProvider";
import MarketToggle from "@/app/components/MarketToggle.client";

function VaultWordmark({ className = "", neutralFill = "#090D12" }) {
  const gradientId = useId();

  return (
    <svg
      viewBox="220 320 1435 245"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Vault"
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="680" y1="330" x2="680" y2="540" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="48%" stopColor="#4f93f4" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>

      <path
        fill={neutralFill}
        d="M228 333 L270 337 L375 498 L481 334 L517 331 L519 336 L395 529 C389 537 380 540 371 539 C364 539 358 535 357 530 Z"
      />

      <path
        fill={`url(#${gradientId})`}
        d="M534 537 L569 539 C573 539 576 536 579 532 L679 375 L784 535 C787 538 789 539 792 539 L826 536 L699 342 C694 334 687 329 679 331 C672 332 667 338 663 344 Z"
      />

      <path
        fill={neutralFill}
        d="M889 333 L921 333 L921 462 C921 491 934 508 958 519 C979 529 1003 532 1026 532 C1052 532 1074 528 1091 518 C1114 505 1126 486 1126 461 L1126 333 L1158 333 L1158 464 C1158 494 1148 518 1127 536 C1106 554 1074 562 1027 562 C980 562 945 553 922 535 C900 517 889 494 889 465 Z"
      />

      <path
        fill={neutralFill}
        d="M1215 332 L1248 332 L1248 504 C1248 506 1250 507 1253 507 L1416 507 C1419 507 1420 509 1420 512 L1420 538 L1244 539 C1234 539 1226 536 1219 530 C1215 525 1213 518 1213 510 Z"
      />

      <path
        fill={neutralFill}
        d="M1426 332 L1637 332 L1637 359 C1637 362 1635 363 1631 363 L1551 363 L1551 538 L1517 539 L1517 366 C1517 364 1515 363 1514 363 L1428 363 C1425 363 1424 361 1424 359 Z"
      />
    </svg>
  );
}

export default function Header({ currentMarket = "mining" }) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const isMarketplaceRoute = pathname === "/vault" || pathname?.startsWith("/vault/");
  const vaultWordmarkNeutralFill = isLight ? "#090D12" : "#FFFFFF";

  function triggerMarketplaceSearchToggle() {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("vault:search-toggle"));
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
            {isMarketplaceRoute ? <VaultWordmark className="h-4 w-auto shrink-0 sm:h-4.5" neutralFill={vaultWordmarkNeutralFill} /> : null}
            {!isMarketplaceRoute ? <MarketToggle market={currentMarket} /> : null}
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
                aria-label="Toggle vault search"
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


