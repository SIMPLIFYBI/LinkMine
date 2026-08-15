"use client";

import Link from "next/link";
import { useId } from "react";

export default function VaultLogo({ className = "", neutralFill = "#090D12" }) {
  const vaultBlueId = useId();
  const youMineBlueId = useId();

  return (
    <Link
      href="/vault"
      aria-label="The Vault by YouMine"
      className={`select-none inline-flex items-center ${className}`}
    >
      <svg
        viewBox="0 0 1000 180"
        xmlns="http://www.w3.org/2000/svg"
        className="h-auto w-full"
        role="img"
        aria-label="The Vault by YouMine"
      >
        <defs>
          <linearGradient id={vaultBlueId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>

          <linearGradient id={youMineBlueId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>

        <text
          x="25"
          y="38"
          fill={neutralFill}
          fontFamily="Arial, sans-serif"
          fontSize="26"
          fontWeight="600"
        >
          The
        </text>

        <g transform="translate(25 55) scale(0.92) translate(-25 -55)">
          <path
            fill={neutralFill}
            d="
              M25 55
              L50 55
              L95 128
              L140 55
              L165 55
              L108 146
              C102 156 88 156 82 146
              Z
            "
          />

          <path
            fill={`url(#${vaultBlueId})`}
            d="
              M172 145
              L198 145
              L242 73
              L287 145
              L313 145
              L257 56
              C250 45 236 45 229 56
              Z
            "
          />

          <path
            fill={neutralFill}
            d="
              M330 55
              H353
              V111
              C353 130 365 141 391 141
              C417 141 429 130 429 111
              V55
              H452
              V113
              C452 148 429 163 391 163
              C353 163 330 148 330 113
              Z
            "
          />

          <path
            fill={neutralFill}
            d="
              M478 55
              H501
              V140
              H568
              V161
              H478
              Z
            "
          />

          <path
            fill={neutralFill}
            d="
              M590 55
              H700
              V76
              H657
              V161
              H633
              V76
              H590
              Z
            "
          />
        </g>

        <rect x="680" y="72" width="1.5" height="73" fill={neutralFill} opacity="0.7" />

        <text
          x="714"
          y="125"
          fill={neutralFill}
          fontFamily="Arial, sans-serif"
          fontSize="27"
          fontWeight="500"
        >
          by
        </text>

        <text
          x="756"
          y="125"
          fill={`url(#${youMineBlueId})`}
          fontFamily="Arial, sans-serif"
          fontSize="36"
          fontWeight="700"
          letterSpacing="-1.5"
        >
          YouMine.
        </text>
      </svg>
    </Link>
  );
}