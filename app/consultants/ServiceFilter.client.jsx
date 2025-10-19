"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ServiceFilter({ services = [], activeSlug = "" }) {
  const router = useRouter();
  const [value, setValue] = useState(activeSlug || "");

  useEffect(() => {
    setValue(activeSlug || "");
  }, [activeSlug]);

  const onChange = (e) => {
    const slug = e.target.value;
    setValue(slug);
    const href = slug ? `/consultants?service=${encodeURIComponent(slug)}` : "/consultants";
    router.push(href);
  };

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="service-filter" className="text-sm font-semibold text-slate-200">
        Filter by service
      </label>
      <div className="relative">
        <select
          id="service-filter"
          value={value}
          onChange={onChange}
          className="appearance-none rounded-full border border-white/15 bg-white/5 px-4 py-1.5 pr-9 text-sm text-slate-100 hover:border-sky-300/60 hover:bg-sky-500/10 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
        >
          <option value="" className="bg-slate-900">All services</option>
          {services.map((s) => (
            <option key={s.id} value={s.slug} className="bg-slate-900">
              {s.name}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-300">
          ▾
        </span>
      </div>
      {value && (
        <button
          type="button"
          onClick={() => router.push("/consultants")}
          className="text-xs text-sky-300 hover:text-sky-200"
        >
          Clear
        </button>
      )}
    </div>
  );
}