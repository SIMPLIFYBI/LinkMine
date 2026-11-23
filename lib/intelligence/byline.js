import { AUTHOR, formatReportDate } from "@/lib/intelligence/author";

// The byline and author box are injected into the standalone report HTML when it is served, so the five
// hand-written report files never carry author details of their own. Styles fall back through each report's
// token names (the reserve report uses --muted and --ground rather than --ink-2 and --surface) to fixed values.

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const STYLE = `<style>
.ym-byline,.ym-author{font-family:var(--sans,var(--font-display,"IBM Plex Sans",system-ui,sans-serif));color:var(--ink,#16160f)}
.ym-byline{display:flex;align-items:center;gap:12px;margin:14px 0 22px;min-width:0}
.ym-byline img,.ym-author img{border-radius:50%;flex:none;object-fit:cover;background:var(--rule,#ddd)}
.ym-byline__text{min-width:0;font-size:14px;line-height:1.35}
.ym-byline__name{font-weight:600}
.ym-byline__name a{color:inherit;text-decoration:none;border-bottom:1px solid var(--rule-2,var(--rule,#ccc))}
.ym-byline__meta{color:var(--ink-2,var(--muted,#55646f));font-size:13px}
.ym-num{font-family:var(--mono,var(--font-data,"IBM Plex Mono",ui-monospace,monospace))}
.ym-draft{display:inline-block;margin-left:6px;padding:0 6px;border:1px solid var(--rule-2,var(--rule,#ccc));border-radius:4px;font-size:11px;letter-spacing:.04em;text-transform:uppercase}
.ym-author-wrap{max-width:60rem;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:8px 48px}
.ym-author{border-top:1px solid var(--rule,#ddd);padding-top:24px;display:flex;gap:16px;align-items:flex-start;min-width:0}
.ym-author__body{min-width:0;max-width:40rem;font-size:14.5px;line-height:1.55;color:var(--ink-2,var(--muted,#55646f))}
.ym-author__body p{margin:0 0 10px}
.ym-author__name{font-size:16px;font-weight:600;color:var(--ink,#16160f);margin:0 0 4px}
.ym-author__links{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.ym-author__links a{font-size:13.5px;font-weight:600;color:var(--ink,#16160f);text-decoration:none;padding:6px 12px;border:1px solid var(--rule-2,var(--rule,#ccc));border-radius:6px}
.ym-author__links a:hover{border-color:var(--ink-2,var(--muted,#55646f))}
.ym-corrections{margin-top:14px;font-size:13.5px}
.ym-corrections h3{font-size:12px;letter-spacing:.08em;text-transform:uppercase;margin:0 0 6px;color:var(--ink,#16160f)}
.ym-corrections ul{margin:0;padding-left:18px}
</style>`;

function dateLine(report) {
  const published = formatReportDate(report.publishedAt);
  const latest = report.corrections?.length ? formatReportDate(report.corrections[report.corrections.length - 1].date) : null;
  if (!published) return `<span class="ym-draft">Draft</span>`;
  let line = `<span class="ym-num">${esc(published)}</span>`;
  if (latest) line += ` · updated <span class="ym-num">${esc(latest)}</span>`;
  return line;
}

export function bylineHtml(report) {
  return `<div class="ym-byline">
  <img src="${AUTHOR.avatar}" alt="" width="44" height="44">
  <div class="ym-byline__text">
    <div class="ym-byline__name">By <a href="${esc(AUTHOR.linkedin)}" target="_blank" rel="noopener author">${esc(AUTHOR.name)}</a> · ${dateLine(report)}</div>
    <div class="ym-byline__meta">${esc(AUTHOR.credential)}</div>
  </div>
</div>`;
}

function correctionsHtml(report) {
  if (!report.publishedAt) return "";
  if (!report.corrections?.length) {
    return `<div class="ym-corrections"><h3>Corrections</h3><p>None since publication. If you find an error, tell me and I will correct it here.</p></div>`;
  }
  const items = report.corrections
    .map((c) => `<li><span class="ym-num">${esc(formatReportDate(c.date))}</span>: ${esc(c.text)}</li>`)
    .join("");
  return `<div class="ym-corrections"><h3>Corrections</h3><ul>${items}</ul></div>`;
}

export function authorBoxHtml(report) {
  return `<div class="ym-author-wrap"><aside class="ym-author" aria-label="About the author">
  <img src="${AUTHOR.avatar}" alt="${esc(AUTHOR.name)}" width="64" height="64">
  <div class="ym-author__body">
    <p class="ym-author__name">${esc(AUTHOR.name)}</p>
    <p>${esc(AUTHOR.bio)}</p>
    <p><b>Disclosure:</b> ${esc(AUTHOR.disclosure)}</p>
    <div class="ym-author__links">
      <a href="${esc(AUTHOR.linkedin)}" target="_blank" rel="noopener">Follow on LinkedIn</a>
      <a href="${esc(AUTHOR.x)}" target="_blank" rel="noopener">Follow ${esc(AUTHOR.xHandle)} on X</a>
    </div>
    ${correctionsHtml(report)}
  </div>
</aside></div>`;
}

// Byline goes directly under the first headline; the author box closes the page. The style block travels with
// the byline (valid in body) because two reports are fragments with no <head>, and anything placed before
// their doctype would drop the page into quirks mode.
export function injectAuthor(html, report) {
  let out = html.replace(/<\/h1>/i, (m) => `${m}\n${STYLE}\n${bylineHtml(report)}`);
  const box = authorBoxHtml(report);
  out = /<\/body>/i.test(out) ? out.replace(/<\/body>(?![\s\S]*<\/body>)/i, `${box}</body>`) : out + box;
  return out;
}
