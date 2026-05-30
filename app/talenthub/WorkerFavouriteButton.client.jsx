"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function WorkerFavouriteButton({ workerId, className = "" }) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [fav, setFav] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadFavourite() {
      const { data: auth } = await sb.auth.getUser();
      const userId = auth?.user?.id || null;

      if (!mounted) return;
      if (!userId) {
        setFav(false);
        return;
      }

      try {
        const response = await fetch(`/api/workers/${workerId}/favourite`, {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });

        if (!response.ok) {
          setFav(false);
          return;
        }

        const json = await response.json();
        if (!mounted) return;
        setFav(Boolean(json?.favourite));
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("worker-favourite-changed", {
              detail: { workerId, favourite: Boolean(json?.favourite) },
            })
          );
        }
      } catch {
        if (!mounted) return;
        setFav(false);
      }
    }

    loadFavourite();

    return () => {
      mounted = false;
    };
  }, [sb, workerId]);

  async function toggle(event) {
    event.stopPropagation();
    if (loading || fav === null) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/workers/${workerId}/favourite`, {
        method: fav ? "DELETE" : "POST",
        credentials: "same-origin",
      });

      if (response.ok) {
        setFav((current) => {
          const next = !current;
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("worker-favourite-changed", {
                detail: { workerId, favourite: next },
              })
            );
          }
          return next;
        });
      }
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event) {
    event.stopPropagation();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      onKeyDown={handleKeyDown}
      disabled={fav === null || loading}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
        fav
          ? "border-amber-400/60 bg-amber-400/20 text-amber-200"
          : "border-white/12 bg-white/[0.06] text-slate-200 hover:bg-white/[0.12]"
      } disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      aria-pressed={Boolean(fav)}
      aria-label={fav ? "Remove favourite" : "Add to favourites"}
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