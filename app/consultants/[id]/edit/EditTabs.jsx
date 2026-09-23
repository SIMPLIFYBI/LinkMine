import Link from "next/link";

export default function EditTabs({ consultantId, active = "profile" }) {
  const tabs = [
    { key: "profile", label: "Profile", href: `/consultants/${consultantId}/edit` },
    { key: "workspace", label: "Workspace", href: `/consultants/${consultantId}/workspace/edit` },
    { key: "portfolio", label: "Portfolio", href: `/consultants/${consultantId}/portfolio/edit` },
    { key: "resources", label: "My Resources", href: `/consultants/${consultantId}/resources/edit` },
  ];

  return (
    <div className="my-5 overflow-x-auto sm:my-6">
      <nav
        aria-label="Edit profile sections"
        className="min-w-max rounded-2xl border border-white/10 bg-slate-950/35 p-1.5 ring-1 ring-white/5"
      >
        <div className="flex gap-1">
      {tabs.map((t) => {
        const isActive = active === t.key;
        return (
          <Link
            key={t.key}
            href={t.href}
            prefetch
            aria-current={isActive ? "page" : undefined}
            className={`relative rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              isActive
                ? "bg-sky-400/15 text-sky-100 shadow-[inset_0_0_0_1px_rgba(125,211,252,0.25)]"
                : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <span>{t.label}</span>
          </Link>
        );
      })}
        </div>
      </nav>
    </div>
  );
}