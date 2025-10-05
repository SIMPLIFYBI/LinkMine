"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function ConsultantClaimButton({
  consultantId,
  isClaimed,
  canEdit,
  contactEmail,
}) {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function syncSession() {
      const sb = supabaseBrowser();
      const { data } = await sb.auth.getSession();
      const session = data?.session;
      if (!session) return;

      await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        }),
      });
    }

    syncSession();
  }, []);

  if (canEdit || isClaimed) return null;

  const emailText = contactEmail || "the organisation email we have on file";

  async function requestClaim() {
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch(
        `/api/consultants/${consultantId}/request-claim`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Request failed");

      setStatus("sent");
      setMessage("Check your inbox for a confirmation link.");
    } catch (err) {
      setStatus("idle");
      setMessage(err.message || "Something went wrong");
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-200">
      <div className="font-semibold text-slate-100">Claim this profile</div>
      <p className="mt-1 text-slate-300">
        We’ll email a confirmation link to {emailText}. Follow it to take
        ownership and unlock editing.
      </p>
      {!contactEmail && (
        <p className="mt-2 text-xs text-amber-300">
          No contact email saved yet—add one in Supabase before sending.
        </p>
      )}
      <button
        type="button"
        onClick={requestClaim}
        disabled={status === "sending" || !contactEmail}
        className="mt-3 inline-flex items-center rounded-full border border-sky-400/50 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:border-sky-300 hover:bg-sky-500/20 disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Email claim link"}
      </button>
      {message && (
        <p className="mt-2 text-xs text-slate-300">{message}</p>
      )}
    </div>
  );
}