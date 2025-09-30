"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";

export default function AuthStatusPill() {
  const { token, user } = useAuth();
  const [server, setServer] = useState({ header: false, uid: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/auth/debug", {
        cache: "no-store",
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });
      const j = await res.json().catch(() => ({}));
      if (!cancelled) setServer({ header: !!j.hasAuthHeader, uid: j.headerUserId || null });
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const color = server.header ? "bg-emerald-600" : "bg-rose-600";
  const label = server.header ? "Auth: on" : "Auth: off";
  return (
    <div style={{ position: "fixed", top: 8, right: 8, zIndex: 1000 }}>
      <span className={`${color} text-white text-xs px-2 py-1 rounded-full`}>
        {label}{user?.id ? ` (${String(user.id).slice(0, 8)})` : ""}
      </span>
    </div>
  );
}