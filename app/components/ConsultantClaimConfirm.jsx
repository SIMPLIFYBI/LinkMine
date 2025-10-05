"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ConsultantClaimConfirm({ consultantId, token }) {
  const router = useRouter();
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function handleClaim() {
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch(`/api/consultants/${consultantId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Claim failed.");

      setStatus("success");
      setMessage("Profile claimed successfully. Redirecting…");
      setTimeout(() => {
        router.replace(`/consultants/${consultantId}`);
      }, 1200);
    } catch (err) {
      setStatus("idle");
      setMessage(err.message || "Unable to claim profile.");
    }
  }

  return (
    <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-5 text-sm text-emerald-100">
      <h2 className="text-lg font-semibold text-emerald-50">
        Confirm profile ownership
      </h2>
      <p className="mt-2">
        You’re signed in and ready to take control of this consultant profile.
        Click below to finalise ownership and unlock editing tools.
      </p>
      <button
        type="button"
        onClick={handleClaim}
        disabled={status === "loading" || status === "success"}
        className="mt-4 inline-flex items-center rounded-full border border-emerald-300/60 bg-emerald-400/20 px-4 py-2 text-sm font-semibold text-emerald-50 hover:border-emerald-200 hover:bg-emerald-300/30 disabled:opacity-60"
      >
        {status === "loading" ? "Claiming…" : "Claim this profile"}
      </button>
      {message && (
        <p className="mt-2 text-xs text-emerald-50/80">{message}</p>
      )}
    </div>
  );
}