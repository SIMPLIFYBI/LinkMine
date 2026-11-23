// Registry of YouMine Intelligence reports. `file` names are the only paths ever read from disk.
// Every report is bylined to AUTHOR (lib/intelligence/author.js); the byline and author box are injected when served.
// publishedAt: ISO date (YYYY-MM-DD), set on publication and shown in the byline. Null means draft.
// corrections: [{ date: "YYYY-MM-DD", text: "What was wrong and what changed." }], newest last, shown on the page.
export const REPORT_SOURCES = {
  W1: { name: "World Bank Open Data", licence: "CC BY 4.0", attribution: "Source: World Bank Open Data (CC BY 4.0)" },
  M15: { name: "USGS Mineral Commodity Summaries 2026 data release", licence: "CC0", attribution: "required by house style" },
  E1: { name: "U.S. EIA International Energy Statistics", licence: "US Government public domain", attribution: "required by house style" },
  M3: {
    name: "BGS World Mineral Statistics",
    licence: "Permission-based, verbal grant",
    attribution: "World Mineral Statistics contributed by permission of the British Geological Survey",
  },
};

export const REPORTS = [
  {
    slug: "bauxite-to-aluminium",
    file: "bauxite-to-aluminium.html",
    title: "The World’s Biggest Bauxite Miner Barely Refines It",
    kicker: "Mining and processing, 2024",
    sector: "mining",
    status: "draft",
    publishedAt: null,
    corrections: [],
    sources: ["M15", "M3"],
    summary: "Guinea mines a third of the world’s bauxite. Follow it from rock to metal on a map that shows where the leaders change.",
  },
  {
    slug: "australia-qatar-gas",
    file: "australia-qatar-gas.html",
    title: "Australia Nearly Caught Qatar on Gas",
    kicker: "Dry natural gas, 2000–24",
    sector: "oil-gas",
    status: "draft",
    publishedAt: null,
    corrections: [],
    sources: ["E1"],
    summary: "Australia went from producing 40% as much gas as Qatar to 90%. The annual figures show how quickly it closed the gap.",
  },
  {
    slug: "mine-dependent-six",
    file: "mine-dependent-six.html",
    title: "The Mine-Dependent Six",
    kicker: "Mining dependence, 2015-2023",
    sector: "mining",
    status: "draft",
    publishedAt: null,
    corrections: [],
    sources: ["W1", "M3"],
    summary: "Two World Bank measures, one test: which economies depend on mining by both, and which only one can see.",
  },
  {
    slug: "the-handover",
    file: "the-handover.html",
    title: "The Handover",
    kicker: "Mine production share, 2002-04 to 2022-24",
    sector: "mining",
    status: "draft",
    publishedAt: null,
    corrections: [],
    sources: ["M3", "M15"],
    summary: "Twenty minerals, one test: which countries gained or lost the most share of world mine output in two decades.",
  },
  {
    slug: "reserve-report",
    file: "reserve-report.html",
    title: "Reserve Rich, Production Poor",
    kicker: "Mineral endowment",
    sector: "mining",
    status: "draft",
    publishedAt: null,
    corrections: [],
    sources: ["M15", "E1"],
    summary: "Years of reserves remaining by commodity and country, with a reader-driven ranking.",
  },
  {
    slug: "peak-was-yesterday",
    file: "peak-was-yesterday.html",
    title: "Peak Was Yesterday",
    kicker: "Global production, 1970-2024",
    sector: "mining",
    status: "draft",
    publishedAt: null,
    corrections: [],
    sources: ["M3", "M15"],
    summary: "Nine minerals whose world production has already peaked, indexed to their own peak.",
  },
  {
    slug: "energy-flip",
    file: "energy-flip.html",
    title: "The Energy Flip",
    kicker: "Energy, 1990-2025",
    sector: "oil-gas",
    status: "draft",
    publishedAt: null,
    corrections: [],
    sources: ["E1"],
    summary: "Every country that crossed the oil or gas self-sufficiency line, and when.",
  },
];

export function getReport(slug) {
  return REPORTS.find((report) => report.slug === slug) || null;
}

// Native pages built from the published data layer rather than a static HTML file.
export const CHARTS = [
  {
    href: "/intelligence/reserves",
    title: "Years of reserves remaining",
    kicker: "Native chart · published data",
    summary: "The reserve report's ranking, read live from the published layer with data age, coverage and per-commodity caveats.",
    sources: ["M15", "E1"],
  },
];
