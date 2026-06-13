"use client";

import { useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function TrainingInviteAudience({ recipients = [] }) {
  const [items, setItems] = useState(recipients);
  const recipientIds = useMemo(() => items.map((recipient) => recipient.id), [items]);
  const [selectedIds, setSelectedIds] = useState(() => new Set(recipientIds));
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const selectedCount = selectedIds.size;
  const allSelected = items.length > 0 && selectedCount === items.length;
  const someSelected = selectedCount > 0 && selectedCount < items.length;

  const selectedRecipients = useMemo(
    () => items.filter((recipient) => selectedIds.has(recipient.id)),
    [items, selectedIds]
  );

  const claimedCount = selectedRecipients.filter((recipient) => recipient.claimed_by).length;
  const trainingReadyCount = selectedRecipients.filter(
    (recipient) => recipient.is_trainer || recipient.provider_kind === "training" || recipient.provider_kind === "both"
  ).length;
  const previouslyFlaggedCount = selectedRecipients.filter((recipient) => recipient.invite_email).length;

  function toggleRecipient(recipientId) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(recipientId)) next.delete(recipientId);
      else next.add(recipientId);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(recipientIds));
  }

  function clearAll() {
    setSelectedIds(new Set());
  }

  function requestSendSelected() {
    if (selectedCount === 0 || submitting) return;
    setConfirmOpen(true);
  }

  async function sendSelected() {
    setSubmitting(true);
    setConfirmOpen(false);
    setError("");
    setResult(null);

    try {
      const sb = supabaseBrowser();
      const {
        data: { session },
        error: sessionError,
      } = await sb.auth.getSession();

      if (sessionError) throw new Error(sessionError.message);

      const response = await fetch("/api/admin/notifications/consultants/training-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          consultantIds: Array.from(selectedIds),
        }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok || body?.ok === false) {
        throw new Error(body?.error || "Failed to send training invite emails.");
      }

      setResult(body);
      if (Array.isArray(body.sentIds) && body.sentIds.length) {
        setItems((current) =>
          current.map((recipient) =>
            body.sentIds.includes(recipient.id)
              ? { ...recipient, invite_email: true }
              : recipient
          )
        );
      }
    } catch (sendError) {
      setError(sendError?.message || String(sendError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">Audience rule</div>
            <div className="mt-1 text-sm text-slate-200">Approved, public consultants with a non-empty contact email. All are selected by default.</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={requestSendSelected}
              disabled={submitting || selectedCount === 0}
              className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-40"
            >
              {submitting ? "Sending..." : `Send selected consultant invites (${selectedCount})`}
            </button>
            <button
              type="button"
              onClick={selectAll}
              disabled={allSelected}
              className="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-sky-500 disabled:opacity-40"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={clearAll}
              disabled={selectedCount === 0}
              className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-white/20 hover:text-white disabled:opacity-40"
            >
              Clear all
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
        ) : null}
        {result ? (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            Consultant campaign complete. Sent {result.sent} emails. Skipped already sent: {result.skippedAlreadySentCount}. Failed: {result.failedCount}. Invalid selection count: {result.invalidCount}.
          </div>
        ) : null}

        <div className="mt-4 flex items-center gap-3 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(node) => {
              if (node) node.indeterminate = someSelected;
            }}
            onChange={(event) => {
              if (event.target.checked) selectAll();
              else clearAll();
            }}
          />
          <span>{allSelected ? "All approved/public recipients selected" : `${selectedCount} of ${items.length} recipients selected`}</span>
        </div>

        {items.length ? (
          <div className="mt-4 max-h-[520px] overflow-auto rounded-2xl border border-white/10">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="sticky top-0 bg-slate-950 text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-medium">Send</th>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Company</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {items.map((recipient) => {
                  const checked = selectedIds.has(recipient.id);
                  return (
                    <tr key={recipient.id} className={checked ? "bg-transparent" : "bg-slate-950/40 text-slate-500"}>
                      <td className="px-3 py-2 align-middle">
                        <input type="checkbox" checked={checked} onChange={() => toggleRecipient(recipient.id)} />
                      </td>
                      <td className="px-3 py-2">{recipient.display_name || "-"}</td>
                      <td className="px-3 py-2">{recipient.company || "-"}</td>
                      <td className="px-3 py-2">{recipient.contact_email}</td>
                      <td className="px-3 py-2">{recipient.status} / {recipient.visibility}{recipient.invite_email ? " / invited" : ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-400">No matching consultants were found for the current rule.</p>
        )}
      </div>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950 p-6 text-slate-100 shadow-2xl ring-1 ring-white/10">
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-[0.2em] text-sky-300">Confirm campaign send</div>
              <h3 className="text-xl font-semibold text-white">Send training invite to {selectedCount} selected consultant{selectedCount === 1 ? "" : "s"}?</h3>
              <p className="text-sm text-slate-300">
                This will send the current training invite to the checked approved/public consultants only. Already-sent recipients will be skipped automatically.
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              <div>Selected recipients: {selectedCount}</div>
              <div className="mt-1">Training-ready within selection: {trainingReadyCount}</div>
              <div className="mt-1">Previously flagged within selection: {previouslyFlaggedCount}</div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:text-white disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={sendSelected}
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg transition hover:from-emerald-300 hover:to-sky-300 disabled:opacity-60"
              >
                {submitting ? "Sending..." : "Confirm and send"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}