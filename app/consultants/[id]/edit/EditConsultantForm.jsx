"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const MAX_LOGO_BYTES = 300_000;
const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];

export default function EditConsultantForm({ consultant }) {
  const router = useRouter();
  const sb = supabaseBrowser();

  const [form, setForm] = useState({
    display_name: consultant.display_name ?? "",
    headline: consultant.headline ?? "",
    company: consultant.company ?? "",
    location: consultant.location ?? "",
    contact_email: consultant.contact_email ?? "",
    bio: consultant.bio ?? "",
    linkedin_url: consultant.linkedin_url ?? "",
    facebook_url: consultant.facebook_url ?? "",
    twitter_url: consultant.twitter_url ?? "",
    instagram_url: consultant.instagram_url ?? "",
    place_id: consultant.place_id ?? "",
  });

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

    // Social validation
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

    const payload = {
      display_name: form.display_name.trim(),
      headline: form.headline.trim(),
      company: form.company.trim(),
      location: form.location.trim(),
      contact_email: form.contact_email.trim(),
      bio: form.bio.trim(),
      linkedin_url: form.linkedin_url.trim() || null,
      facebook_url: form.facebook_url.trim() || null,
      twitter_url: form.twitter_url.trim() || null,
      instagram_url: form.instagram_url.trim() || null,
      place_id: placeId || null,
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
          <Field label="Company" value={form.company} onChange={handleChange("company")} />
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

        {/* Logo sub-card */}
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