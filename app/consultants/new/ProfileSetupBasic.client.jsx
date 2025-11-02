"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const MAX_HEADLINE = 120;
const MAX_SERVICES = 15; // safety cap

export default function ProfileSetupBasic({ services = [] }) {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // Services state
  const [selected, setSelected] = useState(new Set()); // service ids
  const [servicesOpen, setServicesOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const grouped = useMemo(() => {
    const byCat = new Map();
    for (const s of services) {
      const cat = s?.category?.name || "Other";
      if (!byCat.has(cat)) byCat.set(cat, []);
      byCat.get(cat).push(s);
    }
    // sort items within each group for predictability
    for (const list of byCat.values()) list.sort((a, b) => a.name.localeCompare(b.name));
    return Array.from(byCat.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [services]);

  function toggleService(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        if (next.size >= MAX_SERVICES) return prev; // ignore beyond cap
        next.add(id);
      }
      return next;
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    const name = displayName.trim();
    const head = headline.trim();
    const loc = location.trim();
    const email = contactEmail.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!name) return setMsg({ ok: false, text: "Display name is required." });
    if (!head) return setMsg({ ok: false, text: "Headline is required." });
    if (head.length > MAX_HEADLINE) return setMsg({ ok: false, text: `Headline must be ${MAX_HEADLINE} characters or fewer.` });
    if (!loc) return setMsg({ ok: false, text: "Location is required." });
    if (!email) return setMsg({ ok: false, text: "Contact email is required." });
    if (!emailOk) return setMsg({ ok: false, text: "Enter a valid email address." });
    if (selected.size < 1) return setMsg({ ok: false, text: "Select at least one service you offer." });

    setSaving(true);
    setMsg(null);

    let authHeader = {};
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (token) authHeader = { Authorization: `Bearer ${token}` };
    } catch {}

    try {
      const res = await fetch("/api/consultants/create-draft", {
        method: "POST",
        headers: { "content-type": "application/json", ...authHeader },
        body: JSON.stringify({
          display_name: name,
          headline: head,
          location: loc,
          contact_email: email,
          services: Array.from(selected),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Create failed");
      const id = data?.id;
      if (!id) throw new Error("Missing new consultant id");
      router.replace(`/consultants/${id}/edit`);
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: err.message || "Create failed." });
      setSaving(false);
    }
  }

  const selectedCount = selected.size;

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Display name"
            value={displayName}
            onChange={setDisplayName}
            required
            placeholder="e.g. Jane Doe"
          />
          <Field
            label={`Headline (max ${MAX_HEADLINE})`}
            value={headline}
            onChange={(v) => setHeadline(v.slice(0, MAX_HEADLINE))}
            required
            placeholder="Short summary, e.g. Mining engineer (LOM planning)"
            hint={`${headline.length}/${MAX_HEADLINE}`}
          />
          <Field
            label="Location"
            value={location}
            onChange={setLocation}
            required
            placeholder="City, Country"
          />
          <Field
            label="Contact email"
            type="email"
            value={contactEmail}
            onChange={setContactEmail}
            required
            placeholder="name@example.com"
          />
        </div>

        {/* Services launcher */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-200">
              Services you offer <span className="text-rose-300">*</span>
            </p>
            <span className="text-xs text-slate-400">
              {selectedCount > 0 ? `${selectedCount} selected` : "None selected"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setServicesOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/15"
            aria-haspopup="dialog"
            aria-expanded={servicesOpen}
          >
            {selectedCount > 0 ? "Edit services" : "Add services"}
          </button>
          <p className="text-xs text-slate-400">Pick at least one. You can add more later.</p>
        </div>

        {msg && (
          <div
            className={`rounded-lg px-3 py-2 text-sm ${
              msg.ok
                ? "border border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                : "border border-rose-400/40 bg-rose-500/10 text-rose-100"
            }`}
          >
            {msg.text}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving || !displayName.trim()}
            className="rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Creating…" : "Create and continue"}
          </button>
        </div>
      </form>

      {/* Services picker overlay */}
      {servicesOpen && (
        <ServicesPicker
          grouped={grouped}
          selected={selected}
          onToggle={toggleService}
          onClose={() => setServicesOpen(false)}
          maxSelect={MAX_SERVICES}
        />
      )}
    </>
  );
}

function Field({ label, value, onChange, type = "text", required = false, placeholder, hint }) {
  return (
    <label className="block text-sm text-slate-300">
      {label} {required ? "*" : ""}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
      />
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </label>
  );
}

function ServicesPicker({ grouped, selected, onToggle, onClose, maxSelect }) {
  const [q, setQ] = useState("");

  function isMatch(name) {
    if (!q.trim()) return true;
    return name.toLowerCase().includes(q.toLowerCase());
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Select services"
    >
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl border border-white/15 bg-white/5 p-5 shadow-[0_40px_80px_rgba(8,12,24,0.55)] backdrop-blur-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Select services</h3>
          <button
            onClick={onClose}
            className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:bg-white/20"
          >
            Close
          </button>
        </div>

        <div className="mt-3 grid gap-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search services…"
              className="w-full rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
            />
            <span className="text-xs text-slate-400 whitespace-nowrap">
              {selected.size} selected
            </span>
          </div>

          <div className="max-h-[60vh] overflow-auto rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            {grouped.length === 0 ? (
              <p className="text-sm text-slate-400">No services available.</p>
            ) : (
              grouped.map(([cat, list]) => {
                const filtered = list.filter((s) => isMatch(s.name));
                if (!filtered.length) return null;
                return (
                  <div key={cat} className="mb-4 last:mb-0">
                    <div className="text-xs font-semibold text-slate-300">{cat}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {filtered.map((s) => {
                        const checked = selected.has(s.id);
                        return (
                          <label
                            key={s.id}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
                              checked
                                ? "border-sky-400/60 bg-sky-500/20 text-sky-100"
                                : "border-white/15 bg-white/10 text-slate-200 hover:bg-white/15"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="h-3.5 w-3.5 accent-sky-400"
                              checked={checked}
                              onChange={() => onToggle(s.id)}
                            />
                            <span>{s.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-slate-400">
              Select at least one. Max {maxSelect}.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-1.5 text-sm font-semibold text-white"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}