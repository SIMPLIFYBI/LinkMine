"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/app/components/ThemeProvider";
import {
  SITE_MARKET_COOKIE,
  normaliseSiteMarket,
  siteMarketLabel,
  siteMarketToUrlValue,
} from "@/lib/siteMarket";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function writeMarketCookie(value) {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:";
  document.cookie = `${SITE_MARKET_COOKIE}=${encodeURIComponent(value)}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure ? "; Secure" : ""}`;
}

export default function MarketToggle({ market = "mining" }) {
  const currentMarket = normaliseSiteMarket(market);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const isLight = theme === "light";

  const handleSwitch = useCallback((nextMarket) => {
    const resolvedMarket = normaliseSiteMarket(nextMarket);
    if (resolvedMarket === currentMarket) return;

    writeMarketCookie(resolvedMarket);
    document.body?.setAttribute("data-market", resolvedMarket);

    if (pathname?.startsWith("/consultants")) {
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.delete("service");
      params.delete("category");
      params.delete("page");

      const marketValue = siteMarketToUrlValue(resolvedMarket);
      if (marketValue === "mining") params.delete("market");
      else params.set("market", marketValue);

      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
      return;
    }

    router.refresh();
  }, [currentMarket, pathname, router, searchParams]);

  return (
    <div
      className={[
        "inline-flex items-center gap-1 rounded-full border p-1 shadow-inner",
        isLight
          ? "border-slate-200/80 bg-white/85"
          : "border-white/12 bg-slate-950/55",
      ].join(" ")}
      aria-label="Active market"
      role="group"
    >
      {["mining", "oil_gas"].map((value) => {
        const active = currentMarket === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => handleSwitch(value)}
            className={[
              "rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition sm:px-3",
              active
                ? value === "oil_gas"
                  ? "bg-amber-400 text-slate-950"
                  : "bg-sky-400 text-slate-950"
                : isLight
                ? "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                : "text-slate-300 hover:bg-white/10 hover:text-white",
            ].join(" ")}
            aria-pressed={active}
          >
            <span className="hidden sm:inline">{siteMarketLabel(value)}</span>
            <span className="sm:hidden">{value === "oil_gas" ? "O&G" : "Mine"}</span>
          </button>
        );
      })}
    </div>
  );
}