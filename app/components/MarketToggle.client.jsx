"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTheme } from "@/app/components/ThemeProvider";
import {
  SITE_MARKET_COOKIE,
  normaliseSiteMarket,
  siteMarketLabel,
  siteMarketToUrlValue,
} from "@/lib/siteMarket";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const TOGGLE_OPTIONS = [
  { value: "mining", shortLabel: "Mine" },
  { value: "oil_gas", shortLabel: "O&G" },
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
  const isLight = theme === "light";

  const handleSwitch = useCallback((marketValue) => {
    const resolvedMarket = (() => {
      if (currentMarket === "both") {
        return marketValue === "mining" ? "oil_gas" : "mining";
      }

      if (currentMarket === marketValue) {
        return currentMarket;
      }

      return "both";
    })();

    if (resolvedMarket === currentMarket) return;

    writeMarketCookie(resolvedMarket);

    const currentPath = pathname || "/";

    if (currentPath.startsWith("/consultants")) {
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.delete("service");
      params.delete("category");
      params.delete("page");

      const marketValue = siteMarketToUrlValue(resolvedMarket);
      if (marketValue === "mining") params.delete("market");
      else params.set("market", marketValue);

      const query = params.toString();
      const nextUrl = query ? `${currentPath}?${query}` : currentPath;
      window.location.assign(nextUrl);
      return;
    }

    const currentQuery = searchParams?.toString();
    const nextUrl = currentQuery ? `${currentPath}?${currentQuery}` : currentPath;
    startTransition(() => {
      window.location.assign(nextUrl);
    });
  }, [currentMarket, pathname, searchParams, startTransition]);

  return (
    <div
      className={[
        "inline-grid grid-cols-2 items-center gap-1 rounded-full border p-1 shadow-inner",
        isLight
          ? "border-slate-200/80 bg-white/85"
          : "border-white/12 bg-slate-950/55",
      ].join(" ")}
      aria-label="Active market"
      role="group"
    >
      {TOGGLE_OPTIONS.map(({ value, shortLabel }) => {
        const active = currentMarket === "both" || currentMarket === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => handleSwitch(value)}
            disabled={isPending}
            className={[
              "rounded-full px-2 py-1.5 text-[10px] font-semibold transition disabled:cursor-wait disabled:opacity-70 sm:px-2.5 sm:text-[11px]",
              active
                ? value === "oil_gas"
                  ? "bg-[linear-gradient(90deg,#fbbf24_0%,#f97316_56%,#f43f5e_100%)] text-slate-950 shadow-[0_8px_18px_-10px_rgba(249,115,22,0.95)]"
                  : "bg-[linear-gradient(90deg,#38bdf8_0%,#6366f1_100%)] text-slate-950 shadow-[0_8px_18px_-10px_rgba(56,189,248,0.95)]"
                : isLight
                ? "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                : "text-slate-300 hover:bg-white/10 hover:text-white",
            ].join(" ")}
            aria-pressed={active}
            aria-label={`${siteMarketLabel(value)}${currentMarket === "both" ? " selected" : active ? " selected" : " not selected"}`}
          >
            <span className="hidden sm:inline">{siteMarketLabel(value)}</span>
            <span className="sm:hidden">{shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}