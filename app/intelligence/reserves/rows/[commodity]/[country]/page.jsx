import Link from "next/link";
import { notFound } from "next/navigation";
import { getReserveRowInputs } from "@/lib/intelligence/published";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Reserve and production inputs",
  robots: { index: false, follow: true },
};

const number = new Intl.NumberFormat("en", { maximumSignificantDigits: 12 });
const ratio = new Intl.NumberFormat("en", { maximumFractionDigits: 2 });

function PublishedInput({ label, value, unit, year, basis, bound, sourceCode, source }) {
  const licenceUrl = /^https?:\/\//i.test(source?.licence_url || "") ? source.licence_url : null;
  return (
    <article className="yi-tile">
      <h2 className="yi-section">{label}</h2>
      <dl className="yi-dl">
        <div><dt>Published quantity</dt><dd className="yi-num">{number.format(value)} {unit}</dd></div>
        <div><dt>Reporting year</dt><dd>{year}</dd></div>
        {basis && <div><dt>Measurement basis</dt><dd>{basis}</dd></div>}
        {bound && bound !== "exact" && <div><dt>Source qualifier</dt><dd>{bound}</dd></div>}
        <div><dt>Source</dt><dd>{source ? `${source.name} (${sourceCode})` : sourceCode}</dd></div>
        {source?.publisher && <div><dt>Publisher</dt><dd>{source.publisher}</dd></div>}
        {source?.licence_name && (
          <div><dt>Licence</dt><dd>{licenceUrl ? <a href={licenceUrl}>{source.licence_name}</a> : source.licence_name}</dd></div>
        )}
        {source?.attribution_text && <div><dt>Attribution</dt><dd>{source.attribution_text}</dd></div>}
      </dl>
    </article>
  );
}

export default async function ReserveRowPage({ params }) {
  const { commodity, country } = await params;
  if (!/^[A-Z0-9_]{1,40}$/.test(commodity) || !/^[A-Z]{3}$/.test(country)) notFound();
  let data;
  try {
    data = await getReserveRowInputs(commodity, country);
  } catch (error) {
    console.error("Intelligence reserve row unavailable", error);
  }
  if (data === null) notFound();

  return (
    <main className="yi-wrap">
      <Link className="yi-back" href="/intelligence/reserves/rows" prefetch={false}>Browse rows</Link>
      {!data ? (
        <p className="yi-flag" role="alert">The published inputs are temporarily unavailable.</p>
      ) : <ReserveInputs data={data} />}
    </main>
  );
}

function ReserveInputs({ data: { row, basis, sources } }) {
  const sourceByCode = new Map(sources.map((source) => [source.source_code, source]));
  return (
    <>
      <p className="yi-kicker">Published reserves ranking</p>
      <h1 className="yi-title">{row.commodity_name} in {row.country_name}</h1>
      <p className="yi-lede">
        {ratio.format(row.years_remaining)} years at the reported production rate.
      </p>
      <p className="yi-fresh">
        The ratio divides the published reserves by one year of mine production. Both inputs are converted to tonnes.
        It describes output at the reported rate, which can change over time.
      </p>
      {basis?.note && <p className="yi-flag">{basis.note}</p>}
      <div className="yi-tiles">
        <PublishedInput label="Reserves" value={row.reserves_t} unit="t" year={row.reserve_year}
          basis={basis?.reserve_detail} bound={row.reserve_bound} sourceCode={row.reserve_source_code}
          source={sourceByCode.get(row.reserve_source_code)} />
        <PublishedInput label="Annual mine production" value={row.production_t} unit="t/yr" year={row.production_year}
          basis={basis?.production_detail} bound={row.production_bound} sourceCode={row.production_source_code}
          source={sourceByCode.get(row.production_source_code)} />
      </div>
      <p className="yi-fresh">
        <Link href={`/intelligence/reserves?c=${row.commodity_code}&h=${row.iso_alpha3}`} prefetch={false}>Open this country in the reserves chart</Link>
      </p>
    </>
  );
}
