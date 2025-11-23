"use client";
import { useCountUp } from "../kpi/useCountUp";

function StatCard({
  target,
  label,
  sub,
  suffix = "",
  icon,
  gradient = "from-sky-500 via-indigo-500 to-violet-500",
  duration = 1800
}) {
  const { ref, formatted, done } = useCountUp(target, {
    duration,
    threshold: 0.2,
    format: (n) => `${n.toLocaleString()}${suffix}`
  });

  return (
    <div
      ref={ref}
      className="
        group relative overflow-hidden rounded-2xl
        border border-white/10 bg-white/[0.04] p-4 sm:p-5
        ring-1 ring-white/10 backdrop-blur-md
        shadow-[0_4px_20px_-6px_rgba(0,0,0,0.45)]
        transition hover:border-sky-400/40 hover:shadow-[0_8px_28px_-8px_rgba(0,0,0,0.55)]
      "
    >
      {/* Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(circle at 30% 25%, rgba(56,189,248,0.25), transparent 65%)"
        }}
      />
      <div className="flex items-start gap-3">
        <div
          className={`
            flex h-10 w-10 items-center justify-center rounded-xl
            bg-gradient-to-br ${gradient} text-white text-lg font-semibold
            shadow-inner ring-1 ring-white/20
          `}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="
              text-2xl sm:text-3xl font-bold tabular-nums tracking-tight
              bg-clip-text text-transparent
              bg-[linear-gradient(90deg,#38bdf8,#6366f1,#8b5cf6,#6366f1,#38bdf8)]
              bg-[length:280%_100%] animate-[kpiPan_6s_linear_infinite]
            "
          >
            {formatted}
          </div>
          <p className="mt-1 text-sm font-medium text-slate-200">{label}</p>
          <p className="mt-0.5 text-[11px] leading-tight text-slate-400">{sub}</p>
        </div>
      </div>
    </div>
  );
}

function TrendChart({
  // Replace the default points with this 10-year estimate (A$ millions)
  points = [
    { m: "2016", v: 1150 },
    { m: "2017", v: 1230 },
    { m: "2018", v: 1360 },
    { m: "2019", v: 1490 },
    { m: "2020", v: 1410 }, // dip during covid disruptions
    { m: "2021", v: 1550 },
    { m: "2022", v: 1710 },
    { m: "2023", v: 1850 },
    { m: "2024", v: 1980 },
    { m: "2025", v: 2120 }
  ],
  height = 140
}) {
  // Dynamic horizontal scale
  const step = 28; // horizontal distance between points
  const w = (points.length - 1) * step;
  const max = Math.max(...points.map((p) => p.v));
  const topPad = 6;
  const bottomPad = 8;
  const h = 100; // internal vertical units

  // Normalized point coordinates
  const coords = points.map((p, i) => {
    const x = i * step;
    const y = h - bottomPad - ((p.v / max) * (h - topPad - bottomPad));
    return { x, y };
  });

  // Catmull-Rom to Bezier for smoothing
  function smoothPath(pts) {
    if (pts.length < 2) return "";
    const d = [];
    d.push(`M${pts[0].x},${pts[0].y}`);
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;

      // Catmull-Rom to Cubic Bezier conversion
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d.push(`C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`);
    }
    return d.join(" ");
  }

  const linePath = smoothPath(coords);
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 ring-1 ring-white/10 backdrop-blur-md shadow-[0_4px_20px_-6px_rgba(0,0,0,0.45)]">
      <p className="text-sm font-semibold tracking-wide text-slate-200 mb-2">
        Annual spend on mining consultants (A$ millions) — Australia
      </p>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        // Removed preserveAspectRatio="none" so circles stay round.
        preserveAspectRatio="xMidYMid meet"
        style={{ height, width: "100%" }}
        className="block"
        role="img"
        aria-label="Line chart showing growth over years"
      >
        <defs>
          <linearGradient id="chartFill2" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(56,189,248,0.45)" />
            <stop offset="100%" stopColor="rgba(56,189,248,0)" />
          </linearGradient>
          <linearGradient id="chartStroke2" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>

        {/* Filled area */}
        <path
          d={areaPath}
          fill="url(#chartFill2)"
          opacity="0.85"
          style={{ animation: "fadeIn 0.7s ease-out forwards" }}
        />

        {/* Smoothed stroke */}
        <path
          d={linePath}
          fill="none"
          stroke="url(#chartStroke2)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{
            strokeDasharray: w * 2,
            strokeDashoffset: w * 2,
            animation: "dash 1.4s cubic-bezier(.16,1,.3,1) forwards"
          }}
        />

        {/* Data points */}
        {coords.map((c, i) => (
          <circle
            key={points[i].m}
            cx={c.x}
            cy={c.y}
            r="3.4"
            fill="#38bdf8"
            className="opacity-0"
            style={{
              animation: "fadeIn 0.5s ease-out forwards",
              animationDelay: `${0.4 + i * 0.1}s`
            }}
          />
        ))}
      </svg>

      <div className="mt-2 sm:overflow-visible overflow-x-auto no-scrollbar">
        <div
          className="grid text-[10px] tracking-wide text-slate-400"
          style={{
            gridTemplateColumns: `repeat(${points.length}, minmax(24px, 1fr))`,
            minWidth: `${points.length * 28}px`
          }}
        >
          {points.map((p) => {
            // If label is a 4-digit year, show last two digits; otherwise leave as-is
            const short = /^[0-9]{4}$/.test(p.m) ? p.m.slice(2) : p.m;
            return (
              <span key={p.m} className="text-center">
                {short}
              </span>
            );
          })}
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 mix-blend-plus-lighter opacity-30"
        style={{
          background:
            "radial-gradient(circle at 22% 28%, rgba(56,189,248,0.25), transparent 60%)"
        }}
      />
    </div>
  );
}

