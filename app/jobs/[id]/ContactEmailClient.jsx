"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function ContactEmailClient({ email, jobId, initialIsLoggedIn = false }) {
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(initialIsLoggedIn));

  useEffect(() => {
    let active = true;
    const sb = supabaseBrowser();
    sb.auth.getSession().then(({ data }) => {
      if (!active) return;
      setIsLoggedIn(Boolean(data?.session));
    });
    return () => {
      active = false;
    };
  }, []);

  if (!email) return null;

  if (isLoggedIn) {
    return (
      <p className="text-sm text-slate-300">
        Interested? Reach out at{" "}
        <a href={`mailto:${email}`} className="font-semibold text-sky-300 hover:text-sky-200">
          {email}
        </a>
        .
      </p>
    );
  }

  const redirect = encodeURIComponent(`/jobs/${jobId}`);
  return (
    <div className="space-y-2 text-sm text-slate-300">
      <div className="inline-flex items-center gap-2">
        <span className="rounded bg-slate-900/80 px-3 py-1 font-semibold text-slate-100/70 blur-sm select-none">
          {email}
        </span>
        <span className="text-xs text-slate-400 uppercase tracking-wide">Hidden</span>
      </div>
      <p>
        Log in or{" "}
        <Link href={`/signup?redirect=${redirect}`} className="font-semibold text-sky-300 hover:text-sky-200">
          create an account
        </Link>{" "}
        (free) to view contact details.{" "}
        <Link href={`/login?redirect=${redirect}`} className="font-semibold text-sky-300 hover:text-sky-200">
          Log in
        </Link>
        .
      </p>
    </div>
  );
}