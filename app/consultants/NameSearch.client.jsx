"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const inputClass =
  "h-9 w-56 sm:w-64 rounded-xl bg-slate-800/60 border border-white/10 px-3 text-sm text-slate-100 " +
  "placeholder:text-slate-400 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-sky-500/40 " +
  "hover:border-sky-400/40 transition";

export default function NameSearch({ initialValue = "" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const pushSearch = (query) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (query) params.set("q", query);
    else params.delete("q");
    const href = `${pathname}${params.toString() ? `?${params}` : ""}`;
    router.push(href);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    pushSearch(value.trim());
  };

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <div className="relative">
        <input
          type="text"
          aria-label="Search by name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search by name"
          className={inputClass}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              setValue("");
              pushSearch("");
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-sky-300 hover:text-sky-200"
          >
            ✕
          </button>
        )}
      </div>
      <button
        type="submit"
        className="h-9 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 text-xs font-semibold text-white shadow-sm hover:from-sky-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
      >
        Search
      </button>
    </form>
  );
}