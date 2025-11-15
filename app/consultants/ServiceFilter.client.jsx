"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const pill =
  "h-9 w-48 sm:w-56 rounded-xl bg-slate-800/60 border border-white/10 px-3 pr-9 text-sm text-slate-100 " +
  "backdrop-blur-md appearance-none transition " +
  "hover:border-sky-400/40 focus:outline-none focus:ring-2 focus:ring-sky-500/40";

export default function ServiceFilter({ categories = [], activeSlug = "" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [value, setValue] = useState(activeSlug || "");

  useEffect(() => {
    setValue(activeSlug || "");
  }, [activeSlug]);

  const onChange = (e) => {
    const slug = e.target.value;
    setValue(slug);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    params.delete("service"); // category selection clears any service
    if (slug) params.set("category", slug);
    else params.delete("category");
    const href = `${pathname}${params.toString() ? `?${params}` : ""}`;
    router.push(href);
  };

  return (
    <div className="relative">
      <select
        id="category-filter"
        value={value}
        onChange={onChange}
        className={pill}
        aria-label="Filter by category"
      >
        <option value="" className="bg-slate-900">
          All categories
        </option>
        {categories.map((c) => (
          <option key={c.id} value={c.slug} className="bg-slate-900">
            {c.name}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">▾</span>
    </div>
  );
}