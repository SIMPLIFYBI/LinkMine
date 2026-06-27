"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { COUNTRY_OPTIONS } from "@/lib/geoOptions";

const pill =
  "h-9 w-48 sm:w-56 rounded-xl bg-slate-800/60 border border-white/10 px-3 pr-9 text-sm text-slate-100 " +
  "backdrop-blur-md appearance-none transition " +
  "hover:border-sky-400/40 focus:outline-none focus:ring-2 focus:ring-sky-500/40";

export default function CountryFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("country") || "");

  useEffect(() => {
    setValue(searchParams.get("country") || "");
  }, [searchParams]);

  const onChange = (event) => {
    const nextValue = event.target.value;
    setValue(nextValue);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (nextValue) params.set("country", nextValue);
    else params.delete("country");
    const href = `${pathname}${params.toString() ? `?${params}` : ""}`;
    router.push(href);
  };

  return (
    <div className="relative">
      <select
        id="country-filter"
        value={value}
        onChange={onChange}
        className={pill}
        aria-label="Filter by country"
      >
        <option value="" className="bg-slate-900">
          All countries
        </option>
        {COUNTRY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value} className="bg-slate-900">
            {option.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">▾</span>
    </div>
  );
}