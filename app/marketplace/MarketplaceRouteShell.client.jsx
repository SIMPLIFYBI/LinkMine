"use client";

import { useMemo, useState } from "react";

function classNames(parts) {
  return parts.filter(Boolean).join(" ");
}

function MarketplaceNavIcon({ name, active }) {
  const stroke = active ? "currentColor" : "rgba(148,163,184,0.95)";

  if (name === "discover") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke={stroke} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M6.5 10.5V20h11V10.5" />
      </svg>
    );
  }

  if (name === "submit") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke={stroke} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="5" width="16" height="14" rx="2.5" />
        <path d="M8 9h8" />
        <path d="M8 13h5" />
        <path d="M15.5 15.5v-4" />
        <path d="M13.5 13.5h4" />
      </svg>
    );
  }

  if (name === "requests") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke={stroke} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 8h10" />
        <path d="M7 12h7" />
        <path d="M7 16h6" />
        <path d="M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-4 3v-5H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      </svg>
    );
  }

  if (name === "review") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke={stroke} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 12 2 2 4-5" />
        <path d="M12 3l7 3v5c0 5-3.4 8.4-7 10-3.6-1.6-7-5-7-10V6l7-3Z" />
      </svg>
    );
  }

  if (name === "library") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke={stroke} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5.5 5.5h3v13h-3z" />
        <path d="M10.5 4.5h3v14h-3z" />
        <path d="m16.5 6 2.5-.5 1.5 12.5-2.5.5z" />
      </svg>
    );
  }

  if (name === "orders") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke={stroke} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7.5h16" />
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="M7 15h4" />
        <path d="M15 15h2" />
      </svg>
    );
  }

  return null;
}

function SidebarTabButton({ active, label, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group relative flex w-full flex-col items-center justify-center gap-1 rounded-[15px] border px-1 py-2 text-center transition",
        active
          ? "border-slate-200/80 bg-white text-sky-600 shadow-[0_18px_45px_-34px_rgba(255,255,255,0.95)]"
          : "border-transparent bg-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.05] hover:text-white",
      ].join(" ")}
    >
      <span
        className={[
          "absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full transition",
          active ? "bg-sky-500 opacity-100" : "bg-transparent opacity-0 group-hover:opacity-40",
        ].join(" ")}
      />
      <span className={["flex h-9 w-9 items-center justify-center rounded-[13px] border transition", active ? "border-sky-100 bg-sky-50" : "border-white/10 bg-white/[0.04] group-hover:border-white/20 group-hover:bg-white/[0.08]"].join(" ")}>
        <MarketplaceNavIcon name={icon} active={active} />
      </span>
      <span className={`text-[9px] font-medium leading-[1.05] ${active ? "text-slate-700" : "text-slate-400 group-hover:text-slate-200"}`}>{label}</span>
    </button>
  );
}

function MobileSidebarTabButton({ active, label, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames([
        "group flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition",
        active
          ? "border-sky-300/45 bg-white text-slate-950 shadow-[0_14px_34px_-22px_rgba(255,255,255,0.85)]"
          : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.08] hover:text-white",
      ])}
    >
      {icon ? (
        <span className="inline-flex h-4.5 w-4.5 items-center justify-center">
          <MarketplaceNavIcon name={icon} active={active} />
        </span>
      ) : null}
      <span className="text-[13px] font-semibold leading-none">{label}</span>
    </button>
  );
}

