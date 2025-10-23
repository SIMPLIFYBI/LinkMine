"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

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
    // Socials
    linkedin_url: consultant.linkedin_url ?? "",
    facebook_url: consultant.facebook_url ?? "",
    twitter_url: consultant.twitter_url ?? "",
    instagram_url: consultant.instagram_url ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  // Only validate full https URLs for allowed domains. No handle parsing or normalization.
  function isValidSocialUrl(network, value) {
    const v = String(value || "").trim();
    if (!v) return true; // empty is allowed
    if (!/^https:\/\//i.test(v)) return false;
    const patterns = {
      linkedin: /^https:\/\/([a-z0-9-]+\.)*linkedin\.com\/.+/i,
      facebook: /^https:\/\/([a-z0-9-]+\.)*facebook\.com\/.+/i,
      twitter: /^https:\/\/([a-z0-9-]+\.)*(twitter\.com|x\.com)\/.+/i,
      instagram: /^https:\/\/([a-z0-9-]+\.)*instagram\.com\/.+/i,
    };
    const re = patterns[network];
    return re.test(v);
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    // Validate inputs (must be full https URLs to approved domains)
    if (form.linkedin_url && !isValidSocialUrl("linkedin", form.linkedin_url)) {
      setMessage({ type: "error", text: "LinkedIn must be a full https://linkedin.com/... URL." });
      setSaving(false);
      return;
    }
    if (form.facebook_url && !isValidSocialUrl("facebook", form.facebook_url)) {
      setMessage({ type: "error", text: "Facebook must be a full https://facebook.com/... URL." });
      setSaving(false);
      return;
    }
    if (form.twitter_url && !isValidSocialUrl("twitter", form.twitter_url)) {
      setMessage({ type: "error", text: "Twitter/X must be a full https://x.com/... or https://twitter.com/... URL." });
      setSaving(false);
      return;
    }
    if (form.instagram_url && !isValidSocialUrl("instagram", form.instagram_url)) {
      setMessage({ type: "error", text: "Instagram must be a full https://instagram.com/... URL." });
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
      // Socials: send empty as null
      linkedin_url: form.linkedin_url.trim() || null,
      facebook_url: form.facebook_url.trim() || null,
      twitter_url: form.twitter_url.trim() || null,
      instagram_url: form.instagram_url.trim() || null,
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
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-white/12 bg-white/[0.05] p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Display name" value={form.display_name} onChange={handleChange("display_name")} required />
        <Field label="Headline" value={form.headline} onChange={handleChange("headline")} />
        <Field label="Company" value={form.company} onChange={handleChange("company")} />
        <Field label="Location" value={form.location} onChange={handleChange("location")} />
        <Field label="Contact email" type="email" value={form.contact_email} onChange={handleChange("contact_email")} />
      </div>

      <Field label="Bio" value={form.bio} onChange={handleChange("bio")} as="textarea" rows={5} />

      {/* Social links */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-slate-200">Social links</p>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="LinkedIn"
            placeholder="https://www.linkedin.com/in/your-handle"
            value={form.linkedin_url}
            onChange={handleChange("linkedin_url")}
            hint="Paste the full https URL."
          />
          <Field
            label="Facebook"
            placeholder="https://www.facebook.com/your-page"
            value={form.facebook_url}
            onChange={handleChange("facebook_url")}
            hint="Paste the full https URL."
          />
          <Field
            label="Twitter/X"
            placeholder="https://x.com/your-handle"
            value={form.twitter_url}
            onChange={handleChange("twitter_url")}
            hint="Paste the full https URL."
          />
          <Field
            label="Instagram"
            placeholder="https://www.instagram.com/your-handle"
            value={form.instagram_url}
            onChange={handleChange("instagram_url")}
            hint="Paste the full https URL."
          />
        </div>
      </div>

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

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-2 text-sm font-semibold text-white shadow disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-sky-300/60 hover:bg-sky-500/10"
        >
          Cancel
        </button>
      </div>
    </form>
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