"use client";

import { Fragment, useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTheme } from "@/app/components/ThemeProvider";
import {
  SITE_MARKET_COOKIE,
  normaliseSiteMarket,
  siteMarketLabel,
  siteMarketToUrlValue,
} from "@/lib/siteMarket";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const NAVIGATION_ANIMATION_MS = 180;
const MARKET_OPTIONS = [
  { value: "mining", label: "Mining", mobileLabel: "Mine" },
  { value: "oil_gas", label: "Oil & Gas", mobileLabel: "O&G" },
];

function writeMarketCookie(value) {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:";
  document.cookie = `${SITE_MARKET_COOKIE}=${encodeURIComponent(value)}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure ? "; Secure" : ""}`;
}

export default function MarketToggle({ market = "mining" }) {
  const currentMarket = normaliseSiteMarket(market);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const [isPending, startTransition] = useTransition();
  const [visualMarket, setVisualMarket] = useState(currentMarket);
  const navigationTimerRef = useRef(null);
  const isLight = theme === "light";
  const bothSelected = visualMarket === "both";
  const miningActive = visualMarket === "mining" || bothSelected;
  const oilGasActive = visualMarket === "oil_gas" || bothSelected;

  useEffect(() => {
    setVisualMarket(currentMarket);
  }, [currentMarket]);

  useEffect(() => {
    return () => {
      if (navigationTimerRef.current) {
        window.clearTimeout(navigationTimerRef.current);
      }
    };
  }, []);

  const navigateWithAnimationDelay = useCallback((nextUrl) => {
    if (navigationTimerRef.current) {
      window.clearTimeout(navigationTimerRef.current);
    }

    navigationTimerRef.current = window.setTimeout(() => {
      window.location.assign(nextUrl);
    }, NAVIGATION_ANIMATION_MS);
  }, []);

  const handleSwitch = useCallback((marketValue) => {
    if (marketValue === visualMarket) return;

    setVisualMarket(marketValue);

    writeMarketCookie(marketValue);

    const currentPath = pathname || "/";

    if (currentPath.startsWith("/consultants")) {
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.delete("service");
      params.delete("category");
      params.delete("page");

      const nextMarketValue = siteMarketToUrlValue(marketValue);
      if (nextMarketValue === "mining") params.delete("market");
      else params.set("market", nextMarketValue);

      const query = params.toString();
      const nextUrl = query ? `${currentPath}?${query}` : currentPath;
      navigateWithAnimationDelay(nextUrl);
      return;
    }

    const currentQuery = searchParams?.toString();
    const nextUrl = currentQuery ? `${currentPath}?${currentQuery}` : currentPath;
    startTransition(() => {
      navigateWithAnimationDelay(nextUrl);
    });
  }, [navigateWithAnimationDelay, pathname, searchParams, startTransition, visualMarket]);

  return (
    <div
      className={[
        "relative inline-grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-0.5 rounded-full border p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_18px_40px_-28px_rgba(15,23,42,0.85)] backdrop-blur-xl",
        isLight
          ? "border-slate-200/80 bg-white/80"
          : "border-white/12 bg-slate-950/55",
      ].join(" ")}
      aria-label="Select market"
      role="radiogroup"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0.5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-0.5"
      >
        <span
          className={[
            "rounded-full bg-[linear-gradient(135deg,rgba(56,189,248,0.98)_0%,rgba(99,102,241,0.95)_100%)] shadow-[0_16px_30px_-18px_rgba(56,189,248,0.92)] transition-all duration-300 ease-out",
            miningActive ? "scale-100 opacity-100" : "scale-x-0 scale-y-90 opacity-0",
            "origin-right",
          ].join(" ")}
        />
        <span className="w-4 sm:w-5" />
        <span
          className={[
            "rounded-full bg-[linear-gradient(135deg,rgba(251,191,36,0.98)_0%,rgba(249,115,22,0.98)_55%,rgba(244,63,94,0.95)_100%)] shadow-[0_16px_30px_-18px_rgba(249,115,22,0.92)] transition-all duration-300 ease-out",
            oilGasActive ? "scale-100 opacity-100" : "scale-x-0 scale-y-90 opacity-0",
            "origin-left",
          ].join(" ")}
        />
      </div>
      {MARKET_OPTIONS.map(({ value, label, mobileLabel }, index) => {
        const active = visualMarket === value;
        const blendedActive = active || bothSelected;
        return (
          <Fragment key={value}>
            <button
              type="button"
              onClick={() => handleSwitch(value)}
              disabled={isPending}
              role="radio"
              aria-checked={active}
              className={[
                "group relative z-10 flex h-6 min-w-[4rem] items-center justify-center overflow-hidden rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-[0.02em] transition-all duration-200 disabled:cursor-wait disabled:opacity-70 sm:h-6 sm:px-2.5 sm:text-[11px]",
                blendedActive
                  ? "text-slate-950"
                  : isLight
                  ? "text-slate-600 hover:bg-slate-100/90 hover:text-slate-950"
                  : "text-slate-300 hover:bg-white/10 hover:text-white",
                bothSelected && index === 0 ? "pr-4" : "",
                bothSelected && index === 1 ? "pl-4" : "",
              ].join(" ")}
              aria-label={`${label}${active ? " selected" : bothSelected ? " included in both markets" : " not selected"}`}
            >
              <span
                aria-hidden="true"
                className={[
                  "pointer-events-none absolute inset-[1px] rounded-full transition-opacity duration-200",
                  blendedActive ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                  isLight ? "bg-white/14" : "bg-white/8",
                ].join(" ")}
              />
              <span className="relative hidden sm:inline">{siteMarketLabel(value)}</span>
              <span className="relative sm:hidden">{mobileLabel}</span>
            </button>
            {index === 0 ? (
              <button
                type="button"
                onClick={() => handleSwitch("both")}
                disabled={isPending}
                role="radio"
                aria-checked={bothSelected}
                aria-label={`Both markets${bothSelected ? " selected" : " not selected"}`}
                className={[
                  "group relative -mx-0.5 z-10 flex h-6 w-4 items-center justify-center rounded-full transition-all duration-200 disabled:cursor-wait disabled:opacity-70 sm:h-6 sm:w-5",
                  bothSelected ? "scale-105" : "hover:scale-105",
                ].join(" ")}
              >
                <span
                  className={[
                    "block size-2 rounded-full border transition-all duration-200 sm:size-2.5",
                    bothSelected
                      ? "border-white/70 bg-white shadow-[0_0_0_4px_rgba(255,255,255,0.18),0_0_18px_rgba(255,255,255,0.55)]"
                      : isLight
                      ? "border-slate-400/70 bg-slate-500/80 group-hover:border-slate-500 group-hover:bg-slate-700"
                      : "border-white/35 bg-white/45 group-hover:border-white/55 group-hover:bg-white/65",
                  ].join(" ")}
                />
              </button>
            ) : null}
          </Fragment>
        );
      })}
    </div>
  );
}