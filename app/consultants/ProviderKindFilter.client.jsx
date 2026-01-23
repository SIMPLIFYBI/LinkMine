"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const pill =
  "h-9 w-48 sm:w-56 rounded-xl bg-slate-800/60 border border-white/10 px-3 pr-9 text-sm text-slate-100 " +
  "backdrop-blur-md appearance-none transition " +
  "hover:border-sky-400/40 focus:outline-none focus:ring-2 focus:ring-sky-500/40";

const OPTIONS = [
  { value: "", label: "All provider types" },
  { value: "operational", label: "Operational Services" },
  { value: "professional", label: "Professional Services" },
  { value: "both", label: "Both" },
];

export default function ProviderKindFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("kind") || "");

  useEffect(() => {
    setValue(searchParams.get("kind") || "");
  }, [searchParams]);

  const pushParams = (kind) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (kind) params.set("kind", kind);
    else params.delete("kind");
    const href = `${pathname}${params.toString() ? `?${params}` : ""}`;
    router.push(href);
  };

  const onChange = (e) => {
    const v = e.target.value;
    setValue(v);
    pushParams(v);
  };

  return (
    <div className="relative">
      <select
        id="provider-kind-filter"
        value={value}
        onChange={onChange}
        className={pill}
        aria-label="Filter by provider type"
      >
        {OPTIONS.map((o) => (
          <option key={o.value || "all"} value={o.value} className="bg-slate-900">
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">▾</span>
    </div>
  );
}