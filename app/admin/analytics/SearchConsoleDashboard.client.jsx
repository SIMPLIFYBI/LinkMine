"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const dimensions = ["query", "page", "country", "device"];
const labels = { query: "Queries", page: "Pages", country: "Countries", device: "Devices" };
const metrics = [
  { key: "clicks", label: "Total clicks", color: "#60a5fa" },
  { key: "impressions", label: "Total impressions", color: "#a78bfa" },
  { key: "ctr", label: "Average CTR", color: "#34d399" },
  { key: "position", label: "Average position", color: "#fb923c" },
];

function formatMetric(value, key) {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  if (key === "ctr") return `${(value * 100).toFixed(2)}%`;
  if (key === "position") return Number(value).toFixed(1);
  return new Intl.NumberFormat().format(value);
}

function MetricCard({ metric, current, previous }) {
  const value = current?.[metric.key];
  const prior = previous?.[metric.key];
  const difference = value != null && prior != null ? value - prior : null;
  const delta = difference == null ? "No previous data" : metric.key === "ctr" ? `${difference >= 0 ? "+" : ""}${(difference * 100).toFixed(2)} pp` : metric.key === "position" ? `${difference >= 0 ? "+" : ""}${difference.toFixed(1)} positions` : prior === 0 ? "Previous: 0" : `${difference >= 0 ? "+" : ""}${(difference / prior * 100).toFixed(1)}%`;
  return <div className="border-l-4 bg-white/[0.04] p-4" style={{ borderColor: metric.color }}><p className="text-xs font-medium text-slate-300">{metric.label}</p><p className="mt-2 text-2xl font-semibold text-white">{formatMetric(value, metric.key)}</p><p className="mt-1 text-xs text-slate-400">{delta} vs previous period</p></div>;
}

function DataTable({ rows, dimension, sort, setSort, onSelect }) {
  const sorted = [...rows].sort((left, right) => (Number(right[sort]) || 0) - (Number(left[sort]) || 0));
  return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-white/10 text-xs text-slate-400"><tr><th className="min-w-52 px-4 py-3 font-medium">{labels[dimension]}</th>{metrics.map((metric) => <th key={metric.key} className="px-4 py-3 text-right font-medium"><button type="button" onClick={() => setSort(metric.key)} className={sort === metric.key ? "text-cyan-300" : "hover:text-white"}>{metric.label.replace("Total ", "").replace("Average ", "")}{sort === metric.key ? " ↓" : ""}</button></th>)}</tr></thead><tbody className="divide-y divide-white/5">{sorted.map((row) => <tr key={row.keys[0]}><td className="max-w-[35rem] break-all px-4 py-3"><button type="button" className="text-left text-sky-300 hover:underline" onClick={() => onSelect(dimension, row.keys[0])}>{row.keys[0]}</button></td>{metrics.map((metric) => <td key={metric.key} className="whitespace-nowrap px-4 py-3 text-right text-slate-300">{formatMetric(row[metric.key], metric.key)}</td>)}</tr>)}</tbody></table>{!sorted.length && <p className="px-4 py-10 text-center text-sm text-slate-400">No data for this period and filter selection.</p>}</div>;
}

