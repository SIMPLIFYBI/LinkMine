"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin/intelligence", label: "Discover", match: (p) => p === "/admin/intelligence" },
  { href: "/admin/intelligence/reports", label: "Reports", match: (p) => p.startsWith("/admin/intelligence/reports") || /\/admin\/intelligence\/(energy-flip|peak-was-yesterday|reserve-report)/.test(p) },
  { href: "/admin/intelligence/data", label: "Data", match: (p) => p.startsWith("/admin/intelligence/data") || p.startsWith("/admin/intelligence/reserves") },
  { label: "Atlas", soon: true },
  { label: "My work", soon: true },
];

export default function IntelligenceNav() {
  const pathname = usePathname() || "";
  return (
    <nav className="yi-nav" aria-label="Intelligence">
      <div className="yi-nav__in">
        <span className="yi-nav__brand">YouMine Intelligence</span>
        {ITEMS.map((item) =>
          item.soon ? (
            <span key={item.label} className="is-soon">
              {item.label}
              <small>soon</small>
            </span>
          ) : (
            <Link key={item.href} href={item.href} aria-current={item.match(pathname) ? "page" : undefined}>
              {item.label}
            </Link>
          )
        )}
      </div>
    </nav>
  );
}
