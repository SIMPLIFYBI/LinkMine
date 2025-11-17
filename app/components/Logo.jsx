"use client";
import Link from "next/link";

export default function Logo({ className = "" }) {
  return (
    <Link
      href="/"
      aria-label="Home"
      className={`select-none inline-flex items-center ${className}`}
    >
      <span
        className="text-xl leading-none font-bold tracking-tight bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent"
      >
        YouMine
      </span>
      <span
        aria-hidden="true"
        className="
          ml-[2px]
          inline-block
          h-[0.55em] w-[0.55em]
          rounded-full
          bg-gradient-to-br from-sky-400 to-indigo-500
          shadow-[0_0_0_3px_rgba(255,255,255,0.05)]
          self-end
          translate-y-[1px]
        "
      />
    </Link>
  );
}