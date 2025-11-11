"use client";

import { useEffect } from "react";

export default function TrackView({ consultantId, source = null }) {
  useEffect(() => {
    if (!consultantId) return;

    // Allow one view per 10 minutes per consultant per tab
    const now = Date.now();
    const ssKey = `consultant_viewed_ts:${consultantId}`;
    try {
      const lastTs = parseInt(sessionStorage.getItem(ssKey) || "0", 10);
      // 10 minutes in ms
      if (now - lastTs < 10 * 60 * 1000) return;
      sessionStorage.setItem(ssKey, String(now));
    } catch {
      // If storage fails, we still attempt the view
    }

    // Stable anon ID per browser
    let anonId = null;
    try {
      anonId = localStorage.getItem("ml_anon_id");
      if (!anonId) {
        anonId = crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
        localStorage.setItem("ml_anon_id", anonId);
      }
    } catch {}

    fetch("/api/track/consultant-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({ consultantId, source, anonId }),
    }).catch(() => {});
  }, [consultantId, source]);

  return null;
}