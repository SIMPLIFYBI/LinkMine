"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

/**
 * Animated sliding highlight between tabs.
 * NOTE: Because each tab navigates to a new route, we show the slide
 * before pushing the route (tiny delay). Remove setTimeout if you
 * prefer instant navigation without seeing the movement.
 */
export default function ConsultantTabs({ consultantId, active = "profile" }) {
  const router = useRouter();
  const tabs = [
    { key: "profile", label: "Profile", href: `/consultants/${consultantId}` },
    { key: "portfolio", label: "Portfolio", href: `/consultants/${consultantId}/portfolio` },
  ];

  // Local state to animate from current to next before route change
  const [current, setCurrent] = useState(active);
  const [isAnimating, setIsAnimating] = useState(false);
  const navRef = useRef(null);

  // Sync when route loads
  useEffect(() => {
    setCurrent(active);
    setIsAnimating(false);
  }, [active]);

  function handleClick(e, tab) {
    // Allow ctrl/cmd/middle clicks to open in new tab
    if (
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      e.button === 1 ||
      tab.key === current
    ) {
      return;
    }
    e.preventDefault();
    setCurrent(tab.key);
    setIsAnimating(true);
    // Navigate after short animation
    setTimeout(() => {
      router.push(tab.href);
    }, 140); // tweak duration to match CSS transition
  }

  const activeIndex = tabs.findIndex((t) => t.key === current);
  const total = tabs.length;

  return (
    <nav
      ref={navRef}
      aria-label="Consultant sections"
      className="relative mb-4 rounded-full border border-white/10 bg-white/[0.04] p-1 text-sm font-semibold text-slate-100"
    >
      {/* Sliding highlight */}
      <div
        className="absolute top-1 left-1 h-[calc(100%-0.5rem)] rounded-full bg-sky-500 text-slate-900 shadow-md transition-all duration-200 ease-out motion-safe:duration-200"
        style={{
          width: `calc(${100 / total}% - 0.5rem)`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
        aria-hidden="true"
      />
      <div className="grid grid-cols-2 relative">
        {tabs.map((t) => {
          const isActive = t.key === current;
            return (
              <Link
                key={t.key}
                href={t.href}
                prefetch
                onClick={(e) => handleClick(e, t)}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "relative z-10 flex items-center justify-center rounded-full px-4 py-2 transition-colors",
                  isActive
                    ? "text-slate-900"
                    : "text-slate-300 hover:text-white",
                ].join(" ")}
              >
                <span className="pointer-events-none">{t.label}</span>
              </Link>
            );
        })}
      </div>
      {/* Optional: subtle focus ring when animating */}
      <div
        className={`absolute inset-0 rounded-full transition-opacity duration-300 ${
          isAnimating ? "opacity-30" : "opacity-0"
        } pointer-events-none`}
        aria-hidden="true"
      />
    </nav>
  );
}