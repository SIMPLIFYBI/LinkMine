"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import {
  COUNTRY_OPTIONS,
  GLOBAL_REGION_OPTIONS,
  isValidCountryCode,
  isValidGlobalRegion,
} from "@/lib/geoOptions";

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

const MARKET_FOCUS_OPTIONS = [
  { value: "mining", label: "Mining" },
  { value: "oil_gas", label: "Oil & Gas" },
  { value: "both", label: "Both" },
];

const PROFILE_TYPE_OPTIONS = [
  { value: "consultant", label: "Consultant" },
  { value: "creator", label: "Creator" },
  { value: "both", label: "Both" },
];

function normaliseMarketFocus(value) {
  const v = String(value || "").toLowerCase();
  if (v === "oil_gas" || v === "oil-gas") return "oil_gas";
  if (v === "both") return "both";
  return "mining";
}

function marketFocusFromMetadata(metadata) {
  const m = metadata && typeof metadata === "object" ? metadata : {};
  const direct = normaliseMarketFocus(m.market_focus || m.market || "");
  if (direct !== "mining" || m.market_focus || m.market) return direct;

  const legacy = String(m.services_markets || "").toLowerCase();
  if (legacy.includes("both")) return "both";
  if (legacy.includes("oil_gas") || legacy.includes("oil-gas") || legacy.includes("oil")) return "oil_gas";
  return "mining";
}

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
    country_code: consultant.country_code ?? "",
    global_region: consultant.global_region ?? "",
    contact_email: consultant.contact_email ?? "",
    website_url: consultant.website_url ?? "",
    bio: consultant.bio ?? "",
    linkedin_url: consultant.linkedin_url ?? "",
    facebook_url: consultant.facebook_url ?? "",
    twitter_url: consultant.twitter_url ?? "",
    instagram_url: consultant.instagram_url ?? "",
    place_id: consultant.place_id ?? "",
    provider_kind: fromDbProviderKind(consultant.provider_kind ?? "both"),
    profile_type: ["consultant", "creator", "both"].includes(String(consultant.profile_type || "consultant"))
      ? String(consultant.profile_type || "consultant")
      : "consultant",
    market_focus: marketFocusFromMetadata(consultant.metadata),
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

  function isValidWebsiteUrl(value) {
    const v = String(value || "").trim();
    if (!v) return true;
    return /^https:\/\//i.test(v);
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
    const countryCode = String(form.country_code || "").trim().toUpperCase();
    const globalRegion = String(form.global_region || "").trim();
    if (form.website_url && !isValidWebsiteUrl(form.website_url)) {
      setMessage({
        type: "error",
        text: "Website URL must be a full https URL.",
      });
      setSaving(false);
      return;
    }

    if (!isValidCountryCode(countryCode)) {
      setMessage({ type: "error", text: "Select a valid country." });
      setSaving(false);
      return;
    }

    if (!isValidGlobalRegion(globalRegion)) {
      setMessage({ type: "error", text: "Select a valid global region." });
      setSaving(false);
      return;
    }

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
      country_code: countryCode || null,
      global_region: globalRegion || null,
      contact_email: form.contact_email.trim(),
      website_url: form.website_url.trim() || null,
      bio: form.bio.trim(),
      linkedin_url: form.linkedin_url.trim() || null,
      facebook_url: form.facebook_url.trim() || null,
      twitter_url: form.twitter_url.trim() || null,
      instagram_url: form.instagram_url.trim() || null,
      place_id: placeId || null,
      provider_kind: TO_DB_PROVIDER_KIND[form.provider_kind] || "both",
      profile_type: ["consultant", "creator", "both"].includes(form.profile_type)
        ? form.profile_type
        : "consultant",
      metadata: {
        ...(consultant.metadata || {}),
        market_focus: form.market_focus || "mining",
        services_markets: form.market_focus || "mining",
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
        <SectionTitle
          title="Core profile details"
          subtitle="Set the essentials clients use to find you and decide whether to reach out."
          icon={
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="10" cy="6" r="3" />
              <path d="M3.5 16c1.6-2.7 4-4 6.5-4s4.9 1.3 6.5 4" />
            </svg>
          }
        />

        <div className="rounded-2xl border border-sky-300/20 bg-sky-500/10 px-4 py-3 text-xs text-sky-100">
          Tip: Start with display name, headline, profile mode, and market focus. These have the biggest impact on discoverability.
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Display name"
            value={form.display_name}
            onChange={handleChange("display_name")}
            required
            infoText="This is your public profile name shown in search and across YouMine."
          />
          <Field
            label="Headline"
            value={form.headline}
            onChange={handleChange("headline")}
            infoText="A short one-line summary of what you do best and who you help."
          />
          <div className="md:col-span-1">
            <SelectField
              label="Profile mode"
              value={form.profile_type}
              onChange={handleChange("profile_type")}
              options={PROFILE_TYPE_OPTIONS}
              placeholder="Select profile mode"
              hint="Consultant appears in consultant discovery. Creator appears in creator discovery. Both appears in both."
              infoText="Choose where you appear: consultant listings, creator listings, or both."
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm text-slate-300">
              <LabelWithHint
                label="Provider type"
                infoText="Clarifies whether you mainly offer operational services, professional services, or both."
              />
              <ProviderKindSelect
                value={form.provider_kind}
                onChange={(v) => setForm((p) => ({ ...p, provider_kind: v }))}
              />
              <p className="mt-1 text-xs text-slate-400">
                Helps clients quickly understand your service model.
              </p>
            </label>
          </div>
          <div className="md:col-span-1">
            <SelectField
              label="Market focus"
              value={form.market_focus}
              onChange={handleChange("market_focus")}
              options={MARKET_FOCUS_OPTIONS}
              placeholder="Select market focus"
              hint="Controls whether this profile is tagged as Mining, Oil & Gas, or Both."
              infoText="Used in filters so clients in Mining and/or Oil & Gas can find you faster."
            />
          </div>
          <Field
            label="Location"
            value={form.location}
            onChange={handleChange("location")}
            infoText="Your base location helps clients assess fit, timezone, and proximity."
          />
          <SelectField
            label="Country"
            value={form.country_code}
            onChange={handleChange("country_code")}
            options={COUNTRY_OPTIONS}
            placeholder="Select a country"
            infoText="Adds country context for search and trust signals."
          />
          <SelectField
            label="Global region"
            value={form.global_region}
            onChange={handleChange("global_region")}
            options={GLOBAL_REGION_OPTIONS}
            placeholder="Select a region"
            infoText="Supports broad region filtering (for example APAC or North America)."
          />
          <Field
            label="Contact email"
            type="email"
            value={form.contact_email}
            onChange={handleChange("contact_email")}
            infoText="This is your public enquiry inbox. Use an address you check regularly."
          />
          <Field
            label="Website"
            placeholder="https://your-site.example.com"
            value={form.website_url}
            onChange={handleChange("website_url")}
            infoText="Add your website or landing page so clients can validate your brand quickly."
          />
          <div className="md:col-span-2">
            <Field
              label="Bio"
              as="textarea"
              rows={5}
              value={form.bio}
              onChange={handleChange("bio")}
              hint="A concise overview of your expertise. Supports multiple paragraphs."
              infoText="Share your niche, typical projects, and results clients can expect."
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
        <SectionTitle
          title="Social presence"
          subtitle="Optional social links that help clients verify your credibility and recent activity."
          icon={
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 10h14" />
              <path d="M10 3v14" />
              <circle cx="10" cy="10" r="6.5" />
            </svg>
          }
        />
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs text-slate-300">
          Tip: Add only active profiles that strengthen trust and show current work.
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="LinkedIn"
            placeholder="https://www.linkedin.com/in/your-handle"
            value={form.linkedin_url}
            onChange={handleChange("linkedin_url")}
            infoText="Best for showcasing professional background, expertise, and project history."
          />
          <Field
            label="Facebook"
            placeholder="https://www.facebook.com/your-page"
            value={form.facebook_url}
            onChange={handleChange("facebook_url")}
            infoText="Useful if your page is active and includes relevant updates or testimonials."
          />
          <Field
            label="Twitter/X"
            placeholder="https://x.com/your-handle"
            value={form.twitter_url}
            onChange={handleChange("twitter_url")}
            infoText="Great for timely updates, thought leadership, and industry commentary."
          />
          <Field
            label="Instagram"
            placeholder="https://www.instagram.com/your-handle"
            value={form.instagram_url}
            onChange={handleChange("instagram_url")}
            infoText="Useful for visual proof of projects, team capability, and field activity."
          />
        </div>
      </section>

      {/* Google listing */}
      <section className="space-y-5 rounded-3xl border border-white/12 bg-white/[0.05] p-6 shadow-sm ring-1 ring-white/10">
        <SectionTitle
          title="Google business listing"
          subtitle="Link your Google Place ID to show map context and public review signals."
          icon={
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M10 18s5-4.4 5-8.2A5 5 0 1 0 5 9.8C5 13.6 10 18 10 18Z" />
              <circle cx="10" cy="8" r="1.8" />
            </svg>
          }
        />
        <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
          <Field
            label="Google Place ID"
            placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
            value={form.place_id}
            onChange={handleChange("place_id")}
            hint="Paste the full Place ID. Leave blank if unsure."
            infoText="Connects your profile to the exact Google Maps listing clients see publicly."
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

function Field({ label, as = "input", hint, infoText, ...props }) {
  const Component = as;
  const shared =
    "mt-1 w-full rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-400/30";
  return (
    <label className="block text-sm text-slate-300">
      <LabelWithHint label={label} infoText={infoText} />
      <Component className={shared} {...props} />
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </label>
  );
}

function SelectField({ label, hint, options, placeholder, infoText, ...props }) {
  return (
    <label className="block text-sm text-slate-300">
      <LabelWithHint label={label} infoText={infoText} />
      <div className="relative mt-1">
        <select
          {...props}
          className="w-full appearance-none rounded-xl border border-white/10 bg-slate-900/95 px-3 py-2 pr-10 text-sm text-slate-100 hover:bg-slate-900 focus:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
        >
          <option value="" className="bg-slate-900 text-slate-300">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-slate-900 text-slate-100">
              {option.label}
            </option>
          ))}
        </select>
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m5.5 7.5 4.5 5 4.5-5" />
        </svg>
      </div>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </label>
  );
}

function LabelWithHint({ label, infoText }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span>{label}</span>
      {infoText ? <HoverHint text={infoText} /> : null}
    </span>
  );
}

function HoverHint({ text }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label="Field help"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/25 text-[11px] font-semibold text-slate-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        i
      </button>
      <span className="pointer-events-none absolute left-1/2 top-7 z-30 hidden w-64 -translate-x-1/2 rounded-lg border border-white/15 bg-slate-900/95 px-3 py-2 text-left text-xs leading-relaxed text-slate-100 shadow-xl group-hover:block group-focus-within:block">
        {text}
      </span>
    </span>
  );
}

function SectionTitle({ title, subtitle, icon }) {
  return (
    <header className="space-y-1">
      <div className="inline-flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] text-slate-100">
          {icon}
        </span>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      <p className="text-xs text-slate-400">{subtitle}</p>
    </header>
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