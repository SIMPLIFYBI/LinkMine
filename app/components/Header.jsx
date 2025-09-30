"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import navTabs from "./navTabs";
import UserPill from "./UserPill";
import DirectoryTab from "@/app/components/directory/DirectoryTab";
import Logo from "@/app/components/Logo";

export default function Header() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 bg-slate-900/70 backdrop-blur border-b border-white/10">
      <div className="mx-auto max-w-screen-xl px-4 h-14 flex items-center justify-between">
        {/* Replace inline brand with reusable Logo */}
        <Logo className="select-none" />
        <nav className="flex items-center gap-1">
          <div className="hidden md:block">
            <DirectoryTab variant="desktop" />
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm">
            {navTabs.map((t) => {
              const active = pathname === t.href || pathname?.startsWith(t.href + "/");
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`rounded-full border px-3 py-2 transition
                    ${active
                      ? "border-sky-400/30 bg-sky-500/10 text-sky-200"
                      : "border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10"
                    }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
        </nav>
        <div className="flex items-center gap-2">
          <div className="block md:hidden">
            <DirectoryTab variant="mobile" />
          </div>
          <UserPill />
        </div>
      </div>
    </header>
  );
}

