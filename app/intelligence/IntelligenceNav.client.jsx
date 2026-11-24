"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/intelligence", label: "Discover", match: (p) => p === "/intelligence" },
  { href: "/intelligence/reports", label: "Reports", match: (p) => p === "/intelligence/reports" },
  { href: "/intelligence/data", label: "Custom Charts", match: (p) => p.startsWith("/intelligence/data") || p.startsWith("/intelligence/reserves") },
  { href: "/intelligence/sources", label: "Data", match: (p) => p === "/intelligence/sources" },
];

// Editorial tooling stays under /admin and only appears in the nav there.
const ADMIN_ITEMS = [
  { href: "/admin/intelligence/social", label: "Social", match: (p) => p.startsWith("/admin/intelligence/social") },
];

export default function IntelligenceNav({ admin = false }) {
  const pathname = usePathname() || "";
  const items = admin ? [...ITEMS, ...ADMIN_ITEMS] : ITEMS;
  return (
    <nav className="yi-nav" aria-label="Intelligence">
      <div className="yi-nav__in">
        <span className="yi-nav__brand">YouMine Intelligence</span>
        {items.map((item) => (
          <Link key={item.href} href={item.href} aria-current={item.match(pathname) ? "page" : undefined}>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
