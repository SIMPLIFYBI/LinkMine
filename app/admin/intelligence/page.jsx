import Link from "next/link";
import { requireIntelligenceAdmin } from "@/lib/intelligence/adminPage";
import { getHomeData, PublishedDataError } from "@/lib/intelligence/published";
import { sustainedCrossing } from "@/lib/intelligence/frames";
import { fmt, sparkPath, stamp, tonnes } from "@/lib/intelligence/format";
import { REPORTS } from "@/lib/intelligence/reports";
import { getResolvedSiteMarket } from "@/lib/siteMarketServer";
import HeroMapPlayer from "@/app/intelligence/maps/HeroMapPlayer.client";
import YourCountryTile from "@/app/intelligence/YourCountryTile.client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Discover · YouMine Intelligence",
  robots: { index: false, follow: false },
};

// Each caption is a checked reading from the published data, shown when the map reaches its year.
const CAPTIONS = [
  { year: 1992, text: "Each country shaded by how much of its own oil and liquid fuel demand it produces. Blue: more than it burns. Orange: less." },
  { year: 1993, text: "China, an oil exporter, falls below its own demand: it produces 97% of what it burns." },
  { year: 2003, text: "Indonesia, an OPEC member, becomes a net importer: about 96% of its demand." },
  { year: 2006, text: "The North Sea decline takes the UK below its own demand for good: about 96%." },
  { year: 2015, text: "Brazil's pre-salt fields lift it above its own demand for good: 101%." },
  { year: 2022, text: "The United States crosses back above 100% for good, on shale oil: 102%." },
  { year: 2025, text: "Guyana produces about 38 times its own demand. 2025 is a publisher estimate." },
];

const FLIPPERS = ["CHN", "GBR", "BRA", "USA"];

// EIA leaves non-producing countries blank in these years but records zero in the others.
const RANGE_NOTES = [
  {
    from: 1993,
    to: 2003,
    text: "In 1993 to 2003 the source leaves countries that produce nothing blank instead of recording zero, so about 90 countries show as hatched here. They are not unknown; in other years they appear as deep orange. Producers are unaffected.",
  },
];
const FEATURED = "CU";

const PROBLEM = {
  schema_not_exposed: "The published schema is not exposed to the API yet (Settings, API, Exposed schemas).",
  missing_config: "The intelligence project connection is not configured. Set INTEL_SUPABASE_URL and INTEL_SUPABASE_ANON_KEY.",
};

