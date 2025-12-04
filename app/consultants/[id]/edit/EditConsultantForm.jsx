"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

// Display options and mapping helpers
const PROVIDER_KIND_OPTIONS = [
  {
    value: "Operational Services",
    label: "Operational Services",
    desc: "Field ops, maintenance, equipment, production support.",
  },
  {
    value: "Professional Services",
    label: "Professional Services",
    desc: "Advisory, design, studies, compliance, engineering.",
  },
  {
    value: "both",
    label: "Both",
    desc: "Operate across operational and professional services.",
  },
];

// Normalize old DB values to new display values
function fromDbProviderKind(v) {
  switch ((v || "").toLowerCase()) {
    case "consultant":
    case "professional_services":
      return "Professional Services";
    case "service_provider":
    case "operational_services":
      return "Operational Services";
    case "both":
    default:
      return "both";
  }
}

// Map UI selection back to DB value
// If your DB column uses the human labels exactly, keep identity mapping.
// If you use snake_case in DB, change the mapping targets below.
const TO_DB_PROVIDER_KIND = {
  "Operational Services": "Operational Services",      // or "operational_services"
  "Professional Services": "Professional Services",    // or "professional_services"
  both: "both",
};

const MAX_LOGO_BYTES = 300_000;
const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];

export default function EditConsultantForm({ consultant }) {
  const router = useRouter();
  const sb = supabaseBrowser();

  const originalCompany = useRef(consultant.company?.trim() || "");

  const [form, setForm] = useState({
    display_name: consultant.display_name ?? "",
    headline: consultant.headline ?? "",
    company: (consultant.company && consultant.company.trim())
      ? consultant.company
      : (consultant.display_name ?? ""),
    location: consultant.location ?? "",
    contact_email: consultant.contact_email ?? "",
    bio: consultant.bio ?? "",
    linkedin_url: consultant.linkedin_url ?? "",
    facebook_url: consultant.facebook_url ?? "",
    twitter_url: consultant.twitter_url ?? "",
    instagram_url: consultant.instagram_url ?? "",
    place_id: consultant.place_id ?? "",
    provider_kind: fromDbProviderKind(consultant.provider_kind ?? "both"),
  });

  // If there was no original company value, keep company in sync with display_name edits.
  useEffect(() => {
    if (!originalCompany.current) {
      setForm((prev) => ({
        ...prev,
        company: prev.display_name || "",
      }));
    }
  }, [form.display_name]);

  const initialLogo = consultant?.metadata?.logo ?? { url: "", path: "", mime: "" };
  const [logo, setLogo] = useState(initialLogo);
  const [busyLogo, setBusyLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleChange = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  function isValidSocialUrl(network, value) {
    const v = String(value || "").trim();
    if (!v) return true;
    if (!/^https:\/\//i.test(v)) return false;
    const patterns = {
      linkedin: /^https:\/\/([a-z0-9-]+\.)*linkedin\.com\/.+/i,
      facebook: /^https:\/\/([a-z0-9-]+\.)*facebook\.com\/.+/i,
      twitter: /^https:\/\/([a-z0-9-]+\.)*(twitter\.com|x\.com)\/.+/i,
      instagram: /^https:\/\/([a-z0-9-]+\.)*instagram\.com\/.+/i,
    };
    return patterns[network].test(v);
  }

  async function handleLogoFile(file) {
    if (!file) return;
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setMessage({ type: "error", text: "Logo must be PNG, JPG, or WEBP." });
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setMessage({ type: "error", text: "Logo too large (max ~300 KB)." });
      return;
    }
    setBusyLogo(true);
    setMessage({ type: "", text: "" });
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/consultants/${consultant.id}/logo/upload`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      setLogo({ url: data.publicUrl, path: data.path, mime: data.mime });
    } catch (e) {
      setMessage({ type: "error", text: e.message || "Upload failed." });
    } finally {
      setBusyLogo(false);
    }
  }

  async function removeLogo() {
    if (logo?.path) {
      try {
        await fetch(`/api/consultants/${consultant.id}/portfolio/delete-file`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: logo.path }),
        });
      } catch {}
    }
    setLogo({ url: "", path: "", mime: "" });
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    // Social validation (unchanged)
    for (const [net, key] of [
      ["linkedin", "linkedin_url"],
      ["facebook", "facebook_url"],
      ["twitter", "twitter_url"],
      ["instagram", "instagram_url"],
    ]) {
      const val = form[key];
      if (val && !isValidSocialUrl(net, val)) {
        setMessage({
          type: "error",
          text: `${net[0].toUpperCase() + net.slice(1)} URL must be a full https URL.`,
        });
        setSaving(false);
        return;
      }
    }

    const placeId = String(form.place_id || "").trim();
    if (placeId && placeId.length < 10) {
      setMessage({
        type: "error",
        text:
          "Place ID looks too short. Paste the full ID (e.g. starting with ChIJ...). Leave blank if unsure.",
      });
      setSaving(false);
      return;
    }

    // Ensure company auto-fills if blank
    const displayNameTrimmed = form.display_name.trim();
    const companyFinal = (form.company && form.company.trim())
      ? form.company.trim()
      : displayNameTrimmed;

    const payload = {
      display_name: displayNameTrimmed,
      headline: form.headline.trim(),
      company: companyFinal,
      location: form.location.trim(),
      contact_email: form.contact_email.trim(),
      bio: form.bio.trim(),
      linkedin_url: form.linkedin_url.trim() || null,
      facebook_url: form.facebook_url.trim() || null,
      twitter_url: form.twitter_url.trim() || null,
      instagram_url: form.instagram_url.trim() || null,
      place_id: placeId || null,
      provider_kind: TO_DB_PROVIDER_KIND[form.provider_kind] || "both",
      metadata: {
        ...(consultant.metadata || {}),
        logo: logo?.url ? { url: logo.url, path: logo.path, mime: logo.mime } : null,
      },
    };

    const { error } = await sb.from("consultants").update(payload).eq("id", consultant.id);
    if (error) {
      setMessage({ type: "error", text: error.message || "Update failed." });
      setSaving(false);
      return;
    }

    setMessage({ type: "success", text: "Profile updated. Redirecting…" });
    setTimeout(() => {
      router.replace(`/consultants/${consultant.id}`);
      router.refresh();
    }, 900);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Core details & logo */}
      <section className="rounded-3xl border border-white/12 bg-white/[0.05] p-6 shadow-sm ring-1 ring-white/10 space-y-6">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-white">Core profile details</h2>
          <p className="text-xs text-slate-400">
            Name, headline, contact and brand identity. These define the public top of your profile.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Display name" value={form.display_name} onChange={handleChange("display_name")} required />
          <Field label="Headline" value={form.headline} onChange={handleChange("headline")} />
          <div className="md:col-span-1">
            <label className="block text-sm text-slate-300">
              Provider type
              <ProviderKindSelect
                value={form.provider_kind}
                onChange={(v) => setForm((p) => ({ ...p, provider_kind: v }))}
              />
              <p className="mt-1 text-xs text-slate-400">
                Choose whether you operate in operational services, professional services, or both.
              </p>
            </label>
          </div>
          <Field label="Location" value={form.location} onChange={handleChange("location")} />
          <Field label="Contact email" type="email" value={form.contact_email} onChange={handleChange("contact_email")} />
          <div className="md:col-span-2">
            <Field
              label="Bio"
              as="textarea"
              rows={5}
              value={form.bio}
              onChange={handleChange("bio")}
              hint="A concise overview of your expertise. Supports multiple paragraphs."
            />
          </div>
        </div>

        {/* Logo sub-card (unchanged) */}
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm font-semibold text-slate-200">Brand logo</p>
          <div className="flex items-start gap-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5">
              {logo?.url ? (
                <img
                  src={logo.url}
                  alt={`${form.display_name || "Consultant"} logo`}
                  width={80}
                  height={80}
                  decoding="async"
                  loading="eager"
                  className="h-20 w-20 object-contain"
                />
              ) : (
                <div className="h-20 w-20 flex items-center justify-center text-xs text-slate-500">
                  No logo
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <label className="block text-xs text-slate-300">
                  Upload logo (PNG, JPG, WEBP, ≤300 KB)
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => handleLogoFile(e.target.files?.[0])}
                  disabled={busyLogo}
                  className="mt-1 block w-full text-xs text-slate-200 file:mr-3 file:rounded-md file:border file:border-white/15 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:text-slate-100 hover:file:bg-white/15"
                />
                {busyLogo && <p className="mt-1 text-xs text-slate-400">Uploading…</p>}
              </div>
              {logo?.url ? (
                <button
                  type="button"
                  onClick={removeLogo}
                  className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-slate-100 hover:bg-white/15"
                >
                  Remove logo
                </button>
              ) : null}
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Tip: square background, 256–512 px, optimized &lt; 300 KB.
          </p>
        </div>
      </section>

      {/* Social links */}
      <section className="space-y-5 rounded-3xl border border-white/12 bg-white/[0.05] p-6 shadow-sm ring-1 ring-white/10">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-white">Social presence</h2>
          <p className="text-xs text-slate-400">
            Optional links to verified social profiles. Paste full https URLs.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="LinkedIn"
            placeholder="https://www.linkedin.com/in/your-handle"
            value={form.linkedin_url}
            onChange={handleChange("linkedin_url")}
          />
          <Field
            label="Facebook"
            placeholder="https://www.facebook.com/your-page"
            value={form.facebook_url}
            onChange={handleChange("facebook_url")}
          />
          <Field
            label="Twitter/X"
            placeholder="https://x.com/your-handle"
            value={form.twitter_url}
            onChange={handleChange("twitter_url")}
          />
          <Field
            label="Instagram"
            placeholder="https://www.instagram.com/your-handle"
            value={form.instagram_url}
            onChange={handleChange("instagram_url")}
          />
        </div>
      </section>

      {/* Google listing */}
      <section className="space-y-5 rounded-3xl border border-white/12 bg-white/[0.05] p-6 shadow-sm ring-1 ring-white/10">
        <header className="space-y-1 flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-bold text-[#4285F4] shadow">
            G
          </span>
          <div>
            <h2 className="text-lg font-semibold text-white">Google business listing</h2>
            <p className="text-xs text-slate-400">
              Connect your Google Place ID to show map & ratings (optional).
            </p>
          </div>
        </header>
        <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
          <Field
            label="Google Place ID"
            placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
            value={form.place_id}
            onChange={handleChange("place_id")}
            hint="Paste the full Place ID. Leave blank if unsure."
          />
          <div className="self-end">
            <InfoPopover />
          </div>
        </div>
      </section>

      {/* Status message (global) */}
      {message.text && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            message.type === "success"
              ? "border border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
              : "border border-rose-400/40 bg-rose-500/10 text-rose-100"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Global action bar */}
      <div
        className="
          sticky bottom-4 z-10 flex items-center gap-3 rounded-2xl
          border border-white/15 bg-slate-900/70 px-4 py-3 backdrop-blur
          shadow-lg ring-1 ring-white/10
        "
      >
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-2 text-sm font-semibold text-white shadow disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.replace(`/consultants/${consultant.id}`)}
          className="inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-sky-300/60 hover:bg-sky-500/10"
        >
          Cancel
        </button>
        <span className="ml-auto text-[11px] font-medium text-slate-400">
          Changes apply to all sections
        </span>
      </div>
    </form>
  );
}

function InfoPopover() {
  return (
    <details className="group relative w-full">
      <summary className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:bg-white/15">
        What’s a Place ID?
      </summary>
      <div className="absolute z-10 mt-2 w-80 rounded-xl border border-white/10 bg-slate-900/95 p-3 text-xs text-slate-200 shadow-xl backdrop-blur-md ring-1 ring-white/10">
        <p>
          A Place ID identifies your business on Google Maps (e.g.{" "}
          <code className="text-slate-100">ChIJN1t_tDeuEmsRUsoyG83frY4</code>).
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>
            Docs:{" "}
            <a
              href="https://developers.google.com/maps/documentation/places/web-service/place-id"
              target="_blank"
              className="text-sky-300 underline"
            >
              Place ID
            </a>
          </li>
          <li>
            Find:{" "}
            <a
              href="https://developers.google.com/maps/documentation/javascript/place-id#find-id"
              target="_blank"
              className="text-sky-300 underline"
            >
              Lookup tool
            </a>
          </li>
        </ul>
        <p className="mt-2 text-slate-400">Leave blank if you don’t have it yet.</p>
      </div>
    </details>
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

function ProviderKindSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const selected = PROVIDER_KIND_OPTIONS.find((o) => o.value === value) ?? PROVIDER_KIND_OPTIONS[2];

  return (
    <div className="relative mt-1" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full inline-flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-left text-sm text-slate-100 hover:bg-white/[0.1] focus:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate font-medium">{selected.label}</span>
        <svg width="16" height="16" viewBox="0 0 20 20" className="ml-2 opacity-80">
          <path fill="currentColor" d="M5.5 7.5L10 12l4.5-4.5z" />
        </svg>
      </button>
      {open && (
        <div
          role="listbox"
          tabIndex={-1}
          className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-slate-900/95 ring-1 ring-white/10 shadow-2xl backdrop-blur"
        >
          <ul className="max-h-72 overflow-auto p-1">
            {PROVIDER_KIND_OPTIONS.map((opt) => {
              const active = opt.value === value;
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`w-full text-left rounded-lg px-3 py-2.5 transition ${
                      active
                        ? "bg-sky-500/15 text-sky-100 border border-sky-400/30"
                        : "text-slate-200 hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={`mt-1 h-2.5 w-2.5 rounded-full ${
                          opt.value === "Operational Services"
                            ? "bg-indigo-400"
                            : opt.value === "Professional Services"
                            ? "bg-sky-400"
                            : "bg-teal-400"
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold">{opt.label}</div>
                        {opt.desc ? (
                          <div className="text-xs text-slate-400">{opt.desc}</div>
                        ) : null}
                      </div>
                      {active && (
                        <svg width="16" height="16" viewBox="0 0 20 20" className="ml-auto mt-0.5 text-sky-300">
                          <path fill="currentColor" d="M8.5 12.5l-2.5-2.5 1.4-1.4 1.1 1.1 4.1-4.1 1.4 1.4z" />
                        </svg>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}