"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function ResetPasswordPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const [ready, setReady] = useState(false);
  const [exchangeError, setExchangeError] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const sb = supabaseBrowser();
        // Two patterns possible: ?code=... or #access_token=...
        const code = sp.get("code");
        if (code) {
          const { error } = await sb.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (typeof window !== "undefined" && window.location.hash?.includes("access_token")) {
          const { error } = await sb.auth.exchangeCodeForSession(window.location.hash);
          if (error) throw error;
        }
      } catch (e) {
        if (!active) return;
        setExchangeError(e.message || "Unable to verify reset link.");
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => { active = false; };
  }, [sp]);

  async function handleUpdate(e) {
    e.preventDefault();
    setMessage("");
    setExchangeError("");
    if (!password || password.length < 8) {
      setExchangeError("Password must be at least 8 characters.");
      return;
    }
    if (password !== password2) {
      setExchangeError("Passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      const sb = supabaseBrowser();
      const { error } = await sb.auth.updateUser({ password });
      if (error) throw error;
      setMessage("Password updated. Redirecting…");
      setTimeout(() => router.replace("/account"), 900);
    } catch (e) {
      setExchangeError(e.message || "Unable to update password.");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) {
    return (
      <main className="mx-auto max-w-md px-6 py-12">
        <p className="text-sm text-slate-300">Preparing password reset…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-white">Reset password</h1>
      <p className="mt-2 text-sm text-slate-300">
        Enter a new password for your account.
      </p>

      <form onSubmit={handleUpdate} className="mt-5 space-y-3">
        <div>
          <label className="block text-sm text-slate-300">New password</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md bg-slate-900/60 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300">Confirm password</label>
          <input
            type="password"
            required
            minLength={8}
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            className="mt-1 w-full rounded-md bg-slate-900/60 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
            placeholder="••••••••"
          />
        </div>

        {exchangeError && <div className="text-sm text-rose-300">{exchangeError}</div>}
        {message && <div className="text-sm text-emerald-300">{message}</div>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-md bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {saving ? "Updating…" : "Update password"}
        </button>
      </form>

      <div className="mt-4 text-sm text-slate-300">
        Link expired or not working? Go back to{" "}
        <a href="/login" className="text-sky-300 underline">Log in</a> and use “Forgot password?” to request another link.
      </div>
    </main>
  );
}