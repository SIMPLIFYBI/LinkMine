"use client";

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import navTabs from "./navTabs";
import UserPill from "./UserPill";
import Logo from "@/app/components/Logo";
import { useTheme } from "@/app/components/ThemeProvider";

export default function Header() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <header className="sticky top-0 z-40 pt-[env(safe-area-inset-top)]">
      <div
        className={isLight
          ? "border-b border-slate-200/80 bg-white/78 backdrop-blur-xl shadow-[0_1px_0_0_rgba(148,163,184,0.18)]"
          : "border-b border-white/10 bg-slate-950/60 backdrop-blur-xl shadow-[0_1px_0_0_rgba(255,255,255,0.06)]"}
      >
        <div className="mx-auto flex h-14 max-w-screen-xl items-center gap-3 px-4">
          {/* Left */}
          <div className="flex min-w-0 items-center">
            <Logo className="select-none" />
          </div>

          {/* Center (desktop) */}
          <nav className="hidden md:flex flex-1 items-center justify-center gap-6">
            {(navTabs ?? []).map((t) => {
              const active = pathname === t.href || pathname?.startsWith(t.href + "/");

              return (
                <Link
                  key={t.href}
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "relative text-sm font-medium tracking-tight transition-colors",
                    isLight ? "text-slate-600 hover:text-slate-950" : "text-slate-300 hover:text-white",
                    active ? (isLight ? "text-slate-950" : "text-white") : "",
                    // underline accent
                    active
                      ? "after:absolute after:left-0 after:right-0 after:-bottom-2 after:h-px after:bg-gradient-to-r after:from-sky-400 after:to-indigo-400 after:opacity-100"
                      : "after:absolute after:left-0 after:right-0 after:-bottom-2 after:h-px after:bg-white/0 after:opacity-0 hover:after:bg-white/20 hover:after:opacity-100",
                  ].join(" ")}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>

          {/* Right */}
          <div className="ml-auto flex items-center">
            <UserPill />
          </div>
        </div>
      </div>
    </header>
  );
}

