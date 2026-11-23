"use client";

import Link from "next/link";
import { useState } from "react";
import { Database, FileText, Layers3, LibraryBig, Network } from "lucide-react";
import styles from "./sources.module.css";

const TABLES = {
  series: ["Data Explorer", "published.series", "Groups observations by source, measure, commodity or product, basis and unit. Each row holds a series for one country.", "/intelligence/data"],
  reserves: ["Reserves ranking", "published.reserves_to_production", "Joins reserves and annual production for the same commodity and jurisdiction. The published view converts both inputs to tonnes and retains their individual reporting years and source codes.", "/intelligence/reserves"],
  catalogue: ["Source catalogue", "published.source", "Lists sources cleared for commercial reuse, with their publishers, licences and attribution. Browse the catalogue below."],
  mining: ["Mining statistics", "mining.country_commodity_statistic", "Holds country-level measures including mineral production, trade and reserves, with a reference year and quantity unit."],
  petroleum: ["Petroleum statistics", "petroleum.country_product_statistic", "Holds country-level petroleum product measures such as dry natural gas production and imports."],
  power: ["Power statistics", "power.country_source_statistic", "Holds country-level electricity statistics by generation source, such as wind or solar."],
  countries: ["Jurisdictions", "core.jurisdiction", "Provides shared jurisdiction IDs and the ISO alpha-3 country codes used by the published data."],
  commodities: ["Commodities", "core.commodity", "Provides shared commodity IDs, names and codes for mining observations."],
  provenance: ["Source provenance", "prov.*", "A statistic’s source_record_id points to prov.source_record. That record points to prov.source_run, which points to prov.source and its publisher and licence metadata."],
};

const CONNECTIONS = [
  ["series", "mining", "Includes mining production and trade series"],
  ["series", "petroleum", "Includes petroleum product series"],
  ["series", "power", "Includes electricity series by generation source"],
  ["reserves", "mining", "Uses reserves and production observations"],
  ["catalogue", "provenance", "Publishes eligible entries from prov.source"],
  ["mining", "countries", "Joins on jurisdiction_id"],
  ["mining", "commodities", "Joins on commodity_id"],
  ["mining", "provenance", "Traces observations by source_record_id"],
  ["petroleum", "countries", "Joins on jurisdiction_id"],
  ["petroleum", "provenance", "Traces observations by source_record_id"],
  ["power", "countries", "Joins on jurisdiction_id"],
  ["power", "provenance", "Traces observations by source_record_id"],
];

const positions = Object.fromEntries(Object.keys(TABLES).map((id, index) => [
  id, { x: 16 + Math.floor(index / 3) * 240, y: 48 + (index % 3) * 108 },
]));

