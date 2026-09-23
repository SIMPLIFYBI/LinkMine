"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function VaultCreatorClaimOutreach() {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingIds, setSendingIds] = useState(() => new Set());
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function request(path, options) {
    const sb = supabaseBrowser();
    const { data: { session } } = await sb.auth.getSession();
    const response = await fetch(path, { ...options, credentials: "include", headers: { "Content-Type": "application/json", ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}), ...(options?.headers || {}) } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body?.ok === false) throw new Error(body?.error || "Request failed.");
    return body;
  }

  async function loadCreators() {
    setLoading(true);
    setError("");
    try {
      const body = await request("/api/admin/dev-tools/vault-creator-claim-outreach");
      setCreators(Array.isArray(body.creators) ? body.creators : []);
    } catch (loadError) {
      setError(loadError.message || "Unable to load creators.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCreators(); }, []);

  async function sendTo(ids) {
    if (!ids.length) return;
    setError("");
    setMessage("");
    setSendingIds(new Set(ids));
    try {
      const body = await request("/api/admin/dev-tools/vault-creator-claim-outreach", { method: "POST", body: JSON.stringify({ creatorIds: ids }) });
      const sent = new Set(body.sentIds || []);
      setCreators((current) => current.map((creator) => sent.has(creator.id) ? { ...creator, sent: true } : creator));
      setMessage(`Sent ${body.sentIds?.length || 0}; failed ${body.failed?.length || 0}.`);
    } catch (sendError) {
      setError(sendError.message || "Unable to send claim emails.");
    } finally {
      setSendingIds(new Set());
    }
  }

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold text-white">Vault creator profile claims</h2>
        <p className="mt-2 text-sm text-slate-400">Approved public creators with an unclaimed profile and contact email. Every message uses that creator&apos;s own profile link.</p>
      </header>
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <button type="button" onClick={() => { if (window.confirm(`Send the claim email to ${creators.length} eligible creators? This can resend to creators who have already received it.`)) sendTo(creators.map((creator) => creator.id)); }} disabled={loading || sendingIds.size > 0 || !creators.length} className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50">
          {sendingIds.size > 1 ? "Sending..." : `Send to all eligible (${creators.length})`}
        </button>
        <button type="button" onClick={loadCreators} disabled={loading || sendingIds.size > 0} className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/30 disabled:opacity-50">Refresh list</button>
      </div>
      {error ? <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div> : null}
      {message ? <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">{message}</div> : null}
      {loading ? <div className="text-sm text-slate-300">Loading eligible creators...</div> : null}
      {!loading ? <div className="overflow-auto rounded-2xl border border-white/10"><table className="min-w-full text-left text-sm text-slate-200"><thead className="bg-slate-950 text-slate-400"><tr><th className="px-3 py-3 font-medium">Creator</th><th className="px-3 py-3 font-medium">Email</th><th className="px-3 py-3 font-medium">Profile</th><th className="px-3 py-3 font-medium">Action</th></tr></thead><tbody className="divide-y divide-white/10">{creators.map((creator) => <tr key={creator.id}><td className="px-3 py-3">{creator.display_name || creator.company || "Unnamed creator"}</td><td className="px-3 py-3">{creator.contact_email}</td><td className="px-3 py-3"><a href={creator.profileUrl} target="_blank" rel="noreferrer" className="text-sky-300 hover:underline">Open profile</a></td><td className="px-3 py-3"><button type="button" disabled={sendingIds.size > 0} onClick={() => { if (window.confirm(`${creator.sent ? "Resend" : "Send"} the claim email to ${creator.contact_email}?`)) sendTo([creator.id]); }} className="rounded-full border border-sky-300/40 bg-sky-500/15 px-3 py-1.5 text-xs font-semibold text-sky-100 hover:bg-sky-500/25 disabled:opacity-50">{sendingIds.has(creator.id) ? "Sending..." : creator.sent ? "Resend email" : "Send email"}</button></td></tr>)}</tbody></table>{!creators.length ? <div className="p-4 text-sm text-slate-400">No eligible creators found.</div> : null}</div> : null}
    </section>
  );
}