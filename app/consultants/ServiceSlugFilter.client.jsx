"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const pill =
  "h-9 w-48 sm:w-56 rounded-xl bg-slate-800/60 border border-white/10 px-3 pr-9 text-sm text-slate-100 " +
  "backdrop-blur-md appearance-none transition " +
  "hover:border-sky-400/40 focus:outline-none focus:ring-2 focus:ring-sky-500/40";

export default function ServiceSlugFilter({ services = [], activeSlug = "" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(activeSlug || "");

  useEffect(() => {
    setValue(activeSlug || "");
  }, [activeSlug]);

  const pushParams = (slug) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (slug) {
      params.set("service", slug);
      params.delete("category"); // service overrides category
    } else {
      params.delete("service");
    }
    const href = `${pathname}${params.toString() ? `?${params}` : ""}`;
    router.push(href);
  };

  const onChange = (e) => {
    const slug = e.target.value;
    setValue(slug);
    pushParams(slug);
  };

  return (
    <div className="relative">
      <select
        id="service-filter"
        value={value}
        onChange={onChange}
        className={pill}
        aria-label="Filter by service"
      >
        <option value="" className="bg-slate-900">
          All services
        </option>
        {services
          .filter((s) => s?.slug)
          .map((s) => (
            <option key={s.id} value={s.slug} className="bg-slate-900">
              {s.name || s.slug}
            </option>
          ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">▾</span>
    </div>
  );
}