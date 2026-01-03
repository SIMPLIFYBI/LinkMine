"use client";

import { useMemo, useState } from "react";
import AddCourseForm from "./AddCourseForm.client.jsx";
import CourseEditorModal from "./CourseEditorModal.client.jsx";

function fmtDT(iso) {
  try {
    return new Date(iso).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}
function fmtPrice(cents, currency = "AUD") {
  if (cents == null) return "TBA";
  try {
    return (cents / 100).toLocaleString("en-AU", { style: "currency", currency, minimumFractionDigits: 0 });
  } catch {
    return `$${(cents / 100).toFixed(0)} ${currency}`;
  }
}

function PencilIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13.586 3.586a2 2 0 0 1 2.828 2.828l-9.9 9.9a1 1 0 0 1-.39.242l-3.5 1.25a1 1 0 0 1-1.28-1.28l1.25-3.5a1 1 0 0 1 .242-.39l9.9-9.9Z" />
      <path d="M12.172 5 15 7.828" />
    </svg>
  );
}

function sortSessions(sessions) {
  return [...(sessions || [])].sort((a, b) => String(a.starts_at || "").localeCompare(String(b.starts_at || "")));
}

export default function ProviderCard({ provider, canManage }) {
  const [showForm, setShowForm] = useState(false);

  // accordion open state (as you already implemented)
  const [openCourseId, setOpenCourseId] = useState(null);

  // single editor modal state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorCourseId, setEditorCourseId] = useState(null);
  const [editorSeed, setEditorSeed] = useState(null);

  function openEditor(course) {
    if (!course?.id) return;
    setEditorCourseId(course.id);
    setEditorSeed({ courseTitle: course.title, providerName: provider.name, providerSlug: provider.slug });
    setEditorOpen(true);
  }

  const courses = useMemo(() => provider?.courses || [], [provider]);

  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          {provider.slug ? (
            <a
              href={`/consultants/${encodeURIComponent(provider.slug)}`}
              className="text-lg font-semibold text-white hover:underline"
            >
              {provider.name}
            </a>
          ) : (
            <div className="text-lg font-semibold text-white">{provider.name}</div>
          )}
          <div className="text-slate-400 text-sm">Courses offered</div>
        </div>
        {canManage && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md border border-sky-400/30 bg-sky-500/10 px-3 py-1.5 text-sm font-semibold text-sky-100 hover:bg-sky-500/20"
          >
            {showForm ? "Close" : "+ Add course"}
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-4 rounded-lg border border-white/10 bg-white/10 p-4">
          <AddCourseForm consultantId={provider.id} onDone={() => setShowForm(false)} />
        </div>
      )}

      <div className="space-y-2">
        {courses.map((c) => {
          const courseKey = c.id || c.slug || c.title;
          const isOpen = openCourseId === courseKey;
          const sessions = sortSessions(c.sessions);

          return (
            <div key={courseKey} className="rounded-lg border border-white/10 bg-white/0">
              {/* ✅ header is a div (no nested buttons) */}
              <div className="flex w-full items-stretch justify-between gap-2 px-3 py-2 hover:bg-white/5">
                {/* ✅ toggle button controls accordion */}
                <button
                  type="button"
                  onClick={() => setOpenCourseId((prev) => (prev === courseKey ? null : courseKey))}
                  className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
                  aria-expanded={isOpen}
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-white">{c.title}</div>
                    <div className="text-xs text-slate-400">
                      {sessions.length ? `${sessions.length} session${sessions.length === 1 ? "" : "s"}` : "No dates yet"}
                    </div>
                  </div>

                  <span className="text-slate-400 text-xs">{isOpen ? "▲" : "▼"}</span>
                </button>

                {/* ✅ separate sibling button */}
                {canManage && c.id ? (
                  <button
                    type="button"
                    onClick={() => openEditor(c)}
                    className="shrink-0 inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
                    title="Edit course + sessions"
                  >
                    <PencilIcon className="h-4 w-4" />
                    Edit
                  </button>
                ) : null}
              </div>

              {/* ...existing accordion body... */}
            </div>
          );
        })}
      </div>

      <CourseEditorModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        courseId={editorCourseId}
        seedMeta={editorSeed}
      />
    </section>
  );
}