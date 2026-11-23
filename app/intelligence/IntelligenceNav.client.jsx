"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { REPORTS } from "@/lib/intelligence/reports";

const REPORT_PATH = new RegExp(`^/intelligence/(${REPORTS.map((r) => r.slug).join("|")})(/|$)`);

const ITEMS = [
  { href: "/intelligence", label: "Discover", match: (p) => p === "/intelligence" },
  { href: "/intelligence/reports", label: "Reports", match: (p) => p.startsWith("/intelligence/reports") || REPORT_PATH.test(p) },
  { href: "/intelligence/data", label: "Data", match: (p) => p.startsWith("/intelligence/data") || p.startsWith("/intelligence/reserves") },
  { label: "Atlas", soon: true },
  { label: "My work", soon: true },
];

// Editorial tooling stays under /admin and only appears in the nav there.
const ADMIN_ITEMS = [
  { href: "/admin/intelligence/social", label: "Social", match: (p) => p.startsWith("/admin/intelligence/social") },
];

export default function IntelligenceNav({ admin = false }) {
  const pathname = usePathname() || "";
  const items = admin ? [...ITEMS.slice(0, 3), ...ADMIN_ITEMS, ...ITEMS.slice(3)] : ITEMS;
  return (
    <nav className="yi-nav" aria-label="Intelligence">
      <div className="yi-nav__in">
        <span className="yi-nav__brand">YouMine Intelligence</span>
        {items.map((item) =>
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
