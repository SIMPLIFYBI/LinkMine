"use client";
import Link from "next/link";

export default function Logo({ className = "", variant = "default" }) {
  const isSplitBoth = variant === "split-both";

  return (
    <Link
      href="/"
      aria-label="Home"
      className={`select-none inline-flex items-center ${className}`}
    >
      {isSplitBoth ? (
        <span className="text-xl leading-none font-bold tracking-tight">
          <span className="bg-[linear-gradient(90deg,#38bdf8_0%,#6366f1_100%)] bg-clip-text text-transparent">You</span>
          <span className="bg-[linear-gradient(90deg,#fbbf24_0%,#f97316_56%,#f43f5e_100%)] bg-clip-text text-transparent">Mine.</span>
        </span>
      ) : (
        <span
          className="site-market-logo text-xl leading-none font-bold tracking-tight bg-clip-text text-transparent"
        >
          YouMine.
        </span>
      )}
      {/* Removed glowing gradient circle dot */}
    </Link>
  );
}