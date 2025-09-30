"use client";
import Link from "next/link";

export default function Logo({ className = "" }) {
  return (
    <Link href="/" aria-label="Home" className={`select-none ${className}`}>
      <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent">
        YouMine
      </span>
    </Link>
  );
}