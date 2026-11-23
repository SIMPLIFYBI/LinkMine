"use client";

import { useEffect, useMemo, useState } from "react";

const TICKS = [1, 10, 100, 1000, 10000, 100000];

const fmt = (n) => Math.round(n).toLocaleString("en-US");
const yearsLabel = (y) => (y >= 100 ? fmt(y) : y.toFixed(1));

function tonnes(t) {
  if (t >= 1e9) return `${(t / 1e9).toFixed(1)} bn t`;
  if (t >= 1e6) return `${(t / 1e6).toFixed(1)} M t`;
  if (t >= 1e3) return `${fmt(t / 1e3)} k t`;
  return t >= 10 ? `${fmt(t)} t` : `${t.toFixed(2)} t`;
}

function logPos(y, lo, hi) {
  const a = Math.log10(Math.max(y, lo));
  const l = Math.log10(lo);
  const h = Math.log10(hi);
  return ((a - l) / (h - l)) * 100;
}

function stamp(iso) {
  return iso ? `${new Date(iso).toISOString().slice(0, 16).replace("T", " ")} UTC` : "unknown";
}

export default function ReservesExplorer({ rows, notes, sources, builtAt, initial }) {
  const commodities = useMemo(() => {
    const seen = new Map();
    rows.forEach((r) => seen.set(r.commodity_code, r.commodity_name));
    return [...seen].map(([code, name]) => ({ code, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const countries = useMemo(() => {
    const seen = new Map();
    rows.forEach((r) => seen.set(r.iso_alpha3, r.country_name));
    return [...seen].map(([iso, name]) => ({ iso, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const defaultCode = commodities.some((c) => c.code === "CU") ? "CU" : commodities[0]?.code;
  const [code, setCode] = useState(commodities.some((c) => c.code === initial?.code) ? initial.code : defaultCode);
  const [highlight, setHighlight] = useState(countries.some((c) => c.iso === initial?.highlight) ? initial.highlight : "");
  const [view, setView] = useState(initial?.view === "table" ? "table" : "chart");
  const [picked, setPicked] = useState(null);
  const [copied, setCopied] = useState(false);
  const [embedTheme, setEmbedTheme] = useState("light");
  const [embedCopied, setEmbedCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);

  // The URL always describes the current view, so any state can be shared by copying the address.
  useEffect(() => {
    const params = new URLSearchParams({ c: code });
    if (highlight) params.set("h", highlight);
    if (view === "table") params.set("v", "table");
    window.history.replaceState(null, "", `${window.location.pathname}?${params}`);
  }, [code, highlight, view]);

  async function copyLink() {
    await copyText(window.location.href, setCopied);
  }

  async function copyText(text, flag) {
    try {
      await navigator.clipboard.writeText(text);
      flag(true);
      setTimeout(() => flag(false), 2000);
    } catch {
      window.prompt("Copy this", text);
    }
  }

  const list = useMemo(
    () => rows.filter((r) => r.commodity_code === code).sort((a, b) => b.years_remaining - a.years_remaining),
    [rows, code]
  );

  const scale = useMemo(() => {
    const ys = list.map((r) => r.years_remaining);
    const lo = Math.pow(10, Math.floor(Math.log10(Math.min(Math.min(...ys), 1.5))));
    let hi = Math.pow(10, Math.ceil(Math.log10(Math.max(...ys))));
    if (hi <= lo) hi = lo * 10;
    return { lo, hi, ticks: TICKS.filter((t) => t >= lo && t <= hi) };
  }, [list]);

  if (!list.length) return <p className="yi-flag">No ranked countries for this selection.</p>;

  const active = list.find((r) => r.iso_alpha3 === picked) || list.find((r) => r.iso_alpha3 === highlight) || list[0];
  const lead = list[0];
  const byCode = Object.fromEntries(sources.map((s) => [s.source_code, s]));
  const reserveSource = byCode[lead.reserve_source_code];
  const productionSource = byCode[lead.production_source_code];
  const attributions = [...new Set([reserveSource, productionSource].filter(Boolean).map((s) => s.attribution_text).filter(Boolean))];
  const note = notes[code];
  const embedParams = new URLSearchParams({ c: code });
  if (highlight) embedParams.set("h", highlight);
  if (embedTheme === "dark") embedParams.set("theme", "dark");
  const embedUrl = `${origin}/embed/reserves?${embedParams}`;
  const embedHeight = 560 + list.length * 32 + (note ? 130 : 0);
  const embedCode = `<iframe src="${embedUrl}" title="Years of reserves remaining: ${lead.commodity_name}" width="100%" height="${embedHeight}" style="border:0;max-width:100%" loading="lazy"></iframe>`;
  const highlightName = countries.find((c) => c.iso === highlight)?.name;
  const highlightMissing = Boolean(highlight) && !list.some((r) => r.iso_alpha3 === highlight);

  function chooseCommodity(next) {
    setCode(next);
    setPicked(null);
  }

  return (
    <>
      <div className="yi-controls">
        <div className="yi-ctrl">
          <label htmlFor="yi-com">Commodity</label>
          <select id="yi-com" className="yi-select" value={code} onChange={(e) => chooseCommodity(e.target.value)}>
            {commodities.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="yi-ctrl">
          <label htmlFor="yi-hl">Highlight country</label>
          <select id="yi-hl" className="yi-select" value={highlight} onChange={(e) => setHighlight(e.target.value)}>
            <option value="">None</option>
            {countries.map((c) => (
              <option key={c.iso} value={c.iso}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="yi-ctrl">
          <label htmlFor="yi-view">View</label>
          <button
            id="yi-view"
            type="button"
            className="yi-select yi-toggle"
            aria-pressed={view === "table"}
            onClick={() => setView(view === "chart" ? "table" : "chart")}
          >
            {view === "chart" ? "Show as table" : "Show as chart"}
          </button>
        </div>
        <div className="yi-ctrl">
          <label htmlFor="yi-share">Share</label>
          <button id="yi-share" type="button" className="yi-select yi-toggle" onClick={copyLink}>
            {copied ? "Link copied" : "Copy link"}
          </button>
        </div>
      </div>

      <details className="yi-embedbox">
        <summary>Embed this chart</summary>
        <p>
          Paste this code into any web page. The chart follows the choices above, stays current as new data is
          published, and always shows its sources, data date and a link back to YouMine.
        </p>
        <div className="yi-ctrl">
          <label htmlFor="yi-embed-theme">Theme</label>
          <select id="yi-embed-theme" className="yi-select" value={embedTheme} onChange={(e) => setEmbedTheme(e.target.value)}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <textarea
          className="yi-embedcode yi-num"
          readOnly
          rows={4}
          value={origin ? embedCode : ""}
          aria-label="Embed code"
          onFocus={(e) => e.target.select()}
        />
        <div className="yi-actions">
          <button type="button" className="yi-btn yi-btn--primary" onClick={() => copyText(embedCode, setEmbedCopied)}>
            {embedCopied ? "Embed code copied" : "Copy embed code"}
          </button>
          <a className="yi-btn" href={embedUrl} target="_blank" rel="noopener noreferrer">
            Open embed
          </a>
        </div>
      </details>

      <div className="yi-card">
        {view === "chart" ? (
          <div className="yi-rp">
            <div className="yi-rp-axis" aria-hidden="true">
              <div className="yi-rp-pad">years</div>
              <div className="yi-rp-ticks">
                {scale.ticks.map((t) => (
                  <span key={t} style={{ left: `${logPos(t, scale.lo, scale.hi).toFixed(2)}%` }}>
                    {t >= 1000 ? `${t / 1000}k` : t}
                  </span>
                ))}
              </div>
            </div>
            <ul className="yi-rp-rows">
              {list.map((r, i) => {
                const p = logPos(r.years_remaining, scale.lo, scale.hi);
                const isActive = r.iso_alpha3 === active.iso_alpha3;
                const isHighlight = r.iso_alpha3 === highlight;
                const labelled = i < 3 || isActive || isHighlight;
                return (
                  <li key={r.iso_alpha3}>
                    <button
                      type="button"
                      className={`yi-rp-row${isActive ? " is-active" : ""}${isHighlight ? " is-highlight" : ""}`}
                      aria-pressed={isActive}
                      aria-label={`${r.country_name}, ${yearsLabel(r.years_remaining)} years`}
                      onClick={() => setPicked(r.iso_alpha3)}
                    >
                      <span className="yi-rp-lab">
                        <span className="yi-rp-name">{r.country_name}</span>
                        <span className="yi-rp-rank yi-num">
                          R{r.reserve_rank} / P{r.production_rank}
                        </span>
                      </span>
                      <span className="yi-rp-track">
                        {scale.ticks.map((t) => (
                          <i key={t} style={{ left: `${logPos(t, scale.lo, scale.hi).toFixed(2)}%` }} />
                        ))}
                        <span className="yi-rp-stem" style={{ width: `${p.toFixed(2)}%` }} />
                        <span className="yi-rp-dot" style={{ left: `${p.toFixed(2)}%` }} />
                        {labelled ? (
                          <span
                            className="yi-rp-val yi-num"
                            style={p > 72 ? { right: `${(100 - p).toFixed(2)}%`, marginRight: 12 } : { left: `${p.toFixed(2)}%`, marginLeft: 12 }}
                          >
                            {yearsLabel(r.years_remaining)}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="yi-scroll">
            <table className="yi-table">
              <thead>
                <tr>
                  <th>Country</th>
                  <th>Reserves</th>
                  <th>Mine production</th>
                  <th>Years</th>
                  <th>Reserve rank</th>
                  <th>Production rank</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.iso_alpha3} className={r.iso_alpha3 === highlight ? "is-highlight" : undefined}>
                    <td>{r.country_name}</td>
                    <td className="yi-num">{tonnes(r.reserves_t)}</td>
                    <td className="yi-num">{tonnes(r.production_t)}</td>
                    <td className="yi-num">{yearsLabel(r.years_remaining)}</td>
                    <td className="yi-num">
                      {r.reserve_rank} of {r.n_ranked}
                    </td>
                    <td className="yi-num">
                      {r.production_rank} of {r.n_ranked}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {highlightMissing ? (
        <p className="yi-coverage" role="status">
          <strong>{highlightName}</strong> is not ranked for {lead.commodity_name.toLowerCase()}: it has no reported reserves,
          or no reported non-zero production, for {lead.reserve_year}.
        </p>
      ) : null}

      {view === "chart" ? (
        <dl className="yi-detail" aria-live="polite">
          <div>
            <dt>Country</dt>
            <dd>{active.country_name}</dd>
          </div>
          <div>
            <dt>Reserves</dt>
            <dd className="yi-num">{tonnes(active.reserves_t)}</dd>
          </div>
          <div>
            <dt>Mine production</dt>
            <dd className="yi-num">{tonnes(active.production_t)}</dd>
          </div>
          <div>
            <dt>Years remaining</dt>
            <dd className="yi-num">{yearsLabel(active.years_remaining)}</dd>
          </div>
          <div>
            <dt>Reserve rank</dt>
            <dd className="yi-num">
              {active.reserve_rank} of {active.n_ranked}
            </dd>
          </div>
          <div>
            <dt>Production rank</dt>
            <dd className="yi-num">
              {active.production_rank} of {active.n_ranked}
            </dd>
          </div>
        </dl>
      ) : null}

      {note ? (
        <p className="yi-flag">
          <strong>About this commodity.</strong> {note}
        </p>
      ) : null}

      <p className="yi-coverage">
        <span className="yi-num">{list.length}</span> countries with both figures. Countries that publish only one of
        the two are not ranked. Reserves are for {lead.reserve_year} and production for {lead.production_year}; the
        latest production year is the publisher&rsquo;s estimate for an incomplete year.
      </p>

      <footer className="yi-sourcebar">
        <p>
          <strong>Reserves:</strong> {reserveSource?.name || lead.reserve_source_code}.{" "}
          <strong>Production:</strong> {productionSource?.name || lead.production_source_code}.
        </p>
        {attributions.map((text) => (
          <p key={text}>{text}</p>
        ))}
        <p>
          Reserves and production are the publishers&rsquo; own figures; the ratio is ours. Published data refreshed{" "}
          <span className="yi-num">{stamp(builtAt)}</span>.
        </p>
      </footer>
    </>
  );
}
