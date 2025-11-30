"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function NameSearch({ initialValue = "", onApplied }) {
  const [value, setValue] = useState(initialValue || "");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function apply(e) {
    e?.preventDefault?.();
    const params = new URLSearchParams(searchParams?.toString() || "");
    const q = value.trim();
    if (q) params.set("q", q);
    else params.delete("q");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    onApplied?.(); // close sheet
  }

  return (
    <form onSubmit={apply} className="flex items-center gap-2">
      <div className="relative">
        <input
          type="text"
          aria-label="Search by name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search by name"
          className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-400"
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
        className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500"
      >
        Search
      </button>
    </form>
  );
}