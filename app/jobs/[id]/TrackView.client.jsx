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

export default function TrackView({ jobId, source = null }) {
  useEffect(() => {
    if (!jobId) return;

    const now = Date.now();
    const ssKey = `job_viewed_ts:${jobId}`;
    try {
      const lastTs = parseInt(sessionStorage.getItem(ssKey) || "0", 10);
      if (now - lastTs < 10 * 60 * 1000) return;
      sessionStorage.setItem(ssKey, String(now));
    } catch {
      // ignore
    }

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
        setCookie("ml_anon_id", anonId, 60 * 60 * 24 * 365);
      }
    }

    fetch("/api/track/job-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({ jobId, source, anonId }),
    })
      .then((r) => r.json().then((j) => {
        if (!j.ok && !j.skipped && j.error) console.debug("JobTrackView error", j);
        else console.debug("JobTrackView stage", j.stage);
      }))
      .catch((e) => console.debug("JobTrackView network error", e));
  }, [jobId, source]);

  return null;
}