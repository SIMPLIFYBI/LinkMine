"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import ClaimProfileModal from "./ClaimProfileModal.client.jsx"; // NEW

export default function ConsultantClaimButton({
  consultantId,
  isClaimed,
  canEdit,
  contactEmail,
}) {
  const [status, setStatus] = useState("idle");
  const [showModal, setShowModal] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    async function syncSession() {
      const sb = supabaseBrowser();
      const { data } = await sb.auth.getSession();
      const session = data?.session;
      if (session) {
        // Sync cookies for server routes
        await fetch("/api/auth/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          }),
        });
        setHasSession(true);
      }
      setSessionChecked(true);
    }
    syncSession();
  }, []);

  if (canEdit || isClaimed) return null;
  if (!sessionChecked) {
    return (
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
        Checking claim status…
      </div>
    );
  }

  // Card with button to open modal
  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-200">
      <div className="font-semibold text-slate-100">Claim this profile</div>
      <p className="mt-1 text-slate-300">
        Secure ownership and unlock editing by sending a claim link to{" "}
        <span className="text-sky-300">{contactEmail || "the stored email"}</span>.
      </p>
      {!contactEmail && (
        <p className="mt-2 text-xs text-amber-300">
          No contact email saved yet—add one before attempting to claim.
        </p>
      )}
      <button
        type="button"
        onClick={() => setShowModal(true)}
        disabled={status === "sending" || !contactEmail || !hasSession}
        className="mt-3 inline-flex items-center rounded-full border border-sky-400/50 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:border-sky-300 hover:bg-sky-500/20 disabled:opacity-60"
      >
        {status === "sending" ? "Preparing…" : "Start claim process"}
      </button>

      {showModal && (
        <ClaimProfileModal
          consultantId={consultantId}
          contactEmail={contactEmail}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setStatus("sent");
            setShowModal(false);
          }}
        />
      )}

      {status === "sent" && (
        <p className="mt-2 text-xs text-sky-300">
          Claim email sent. Please check your inbox.
        </p>
      )}
      {!hasSession && (
        <p className="mt-2 text-xs text-slate-400">
          You need to log in before claiming. The button will enable after sign in.
        </p>
      )}
    </div>
  );
}