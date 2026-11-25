"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { INTELLIGENCE_NAV_BRAND, INTELLIGENCE_NAV_ITEMS } from "@/lib/intelligence/navigation";

// Editorial tooling stays under /admin and only appears in the nav there.
const ADMIN_ITEMS = [
  { href: "/admin/intelligence/social", label: "Social", match: (p) => p.startsWith("/admin/intelligence/social") },
];

export default function IntelligenceNav({ admin = false }) {
  const pathname = usePathname() || "";
  const items = admin ? [...INTELLIGENCE_NAV_ITEMS, ...ADMIN_ITEMS] : INTELLIGENCE_NAV_ITEMS;
  return (
    <nav className="yi-nav" aria-label="Intelligence">
      <div className="yi-nav__in">
        <span className="yi-nav__brand">{INTELLIGENCE_NAV_BRAND}</span>
        {items.map((item) => (
          <Link key={item.href} href={item.href} aria-current={item.match(pathname) ? "page" : undefined}>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
