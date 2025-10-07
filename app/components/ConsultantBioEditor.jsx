"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function ConsultantBioEditor({
  consultantId,
  initialHeadline = "",
  initialBio = "",
}) {
  const router = useRouter();
  const [headline, setHeadline] = useState(initialHeadline);
  const [bio, setBio] = useState(initialBio);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSave(e) {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch(
        `/api/consultants/${consultantId}/profile`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            headline,
            bio,
          }),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Could not save profile.");
      }

      startTransition(() => {
        router.refresh();
        setMessage("Saved.");
      });
    } catch (err) {
      setMessage(err.message || "Unable to save profile.");
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-slate-100 shadow-sm ring-1 ring-white/5"
    >
      <header>
        <h2 className="text-lg font-semibold text-white">Edit profile</h2>
        <p className="mt-1 text-sm text-slate-300">
          Update the headline and bio shown on your public profile.
        </p>
      </header>

      <label className="block text-sm">
        <span className="text-xs uppercase tracking-wide text-slate-400">
          Headline
        </span>
        <input
          className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          maxLength={160}
          placeholder="e.g. Principal Geotechnical Engineer"
        />
      </label>

      <label className="block text-sm">
        <span className="text-xs uppercase tracking-wide text-slate-400">
          Bio
        </span>
        <textarea
          className="mt-1 w-full min-h-[140px] rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell clients about your expertise, experience and services."
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center rounded-full border border-sky-400/60 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:border-sky-300 hover:bg-sky-500/20 disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save profile"}
        </button>
        {message && <span className="text-xs text-slate-300">{message}</span>}
      </div>
    </form>
  );
}