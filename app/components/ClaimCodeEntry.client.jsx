"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

function formatDisplay(code) {
  const c = code.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 12);
  return c
    .replace(/(.{4})(.{4})(.{0,4})/, (_, a, b, d) => [a, b, d].filter(Boolean).join("-"));
}

export default function ClaimCodeEntry({ consultantId }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const router = useRouter();

  async function submit() {
    if (busy) return;
    const raw = code.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    if (raw.length < 12) {
      setMsg("Enter the 12-character code.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/consultants/${consultantId}/claim-code`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: raw }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setMsg("Claim successful. Redirecting…");
      setTimeout(() => {
        router.replace(`/consultants/${consultantId}`);
        router.refresh();
      }, 800);
    } catch (e) {
      setMsg(e.message || "Failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs uppercase tracking-wide text-slate-400">
        Enter claim code
      </label>
      <input
        value={formatDisplay(code)}
        onChange={(e) => setCode(e.target.value)}
        placeholder="ABCD-EFGH-IJKL"
        className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-center text-lg font-mono tracking-[2px] text-slate-100 placeholder:text-slate-500 outline-none focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/30"
        autoComplete="off"
        inputMode="text"
      />
      <button
        onClick={submit}
        disabled={busy}
        className="inline-flex w-full justify-center rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Checking…" : "Claim profile"}
      </button>
      {msg && <div className="text-xs text-slate-300">{msg}</div>}
      <p className="mt-2 text-[11px] text-slate-400">
        Didn’t get a code?{" "}
        <span className="text-sky-300">Resend (soon)</span>
      </p>
    </div>
  );
}