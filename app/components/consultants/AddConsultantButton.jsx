"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function Field({ id, label, value, onChange, type = "text", required = false, placeholder = "" }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs mb-1">
        {label}
        {required ? " *" : ""}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-md bg-slate-900/60 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
      />
    </div>
  );
}

export default function AddConsultantButton({ className = "" }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Separate, stable state slices prevent remount/focus loss
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
    // reset and close
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
        className={`rounded-md px-3 py-2 text-sm font-medium bg-sky-600 text-white hover:bg-sky-500 ${className}`}
      >
        Add consultant
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => !saving && setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-xl border border-white/10 bg-slate-900 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">New consultant</h3>
              <button
                onClick={() => !saving && setOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                Close
              </button>
            </div>

            <form onSubmit={submit} className="space-y-3">
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
                placeholder="e.g. LinkMine Consulting"
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

              <div>
                <label className="block text-xs mb-1">Visibility</label>
                <select
                  className="w-full rounded-md bg-slate-900/60 border border-white/10 px-3 py-2 text-sm"
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => !saving && setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm border border-white/10 bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !displayName}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    saving ? "bg-white/10 text-slate-400" : "bg-sky-600 text-white hover:bg-sky-500"
                  }`}
                >
                  {saving ? "Saving…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}