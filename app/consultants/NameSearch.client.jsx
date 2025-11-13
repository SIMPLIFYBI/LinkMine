"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

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
    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }
    const href = `${pathname}${params.toString() ? `?${params}` : ""}`;
    router.push(href);
  };

  const onSubmit = (event) => {
    event.preventDefault();
    pushSearch(value.trim());
  };

  const clear = () => {
    setValue("");
    pushSearch("");
  };

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <label htmlFor="consultant-search" className="text-sm font-semibold text-slate-200">
        Search by name
      </label>
      <input
        id="consultant-search"
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="e.g. Pit Slope Consulting"
        className="w-48 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
      />
      <button
        type="submit"
        className="rounded-full bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500"
      >
        Search
      </button>
      {(initialValue || value) && (
        <button type="button" onClick={clear} className="text-xs text-sky-300 hover:text-sky-200">
          Clear
        </button>
      )}
    </form>
  );
}