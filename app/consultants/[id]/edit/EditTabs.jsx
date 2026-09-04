import Link from "next/link";

export default function EditTabs({ consultantId, active = "profile" }) {
  const tabs = [
    { key: "profile", label: "Profile", href: `/consultants/${consultantId}/edit` },
    { key: "portfolio", label: "Portfolio", href: `/consultants/${consultantId}/portfolio/edit` },
    { key: "resources", label: "My Resources", href: `/consultants/${consultantId}/resources/edit` },
  ];

  return (
    <div className="mb-6 overflow-x-auto">
      <nav
        aria-label="Edit profile sections"
        className="min-w-max border-b border-white/10"
      >
        <div className="flex items-end gap-1">
      {tabs.map((t) => {
        const isActive = active === t.key;
        return (
          <Link
            key={t.key}
            href={t.href}
            prefetch
            aria-current={isActive ? "page" : undefined}
            className={`relative -mb-px px-4 py-2.5 text-sm font-medium transition ${
              isActive
                ? "text-sky-200"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <span>{t.label}</span>
            <span
              className={`pointer-events-none absolute inset-x-2 bottom-0 h-0.5 rounded-full transition ${
                isActive ? "bg-sky-300 shadow-[0_0_18px_rgba(56,189,248,0.85)]" : "bg-transparent"
              }`}
              aria-hidden="true"
            />
          </Link>
        );
      })}
        </div>
      </nav>
    </div>
  );
}