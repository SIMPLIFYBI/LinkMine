"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

function hrefWithTab(pathname, searchParams, tab) {
  const params = new URLSearchParams(searchParams?.toString() || "");
  params.set("tab", tab);
  return `${pathname}?${params.toString()}`;
}

export default function Tabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = (searchParams.get("tab") || "dashboard").toLowerCase();

  const tabs = [
    { key: "dashboard", label: "Dashboard" },
    { key: "review", label: "Review" },
    { key: "in-progress", label: "Consultants" }, // renamed
  ];

  return (
    <div className="border-b border-white/10">
      <nav className="flex gap-4">
        {tabs.map((t) => {
          const isActive = active === t.key;
          return (
            <Link
              key={t.key}
              href={hrefWithTab(pathname, searchParams, t.key)}
              className={[
                "px-3 py-2 text-sm transition-colors",
                isActive
                  ? "text-white border-b-2 border-white"
                  : "text-slate-400 hover:text-white",
              ].join(" ")}
              scroll={false}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
