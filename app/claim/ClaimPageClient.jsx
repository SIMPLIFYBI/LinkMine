"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function formatDisplay(code) {
  const c = code.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 12);
  return c.replace(
    /(.{4})(.{4})(.{0,4})/,
    (_, a, b, d) => [a, b, d].filter(Boolean).join("-")
  );
}

export default function ClaimPageClient({ consultantIdInitial = "" }) {
  const router = useRouter();

  const [consultantId, setConsultantId] = useState(consultantIdInitial);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [sessionEmail, setSessionEmail] = useState("");

  useEffect(() => {
    // Refresh consultantId if prop changes (rare)
    if (consultantIdInitial && consultantId !== consultantIdInitial) {
      setConsultantId(consultantIdInitial);
    }
  }, [consultantIdInitial]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data?.user;
      if (u?.email) setSessionEmail(u.email);
    });
  }, []);

  async function ensureSignedIn() {
    const { data } = await supabase.auth.getUser();
    if (data?.user) return data.user;
    if (!email || !password) {
      throw new Error("Enter email and password first.");
    }
    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message || "Sign-in failed.");
    return signInData.user;
  }

  async function submit() {
    try {
      setBusy(true);
      setMsg("");
      if (!consultantId) throw new Error("Missing consultant id.");
      await ensureSignedIn();

      const raw = code.replace(/[^A-Z0-9]/gi, "").toUpperCase();
      if (raw.length < 12) throw new Error("Enter the 12-character code.");

      const res = await fetch(`/api/consultants/${consultantId}/claim-code`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: raw }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Claim failed (${res.status})`);

      setMsg("Claim successful. Redirecting…");
      setTimeout(() => {
        router.replace(`/consultants/${consultantId}/edit`);
        router.refresh();
      }, 800);
    } catch (e) {
      setMsg(e.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative mx-auto mt-12 w-full max-w-md px-6">
      <div className="pointer-events-none absolute inset-x-0 -top-28 mx-auto h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 text-slate-100 shadow-xl ring-1 ring-white/10 backdrop-blur">
        <header className="text-center">
          <h1 className="text-2xl font-semibold text-white">Claim your profile</h1>
          <p className="mt-2 text-sm text-slate-300">
            Enter the code from your email. Sign in below if needed.
          </p>
        </header>

        <div className="mt-5 space-y-4">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-300">Consultant ID</span>
            <input
              value={consultantId}
              onChange={(e) => setConsultantId(e.target.value.trim())}
              placeholder="0c37816d-...."
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-slate-100 placeholder:text-slate-400 outline-none focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/30"
            />
            {consultantIdInitial && (
              <span className="text-xs text-slate-400">Prefilled from link.</span>
            )}
          </label>

          {sessionEmail ? (
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
              Signed in as <span className="font-semibold text-white">{sessionEmail}</span>.
            </div>
          ) : (
            <>
              <label className="grid gap-1 text-sm">
                <span className="text-slate-300">Email</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="you@example.com"
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-slate-100 placeholder:text-slate-400 outline-none focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/30"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-slate-300">Password</span>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="••••••••"
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-slate-100 placeholder:text-slate-400 outline-none focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/30"
                />
              </label>
            </>
          )}

          <label className="grid gap-1 text-sm">
            <span className="text-slate-300">Claim code</span>
            <input
              value={formatDisplay(code)}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ABCD-EFGH-IJKL"
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-center font-mono text-lg tracking-[2px] text-slate-100 placeholder:text-slate-500 outline-none focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/30"
            />
          </label>

          <button
            onClick={submit}
            disabled={busy}
            className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Checking…" : "Claim profile"}
          </button>

          {msg && <div className="text-xs text-slate-200">{msg}</div>}

          <p className="text-[11px] text-slate-400">
            Open this page from any device and enter the code from your email.
          </p>
        </div>
      </section>
    </main>
  );
}