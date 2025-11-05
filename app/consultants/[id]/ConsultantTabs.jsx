import Link from "next/link";

export default function ConsultantTabs({ consultantId, active = "profile" }) {
  const tabs = [
    { key: "profile", label: "Profile", href: `/consultants/${consultantId}` },
    { key: "portfolio", label: "Portfolio", href: `/consultants/${consultantId}/portfolio` },
  ];

  return (
    <nav
      aria-label="Consultant sections"
      className="mb-4 flex gap-3 overflow-x-auto rounded-full border border-white/10 bg-white/[0.04] p-1 text-sm text-slate-100"
    >
      {tabs.map((t) => {
        const isActive = active === t.key;
        return (
          <Link
            key={t.key}
            href={t.href}
            prefetch
            className={`flex-1 whitespace-nowrap rounded-full px-4 py-2 font-semibold transition ${
              isActive
                ? "bg-sky-500 text-slate-900 shadow"
                : "text-slate-300 hover:bg-white/5"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}