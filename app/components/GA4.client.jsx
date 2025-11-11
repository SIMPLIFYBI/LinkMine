"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function GA4({ measurementId, anonymizeIp = true }) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!measurementId || !window.gtag) return;
    window.gtag("event", "page_view", {
      page_path: pathname,
      anonymize_ip: anonymizeIp,
    });
  }, [pathname, measurementId, anonymizeIp]);

  return null;
}