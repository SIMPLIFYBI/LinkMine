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
        YouMine.
      </span>
      {/* Removed glowing gradient circle dot */}
    </Link>
  );
}