import Link from "next/link";

export default function EditTabs({ consultantId, active = "profile" }) {
  const tabs = [
    { key: "profile", label: "Profile", href: `/consultants/${consultantId}/edit` },
    { key: "portfolio", label: "Portfolio", href: `/consultants/${consultantId}/portfolio/edit` },
  ];
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {tabs.map((t) => {
        const isActive = active === t.key;
        return (
          <Link
            key={t.key}
            href={t.href}
            prefetch
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              isActive
                ? "border-sky-400/40 bg-sky-500/15 text-sky-100"
                : "border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}