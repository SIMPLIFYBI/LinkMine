"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "../../lib/supabaseBrowser";

export default function UserPill() {
  const [email, setEmail] = useState(null);

  useEffect(() => {
    const sb = supabaseBrowser();
    let mounted = true;

    sb.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setEmail(data?.user?.email ?? null);
    });

    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  const href = email ? "/account" : "/login";
  const label = email || "Log in";
  const initial = (email?.[0] || "•").toUpperCase();
  const hideLabelOnMobile = !!email; // only hide when logged in

  return (
    <Link
      href={href}
      className={`
        inline-flex items-center gap-2 rounded-full
        border border-white/10 bg-white/5
        ${hideLabelOnMobile ? "px-2 py-1.5 sm:px-3" : "px-3 py-1.5"}
        text-sm text-slate-200 hover:border-white/20 hover:bg-white/10 transition
      `}
      aria-label={email ? `Account (${email})` : "Log in"}
    >
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-full
                   bg-gradient-to-br from-sky-500 to-indigo-500 text-white ring-1 ring-white/20
                   text-xs font-semibold"
        aria-hidden="true"
      >
        {initial}
      </span>
      <span
        className={`
          max-w-[160px] truncate
          ${hideLabelOnMobile ? "hidden sm:inline" : "inline"}
        `}
        {...(hideLabelOnMobile ? { 'aria-hidden': true } : {})}
      >
        {label}
      </span>
    </Link>
  );
}