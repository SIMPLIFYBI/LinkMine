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
        className="site-market-logo text-xl leading-none font-bold tracking-tight bg-clip-text text-transparent"
      >
        YouMine.
      </span>
      {/* Removed glowing gradient circle dot */}
    </Link>
  );
}