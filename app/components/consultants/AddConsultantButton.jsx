"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-slate-200/80">
        {label}
        {required ? " *" : ""}
      </label>
      <div className="relative">
        <div className="absolute inset-0 rounded-lg border border-white/20 bg-white/10/50 blur-sm" />
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="relative w-full rounded-lg border border-white/20 bg-white/15 px-3 py-2 text-sm text-white shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 backdrop-blur"
        />
      </div>
    </div>
  );
}

export default function AddConsultantButton({ className = "" }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [company, setCompany] = useState("");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [visibility, setVisibility] = useState("public");

  const router = useRouter();

  const ids = {
    displayName: useId(),
    company: useId(),
    headline: useId(),
    location: useId(),
    contactEmail: useId(),
  };

  async function submit(e) {
    e.preventDefault();
    if (!displayName) return;
    setSaving(true);
    let authHeader = {};
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (token) authHeader = { Authorization: `Bearer ${token}` };
    } catch {}

    const res = await fetch("/api/consultants", {
      method: "POST",
      headers: { "content-type": "application/json", ...authHeader },
      body: JSON.stringify({
        display_name: displayName,
        company,
        headline,
        location,
        contact_email: contactEmail,
        visibility,
      }),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok || !json.ok) {
      alert(json.error || "Failed to create consultant");
      return;
    }

    alert(json.message || "Thanks! Your consultancy request is awaiting approval.");

    setDisplayName("");
    setCompany("");
    setHeadline("");
    setLocation("");
    setContactEmail("");
    setVisibility("public");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-sky-400 hover:to-sky-600 ${className}`}
      >
        Add consultant
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-950/75 backdrop-blur"
            onClick={() => !saving && setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_40px_80px_rgba(8,12,24,0.55)] backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/25 via-indigo-500/20 to-transparent opacity-85" />
            <div className="pointer-events-none absolute inset-0 bg-white/5 mix-blend-overlay" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Add your consultancy</h3>
                <button
                  onClick={() => !saving && setOpen(false)}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:bg-white/20"
                >
                  Close
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-200/80">
                Share a few details to get your MineLink consultant profile live.
              </p>

              <form onSubmit={submit} className="mt-6 space-y-4">
                <Field
                  id={ids.displayName}
                  label="Display name"
                  value={displayName}
                  onChange={setDisplayName}
                  required
                  placeholder="e.g. Jane Doe"
                />
                <Field
                  id={ids.company}
                  label="Company"
                  value={company}
                  onChange={setCompany}
                  placeholder="e.g. YouMine Consulting"
                />
                <Field
                  id={ids.headline}
                  label="Headline"
                  value={headline}
                  onChange={setHeadline}
                  placeholder="Short summary, e.g. Mining engineer (LOM planning)"
                />
                <Field
                  id={ids.location}
                  label="Location"
                  value={location}
                  onChange={setLocation}
                  placeholder="City, Country"
                />
                <Field
                  id={ids.contactEmail}
                  label="Contact email"
                  type="email"
                  value={contactEmail}
                  onChange={setContactEmail}
                  placeholder="name@example.com"
                />

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-200/80">
                    Visibility
                  </label>
                  <div className="relative">
                    <div className="absolute inset-0 rounded-lg border border-white/20 bg-white/10/50 blur-sm" />
                    <select
                      className="relative w-full rounded-lg border border-white/20 bg-white/15 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 backdrop-blur"
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value)}
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => !saving && setOpen(false)}
                    className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/20"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !displayName}
                    className={`rounded-full px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg transition ${
                      saving
                        ? "bg-white/30 text-slate-500 shadow-none"
                        : "bg-gradient-to-r from-sky-400 via-indigo-400 to-sky-500 hover:from-sky-300 hover:to-sky-500"
                    }`}
                  >
                    {saving ? "Saving…" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}