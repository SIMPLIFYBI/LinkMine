"use client";

import { useState, useEffect, useMemo } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { Star } from "lucide-react";

export default function ConsultantFavouriteButton({
  consultantId,
  initialFavourite = false,
}) {
  const [status, setStatus] = useState({ loading: true, favourite: initialFavourite });
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      const sb = supabaseBrowser();
      const { data: userData } = await sb.auth.getUser();
      const user = userData?.user ?? null;

      if (!user) {
        if (active) setStatus({ loading: false, favourite: false });
        return;
      }

      const { data, error } = await sb
        .from("consultant_favourites")
        .select("id")
        .eq("consultant_id", consultantId)
        .maybeSingle();

      if (!active) return;

      if (error && error.code !== "PGRST116") {
        setError(error.message ?? "Unable to load favourite status.");
        setStatus({ loading: false, favourite: initialFavourite });
        return;
      }

      setStatus({ loading: false, favourite: Boolean(data) });
    }

    load();
    return () => {
      active = false;
    };
  }, [consultantId, initialFavourite]);

  const isLoading = status.loading;
  const isFavourite = status.favourite;

  const label = useMemo(
    () => (isFavourite ? "Remove from favourites" : "Save to favourites"),
    [isFavourite]
  );

  async function toggleFavourite() {
    setError("");
    const sb = supabaseBrowser();
    const { data: userData } = await sb.auth.getUser();
    if (!userData?.user) {
      setError("Log in to favourite consultants.");
      return;
    }

    setStatus((prev) => ({ ...prev, loading: true }));

    try {
      const method = isFavourite ? "DELETE" : "POST";
      const res = await fetch(
        `/api/consultants/${consultantId}/favourite`,
        {
          method,
          credentials: "include",
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Request failed.");
      }

      setStatus({ loading: false, favourite: !isFavourite });
    } catch (err) {
      setStatus({ loading: false, favourite: isFavourite });
      setError(err.message || "Could not update favourite.");
    }
  }

  return (
    <div className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={toggleFavourite}
        disabled={isLoading}
        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
          isFavourite
            ? "border-amber-400/60 bg-amber-400/10 text-amber-200 hover:border-amber-300 hover:bg-amber-400/20"
            : "border-white/15 bg-white/5 text-slate-200 hover:border-white/25 hover:bg-white/10"
        } disabled:opacity-60`}
        title={label}
      >
        <Star
          className={`h-4 w-4 transition ${
            isFavourite ? "fill-amber-400 text-amber-300" : "text-slate-400"
          }`}
        />
        {label}
      </button>
      {error && (
        <span className="text-[10px] text-rose-300">{error}</span>
      )}
    </div>
  );
}