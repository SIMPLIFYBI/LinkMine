"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function AccountTabs({ tabs, active, onChange }) {
  const [current, setCurrent] = useState(active);
  const [isAnimating, setIsAnimating] = useState(false);

  // Measure the grid so highlight width/position is exact in px
  const gridRef = useRef(null);
  const [gridWidth, setGridWidth] = useState(0);

  // Keep current in sync with parent
  useEffect(() => {
    setCurrent(active);
    setIsAnimating(false);
  }, [active]);

  useEffect(() => {
    if (!gridRef.current) return;
    const el = gridRef.current;

    const handle = () => setGridWidth(el.getBoundingClientRect().width);
    handle();

    const ro = new ResizeObserver(handle);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function handleClick(key) {
    if (key === current) return;
    setCurrent(key);
    setIsAnimating(true);
    // Let the slide play, then inform parent
    setTimeout(() => {
      onChange?.(key);
      setIsAnimating(false);
    }, 140);
  }

  const total = Math.max(1, tabs.length);
  const activeIndex = Math.max(0, tabs.findIndex((t) => t.key === current));
  const cellWidth = gridWidth / total;

  // Explicit Tailwind grid cols so classes are not purged
  const gridColsClass =
    {
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
      5: "grid-cols-5",
      6: "grid-cols-6",
    }[total] || "grid-cols-3";

  return (
    <div className="inline-block">
      <div className="relative rounded-full border border-white/10 bg-white/[0.04] p-1 text-sm font-semibold text-slate-100">
        {/* Absolute highlight sized and positioned in px to avoid rounding drift */}
        <div
          className="pointer-events-none absolute top-1 left-1 h-[calc(100%-0.5rem)] rounded-full bg-sky-500 text-slate-900 shadow-md transition-transform duration-200 ease-out"
          style={{
            width: `${Math.max(0, cellWidth - 0)}px`,
            transform: `translateX(${Math.max(0, activeIndex) * cellWidth}px)`,
          }}
          aria-hidden="true"
        />

        <div ref={gridRef} className={`relative grid ${gridColsClass}`}>
          {tabs.map((t) => {
            const isActive = t.key === current;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => handleClick(t.key)}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "relative z-10 flex h-10 w-full items-center justify-center rounded-full px-4 text-center transition-colors",
                  isActive ? "text-slate-900" : "text-slate-300 hover:text-white",
                ].join(" ")}
              >
                <span className="pointer-events-none">{t.label}</span>
              </button>
            );
          })}
        </div>

        <div
          className={`pointer-events-none absolute inset-0 rounded-full transition-opacity duration-300 ${
            isAnimating ? "opacity-30" : "opacity-0"
          }`}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}