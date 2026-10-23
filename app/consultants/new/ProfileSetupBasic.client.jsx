"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, ChevronRight, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { COUNTRY_OPTIONS } from "@/lib/geoOptions";

export default function ProfileSetupBasic() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [location, setLocation] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    const name = displayName.trim();
    const loc = location.trim();
    const email = contactEmail.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!name) return setMsg({ ok: false, text: "Display name is required." });
    if (!loc) return setMsg({ ok: false, text: "Location is required." });
    if (!countryCode) return setMsg({ ok: false, text: "Country is required." });
    if (!email) return setMsg({ ok: false, text: "Contact email is required." });
    if (!emailOk) return setMsg({ ok: false, text: "Enter a valid email address." });

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
          location: loc,
          country_code: countryCode,
          contact_email: email,
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

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-6">
        <section className="relative overflow-hidden rounded-2xl border border-sky-300/20 bg-[linear-gradient(135deg,rgba(14,165,233,0.16),rgba(15,23,42,0.72)_58%,rgba(16,185,129,0.13))] p-4 ring-1 ring-white/5">
          <div aria-hidden="true" className="absolute -right-8 -top-10 h-28 w-28 rounded-full border border-cyan-100/20 bg-cyan-300/10" />
          <div className="relative flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-200/25 bg-sky-400/10 text-sky-100"><BriefcaseBusiness className="h-5 w-5" aria-hidden="true" /></div>
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-200"><Sparkles className="h-3.5 w-3.5" aria-hidden="true" />One profile, built around your work</div>
              <p className="mt-2 text-sm leading-6 text-slate-200">Start with the essentials for your public profile. You will choose services, resources, training, or events next.</p>
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Public provider name"
            value={displayName}
            onChange={setDisplayName}
            required
            placeholder="e.g. Jane Doe or Acme Mining Advisory"
            hint="This is the name people see on your public YouMine profile. Use your own name or your business name."
          />
          <Field
            label="Location"
            value={location}
            onChange={setLocation}
            required
            placeholder="City, Country"
          />
          <SelectField
            label="Country"
            value={countryCode}
            onChange={setCountryCode}
            required
            options={COUNTRY_OPTIONS}
            placeholder="Select a country"
          />
          <Field
            label="Public contact email"
            type="email"
            value={contactEmail}
            onChange={setContactEmail}
            required
            placeholder="name@example.com"
            hint="Shown on your public profile after it is approved."
          />
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

        <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-5">
          <p className="text-xs text-slate-400">You can complete your details and choose what you offer before your profile is reviewed.</p>
          <button
            type="submit"
            disabled={saving || !displayName.trim()}
            className="rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Creating…" : <><span>Create profile and continue</span><ChevronRight className="h-4 w-4" aria-hidden="true" /></>}
          </button>
        </div>
      </form>

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
        className="mt-1 w-full rounded-xl border border-slate-500/40 bg-slate-900/80 px-3 py-2.5 text-sm text-white placeholder:text-slate-300/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400/35"
      />
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </label>
  );
}

function SelectField({ label, value, onChange, required = false, options, placeholder }) {
  return (
    <label className="block text-sm text-slate-300">
      {label} {required ? "*" : ""}
      <div className="relative mt-1">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full appearance-none rounded-xl border border-slate-500/40 bg-slate-900/80 px-3 py-2.5 pr-10 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400/35"
        >
          <option value="" className="bg-slate-900 text-slate-200">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-slate-900 text-white">
              {option.label}
            </option>
          ))}
        </select>
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-200"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m5.5 7.5 4.5 5 4.5-5" />
        </svg>
      </div>
    </label>
  );
}