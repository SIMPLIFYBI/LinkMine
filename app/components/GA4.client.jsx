"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function GA4({ measurementId, anonymizeIp = true }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!measurementId || !window.gtag) return;

    const page_path = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;

    // Send a SPA-safe page view on route changes
    window.gtag("config", measurementId, {
      page_path,
      anonymize_ip: anonymizeIp,
    });
  }, [pathname, searchParams, measurementId, anonymizeIp]);

  return null;
}