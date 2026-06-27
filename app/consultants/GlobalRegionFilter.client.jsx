"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { GLOBAL_REGION_OPTIONS } from "@/lib/geoOptions";

const pill =
  "h-9 w-48 sm:w-56 rounded-xl bg-slate-800/60 border border-white/10 px-3 pr-9 text-sm text-slate-100 " +
  "backdrop-blur-md appearance-none transition " +
  "hover:border-sky-400/40 focus:outline-none focus:ring-2 focus:ring-sky-500/40";

export default function GlobalRegionFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("region") || "");

  useEffect(() => {
    setValue(searchParams.get("region") || "");
  }, [searchParams]);

  const onChange = (event) => {
    const nextValue = event.target.value;
    setValue(nextValue);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (nextValue) params.set("region", nextValue);
    else params.delete("region");
    const href = `${pathname}${params.toString() ? `?${params}` : ""}`;
    router.push(href);
  };

  return (
    <div className="relative">
      <select
        id="global-region-filter"
        value={value}
        onChange={onChange}
        className={pill}
        aria-label="Filter by global region"
      >
        <option value="" className="bg-slate-900">
          All regions
        </option>
        {GLOBAL_REGION_OPTIONS.map((option) => (
          <option key={option.value} value={option.value} className="bg-slate-900">
            {option.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">▾</span>
    </div>
  );
}