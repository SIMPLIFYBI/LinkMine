export const INTELLIGENCE_NAV_BRAND = "YouMine Intelligence";

export const INTELLIGENCE_NAV_ITEMS = [
  { href: "/intelligence", label: "Discover", match: (p) => p === "/intelligence" },
  { href: "/intelligence/reports", label: "Reports", match: (p) => p === "/intelligence/reports" },
  { href: "/intelligence/data", label: "Custom Charts", match: (p) => p.startsWith("/intelligence/data") || p.startsWith("/intelligence/reserves") },
  { href: "/intelligence/sources", label: "Data", match: (p) => p === "/intelligence/sources" },
];
