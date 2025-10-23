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

  function normalizeSocialUrl(network, value) {
    const v = String(value || "").trim();
    if (!v) return "";
    const handle = v.startsWith("@") ? v.slice(1) : v;
    const isUrl = /^https?:\/\//i.test(v);
    const stripSlash = (u) => u.replace(/\/+$/, "");

    switch (network) {
      case "linkedin": {
        let url = isUrl ? v : `https://www.linkedin.com/in/${handle}`;
        url = url.replace(/^http:\/\//i, "https://");
        url = stripSlash(url);
        if (!/^https:\/\/([a-z0-9-]+\.)*linkedin\.com\/.+/i.test(url)) return null;
        return url;
      }
      case "facebook": {
        let url = isUrl ? v : `https://www.facebook.com/${handle}`;
        url = url.replace(/^http:\/\//i, "https://");
        url = stripSlash(url);
        if (!/^https:\/\/([a-z0-9-]+\.)*facebook\.com\/.+/i.test(url)) return null;
        return url;
      }
      case "twitter": {
        let url = isUrl ? v : `https://x.com/${handle}`;
        url = url.replace(/^http:\/\//i, "https://");
        url = stripSlash(url);
        if (!/^https:\/\/([a-z0-9-]+\.)*(twitter\.com|x\.com)\/.+/i.test(url)) return null;
        return url.replace(/^https:\/\/(www\.)?twitter\.com/i, "https://x.com");
      }
      case "instagram": {
        let url = isUrl ? v : `https://www.instagram.com/${handle}`;
        url = url.replace(/^http:\/\//i, "https://");
        url = stripSlash(url);
        if (!/^https:\/\/([a-z0-9-]+\.)*instagram\.com\/.+/i.test(url)) return null;
        return url;
      }
      default:
        return null;
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    const linkedin = form.linkedin_url ? normalizeSocialUrl("linkedin", form.linkedin_url) : "";
    const facebook = form.facebook_url ? normalizeSocialUrl("facebook", form.facebook_url) : "";
    const twitter = form.twitter_url ? normalizeSocialUrl("twitter", form.twitter_url) : "";
    const instagram = form.instagram_url ? normalizeSocialUrl("instagram", form.instagram_url) : "";

    if (form.linkedin_url && !linkedin) {
      setMessage({ type: "error", text: "LinkedIn URL looks invalid." });
      setSaving(false);
      return;
    }
    if (form.facebook_url && !facebook) {
      setMessage({ type: "error", text: "Facebook URL looks invalid." });
      setSaving(false);
      return;
    }
    if (form.twitter_url && !twitter) {
      setMessage({ type: "error", text: "Twitter/X URL looks invalid." });
      setSaving(false);
      return;
    }
    if (form.instagram_url && !instagram) {
      setMessage({ type: "error", text: "Instagram URL looks invalid." });
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
      // Socials
      linkedin_url: linkedin || null,
      facebook_url: facebook || null,
      twitter_url: twitter || null,
      instagram_url: instagram || null,
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
    }, 1200);
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
            placeholder="https://www.linkedin.com/in/your-handle or @your-handle"
            value={form.linkedin_url}
            onChange={handleChange("linkedin_url")}
          />
          <Field
            label="Facebook"
            placeholder="https://www.facebook.com/your-page or @your-page"
            value={form.facebook_url}
            onChange={handleChange("facebook_url")}
          />
          <Field
            label="Twitter/X"
            placeholder="https://x.com/your-handle or @your-handle"
            value={form.twitter_url}
            onChange={handleChange("twitter_url")}
          />
          <Field
            label="Instagram"
            placeholder="https://www.instagram.com/your-handle or @your-handle"
            value={form.instagram_url}
            onChange={handleChange("instagram_url")}
          />
        </div>
        <p className="text-xs text-slate-400">
          Tips: Paste a full https URL or just your @handle. We’ll normalize and validate the domain.
        </p>
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

function Field({ label, as = "input", ...props }) {
  const Component = as;
  const shared =
    "mt-1 w-full rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-400/30";
  return (
    <label className="block text-sm text-slate-300">
      {label}
      <Component className={shared} {...props} />
    </label>
  );
}