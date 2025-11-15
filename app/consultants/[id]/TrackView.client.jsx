"use client";

import { useEffect } from "react";

function getCookie(name) {
  try {
    const match = document.cookie.split("; ").find((p) => p.startsWith(name + "="));
    return match ? decodeURIComponent(match.split("=")[1]) : null;
  } catch {
    return null;
  }
}

function setCookie(name, value, maxAgeSec) {
  try {
    const secure = typeof window !== "undefined" && window.location.protocol === "https:";
    document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSec}; Path=/; SameSite=Lax${secure ? "; Secure" : ""}`;
  } catch {}
}

export default function TrackView({ consultantId, source = null }) {
  useEffect(() => {
    if (!consultantId) return;

    // Allow one view per 10 minutes per consultant per tab
    const now = Date.now();
    const ssKey = `consultant_viewed_ts:${consultantId}`;
    try {
      const lastTs = parseInt(sessionStorage.getItem(ssKey) || "0", 10);
      if (now - lastTs < 10 * 60 * 1000) return; // 10 minutes
      sessionStorage.setItem(ssKey, String(now));
    } catch {
      // ignore
    }

    // Stable anon ID per browser (localStorage -> cookie -> mint cookie)
    let anonId = null;
    try {
      anonId = localStorage.getItem("ml_anon_id");
      if (!anonId) {
        anonId = crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
        localStorage.setItem("ml_anon_id", anonId);
      }
    } catch {
      // localStorage not available
    }
    if (!anonId) {
      anonId = getCookie("ml_anon_id");
      if (!anonId) {
        anonId = crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
        setCookie("ml_anon_id", anonId, 60 * 60 * 24 * 365); // 1 year
      }
    }

    fetch("/api/track/consultant-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({ consultantId, source, anonId }),
    })
    .then((r) => r.json().then((j) => { if (!j.ok && !j.skipped && j.error) console.debug("TrackView error", j); else console.debug("TrackView stage", j.stage); }))
    .catch((e) => console.debug("TrackView network error", e));

  }, [consultantId, source]);

  return null;
}