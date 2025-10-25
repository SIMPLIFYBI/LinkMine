"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function ConsultantFavouriteButton({ consultantId, initialFavourite }) {
  const sb = supabaseBrowser();
  const [fav, setFav] = useState(initialFavourite ?? null);
  const [loading, setLoading] = useState(false);
  const canToggle = fav !== null;

  useEffect(() => {
    if (initialFavourite !== undefined) return;
    let mounted = true;
    (async () => {
      const { data: auth } = await sb.auth.getUser();
      const userId = auth?.user?.id || null;
      if (!mounted) return;
      if (!userId) {
        setFav(false);
        return;
      }
      const { data } = await sb
        .from("consultant_favourites")
        .select("consultant_id")
        .eq("consultant_id", consultantId)
        .limit(1)
        .maybeSingle();
      if (!mounted) return;
      setFav(Boolean(data));
    })();
    return () => {
      mounted = false;
    };
  }, [consultantId, sb, initialFavourite]);

  const toggle = async () => {
    if (loading) return;
    setLoading(true);
    const { data: auth } = await sb.auth.getUser();
    const userId = auth?.user?.id || null;
    if (!userId) {
      setLoading(false);
      return;
    }
    if (fav) {
      await sb
        .from("consultant_favourites")
        .delete()
        .eq("consultant_id", consultantId)
        .eq("user_id", userId);
      setFav(false);
    } else {
      await sb
        .from("consultant_favourites")
        .upsert(
          { consultant_id: consultantId, user_id: userId },
          { onConflict: "user_id,consultant_id" }
        );
      setFav(true);
    }
    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!canToggle || loading}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${
        fav
          ? "border-amber-400/60 bg-amber-400/20 text-amber-200"
          : "border-white/15 bg-white/5 text-slate-300"
      } disabled:opacity-60`}
      aria-pressed={!!fav}
      title={fav ? "Remove favourite" : "Add to favourites"}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        {fav ? (
          <path
            d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
            fill="currentColor"
          />
        ) : (
          <path
            d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  );
}