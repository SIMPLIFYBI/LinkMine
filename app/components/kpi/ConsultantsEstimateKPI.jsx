"use client";
import { useCountUp } from "./useCountUp";

export default function ConsultantsEstimateKPI({
  target = 22000,
  displayLabel = "Mining Consultants",
  label = "Estimated mining consultants across Australia",
  overshoot = 0,
  className = ""
}) {
  const { ref, formatted, done } = useCountUp(target, {
    duration: 1800,
    overshoot,
    threshold: 0.35,
    format: (n) => n.toLocaleString()
  });

  return (
    <div
      ref={ref}
      className={[
        "relative isolate flex flex-col items-center justify-center",
        "rounded-xl sm:rounded-2xl px-3 py-3 sm:px-5 sm:py-4",
        "bg-gradient-to-br from-slate-900/40 via-slate-900/30 to-slate-800/30",
        "border border-white/10 ring-1 ring-white/10 backdrop-blur-md",
        "shadow-[0_4px_16px_-4px_rgba(0,0,0,0.5)]",
        className
      ].join(" ")}
      aria-label={`${formatted} – ${label}`}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-20">
        <div className="absolute -top-10 left-1/4 h-32 w-32 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-24 w-24 rounded-full bg-indigo-500/20 blur-2xl" />
      </div>

      {/* Animated number */}
      <div
        className={[
          "font-bold tracking-tight tabular-nums",
          "text-[clamp(1.125rem,5.5vw,2rem)] sm:text-[clamp(1.5rem,3.2vw,2.25rem)]",
          "bg-clip-text text-transparent",
          "bg-[linear-gradient(90deg,#38bdf8,#6366f1,#8b5cf6,#6366f1,#38bdf8)]",
          "bg-[length:300%_100%] animate-[kpiPan_5s_linear_infinite]",
          done ? "" : "will-change:contents"
        ].join(" ")}
        style={{
          transition: "transform 0.6s cubic-bezier(.16,1,.3,1)",
          transform: done ? "translateY(0)" : "translateY(0.5px)"
        }}
      >
        {formatted}
      </div>

      <div className="mt-1 sm:mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
        {displayLabel}
      </div>

      <div className="mt-1 sm:mt-2 h-px w-10 sm:w-12 bg-gradient-to-r from-sky-500/50 via-cyan-400/40 to-sky-500/50 rounded-full" />
    </div>
  );
}