export default function SearchConsoleDashboard() {
  const [days, setDays] = useState("30");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [filters, setFilters] = useState({ query: "", page: "", country: "", device: "" });
  const [applied, setApplied] = useState({ days: "30" });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dimension, setDimension] = useState("query");
  const [sort, setSort] = useState("clicks");
  const [opportunity, setOpportunity] = useState("page");
  const [opportunitySort, setOpportunitySort] = useState("impressions");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams(Object.entries(applied).filter(([, value]) => value));
        if (refresh) params.set("refresh", "1");
        const response = await fetch(`/api/admin/analytics/search-console?${params}`, { cache: "no-store", signal: controller.signal });
        const payload = await response.json();
        if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to load Search Console data.");
        setReport(payload.report);
      } catch (nextError) {
        if (nextError.name !== "AbortError") { setReport(null); setError(nextError.message || "Unable to load Search Console data."); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    load();
    return () => controller.abort();
  }, [applied, refresh]);

  function apply(nextFilters = filters) {
    setRefresh(0);
    setApplied({ ...(days === "custom" ? { start, end } : { days }), ...nextFilters });
  }
  function selectFilter(name, value) {
    const next = { ...filters, [name]: value };
    setFilters(next);
    apply(next);
  }
  const rows = report?.[`${dimension === "country" ? "countries" : dimension === "query" ? "queries" : dimension === "page" ? "pages" : "devices"}`] || [];
  const opportunityRows = opportunity === "page"
    ? (report?.pages || []).filter((row) => row.impressions >= 100 && row.ctr < 0.02).sort((a, b) => b.impressions - a.impressions)
    : (report?.queries || []).filter((row) => row.impressions >= 20 && row.position >= 5 && row.position <= 20).sort((a, b) => b.impressions - a.impressions);
  const chartData = (report?.trend || []).map((row) => ({ date: row.keys[0], clicks: row.clicks, impressions: row.impressions }));
  const inputClass = "min-h-9 rounded-md border border-white/15 bg-slate-950 px-3 text-sm text-slate-100";

  return <main className="mx-auto w-full max-w-7xl px-4 py-8 text-slate-100 sm:px-6">
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5"><div><p className="text-xs font-semibold uppercase text-cyan-300">Admin analytics</p><h1 className="mt-2 text-3xl font-semibold text-white">Search performance</h1><p className="mt-2 text-sm text-slate-400">Google Search · Web results</p></div><button type="button" onClick={() => setRefresh((value) => value + 1)} disabled={loading} title="Refresh Search Console data" aria-label="Refresh Search Console data" className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-slate-200 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button></header>
    <form onSubmit={(event) => { event.preventDefault(); apply(); }} className="mt-5 flex flex-wrap items-end gap-3">
      <label className="grid gap-1 text-xs text-slate-400">Date range<select className={inputClass} value={days} onChange={(event) => setDays(event.target.value)}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="custom">Custom</option></select></label>
      {days === "custom" && <><label className="grid gap-1 text-xs text-slate-400">From<input type="date" required className={inputClass} value={start} onChange={(event) => setStart(event.target.value)} /></label><label className="grid gap-1 text-xs text-slate-400">To<input type="date" required className={inputClass} value={end} onChange={(event) => setEnd(event.target.value)} /></label></>}
      <label className="grid gap-1 text-xs text-slate-400">Query<input className={inputClass} value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} placeholder="Exact query" /></label>
      <label className="grid gap-1 text-xs text-slate-400">Page<input className={inputClass} value={filters.page} onChange={(event) => setFilters({ ...filters, page: event.target.value })} placeholder="Full URL" /></label>
      <label className="grid gap-1 text-xs text-slate-400">Country<input className={`${inputClass} w-24`} maxLength={3} value={filters.country} onChange={(event) => setFilters({ ...filters, country: event.target.value })} placeholder="AUS" /></label>
      <label className="grid gap-1 text-xs text-slate-400">Device<select className={inputClass} value={filters.device} onChange={(event) => setFilters({ ...filters, device: event.target.value })}><option value="">All</option><option value="MOBILE">Mobile</option><option value="DESKTOP">Desktop</option><option value="TABLET">Tablet</option></select></label>
      <button type="submit" disabled={loading} className="min-h-9 rounded-md bg-cyan-400 px-4 text-sm font-semibold text-slate-950 disabled:opacity-50">Apply</button>
    </form>
    {error && <div role="alert" className="mt-5 rounded-md border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}
    {report && <p className="mt-4 text-xs text-slate-400">{report.start} to {report.end} · Previous: {report.previousStart} to {report.previousEnd} · Pacific Time · Finalized data may be delayed</p>}
    {loading && <p className="mt-5 text-sm text-slate-400">Loading search performance...</p>}
    {!loading && report && <>
      <section className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{metrics.map((metric) => <MetricCard key={metric.key} metric={metric} current={report.overview} previous={report.previousOverview} />)}</section>
      <section aria-label="Clicks and impressions over time" className="mt-5 h-72 border border-white/10 bg-slate-950/45 p-4">{chartData.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} /><XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} minTickGap={30} /><YAxis yAxisId="clicks" tick={{ fill: "#94a3b8", fontSize: 11 }} width={45} /><YAxis yAxisId="impressions" orientation="right" tick={{ fill: "#94a3b8", fontSize: 11 }} width={50} /><Tooltip contentStyle={{ background: "#020617", border: "1px solid #334155" }} /><Legend /><Line yAxisId="clicks" dataKey="clicks" name="Clicks" stroke="#60a5fa" dot={false} /><Line yAxisId="impressions" dataKey="impressions" name="Impressions" stroke="#a78bfa" dot={false} /></LineChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-sm text-slate-400">No trend data available.</div>}</section>
      <section className="mt-5 border border-white/10 bg-slate-950/45"><div className="flex gap-4 overflow-x-auto border-b border-white/10 px-4" aria-label="Search dimensions">{dimensions.map((item) => <button key={item} type="button" onClick={() => { setDimension(item); setSort("clicks"); }} className={`whitespace-nowrap border-b-2 py-3 text-sm font-medium ${dimension === item ? "border-cyan-400 text-white" : "border-transparent text-slate-400"}`}>{labels[item]}</button>)}</div><DataTable rows={rows} dimension={dimension} sort={sort} setSort={setSort} onSelect={selectFilter} /></section>
      <section className="mt-6 border border-white/10 bg-slate-950/45"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3"><h2 className="text-sm font-semibold text-white">SEO opportunities</h2><select aria-label="Opportunity type" value={opportunity} onChange={(event) => setOpportunity(event.target.value)} className={inputClass}><option value="page">High impressions, low CTR</option><option value="query">Queries in positions 5–20</option></select></div><DataTable rows={opportunityRows} dimension={opportunity} sort={opportunitySort} setSort={setOpportunitySort} onSelect={selectFilter} /></section>
      <p className="mt-4 text-xs leading-5 text-slate-500">Showing up to {report.rowLimit} rows per dimension, ordered by clicks by Google before sorting. Some queries may be omitted. Page and property totals can differ. Opportunity thresholds: pages with at least 100 impressions and CTR below 2%; queries with at least 20 impressions and average position 5–20.</p>
    </>}
  </main>;
}