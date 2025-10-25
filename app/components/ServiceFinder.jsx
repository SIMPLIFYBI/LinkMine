"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function ServiceFinder({ className = "" }) {
  const router = useRouter();
  const sb = supabaseBrowser();
  const [loading, setLoading] = useState(true);
  const [cats, setCats] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data, error } = await sb
        .from("service_categories_with_children")
        .select("*")
        .order("position", { ascending: true });
      if (!mounted) return;
      if (!error) {
        const categories = (data || []).map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          services: Array.isArray(c.services)
            ? c.services.map((s) => ({ id: s.id, name: s.name, slug: s.slug }))
            : [],
        }));
        setCats(categories);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []); // eslint-disable-line

  const onSelect = (e) => {
    const slug = e.target.value;
    if (!slug) return;
    router.push(`/consultants?service=${encodeURIComponent(slug)}`);
  };

  return (
    <div className={className}>
      <p className="mb-2 text-sm font-semibold text-slate-200">
        Find a consultant by service category
      </p>
      <div className="rounded-2xl border border-white/15 bg-white/10 p-3 shadow-lg backdrop-blur-md ring-1 ring-white/10">
        <label className="block text-xs uppercase tracking-wide text-slate-300">
          Select a service
        </label>
        <select
          onChange={onSelect}
          disabled={loading}
          className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 focus:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-400/30 disabled:opacity-60"
          defaultValue=""
        >
          <option value="" disabled>
            {loading ? "Loading services..." : "Choose a service"}
          </option>
          {cats.map((c) => (
            <optgroup key={c.id} label={c.name}>
              {c.services.map((s) => (
                <option key={s.id} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    </div>
  );
}