"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function PostJobModal({ open, onClose }) {
  const router = useRouter();
  const [email, setEmail] = useState(null);

  const [title, setTitle] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("general");
  const [servicesInput, setServicesInput] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [applyUrl, setApplyUrl] = useState("");
  const [heroImage, setHeroImage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!open) return;
    const sb = supabaseBrowser();
    sb.auth.getUser().then(({ data }) => {
      const e = data?.user?.email ?? null;
      setEmail(e);
      if (!e) router.push("/login?redirect=/listings");
    });
  }, [open, router]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setOk(false);

    try {
      const sb = supabaseBrowser();
      const services = servicesInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const { error } = await sb.from("listings").insert([
        {
          title: title.trim(),
          short_description: shortDesc.trim(),
          description: description.trim(),
          location: location.trim(),
          job_type: jobType, // fixed_price | fixed_duration | eoi | general
          status: "active",
          services,
          contact: {
            email: (contactEmail || email || "").trim() || null,
            apply_url: applyUrl.trim() || null,
          },
          hero_image: heroImage.trim() || null,
          metadata: {},
        },
      ]);

      if (error) throw error;
      setOk(true);
      router.refresh();
      setTimeout(() => onClose?.(), 600);
    } catch (err) {
      setError(err?.message || "Failed to post job.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="w-full md:max-w-lg bg-slate-900/90 border border-white/10 ring-1 ring-white/10 rounded-t-2xl md:rounded-2xl shadow-2xl text-slate-100">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="text-base font-semibold">Post a job</h2>
          <button onClick={onClose} className="text-slate-300 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-4 space-y-3">
          <label className="grid gap-1">
            <span className="text-sm text-slate-300">Title</span>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-md bg-slate-900/60 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
              placeholder="e.g., Geotechnical Engineer (Open Pit)"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-slate-300">Short description</span>
            <input
              required
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              className="rounded-md bg-slate-900/60 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
              placeholder="One‑line summary shown in cards"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-slate-300">Full description</span>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-md bg-slate-900/60 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
              placeholder="Scope, deliverables, timeframe, requirements…"
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span className="text-sm text-slate-300">Location</span>
              <input
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="rounded-md bg-slate-900/60 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
                placeholder="e.g., Kalgoorlie, WA"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm text-slate-300">Job type</span>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="rounded-md bg-slate-900/60 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
              >
                <option value="general">General</option>
                <option value="fixed_price">Fixed price</option>
                <option value="fixed_duration">Fixed duration</option>
                <option value="eoi">EOI</option>
              </select>
            </label>
          </div>

          <label className="grid gap-1">
            <span className="text-sm text-slate-300">Services (comma‑separated)</span>
            <input
              value={servicesInput}
              onChange={(e) => setServicesInput(e.target.value)}
              className="rounded-md bg-slate-900/60 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
              placeholder="geotechnical-engineering, mine-planning-design"
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span className="text-sm text-slate-300">Contact email</span>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="rounded-md bg-slate-900/60 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
                placeholder={email || "you@example.com"}
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm text-slate-300">Apply URL (optional)</span>
              <input
                value={applyUrl}
                onChange={(e) => setApplyUrl(e.target.value)}
                className="rounded-md bg-slate-900/60 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
                placeholder="https://…"
              />
            </label>
          </div>

          <label className="grid gap-1">
            <span className="text-sm text-slate-300">Hero image URL (optional)</span>
            <input
              value={heroImage}
              onChange={(e) => setHeroImage(e.target.value)}
              className="rounded-md bg-slate-900/60 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
              placeholder="https://images.unsplash.com/…"
            />
          </label>

          {error && <div className="text-sm text-rose-300">{error}</div>}
          {ok && <div className="text-sm text-emerald-300">Job posted.</div>}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm hover:border-white/20 hover:bg-white/10">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {submitting ? "Posting…" : "Post job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}