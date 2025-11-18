"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function AddProfileSmartCTA({ className = "" }) {
  const [href, setHref] = useState("/signup"); // default to signup until we know
  const [label] = useState("Add your profile");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        if (data?.user) {
          setHref("/consultants/new");
        } else {
          setHref("/signup");
        }
      } catch {
        // leave default /signup
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Link
      href={href}
      prefetch
      className={`inline-flex items-center rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:from-sky-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 ${className}`}
      aria-label="Add your profile"
    >
      {label}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="ml-2 h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12h14" />
        <path d="M13 5l7 7-7 7" />
      </svg>
    </Link>
  );
}