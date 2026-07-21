"use client";

import { usePathname } from "next/navigation";
import TradingViewTicker from "@/app/components/TradingViewTicker";

export default function ConditionalTicker() {
  const pathname = usePathname();

  if (pathname?.startsWith("/marketplace")) {
    return null;
  }

  return (
    <div className="relative">
      <TradingViewTicker />
      <div
        aria-hidden="true"
        className="site-market-header-accent absolute -bottom-px left-0 h-px w-full"
      />
    </div>
  );
}