function DatabaseGraph({ selected, onSelect }) {
  return (
    <div className={styles.scroll} tabIndex={0} role="region" aria-label="Scrollable database diagram">
      <div className={styles.canvas}>
        <div className={styles.columns} aria-hidden="true">
          <span>Published views</span><span>Observations</span><span>Reference &amp; provenance</span>
        </div>
        <svg className={styles.edges} viewBox="0 0 720 348" aria-hidden="true">
          {CONNECTIONS.map(([from, to]) => {
            const start = positions[from];
            const end = positions[to];
            const active = from === selected || to === selected;
            const y = start.y + 36;
            const endY = end.y + 36;
            const path = from === "catalogue"
              ? `M ${start.x + 104} ${y + 36} V 332 H ${end.x + 104} V ${endY + 36}`
              : `M ${start.x + 208} ${y} C ${start.x + 226} ${y}, ${end.x - 18} ${endY}, ${end.x} ${endY}`;
            return <path key={from + to} d={path} className={active ? styles.activeEdge : undefined} />;
          })}
        </svg>
        {Object.entries(TABLES).map(([id, [name, schema]], index) => {
          const Icon = [Layers3, Database, LibraryBig][Math.floor(index / 3)];
          return (
            <button
              type="button"
              key={id}
              className={`${styles.node} ${styles.table}`}
              style={{ left: positions[id].x, top: positions[id].y }}
              aria-pressed={selected === id}
              onClick={() => onSelect(id)}
            >
              <span><Icon size={15} aria-hidden="true" /> {name}</span>
              <code>{schema}</code>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SourceDetails({ code, sources }) {
  const source = sources[code];
  const licenceUrl = /^https?:\/\//i.test(source?.licenceUrl || "") ? source.licenceUrl : null;
  return (
    <>
      <h2>{source?.name || code}</h2>
      <dl className={styles.fields}>
        <dt>Source code</dt><dd>{code}</dd>
        {source?.publisher && <><dt>Publisher</dt><dd>{source.publisher}</dd></>}
        {source?.licence && (
          <><dt>Licence</dt><dd>{licenceUrl ? <a href={licenceUrl}>{source.licence}</a> : source.licence}</dd></>
        )}
        {source?.attribution && <><dt>Attribution</dt><dd>{source.attribution}</dd></>}
      </dl>
      {!source && <p>Source details are unavailable.</p>}
    </>
  );
}

export default function SourceExplorer({ reports, initialReport, sources, catalogueAvailable }) {
  const [reportSlug, setReportSlug] = useState(initialReport);
  const [selectedTable, setSelectedTable] = useState("series");
  const report = reports.find(({ slug }) => slug === reportSlug);
  const [selectedSource, setSelectedSource] = useState(report?.codes[0]);
  const [catalogueSource, setCatalogueSource] = useState("");
  const [name, schema, description, href] = TABLES[selectedTable];
  const sourceCodes = Object.keys(sources).sort();

  function chooseReport(slug) {
    setReportSlug(slug);
    setSelectedSource(reports.find((item) => item.slug === slug)?.codes[0]);
  }

  return (
    <>
      <section id="source-diagram" tabIndex={-1} className={styles.explorer} aria-label="Source diagram">
        <div className={styles.toolbar}>
          <div className={styles.mode}>
            <button type="button" aria-pressed={!report} onClick={() => chooseReport("")}>
              <Network size={17} aria-hidden="true" /> Database
            </button>
            <span>{report ? "Report → credited sources" : "Selected database relationships"}</span>
          </div>
          <label>
            <span>Report</span>
            <select value={reportSlug} onChange={(event) => chooseReport(event.target.value)}>
              <option value="">Choose a report</option>
              {reports.map((item) => <option key={item.slug} value={item.slug}>{item.title}</option>)}
            </select>
          </label>
        </div>
        <div className={styles.workspace}>
          {report ? (
            <div className={styles.reportGraph}>
              <div className={styles.reportNode}>
                <FileText size={18} aria-hidden="true" />
                <Link href={`/intelligence/${report.slug}`}>{report.title}</Link>
              </div>
              {report.codes.length ? (
                <ul>
                  {report.codes.map((code) => (
                    <li key={code}>
                      <button type="button" className={styles.node} aria-pressed={code === selectedSource} onClick={() => setSelectedSource(code)}>
                        <span>{sources[code]?.name || code}</span>
                        <code>{code}</code>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : <p>No sources are listed for this report.</p>}
            </div>
          ) : <DatabaseGraph selected={selectedTable} onSelect={setSelectedTable} />}
          <aside className={styles.inspector} aria-label="Selection details" aria-live="polite">
            {report ? (
              selectedSource && <SourceDetails code={selectedSource} sources={sources} />
            ) : (
              <>
                <code>{schema}</code>
                <h2>{name}</h2>
                <p>{description}</p>
                <h3>Connections</h3>
                <ul className={styles.connections}>
                  {CONNECTIONS.filter(([from, to]) => from === selectedTable || to === selectedTable).map(([from, to, relation]) => {
                    const other = from === selectedTable ? to : from;
                    return (
                      <li key={other}>
                        <button type="button" onClick={() => setSelectedTable(other)}>{TABLES[other][0]}</button>
                        <small>{relation}</small>
                      </li>
                    );
                  })}
                </ul>
                {href && <Link href={href}>Open {name.toLowerCase()}</Link>}
              </>
            )}
          </aside>
        </div>
      </section>
      <section className={styles.catalogue}>
        <h2>Source catalogue</h2>
        {!catalogueAvailable && <p>The published catalogue is unavailable. Showing sources from the report registry.</p>}
        <label>
          <span>Dataset</span>
          <select value={catalogueSource} onChange={(event) => setCatalogueSource(event.target.value)}>
            <option value="">Choose a dataset</option>
            {sourceCodes.map((code) => <option key={code} value={code}>{sources[code].name || code} ({code})</option>)}
          </select>
        </label>
        {catalogueSource && (
          <div className={styles.catalogueDetails}>
            <SourceDetails code={catalogueSource} sources={sources} />
            {reports.some(({ codes }) => codes.includes(catalogueSource)) && (
              <>
                <h3>Reports that credit this dataset</h3>
                <ul>
                  {reports.filter(({ codes }) => codes.includes(catalogueSource)).map((item) => (
                    <li key={item.slug}>
                      <button type="button" onClick={() => {
                        chooseReport(item.slug);
                        setSelectedSource(catalogueSource);
                        document.getElementById("source-diagram")?.focus();
                      }}>{item.title}</button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </section>
    </>
  );
}
