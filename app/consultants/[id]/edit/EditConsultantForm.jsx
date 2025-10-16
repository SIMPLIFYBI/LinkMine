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
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    const { error } = await sb
      .from("consultants")
      .update({
        display_name: form.display_name.trim(),
        headline: form.headline.trim(),
        company: form.company.trim(),
        location: form.location.trim(),
        contact_email: form.contact_email.trim(),
        bio: form.bio.trim(),
      })
      .eq("id", consultant.id);

    if (error) {
      setMessage({ type: "error", text: error.message || "Update failed." });
      setSaving(false);
      return;
    }

    setMessage({
      type: "success",
      text: "Profile updated. Redirecting…",
    });
    setTimeout(() => {
      router.replace(`/consultants/${consultant.id}`);
      router.refresh();
    }, 1200);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-3xl border border-white/12 bg-white/[0.05] p-6"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Display name"
          value={form.display_name}
          onChange={handleChange("display_name")}
          required
        />
        <Field
          label="Headline"
          value={form.headline}
          onChange={handleChange("headline")}
        />
        <Field
          label="Company"
          value={form.company}
          onChange={handleChange("company")}
        />
        <Field
          label="Location"
          value={form.location}
          onChange={handleChange("location")}
        />
        <Field
          label="Contact email"
          type="email"
          value={form.contact_email}
          onChange={handleChange("contact_email")}
        />
      </div>

      <Field
        label="Bio"
        value={form.bio}
        onChange={handleChange("bio")}
        as="textarea"
        rows={5}
      />

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