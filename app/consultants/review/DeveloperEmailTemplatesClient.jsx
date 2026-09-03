"use client";

import { useEffect, useMemo, useState } from "react";

export default function DeveloperEmailTemplatesClient() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [templates, setTemplates] = useState([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const search = query.trim();
        const url = search
          ? `/api/admin/dev-tools/email-templates?q=${encodeURIComponent(search)}`
          : "/api/admin/dev-tools/email-templates";

        const response = await fetch(url, { credentials: "include" });
        const body = await response.json().catch(() => ({}));

        if (!response.ok || body?.ok === false) {
          throw new Error(body?.error || "Failed to load email templates.");
        }

        if (ignore) return;

        const next = Array.isArray(body.templates) ? body.templates : [];
        setTemplates(next);
        setActiveId((prev) => {
          if (!next.length) return "";
          if (prev && next.some((item) => item.id === prev)) return prev;
          return next[0].id;
        });
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Failed to load email templates.");
          setTemplates([]);
          setActiveId("");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [query]);

  const activeTemplate = useMemo(
    () => templates.find((item) => item.id === activeId) || templates[0] || null,
    [templates, activeId],
  );

  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-white">Email triggers and templates</h2>
        <p className="text-sm text-slate-400">
          Read-only preview of automatic emails currently defined in code, grouped by trigger.
        </p>
      </header>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <label className="block text-xs uppercase tracking-[0.16em] text-slate-300">
          Search triggers or subjects
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="welcome, consultant approved, bookings..."
            className="mt-2 w-full rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none transition focus:border-sky-400/60"
          />
        </label>
      </div>

      {loading ? <div className="text-sm text-slate-300">Loading templates...</div> : null}
      {error ? (
        <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div>
      ) : null}

      {!loading && !error ? (
        <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="max-h-[76vh] overflow-auto rounded-2xl border border-white/10 bg-slate-950/60 p-2">
            {templates.length ? (
              templates.map((item) => {
                const isActive = activeTemplate?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveId(item.id)}
                    className={[
                      "mb-2 w-full rounded-xl border px-3 py-3 text-left transition",
                      isActive
                        ? "border-sky-400/60 bg-sky-500/15"
                        : "border-white/10 bg-white/0 hover:bg-white/5",
                    ].join(" ")}
                  >
                    <div className="text-sm font-semibold text-white">{item.label}</div>
                    <div className="mt-1 text-xs text-slate-300">{item.trigger}</div>
                    <div className="mt-1 text-[11px] text-slate-500">{item.source}</div>
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-sm text-slate-300">No templates match your search.</div>
            )}
          </aside>

          <div className="space-y-4">
            {activeTemplate ? (
              <>
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Trigger</div>
                  <div className="mt-1 text-sm text-slate-100">{activeTemplate.trigger}</div>
                  <div className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">Recipient</div>
                  <div className="mt-1 text-sm text-slate-100">{activeTemplate.recipient}</div>
                  <div className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">Subject</div>
                  <div className="mt-1 text-sm font-semibold text-white">{activeTemplate.subject}</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">HTML preview</div>
                  <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-white">
                    <iframe
                      title={`Template preview ${activeTemplate.id}`}
                      srcDoc={activeTemplate.html || ""}
                      className="h-[560px] w-full"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Text version</div>
                  <pre className="mt-3 max-h-[260px] overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-slate-900/60 p-3 text-xs text-slate-100">
                    {activeTemplate.text || "No text variant provided."}
                  </pre>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
