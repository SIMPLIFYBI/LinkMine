"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getGaPageLocation, sendGaEvent } from "@/lib/ga4Client";

export default function GA4({ measurementId }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!measurementId) return;

    sendGaEvent("page_view", {
      page_location: getGaPageLocation(),
      page_path: pathname,
      page_title: document.title,
    });
  }, [pathname, searchParams, measurementId]);

  return null;
}
