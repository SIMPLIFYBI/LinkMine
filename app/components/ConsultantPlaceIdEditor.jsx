"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function ConsultantPlaceIdEditor({
  consultantId,
  initialValue = "",
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue ?? "");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    const sb = supabaseBrowser();
    const { error } = await sb
      .from("consultants")
      .update({ place_id: value.trim() || null })
      .eq("id", consultantId);

    if (error) {
      setMessage(error.message || "Failed to save place ID.");
      return;
    }

    startTransition(() => {
      router.refresh();
      setMessage("Saved.");
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-200 ring-1 ring-white/5"
    >
      <header className="mb-3">
        <h2 className="text-lg font-semibold text-white">Google Place ID</h2>
        <p className="mt-1 text-xs text-slate-300">
          Paste the Google Maps place ID for this consultancy to show ratings later.
        </p>
      </header>

      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g. ChIJN1t_tDeuEmsRUsoyG83frY4"
        className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
      />

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center rounded-full border border-sky-400/60 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:border-sky-300 hover:bg-sky-500/20 disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save place ID"}
        </button>
        {message && <span className="text-xs text-slate-300">{message}</span>}
      </div>
    </form>
  );
}