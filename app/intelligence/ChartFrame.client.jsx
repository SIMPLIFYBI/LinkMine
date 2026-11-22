"use client";

import { useEffect, useId, useRef, useState } from "react";

// One card for every chart and map: title, the view, a source line, and a bar of views and panels along the bottom.
// Views change what is drawn; panels (Sources, Download, Share) replace it until another tab is chosen.
export default function ChartFrame({ title, subtitle, views, view, onView, panels = {}, onPanel, source, children }) {
  const [panel, setPanel] = useState(null);
  const base = useId();
  const tabs = useRef({});

  const panelTabs = Object.entries(panels).map(([id, p]) => ({ id, label: p.label }));
  const all = [...views.map(([id, label]) => ({ id, label, kind: "view" })), ...panelTabs.map((t) => ({ ...t, kind: "panel" }))];
  const active = panel || view;

  function choose(tab) {
    const next = tab.kind === "view" ? null : panel === tab.id ? null : tab.id;
    setPanel(next);
    onPanel?.(next);
    if (tab.kind === "view") onView(tab.id);
  }

  function onKey(e, index) {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = all[(index + step + all.length) % all.length];
    tabs.current[next.id]?.focus();
    choose(next);
  }

  return (
    <section className="yi-cf" aria-label={title}>
      <header className="yi-cf__head">
        <div>
          <h2 className="yi-card-title">{title}</h2>
          {subtitle ? <p className="yi-card-sub">{subtitle}</p> : null}
        </div>
        <span className="yi-cf__mark">YouMine Intelligence</span>
      </header>

      <div className="yi-cf__body" hidden={Boolean(panel)} role="tabpanel" aria-labelledby={`${base}-${view}`}>
        {children}
      </div>
      {panel ? (
        <div className="yi-cf__panel" role="tabpanel" aria-labelledby={`${base}-${panel}`}>
          {panels[panel].content}
        </div>
      ) : null}

      {source ? <p className="yi-cf__src">{source}</p> : null}

      <div className="yi-cf__tabs" role="tablist" aria-label="Views and downloads">
        {all.map((tab, i) => (
          <button
            key={tab.id}
            ref={(el) => { tabs.current[tab.id] = el; }}
            id={`${base}-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            tabIndex={active === tab.id ? 0 : -1}
            className={`yi-cf__tab${tab.kind === "panel" && all[i - 1]?.kind === "view" ? " is-first-panel" : ""}`}
            onClick={() => choose(tab)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </section>
  );
}

// Name and value pairs for the Sources panel.
export function SourcesPanel({ items }) {
  return (
    <dl className="yi-dl">
      {items.filter((item) => item.text).map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.text}</dd>
        </div>
      ))}
    </dl>
  );
}

export function DownloadPanel({ onCsv, disabled, includes }) {
  return (
    <div className="yi-pane">
      <p>{includes}</p>
      <div className="yi-actions">
        <button type="button" className="yi-btn yi-btn--primary" onClick={onCsv} disabled={disabled}>
          Download CSV
        </button>
      </div>
    </div>
  );
}

// The address bar already holds the full state of the view, so sharing is copying it.
export function SharePanel() {
  const [href, setHref] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => setHref(window.location.href), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", href);
    }
  }

  return (
    <div className="yi-pane">
      <p>This link reopens exactly what you are looking at.</p>
      <input className="yi-embedcode" readOnly value={href} aria-label="Link to this view" onFocus={(e) => e.target.select()} />
      <div className="yi-actions">
        <button type="button" className="yi-btn yi-btn--primary" onClick={copy}>
          {copied ? "Link copied" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
