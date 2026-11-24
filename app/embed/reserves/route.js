import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/siteUrl";
import { DEFAULT_SHARE_IMAGE } from "@/lib/socialMetadata";
import { getReservesToProduction } from "@/lib/intelligence/published";

export const runtime = "nodejs";

// Embeds are public and cached, so the data is held briefly in memory instead of read per request.
const DATA_TTL_MS = 5 * 60 * 1000;
let dataCache = { at: 0, value: null };
let tokensCss = null;

async function loadData() {
  if (dataCache.value && Date.now() - dataCache.at < DATA_TTL_MS) return dataCache.value;
  const value = await getReservesToProduction();
  dataCache = { at: Date.now(), value };
  return value;
}

// The embed reuses the same stylesheet as the app so the two never drift.
async function loadTokens() {
  if (!tokensCss) tokensCss = await readFile(path.join(process.cwd(), "app", "intelligence", "tokens.css"), "utf8");
  return tokensCss;
}

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const EMBED_CSS = `
.yi{--font-plex-sans:"IBM Plex Sans";--font-plex-serif:"IBM Plex Serif";--font-plex-mono:"IBM Plex Mono"}
html{-webkit-text-size-adjust:100%}
body.yi{margin:0;min-height:0}
.yi[data-theme="dark"]{
  --yi-surface:#1a1a19;--yi-raised:#222221;--yi-sunken:#141413;--yi-ink:#f2f1ec;--yi-ink-2:#b4b3ab;--yi-ink-3:#86857d;
  --yi-rule:#33332f;--yi-rule-2:#44443f;--yi-gain:#3987e5;--yi-lost:#d95926;--yi-lost-soft:rgba(217,89,38,.18);color-scheme:dark
}
.yi-embed{padding:1rem max(16px,env(safe-area-inset-left,0px)) 1.25rem}
.yi-embed-title{font-family:var(--yi-serif);font-weight:600;font-size:clamp(1.15rem,3.4vw,1.5rem);line-height:1.2;letter-spacing:-.01em;margin:.3rem 0 .9rem}
.yi-powered{color:var(--yi-ink-2);font-weight:600;text-decoration:underline;text-underline-offset:3px}
.yi-powered:hover{color:var(--yi-ink)}
.yi-embed .yi-detail{margin-top:.8rem}
`;

const SCRIPT = String.raw`
(function () {
  var d = JSON.parse(document.getElementById("d").textContent);
  var rows = d.rows;
  var TICKS = [1, 10, 100, 1000, 10000, 100000];
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function fmt(n) { return Math.round(n).toLocaleString("en-US"); }
  function yearsLabel(y) { return y >= 100 ? fmt(y) : y.toFixed(1); }
  function tonnes(t) {
    if (t >= 1e9) return (t / 1e9).toFixed(1) + " bn t";
    if (t >= 1e6) return (t / 1e6).toFixed(1) + " M t";
    if (t >= 1e3) return fmt(t / 1e3) + " k t";
    return t >= 10 ? fmt(t) + " t" : t.toFixed(2) + " t";
  }
  var ys = rows.map(function (r) { return r.years_remaining; });
  var lo = Math.pow(10, Math.floor(Math.log10(Math.min(Math.min.apply(null, ys), 1.5))));
  var hi = Math.pow(10, Math.ceil(Math.log10(Math.max.apply(null, ys))));
  if (hi <= lo) hi = lo * 10;
  var ticks = TICKS.filter(function (t) { return t >= lo && t <= hi; });
  function pos(y) { return ((Math.log10(Math.max(y, lo)) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo))) * 100; }

  var active = Math.max(0, rows.findIndex(function (r) { return r.iso_alpha3 === d.highlight; }));
  var chart = document.getElementById("chart");
  var detail = document.getElementById("detail");

  function drawDetail() {
    var r = rows[active];
    var items = [
      ["Country", r.country_name], ["Reserves", tonnes(r.reserves_t)], ["Mine production", tonnes(r.production_t)],
      ["Years remaining", yearsLabel(r.years_remaining)],
      ["Reserve rank", r.reserve_rank + " of " + r.n_ranked], ["Production rank", r.production_rank + " of " + r.n_ranked]
    ];
    detail.textContent = "";
    items.forEach(function (it, i) {
      var box = el("div");
      box.appendChild(el("dt", null, it[0]));
      box.appendChild(el("dd", i ? "yi-num" : null, it[1]));
      detail.appendChild(box);
    });
  }

  function drawChart() {
    chart.textContent = "";
    var axis = el("div", "yi-rp-axis");
    axis.setAttribute("aria-hidden", "true");
    axis.appendChild(el("div", "yi-rp-pad", "years"));
    var tickBox = el("div", "yi-rp-ticks");
    ticks.forEach(function (t) {
      var s = el("span", null, t >= 1000 ? t / 1000 + "k" : String(t));
      s.style.left = pos(t).toFixed(2) + "%";
      tickBox.appendChild(s);
    });
    axis.appendChild(tickBox);
    chart.appendChild(axis);

    var list = el("ul", "yi-rp-rows");
    rows.forEach(function (r, i) {
      var p = pos(r.years_remaining);
      var isActive = i === active, isHl = r.iso_alpha3 === d.highlight;
      var li = el("li");
      var b = el("button", "yi-rp-row" + (isActive ? " is-active" : "") + (isHl ? " is-highlight" : ""));
      b.type = "button";
      b.setAttribute("aria-pressed", String(isActive));
      b.setAttribute("aria-label", r.country_name + ", " + yearsLabel(r.years_remaining) + " years");
      var lab = el("span", "yi-rp-lab");
      lab.appendChild(el("span", "yi-rp-name", r.country_name));
      lab.appendChild(el("span", "yi-rp-rank yi-num", "R" + r.reserve_rank + " / P" + r.production_rank));
      var track = el("span", "yi-rp-track");
      ticks.forEach(function (t) { var g = el("i"); g.style.left = pos(t).toFixed(2) + "%"; track.appendChild(g); });
      var stem = el("span", "yi-rp-stem"); stem.style.width = p.toFixed(2) + "%"; track.appendChild(stem);
      var dot = el("span", "yi-rp-dot"); dot.style.left = p.toFixed(2) + "%"; track.appendChild(dot);
      if (i < 3 || isActive || isHl) {
        var v = el("span", "yi-rp-val yi-num", yearsLabel(r.years_remaining));
        if (p > 72) { v.style.right = (100 - p).toFixed(2) + "%"; v.style.marginRight = "12px"; }
        else { v.style.left = p.toFixed(2) + "%"; v.style.marginLeft = "12px"; }
        track.appendChild(v);
      }
      b.appendChild(lab); b.appendChild(track);
      b.addEventListener("click", function () { active = i; drawChart(); drawDetail(); });
      li.appendChild(b); list.appendChild(li);
    });
    chart.appendChild(list);
  }

  drawChart();
  drawDetail();
})();
`;

