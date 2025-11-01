"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function ContactConsultantButton({ consultantId, consultantName }) {
  const router = useRouter();
  const sb = supabaseBrowser();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await sb.auth.getUser();
        if (mounted) setUser(data?.user ?? null);
      } catch {
        setUser(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [sb]);

  const onClick = () => {
    if (!user) {
      const redir = encodeURIComponent(`/consultants/${consultantId}`);
      router.push(`/login?redirect=${redir}`);
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        onClick={onClick}
        className="inline-flex items-center gap-2 rounded-full border border-sky-400/60 bg-sky-500/15 px-4 py-1.5 text-sm font-semibold text-sky-100 hover:border-sky-300 hover:bg-sky-500/25"
      >
        Contact {consultantName || "consultant"}
      </button>
      {open && (
        <ContactModal consultantId={consultantId} user={user} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function ContactModal({ consultantId, user, onClose }) {
  const [form, setForm] = useState({
    subject: "",
    message: "",
    name: user?.user_metadata?.full_name || "",
    email: user?.email || "",
    phone: "",
    location: "",
    budget: "",
  });
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);

  const handle = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/consultants/${consultantId}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to send.");
      setStatus({ ok: true, msg: "Message sent. The consultant will be notified by email." });
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setStatus({ ok: false, msg: err.message || "Failed to send." });
    } finally {
      setSending(false);
    }
  };

  return (
    // Overlay: allow scrolling as a fallback; keep background blur
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 py-4 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-xl ring-1 ring-white/10 flex flex-col"
        // Cap height to dynamic viewport so inner area can scroll; keeps desktop nice too
        style={{ maxHeight: "calc(100dvh - 2rem)" }}
        tabIndex={-1}
      >
        {/* Close: large tap target, always reachable */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-slate-300 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
        >
          <span aria-hidden>✕</span>
        </button>

        {/* Scrollable content area */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-[max(env(safe-area-inset-top),1rem)]"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <h3 id="contact-consultant-title" className="pr-12 text-lg font-semibold text-white">
            Contact consultant
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Send a brief enquiry. This isn’t a job listing—just a message to start a conversation.
          </p>

          <form onSubmit={submit} className="mt-4 space-y-3">
            <Field label="Subject" value={form.subject} onChange={handle("subject")} required />
            <Field
              as="textarea"
              rows={6}
              label="Message"
              placeholder="Describe what you need help with…"
              value={form.message}
              onChange={handle("message")}
              required
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Your name" value={form.name} onChange={handle("name")} />
              <Field label="Your email" type="email" value={form.email} onChange={handle("email")} />
              <Field label="Phone (optional)" value={form.phone} onChange={handle("phone")} />
              <Field label="Location (optional)" value={form.location} onChange={handle("location")} />
            </div>
            <Field label="Budget (optional)" value={form.budget} onChange={handle("budget")} />

            {status && (
              <div
                className={`rounded-lg px-3 py-2 text-sm ${
                  status.ok
                    ? "border border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                    : "border border-rose-400/40 bg-rose-500/10 text-rose-100"
                }`}
              >
                {status.msg}
              </div>
            )}

            {/* Action bar */}
            <div className="mt-2 flex items-center gap-2 pb-2">
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {sending ? "Sending…" : "Send message"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-sky-300/60 hover:bg-sky-500/10"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, as = "input", hint, ...props }) {
  const Component = as;
  const shared =
    "mt-1 w-full rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-400/30";
  return (
    <label className="block text-sm text-slate-300">
      {label}
      <Component className={shared} {...props} />
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </label>
  );
}