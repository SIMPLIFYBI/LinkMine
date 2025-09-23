"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function FilterBar() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") || "");
  const [loc, setLoc] = useState(sp.get("loc") || "");

  useEffect(() => {
    setQ(sp.get("q") || "");
    setLoc(sp.get("loc") || "");
  }, [sp]);

  function apply() {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (loc.trim()) p.set("loc", loc.trim());
    router.push(`/listings${p.toString() ? "?" + p.toString() : ""}`);
  }

  function reset() {
    setQ(""); setLoc("");
    router.push("/listings");
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 md:p-4 flex flex-col md:flex-row gap-2 md:items-center">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search title or description"
        className="w-full rounded-md bg-slate-900/60 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
      />
      <input
        value={loc}
        onChange={(e) => setLoc(e.target.value)}
        placeholder="Location"
        className="w-full md:w-48 rounded-md bg-slate-900/60 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40"
      />
      <div className="flex gap-2">
        <button onClick={apply} className="rounded-md bg-gradient-to-r from-sky-600 to-indigo-600 px-3 py-2 text-sm font-medium">
          Apply
        </button>
        <button onClick={reset} className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm">
          Reset
        </button>
      </div>
    </div>
  );
}