function page(status, title, body) {
  return new NextResponse(
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title><body style="font-family:system-ui,sans-serif;padding:1rem;color:#4a4a42">${body}</body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" } }
  );
}

export async function GET(request) {
  const url = new URL(request.url);
  const code = (url.searchParams.get("c") || "").trim();
  const highlight = (url.searchParams.get("h") || "").trim().toUpperCase();
  const theme = url.searchParams.get("theme") === "dark" ? "dark" : "light";

  let data;
  try {
    data = await loadData();
  } catch {
    return page(502, "Chart unavailable", "<p>This chart is temporarily unavailable.</p>");
  }

  const rows = data.rows.filter((r) => r.commodity_code === code).sort((a, b) => b.years_remaining - a.years_remaining);
  if (!rows.length) return page(404, "Chart not found", "<p>This chart does not exist.</p>");

  const lead = rows[0];
  const byCode = Object.fromEntries(data.sources.map((s) => [s.source_code, s]));
  const reserveSource = byCode[lead.reserve_source_code];
  const productionSource = byCode[lead.production_source_code];
  const attributions = [...new Set([reserveSource, productionSource].filter(Boolean).map((s) => s.attribution_text).filter(Boolean))];
  const note = data.notes[code];
  const highlightRow = rows.find((r) => r.iso_alpha3 === highlight);
  const base = getBaseUrl(request);
  const builtAt = data.builtAt ? `${new Date(data.builtAt).toISOString().slice(0, 16).replace("T", " ")} UTC` : "unknown";

  const payload = JSON.stringify({ rows, highlight: highlightRow ? highlight : "" }).replace(/</g, "\\u003c");
  const css = (await loadTokens()) + EMBED_CSS;
  const title = `Years of reserves remaining: ${lead.commodity_name}`;
  const description = `Compare reported ${lead.commodity_name.toLowerCase()} reserves and annual mine production by country.`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex">
<title>${esc(title)} · YouMine Intelligence</title>
<meta name="description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="YouMine Intelligence">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(DEFAULT_SHARE_IMAGE.url)}">
<meta property="og:image:alt" content="${esc(DEFAULT_SHARE_IMAGE.alt)}">
<meta property="og:image:width" content="${DEFAULT_SHARE_IMAGE.width}">
<meta property="og:image:height" content="${DEFAULT_SHARE_IMAGE.height}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${esc(DEFAULT_SHARE_IMAGE.url)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Serif:wght@600&display=swap">
<style>${css}</style>
</head>
<body class="yi" data-theme="${theme}">
<main class="yi-embed">
  <p class="yi-kicker">YouMine Intelligence</p>
  <h1 class="yi-embed-title">${esc(title)}</h1>
  <div class="yi-card"><div class="yi-rp" id="chart"></div></div>
  <dl class="yi-detail" id="detail" aria-live="polite"></dl>
  ${note ? `<p class="yi-flag"><strong>About this commodity.</strong> ${esc(note)}</p>` : ""}
  <p class="yi-coverage"><span class="yi-num">${rows.length}</span> countries with both figures, on a log scale. Reserves are for ${esc(lead.reserve_year)} and production for ${esc(lead.production_year)}; the latest production year is the publisher&rsquo;s estimate for an incomplete year.${highlight && !highlightRow ? " The highlighted country is not ranked for this commodity." : ""}</p>
  <footer class="yi-sourcebar">
    <p><strong>Reserves:</strong> ${esc(reserveSource?.name || lead.reserve_source_code)}. <strong>Production:</strong> ${esc(productionSource?.name || lead.production_source_code)}.</p>
    ${attributions.map((text) => `<p>${esc(text)}</p>`).join("")}
    <p>Reserves and production are the publishers&rsquo; own figures; the ratio is ours. Data as of <span class="yi-num">${esc(builtAt)}</span>. <a class="yi-powered" href="${esc(base)}" target="_blank" rel="noopener">Powered by YouMine</a></p>
  </footer>
</main>
<script type="application/json" id="d">${payload}</script>
<script>${SCRIPT}</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      // Embeds are meant to be framed anywhere; content is locked down instead.
      "Content-Security-Policy": [
        "default-src 'none'",
        "script-src 'unsafe-inline'",
        "style-src 'unsafe-inline' https://fonts.googleapis.com",
        "font-src https://fonts.gstatic.com",
        "base-uri 'none'",
        "form-action 'none'",
        "frame-ancestors *",
      ].join("; "),
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex",
    },
  });
}
