"use client";

import CourseDrawer from "../training/schedule/CourseDrawer.client.jsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import EventEditorModal from "./EventEditorModal.client.jsx";

function fmtDT(iso) {
  try {
    return new Date(iso).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso || "";
  }
}

function normalizeEventId(id) {
  const s = String(id || "");
  if (!s) return "";
  return s.startsWith("event-") ? s.slice("event-".length) : s;
}

function labelDelivery(v) {
  if (v === "in_person") return "In person";
  if (v === "online") return "Online";
  if (v === "hybrid") return "Hybrid";
  return v || "";
}

function Row({ label, value, mono = false }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="grid grid-cols-3 gap-3 py-2">
      <div className="col-span-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</div>
      <div className={`col-span-2 text-sm text-slate-100 ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

function LinkRow({ label, href }) {
  if (!href) return null;
  return (
    <div className="grid grid-cols-3 gap-3 py-2">
      <div className="col-span-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="col-span-2">
        <a
          className="break-all text-sm text-sky-300 hover:text-sky-200"
          href={href}
          target="_blank"
          rel="noreferrer"
        >
          {href}
        </a>
      </div>
    </div>
  );
}

export default function WhatsOnDrawer({ open, onClose, item }) {
  // ✅ For training items, reuse the richer drawer
  if (item?.type === "training") {
    const seedMeta = item.course_meta ?? null;
    return <CourseDrawer open={open} onClose={onClose} courseId={item.course_id} seedMeta={seedMeta} />;
  }

  const isEvent = item?.type === "event" || item?.type === "events";
  const eventId = useMemo(() => normalizeEventId(item?.id), [item?.id]);

  const [canManageEvent, setCanManageEvent] = useState(false);
  const [checkingPerms, setCheckingPerms] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  const [eventDetails, setEventDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const overlayRef = useRef(null);
  const openRef = useRef(open);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    openRef.current = open;
  }, [open]);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && openRef.current) onCloseRef.current?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Permissions (Manage button)
  useEffect(() => {
    if (!open || !eventId || !isEvent) return;

    let cancelled = false;
    (async () => {
      try {
        setCheckingPerms(true);

        const sb = supabaseBrowser();
        const { data: sessionData } = await sb.auth.getSession();
        const token = sessionData?.session?.access_token;

        const res = await fetch(`/api/events/${encodeURIComponent(eventId)}/permissions`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: "no-store",
        });

        const json = await res.json().catch(() => ({}));
        if (!cancelled) setCanManageEvent(Boolean(json?.canEdit));
      } catch {
        if (!cancelled) setCanManageEvent(false);
      } finally {
        if (!cancelled) setCheckingPerms(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, isEvent, eventId]);

  // Full event details for drawer display
  useEffect(() => {
    if (!open || !eventId || !isEvent) return;

    let cancelled = false;
    (async () => {
      setLoadingDetails(true);
      try {
        const res = await fetch(`/api/events/${encodeURIComponent(eventId)}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || "Failed to load event.");
        if (!cancelled) setEventDetails(json);
      } catch {
        // fallback to whatever the calendar provided
        if (!cancelled) setEventDetails(null);
      } finally {
        if (!cancelled) setLoadingDetails(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, isEvent, eventId]);

  if (!item) return null;

  // Prefer full DB row if present
  const ev = eventDetails || item;

  const badgeCls = "bg-emerald-500/20 text-emerald-100 border-emerald-400/30";

  return (
    <>
      <div className={`fixed inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!open}>
        <div
          ref={overlayRef}
          onClick={(e) => {
            if (e.target === overlayRef.current) onClose?.();
          }}
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        />

        <aside
          role="dialog"
          aria-modal="true"
          className={`absolute inset-y-0 right-0 w-full max-w-md transform bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl ring-1 ring-white/10 transition-transform duration-300 ease-in-out ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-start gap-3 border-b border-white/10 bg-slate-900/80 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badgeCls}`}
                >
                  Event
                </span>
              </div>

              <div className="truncate text-base font-semibold text-white">{ev?.title || item?.title}</div>

              <div className="mt-1 text-xs text-slate-400">
                {fmtDT(ev?.starts_at)}
                {ev?.ends_at ? ` → ${fmtDT(ev.ends_at)}` : ""}
                {ev?.state ? ` • ${ev.state}` : ""}
                {loadingDetails ? " • Loading…" : ""}
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {isEvent && canManageEvent ? (
                <button
                  type="button"
                  disabled={checkingPerms}
                  onClick={() => setEditorOpen(true)}
                  className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200 hover:bg-white/10 disabled:opacity-60"
                >
                  Manage
                </button>
              ) : null}

              <button
                onClick={onClose}
                className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>

          <div className="h-[calc(100%-52px)] overflow-y-auto px-4 py-4">
            {/* Mirror the edit form fields */}
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-300">Details</div>

              <Row label="Title" value={ev?.title} />
              <Row label="Summary" value={ev?.summary} />
              <Row label="Description" value={ev?.description} />

              <Row label="Starts" value={ev?.starts_at ? fmtDT(ev.starts_at) : ""} />
              <Row label="Ends" value={ev?.ends_at ? fmtDT(ev.ends_at) : ""} />
              <Row label="Timezone" value={ev?.timezone} />
              <Row label="Delivery" value={labelDelivery(ev?.delivery_method)} />

              <Row label="Location" value={ev?.location_name} />
              <Row label="Address 1" value={ev?.address_line1} />
              <Row label="Address 2" value={ev?.address_line2} />
              <Row label="Suburb" value={ev?.suburb} />
              <Row label="State" value={ev?.state} />
              <Row label="Postcode" value={ev?.postcode} />
              <Row label="Country" value={ev?.country} />
              <Row label="Place ID" value={ev?.place_id} mono />

              <LinkRow label="External URL" href={ev?.external_url} />
              <LinkRow label="Join URL" href={ev?.join_url} />

              <Row label="Organizer" value={ev?.organizer_name} />
              <LinkRow label="Organizer URL" href={ev?.organizer_url} />

              <Row label="Tags" value={Array.isArray(ev?.tags) ? ev.tags.join(", ") : ""} />
              <Row label="Status" value={ev?.status} />
            </div>
          </div>
        </aside>
      </div>

      {isEvent && canManageEvent ? (
        <EventEditorModal
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          eventId={eventId}
          seed={ev}
          onDeleted={() => {
            setEditorOpen(false);
            onClose?.();
            window.location.reload();
          }}
        />
      ) : null}
    </>
  );
}