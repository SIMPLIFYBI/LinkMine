"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function ConsultantClaimConfirm({ consultant, consultantId: idProp, user, token }) {
  const router = useRouter();
  const params = useParams();
  const consultantId = idProp || consultant?.id || params?.id || "";

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const confirm = async () => {
    if (!consultantId) {
      setError("Missing consultant id.");
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch(`/api/consultants/${consultantId}/claim`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || `Request failed (${res.status})`);
      setBusy(false);
      return;
    }
    router.replace(`/consultants/${consultantId}`);
    router.refresh();
  };

  return (
    <div className="space-y-3">
      <button
        onClick={confirm}
        disabled={busy || !consultantId}
        className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Claiming…" : "Confirm claim"}
      </button>
      {error && <div className="text-xs text-rose-300">{error}</div>}
      {!consultantId && (
        <div className="text-xs text-amber-300">Debug: consultantId is missing.</div>
      )}
    </div>
  );
}