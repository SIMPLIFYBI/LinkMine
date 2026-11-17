"use client";

import { useEffect, useState } from "react";
import { Activity, Clock3, Eye, RefreshCw, UserPlus, Users } from "lucide-react";
import SearchConsoleDashboard from "./SearchConsoleDashboard.client";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DATE_RANGES = [7, 30, 90];

function formatNumber(value) {
  return new Intl.NumberFormat().format(Number(value || 0));
}

function formatPercent(value) {
  return new Intl.NumberFormat(undefined, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

function formatDuration(seconds) {
  const safeSeconds = Math.max(0, Math.round(Number(seconds || 0)));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return minutes ? `${minutes}m ${remainder}s` : `${remainder}s`;
}

function formatTimestamp(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatCompactNumber(value) {
  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

function formatChartDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(new Date(`${value}T00:00:00`));
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-36 rounded-md border border-white/10 bg-slate-950/95 px-3 py-2 shadow-xl">
      <p className="mb-1.5 text-xs text-slate-400">{formatChartDate(label)}</p>
      {payload.map((item) => (
        <div key={item.dataKey} className="flex items-center justify-between gap-5 py-0.5 text-xs">
          <span style={{ color: item.color }}>{item.name}</span>
          <span className="font-medium text-white">{formatNumber(item.value)}</span>
        </div>
      ))}
    </div>
  );
}

function TrendChart({ title, data, lines, loading, days }) {
  return (
    <Panel title={title}>
      {loading ? (
        <div className="flex h-[288px] items-center justify-center text-sm text-slate-400">Loading trend...</div>
      ) : data?.length ? (
        <div className="h-[288px] w-full px-2 py-4 sm:px-4" role="img" aria-label={`${title} over the last ${days} days`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatChartDate}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={{ stroke: "rgba(148,163,184,0.2)" }}
                tickLine={false}
                minTickGap={28}
              />
              <YAxis
                tickFormatter={formatCompactNumber}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={42}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(148,163,184,0.28)" }} />
              <Legend verticalAlign="top" align="right" height={28} iconType="circle" iconSize={7} wrapperStyle={{ color: "#cbd5e1", fontSize: 11 }} />
              {lines.map((line) => (
                <Line
                  key={line.key}
                  type="monotone"
                  dataKey={line.key}
                  name={line.label}
                  stroke={line.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-[288px] items-center justify-center px-4 text-center text-sm text-slate-400">
          No trend data is available for this period.
        </div>
      )}
    </Panel>
  );
}

function MetricCard({ icon: Icon, label, value, detail }) {
  return (
    <article className="rounded-lg border border-white/10 bg-slate-950/45 p-4 shadow-[0_12px_30px_-24px_rgba(56,189,248,0.65)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</p>
          {detail ? <p className="mt-1 text-xs text-slate-400">{detail}</p> : null}
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
    </article>
  );
}

function EmptyTable({ children }) {
  return <p className="px-4 py-8 text-center text-sm text-slate-400">{children}</p>;
}

function Panel({ title, children }) {
  return (
    <section className="overflow-hidden rounded-lg border border-white/10 bg-slate-950/45">
      <div className="border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function AnalyticsDashboard() {
  const [tab, setTab] = useState("analytics");
  return (
    <>
      <nav aria-label="Analytics reports" className="mx-auto flex w-full max-w-7xl gap-5 border-b border-white/10 px-4 pt-5 sm:px-6">
        {[{ id: "analytics", label: "Google Analytics" }, { id: "search", label: "Search Console" }].map((item) => (
          <button key={item.id} type="button" onClick={() => setTab(item.id)} aria-current={tab === item.id ? "page" : undefined} className={`border-b-2 px-1 pb-3 text-sm font-semibold ${tab === item.id ? "border-cyan-400 text-white" : "border-transparent text-slate-400 hover:text-white"}`}>{item.label}</button>
        ))}
      </nav>
      {tab === "analytics" ? <Ga4Dashboard /> : <SearchConsoleDashboard />}
    </>
  );
}

function Ga4Dashboard() {
  const [days, setDays] = useState(30);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadReport(nextDays = days) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/analytics?days=${nextDays}`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Unable to load Google Analytics reporting.");
      }
      setReport(payload.report);
    } catch (nextError) {
      setReport(null);
      setError(nextError.message || "Unable to load Google Analytics reporting.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport(days);
  }, [days]);

  const overview = report?.overview;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 text-slate-100 sm:px-6">
      <div className="border-b border-white/10 pb-6">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">Admin analytics</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Website performance</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Live GA4 reporting for website traffic, sign-ups, locations, and campaign performance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-white/10 bg-slate-950/50 p-1" aria-label="Reporting period">
              {DATE_RANGES.map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setDays(range)}
                  className={`min-w-12 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    days === range ? "bg-cyan-400 text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {range}d
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => loadReport(days)}
              disabled={loading}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Refresh analytics"
              title="Refresh analytics"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
            </button>
          </div>
        </div>
        {report?.generatedAt ? <p className="mt-3 text-xs text-slate-500">Updated {formatTimestamp(report.generatedAt)}. Results are cached for up to 15 minutes.</p> : null}
      </div>

      {error ? (
        <section className="mt-6 rounded-lg border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </section>
      ) : null}

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard icon={Users} label="Active users" value={loading ? "-" : formatNumber(overview?.activeUsers)} detail={`${days}-day period`} />
        <MetricCard icon={Users} label="Total users" value={loading ? "-" : formatNumber(overview?.totalUsers)} detail={`${formatNumber(overview?.newUsers)} new users`} />
        <MetricCard icon={Activity} label="Sessions" value={loading ? "-" : formatNumber(overview?.sessions)} />
        <MetricCard icon={Eye} label="Page views" value={loading ? "-" : formatNumber(overview?.pageViews)} />
        <MetricCard icon={UserPlus} label="Sign-ups" value={loading ? "-" : formatNumber(overview?.signups)} detail={`${formatPercent(overview?.signupRate)} of active users`} />
        <MetricCard icon={Clock3} label="Avg. visit" value={loading ? "-" : formatDuration(overview?.averageSessionDuration)} detail="Average session duration" />
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-2">
        <TrendChart
          title="Traffic over time"
          data={report?.trend}
          days={days}
          loading={loading}
          lines={[
            { key: "sessions", label: "Sessions", color: "#38bdf8" },
            { key: "pageViews", label: "Page views", color: "#fbbf24" },
          ]}
        />
        <TrendChart
          title="User growth"
          data={report?.trend}
          days={days}
          loading={loading}
          lines={[
            { key: "activeUsers", label: "Active users", color: "#34d399" },
            { key: "newUsers", label: "New users", color: "#fb7185" },
          ]}
        />
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-2">
        <Panel title="Top visitor locations">
          {report?.countries?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.1em] text-slate-500">
                  <tr><th className="px-4 py-3 font-medium">Country</th><th className="px-4 py-3 text-right font-medium">Users</th><th className="px-4 py-3 text-right font-medium">Views</th></tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {report.countries.map((row) => <tr key={row.country}><td className="px-4 py-3 text-slate-200">{row.country}</td><td className="px-4 py-3 text-right text-slate-300">{formatNumber(row.activeUsers)}</td><td className="px-4 py-3 text-right text-slate-300">{formatNumber(row.pageViews)}</td></tr>)}
                </tbody>
              </table>
            </div>
          ) : <EmptyTable>{loading ? "Loading locations..." : "No location data is available for this period."}</EmptyTable>}
        </Panel>

        <Panel title="Top pages">
          {report?.topPages?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.1em] text-slate-500">
                  <tr><th className="px-4 py-3 font-medium">Page</th><th className="px-4 py-3 text-right font-medium">Views</th><th className="px-4 py-3 text-right font-medium">Users</th></tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {report.topPages.map((row) => <tr key={row.path}><td className="max-w-[13rem] truncate px-4 py-3 font-mono text-xs text-slate-200" title={row.path}>{row.path}</td><td className="px-4 py-3 text-right text-slate-300">{formatNumber(row.pageViews)}</td><td className="px-4 py-3 text-right text-slate-300">{formatNumber(row.activeUsers)}</td></tr>)}
                </tbody>
              </table>
            </div>
          ) : <EmptyTable>{loading ? "Loading page performance..." : "No page data is available for this period."}</EmptyTable>}
        </Panel>
      </section>

      <section className="mt-5">
        <Panel title="Traffic sources and campaigns">
          {report?.acquisition?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.1em] text-slate-500">
                  <tr><th className="px-4 py-3 font-medium">Source / medium</th><th className="px-4 py-3 font-medium">Campaign</th><th className="px-4 py-3 text-right font-medium">Sessions</th></tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {report.acquisition.map((row, index) => <tr key={`${row.source}-${row.medium}-${row.campaign}-${index}`}><td className="px-4 py-3 text-slate-200">{row.source} / {row.medium}</td><td className="max-w-[10rem] truncate px-4 py-3 text-slate-400" title={row.campaign}>{row.campaign}</td><td className="px-4 py-3 text-right text-slate-300">{formatNumber(row.sessions)}</td></tr>)}
                </tbody>
              </table>
            </div>
          ) : <EmptyTable>{loading ? "Loading traffic sources..." : "No campaign data is available for this period."}</EmptyTable>}
        </Panel>
      </section>
    </main>
  );
}