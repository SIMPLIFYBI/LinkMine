"use client";

import { useEffect, useState } from "react";

// Shows where a chosen country sits across the ranked commodities. The choice is remembered on this device.
export default function YourCountryTile({ ranks, countries }) {
  const [iso, setIso] = useState("AUS");

  useEffect(() => {
    const saved = window.localStorage.getItem("yi-country");
    if (saved && countries.some((c) => c.iso === saved)) setIso(saved);
  }, [countries]);

  function choose(next) {
    setIso(next);
    window.localStorage.setItem("yi-country", next);
  }

  const mine = ranks.filter((r) => r.iso === iso).sort((a, b) => a.rr - b.rr);
  const top = mine.slice(0, 4);
  const name = countries.find((c) => c.iso === iso)?.name || iso;

  return (
    <article className="yi-tile">
      <p className="yi-kicker">Your country</p>
      <h3>Where {name} ranks for reserves</h3>
      <div className="yi-ctrl">
        <label htmlFor="yi-home-country">Country</label>
        <select id="yi-home-country" className="yi-select" value={iso} onChange={(e) => choose(e.target.value)}>
          {countries.map((c) => (
            <option key={c.iso} value={c.iso}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      {top.length ? (
        <ul className="yi-bars">
          {top.map((r) => (
            <li key={r.code}>
              <span title={r.commodity}>{r.commodity}</span>
              <span className="yi-num">
                {r.rr} of {r.n}
              </span>
              <span className="yi-bars__track" aria-hidden="true">
                <span className="yi-bars__fill" style={{ width: `${Math.max(6, (1 - (r.rr - 1) / r.n) * 100)}%` }} />
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="yi-fresh">{name} is not ranked for any commodity here.</p>
      )}
      <p className="yi-tile__foot">
        Best reserve ranks among the {ranks.filter((r) => r.iso === iso).length} commodities where {name} has both figures.{" "}
        <a href={`/intelligence/reserves?c=${(top[0] || ranks[0])?.code}&h=${iso}`}>Open in Data</a>
      </p>
    </article>
  );
}