function Bars({ items, max, unit }) {
  return (
    <ul className="yi-bars">
      {items.map((item) => (
        <li key={item.key}>
          <span title={item.label}>{item.label}</span>
          <span className="yi-num">{unit(item)}</span>
          <span className="yi-bars__track" aria-hidden="true">
            <span className="yi-bars__fill" style={{ width: `${Math.max(3, (item.value / max) * 100)}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

export default async function IntelligenceHome() {
  await requireIntelligenceAdmin("/admin/intelligence");
  const { market } = await getResolvedSiteMarket();

  let data = null;
  let problem = null;
  try {
    data = await getHomeData();
  } catch (error) {
    const code = error instanceof PublishedDataError ? error.code : "query_failed";
    problem = PROBLEM[code] || `The published data could not be read: ${error.message}`;
  }

  if (problem) {
    return (
      <main className="yi-wrap">
        <p className="yi-kicker">Discover</p>
        <h1 className="yi-title">YouMine Intelligence</h1>
        <p className="yi-flag" role="alert">
          {problem}
        </p>
      </main>
    );
  }

  const { reserves, hero } = data;

  const ranks = reserves.rows.map((r) => ({
    code: r.commodity_code,
    commodity: r.commodity_name,
    iso: r.iso_alpha3,
    rr: r.reserve_rank,
    pr: r.production_rank,
    n: r.n_ranked,
  }));
  const countries = [...new Map(reserves.rows.map((r) => [r.iso_alpha3, r.country_name]))]
    .map(([iso, name]) => ({ iso, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const commodities = [...new Map(reserves.rows.map((r) => [r.commodity_code, r.commodity_name]))];
  const surprise = commodities[Math.floor(Math.random() * commodities.length)]?.[0] || FEATURED;

  const featuredRows = reserves.rows
    .filter((r) => r.commodity_code === FEATURED)
    .sort((a, b) => b.reserves_t - a.reserves_t)
    .slice(0, 5);
  const topProducers = hero.latest.slice(0, 5);
  const crossings = FLIPPERS.map((iso) => {
    const values = hero.series[iso];
    return values ? { iso, name: hero.names[iso], values, crossing: sustainedCrossing(values, hero.firstYear) } : null;
  }).filter(Boolean);

  const miningTiles = [
    <article key="reserves" className="yi-tile">
      <p className="yi-kicker">Mining · ranking</p>
      <h3>Who holds the most {featuredRows[0]?.commodity_name.toLowerCase()}</h3>
      <Bars
        items={featuredRows.map((r) => ({ key: r.iso_alpha3, label: r.country_name, value: r.reserves_t, years: r.years_remaining }))}
        max={featuredRows[0]?.reserves_t || 1}
        unit={(item) => `${tonnes(item.value)} · ${item.years >= 100 ? fmt(item.years) : item.years.toFixed(0)} yrs`}
      />
      <p className="yi-tile__foot">
        Reserves, with years left at current output. <Link href={`/admin/intelligence/reserves?c=${FEATURED}`}>Open in Data</Link>
      </p>
    </article>,
    <YourCountryTile key="country" ranks={ranks} countries={countries} />,
  ];

  const energyTiles = [
    <article key="producers" className="yi-tile">
      <p className="yi-kicker">Oil and liquids · ranking</p>
      <h3>The biggest producers, and whether they cover themselves</h3>
      <Bars
        items={topProducers.map((r) => ({ key: r.iso, label: r.name, value: r.production, pct: r.pct }))}
        max={topProducers[0]?.production || 1}
        unit={(item) => `${(item.value / 1000).toFixed(1)} Mb/d · ${fmt(item.pct)}%`}
      />
      <p className="yi-tile__foot">
        {hero.lastYear} (estimate), million barrels a day against own demand. <Link href="/admin/intelligence/energy-flip">Read the report</Link>
      </p>
    </article>,
    <article key="crossings" className="yi-tile">
      <p className="yi-kicker">Oil and liquids · crossings</p>
      <h3>Four countries that crossed their own demand line</h3>
      {crossings.map((c) => {
        const { d, baseline } = sparkPath(c.values);
        return (
          <div key={c.iso} className="yi-spark">
            <span>
              <strong>{c.name}</strong>
              <br />
              {c.crossing ? `${c.crossing.direction === "down" ? "below" : "above"} 100% for good in ` : "no lasting crossing "}
              <span className="yi-num">{c.crossing?.year}</span>
            </span>
            <svg viewBox="0 0 100 32" role="img" aria-label={`${c.name} self-sufficiency since ${hero.firstYear}`}>
              <line x1="0" x2="100" y1={baseline} y2={baseline} stroke="var(--yi-rule-2)" strokeDasharray="2 2" />
              <path d={d} fill="none" stroke="var(--yi-gain)" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </div>
        );
      })}
      <p className="yi-tile__foot">Log scale from 10% to 1,000%; the dashed line is 100% of own demand.</p>
    </article>,
  ];

  const tiles = market === "oil_gas" ? [...energyTiles, ...miningTiles] : market === "both" ? [miningTiles[0], energyTiles[0], miningTiles[1], energyTiles[1]] : [...miningTiles, ...energyTiles];

  const reserveSources = [...new Set(reserves.sources.map((s) => s.attribution_text).filter(Boolean))];

  return (
    <main className="yi-wrap yi-wrap--wide">
      <p className="yi-kicker">Discover · Admin only</p>
      <h1 className="yi-title">What the public data says</h1>
      <p className="yi-lede">
        Live maps and rankings built from open data. Open anything to explore it, embed it or build on it.
      </p>

      <h2 className="yi-section">Who covers their own oil demand?</h2>
      <HeroMapPlayer hero={hero} captions={CAPTIONS} rangeNotes={RANGE_NOTES} title="Oil and liquid fuel self-sufficiency" />
      <details className="yi-embedbox">
        <summary>Read the same map as a table</summary>
        <div className="yi-scroll">
          <table className="yi-table">
            <thead>
              <tr>
                <th>Country</th>
                <th>Production, {hero.lastYear}</th>
                <th>Share of own demand</th>
              </tr>
            </thead>
            <tbody>
              {hero.latest.slice(0, 20).map((r) => (
                <tr key={r.iso}>
                  <td>{r.name}</td>
                  <td className="yi-num">{fmt(r.production)} kb/d</td>
                  <td className="yi-num">{fmt(r.pct)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <h2 className="yi-section">Start with a question</h2>
      <div className="yi-chips">
        <Link className="yi-btn" href="/admin/intelligence/reserves?c=CU">
          How many years of copper are left?
        </Link>
        <Link className="yi-btn" href="/admin/intelligence/reserves?c=NI&h=AUS">
          Who holds the most nickel?
        </Link>
        <Link className="yi-btn" href="/admin/intelligence/energy-flip">
          Who flipped from exporter to importer?
        </Link>
        <Link className="yi-btn yi-btn--primary" href={`/admin/intelligence/reserves?c=${surprise}`}>
          Surprise me
        </Link>
      </div>

      <h2 className="yi-section">Moving now</h2>
      <div className="yi-tiles">{tiles}</div>

      <h2 className="yi-section">Reports</h2>
      <div className="yi-tiles">
        {REPORTS.map((report) => (
          <article key={report.slug} className="yi-tile">
            <p className="yi-kicker">{report.kicker}</p>
            <h3>{report.title}</h3>
            <p className="yi-fresh">{report.summary}</p>
            <p className="yi-tile__foot">
              <Link href={`/admin/intelligence/${report.slug}`}>Preview the report</Link>
            </p>
          </article>
        ))}
      </div>

      <footer className="yi-sourcebar">
        <p>
          <strong>Energy:</strong> {hero.sourceName}, through {hero.lastYear} (the latest year is a publisher estimate), refreshed{" "}
          <span className="yi-num">{stamp(hero.builtAt)}</span>. Where a publisher reported no trade, the country is hatched on the
          map, not shown as zero. Former states such as the Soviet Union are not drawn, so the map starts in {hero.firstYear}.
        </p>
        {hero.attribution ? <p>{hero.attribution}</p> : null}
        <p>
          <strong>Reserves:</strong> refreshed <span className="yi-num">{stamp(reserves.builtAt)}</span>.
        </p>
        {reserveSources.map((text) => (
          <p key={text}>{text}</p>
        ))}
      </footer>
    </main>
  );
}