export default function DidYouKnowSection() {
  return (
    <section
      id="did-you-know"
      className="
        mt-12 rounded-3xl border border-white/10 bg-white/[0.02]
        px-4 py-8 sm:px-6
        backdrop-blur-md
        relative overflow-hidden
      "
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-70"
        style={{
          background:
            "linear-gradient(130deg, rgba(15,23,42,0.85) 0%, rgba(30,41,59,0.82) 55%, rgba(15,23,42,0.9) 100%)"
        }}
      />
      <div className="absolute inset-0 -z-10 mix-blend-plus-lighter opacity-40 bg-radial-fade" />
      <p className="section-label mb-2">Did you know</p>
      <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
        Industry insights at a glance
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-300">
        Quick visual stats highlighting scale and momentum. Replace these placeholder values with your
        verified data when ready.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard
          target={22000}
          label="Estimated independent mining consultants"
          sub="Potential expert profiles across Australia"
          suffix="+"
          gradient="from-sky-500 via-cyan-500 to-sky-600"
          icon={
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {/* Users/group icon */}
              <path d="M17 21v-2a4 4 0 0 0-4-4h-2a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
              <path d="M5.5 11a3.5 3.5 0 0 1 0-7" />
              <path d="M18.5 11a3.5 3.5 0 0 0 0-7" />
            </svg>
          }
        />
        <StatCard
          target={850}
          label="Estimated active mining clients"
          sub="Organizations regularly engaging specialist services"
          suffix="+"
          gradient="from-indigo-500 via-violet-500 to-fuchsia-500"
          duration={2000}
          icon={
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {/* Briefcase icon */}
              <path d="M3 7h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
              <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M3 12h18" />
            </svg>
          }
        />
        <TrendChart />
      </div>

      <p className="mt-5 text-[11px] text-slate-500">
        Figures are indicative placeholders. Substitute with validated internal or public sources.
      </p>
    </section>
  );
}

// Animations (keyframes) rely on existing globals; add these if not present:
//
// @keyframes dash { to { stroke-dashoffset: 0; } }
// @keyframes fadeIn { to { opacity: 1; } }