export default function MarketplaceRouteShell({ children, signedIn = false, isAdmin = false, activeKey = "account" }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const tabs = useMemo(() => {
    if (!signedIn) {
      return [
        { key: "discover", label: "Home", icon: "discover", group: "primary", href: "/vault" },
        { key: "all-resources", label: "All Resources", icon: "orders", group: "primary", href: "/vault/resources" },
      ];
    }

    const baseTabs = [
      { key: "discover", label: "Home", icon: "discover", group: "primary", href: "/vault" },
      { key: "all-resources", label: "All Resources", icon: "orders", group: "primary", href: "/vault/resources" },
      { key: "submit", label: "Submit", icon: "submit", group: "primary", href: "/vault/submit" },
      { key: "requests", label: "Requests", icon: "requests", group: "primary", href: "/vault/requests" },
      { key: "account", label: "My Vault", icon: "library", group: "secondary", href: "/vault/account" },
    ];

    if (isAdmin) {
      baseTabs.push({ key: "admin", label: "Admin", icon: "review", group: "secondary", href: "/vault/admin" });
    }

    return baseTabs.map((tab) => ({ ...tab, active: tab.key === activeKey }));
  }, [activeKey, isAdmin, signedIn]);

  const primaryTabs = tabs.filter((tab) => tab.group === "primary");
  const secondaryTabs = tabs.filter((tab) => tab.group === "secondary");

  return (
    <main className="w-full px-0 py-0 lg:min-h-[calc(100vh-8rem)]">
      <div className="lg:flex lg:items-start">
        <aside className="hidden lg:block lg:w-[72px] lg:flex-none lg:self-stretch lg:border-r lg:border-white/10 lg:bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(15,23,42,0.9))] xl:w-20">
          <div className="sticky top-[88px] flex h-[calc(100vh-104px)] flex-col px-1.5 py-3.5 shadow-[20px_0_60px_-45px_rgba(0,0,0,0.9)]">
            <div className="flex justify-center pb-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-[13px] border border-white/10 bg-white/[0.06] text-[9px] font-semibold uppercase tracking-[0.16em] text-white">
                LM
              </div>
            </div>

            <div className="space-y-1 border-t border-white/10 pt-3.5">
              {primaryTabs.map((tab) => (
                <SidebarTabButton
                  key={tab.key}
                  active={Boolean(tab.active)}
                  label={tab.label}
                  icon={tab.icon}
                  onClick={() => window.location.assign(tab.href)}
                />
              ))}
            </div>

            <div className="mt-auto space-y-1 border-t border-white/10 pt-3.5">
              {secondaryTabs.map((tab) => (
                <SidebarTabButton
                  key={tab.key}
                  active={Boolean(tab.active)}
                  label={tab.label}
                  icon={tab.icon}
                  onClick={() => window.location.assign(tab.href)}
                />
              ))}
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 px-4 pb-6 pt-0 sm:px-6 sm:pb-6 sm:pt-0 lg:px-6 lg:py-7 xl:px-8">
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setMobileNavOpen((current) => !current)}
              className="fixed left-3 top-[72px] z-40 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-slate-900/75 text-slate-100 shadow-[0_18px_38px_-22px_rgba(0,0,0,0.75)] backdrop-blur-md"
              aria-label={mobileNavOpen ? "Collapse vault navigation" : "Expand vault navigation"}
            >
              {mobileNavOpen ? (
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 6 9 12l6 6" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </svg>
              )}
            </button>

            {mobileNavOpen ? (
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="fixed inset-0 z-30 bg-black/45"
                aria-label="Close vault navigation"
              />
            ) : null}

            <aside
              className={[
                "fixed bottom-0 left-0 top-[56px] z-40 w-[248px] border-r border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.98),rgba(2,6,23,0.92))] px-3 pb-4 pt-3 shadow-[24px_0_56px_-30px_rgba(0,0,0,0.92)] backdrop-blur-xl transition-transform duration-300",
                mobileNavOpen ? "translate-x-0" : "-translate-x-full",
              ].join(" ")}
            >
              <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">Vault</div>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-200"
                  aria-label="Collapse vault navigation"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 6 9 12l6 6" />
                  </svg>
                </button>
              </div>

              <div className="space-y-1.5">
                {tabs.map((tab) => (
                  <MobileSidebarTabButton
                    key={tab.key}
                    active={Boolean(tab.active)}
                    label={tab.label}
                    icon={tab.icon}
                    onClick={() => {
                      setMobileNavOpen(false);
                      window.location.assign(tab.href);
                    }}
                  />
                ))}
              </div>
            </aside>
          </div>

          {children}
        </div>
      </div>
    </main>
  );
}
