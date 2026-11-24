import Link from "next/link";
import { getHomeData } from "@/lib/intelligence/published";
import { intelligenceMetadata } from "@/lib/intelligence/seo";
import { sustainedCrossing } from "@/lib/intelligence/frames";
import { fmt, sparkPath, stamp, tonnes } from "@/lib/intelligence/format";
import { REPORTS } from "@/lib/intelligence/reports";
import { getResolvedSiteMarket } from "@/lib/siteMarketServer";
import { MAP_REPORTS } from "@/lib/intelligence/mapReports";
import MapReports from "@/app/intelligence/maps/MapReports.client";
import YourCountryTile from "@/app/intelligence/YourCountryTile.client";

export const dynamic = "force-dynamic";

export const metadata = intelligenceMetadata(
  "/intelligence",
  "Mining and Energy Data & Analysis | YouMine Intelligence",
  "Explore mining and energy production, mineral reserves and energy self-sufficiency by country, with interactive maps, original reports and source attribution.",
);

const FLIPPERS = ["CHN", "GBR", "BRA", "USA"];
const FEATURED = "CU";

function ReportCards() {
  return (
    <>
      <h2 className="yi-section">Reports</h2>
      <div className="yi-tiles">
        {REPORTS.filter((report) => report.publishedAt).map((report) => (
          <article key={report.slug} className="yi-tile">
            <p className="yi-kicker">{report.kicker}</p>
            <h3><a href={`/intelligence/raw/${report.slug}`}>{report.title}</a></h3>
            <p className="yi-fresh">{report.summary}</p>
          </article>
        ))}
      </div>
    </>
  );
}

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

export default async function IntelligenceHome({ searchParams }) {
  const { map: requestedMap } = await searchParams;
  const { market } = await getResolvedSiteMarket();
  let data = null;
  try {
    data = await getHomeData();
  } catch (error) {
    console.error("Intelligence Discover data unavailable", error);
  }

  if (!data) {
    return (
      <main className="yi-wrap yi-wrap--wide">
        <p className="yi-kicker">Discover</p>
        <h1 className="yi-title">YouMine Intelligence</h1>
        <p className="yi-flag" role="alert">
          The maps and rankings are temporarily unavailable. You can still read the reports below.
        </p>
        <ReportCards />
      </main>
    );
  }

  const { reserves, hero, maps, charts } = data;
  const mapReports = MAP_REPORTS.map((config) => {
    const { firstYear, lastYear, series, names, sourceName, attribution, builtAt, undrawn, table } = maps[config.id];
    return { ...config, firstYear, lastYear, series, names, sourceName, attribution, builtAt, undrawn, table };
  });

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
        Reserves, with years left at current output. <Link href={`/intelligence/reserves?c=${FEATURED}`}>Open in Data</Link>
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
        {hero.lastYear} (estimate), million barrels a day against own demand. <a href="/intelligence/raw/energy-flip">Read The Energy Flip</a>
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
      <p className="yi-kicker">Discover</p>
      <h1 className="yi-title">The numbers that move mining and energy</h1>
      <p className="yi-lede">
        Explore mining and energy through interactive maps, country rankings and published reports. See the source and reporting period for each chart.
      </p>

      <MapReports reports={mapReports} charts={charts} initialId={requestedMap} />

      <h2 className="yi-section">Start with a question</h2>
      <div className="yi-chips">
        <Link className="yi-btn" href="/intelligence/reserves?c=CU">
          How many years of copper are left?
        </Link>
        <Link className="yi-btn" href="/intelligence/reserves?c=NI&h=AUS">
          Who holds the most nickel?
        </Link>
        <a className="yi-btn" href="/intelligence/raw/energy-flip">
          Who flipped from exporter to importer?
        </a>
        <Link className="yi-btn yi-btn--primary" href={`/intelligence/reserves?c=${surprise}`}>
          Surprise me
        </Link>
      </div>

      <h2 className="yi-section">Mining and energy rankings</h2>
      <div className="yi-tiles">{tiles}</div>

      <ReportCards />

      <footer className="yi-sourcebar">
        <p>
          <strong>Maps:</strong> each map names its source under the map. Where a publisher reported no trade or no reading, the
          country is hatched, not shown as zero. Former states such as the Soviet Union are not drawn, so the oil, gas and copper
          maps start in {hero.firstYear}. The latest energy year is a publisher estimate.
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
