import Link from "next/link";
import { getReserveRowsPage, RESERVE_ROWS_PAGE_SIZE } from "@/lib/intelligence/published";
import { intelligenceMetadata } from "@/lib/intelligence/seo";

const path = "/intelligence/reserves/rows";
const number = new Intl.NumberFormat("en", { maximumFractionDigits: 2 });

export const dynamic = "force-dynamic";
export const metadata = {
  ...intelligenceMetadata(
    path,
    "Browse Mineral Reserves and Production Data | YouMine Intelligence",
    "Inspect the reported mineral reserves, annual mine output and sources behind the published reserves-to-production rankings.",
  ),
  robots: { index: false, follow: true },
};

function readFilter(value, pattern) {
  if (typeof value !== "string") return "";
  const normalized = value.trim().toUpperCase();
  return pattern.test(normalized) ? normalized : "";
}

function readPage(value) {
  const page = Number(value);
  return Number.isSafeInteger(page * RESERVE_ROWS_PAGE_SIZE) && Number.isInteger(page) && page > 0 ? page : 1;
}

function pageLink(filters, page) {
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
  if (page > 1) query.set("page", String(page));
  return query.size ? `${path}?${query}` : path;
}

function filterOptions(rows, code, label) {
  return [...new Map(rows.map((row) => [row[code], row[label]])).entries()]
    .sort((a, b) => a[1].localeCompare(b[1], "en"));
}

function SelectFilter({ name, label, value, options, empty }) {
  return (
    <div className="yi-ctrl">
      <label htmlFor={`reserve-filter-${name}`}>{label}</label>
      <select className="yi-select" id={`reserve-filter-${name}`} name={name} defaultValue={value}>
        <option value="">{empty}</option>
        {value && !options.some(([code]) => code === value) && <option value={value}>{value}</option>}
        {options.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
      </select>
    </div>
  );
}

export default async function ReserveRowsPage({ searchParams }) {
  const params = await searchParams;
  const filters = {
    commodity: readFilter(params.commodity, /^[A-Z0-9_]{1,40}$/),
    country: readFilter(params.country, /^[A-Z]{3}$/),
    source: readFilter(params.source, /^[A-Z0-9_]{1,24}$/),
    year: readFilter(params.year, /^\d{4}$/),
  };
  const page = readPage(params.page);
  let data = null;
  try {
    data = await getReserveRowsPage({ ...filters, page });
  } catch (error) {
    console.error("Intelligence reserve rows unavailable", error);
  }

  const options = data?.options || [];
  const sourceOptions = [...new Set(options.flatMap((row) => [row.reserve_source_code, row.production_source_code]))]
    .sort().map((code) => [code, code]);
  return (
    <main className="yi-wrap yi-wrap--wide">
      <div className="yi-actions">
        <Link className="yi-back" href="/intelligence/sources">Database diagram</Link>
        <Link className="yi-back" href="/intelligence/reserves">Reserves chart</Link>
      </div>
      <h1 className="yi-title">Reserves ranking rows</h1>
      <p className="yi-lede">
        Browse <code>published.reserves_to_production</code>. Open a row to see the published figures, reporting years and source for each input.
      </p>

      {!data ? (
        <p className="yi-flag" role="alert">The published rows are temporarily unavailable.</p>
      ) : (
        <>
          <form action={path} method="get" className="yi-toolbar">
            <SelectFilter name="commodity" label="Commodity" value={filters.commodity}
              options={filterOptions(options, "commodity_code", "commodity_name")} empty="All commodities" />
            <SelectFilter name="country" label="Country" value={filters.country}
              options={filterOptions(options, "iso_alpha3", "country_name")} empty="All countries" />
            <SelectFilter name="source" label="Source (either input)" value={filters.source}
              options={sourceOptions} empty="All sources" />
            <div className="yi-ctrl">
              <label htmlFor="reserve-filter-year">Reporting year (either input)</label>
              <input className="yi-select" id="reserve-filter-year" name="year" inputMode="numeric"
                pattern="[0-9]{4}" maxLength={4} placeholder="Any year" defaultValue={filters.year} />
            </div>
            <div className="yi-actions">
              <button type="submit" className="yi-btn yi-btn--primary">Apply filters</button>
              <Link href={path} className="yi-btn" prefetch={false}>Clear</Link>
            </div>
          </form>

          {data.rows.length ? (
            <div className="yi-scroll" role="region" aria-label="Reserves and production rows" tabIndex={0}>
              <table className="yi-table">
                <thead>
                  <tr>
                    <th scope="col">Commodity</th>
                    <th scope="col">Country</th>
                    <th scope="col">Reserves (t)</th>
                    <th scope="col">Production (t/yr)</th>
                    <th scope="col">Ratio (years)</th>
                    <th scope="col">Inputs</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr key={`${row.commodity_code}:${row.iso_alpha3}`}>
                      <td>{row.commodity_name}</td>
                      <td>{row.country_name}</td>
                      <td className="yi-num">{number.format(row.reserves_t)}</td>
                      <td className="yi-num">{number.format(row.production_t)}</td>
                      <td className="yi-num">{number.format(row.years_remaining)}</td>
                      <td>
                        <Link prefetch={false} href={`${path}/${row.commodity_code}/${row.iso_alpha3}`}
                          aria-label={`Inspect ${row.commodity_name} inputs for ${row.country_name}`}>Inspect</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="yi-flag">No rows on this page. Change the filters or return to the first page.</p>
          )}

          <nav className="yi-toolbar" aria-label="Rows pagination">
            <p className="yi-fresh">Page {page} · {data.rows.length} {data.rows.length === 1 ? "row" : "rows"} shown</p>
            <div className="yi-actions">
              {page > 1 && <Link className="yi-btn" prefetch={false} href={pageLink(filters, page - 1)}>Previous</Link>}
              {page > 2 && <Link className="yi-btn" prefetch={false} href={pageLink(filters, 1)}>First page</Link>}
              {data.hasNext && <Link className="yi-btn" prefetch={false} href={pageLink(filters, page + 1)}>Next</Link>}
            </div>
          </nav>
        </>
      )}
    </main>
  );
}
