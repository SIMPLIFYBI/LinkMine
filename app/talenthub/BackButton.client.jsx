"use client";

import { useRouter } from "next/navigation";

export default function BackButton({ href = "/talenthub", children = "Back" }) {
  const router = useRouter();

  function goBack() {
    router.push(href);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-200 hover:bg-white/[0.07]"
    >
      <LeftArrow />
      {children}
    </button>
  );
}

function LeftArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" className="opacity-90">
      <path fill="currentColor" d="M5 10l5-5v3h5v4h-5v3z" />
    </svg>
  );
}