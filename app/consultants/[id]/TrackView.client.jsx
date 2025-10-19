"use client";

import { useEffect } from "react";

export default function TrackView({ consultantId, source = null }) {
  useEffect(() => {
    if (!consultantId) return;

    // Debounce: once per tab session
    const ssKey = `consultant_viewed:${consultantId}`;
    if (sessionStorage.getItem(ssKey)) return;
    sessionStorage.setItem(ssKey, "1");

    // Stable anon ID per browser (stored in localStorage)
    let anonId = null;
    try {
      anonId = localStorage.getItem("ml_anon_id");
      if (!anonId) {
        anonId = (crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
        localStorage.setItem("ml_anon_id", anonId);
      }
    } catch {
      // ignore if storage not available
    }

    fetch("/api/track/consultant-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true, // helps if user navigates fast
      body: JSON.stringify({ consultantId, source, anonId }),
    }).catch(() => {});
  }, [consultantId, source]);

  return null;
}