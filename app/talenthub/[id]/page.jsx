export const runtime = "nodejs";

import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import BackButton from "./BackButton.client";

export default async function WorkerProfilePage({ params }) {
  const { id } = params;
  const sb = await supabaseServerClient();

  // Fetch worker (add public_profile_name + working_rights_slug)
  const { data: worker } = await sb
    .from("workers")
    .select("id, display_name, public_profile_name, working_rights_slug, headline, bio, location, created_at, visibility, status")
    .eq("id", id)
    .maybeSingle();

  if (!worker) return notFound();

  const displayName = worker.public_profile_name || worker.display_name || "Unnamed";

  // Owner check
  const {
    data: { user },
  } = await sb.auth.getUser();
  const isOwner = user?.id === worker.id;

  // Roles
  const { data: rolesRows = [] } = await sb
    .from("worker_roles")
    .select("role_categories(name, slug, description)")
    .eq("worker_id", worker.id);

  const roles = rolesRows
    .map((r) => r.role_categories)
    .filter(Boolean);

  // Availability
  const { data: availability } = await sb
    .from("worker_availability")
    .select("available_now, available_from")
    .eq("worker_id", worker.id)
    .maybeSingle();

  const availNow = !!availability?.available_now;
  const availFrom = availability?.available_from ? new Date(availability.available_from) : null;

  // Working rights name
  let workingRights = null;
  if (worker.working_rights_slug) {
    const { data: wr } = await sb
      .from("working_rights_categories")
      .select("name, slug")
      .eq("slug", worker.working_rights_slug)
      .maybeSingle();
    workingRights = wr || null;
  }

  // Experiences (top 3)
  const { data: experiences = [] } = await sb
    .from("worker_experiences")
    .select("role_title, company, description, position, start_date, end_date, is_current")
    .eq("worker_id", worker.id)
    .order("is_current", { ascending: false })
    .order("position", { ascending: true })
    .order("start_date", { ascending: false })
    .limit(3);

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative border-b border-white/10">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(59,130,246,0.18),transparent_60%)]" />
        <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="mx-auto max-w-screen-xl px-4 py-10 md:py-12">
          <div className="mb-3">
            <BackButton href="/talenthub" />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-500/10 px-3 py-1.5 text-[11px] font-medium text-sky-200 shadow-sm ring-1 ring-sky-400/15">
            <Sparkles className="text-sky-300/90" />
            Talent Hub
          </div>

          <div className="mt-5 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white text-lg font-semibold">
              {initials(displayName)}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-semibold text-white">{displayName}</h1>
              {worker.headline ? (
                <p className="mt-1 text-sm text-slate-300">{worker.headline}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {availNow ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Available now
                  </span>
                ) : availFrom ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                    Available from {availFrom.toLocaleDateString()}
                  </span>
                ) : null}
                {worker.location ? (
                  <span className="ml-1 text-[11px] text-slate-400">• {worker.location}</span>
                ) : null}
                {workingRights ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/30 bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
                    {workingRights.name}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="ml-auto">
              {isOwner ? (
                <Link
                  href={`/talenthub/${worker.id}/edit`}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/15 hover:border-emerald-400/40 transition"
                >
                  Edit profile
                  <ArrowNarrowRight />
                </Link>
              ) : (
                <Link
                  href={`/talenthub/${worker.id}#contact`}
                  className="inline-flex items-center gap-2 rounded-xl border border-sky-400/30 bg-sky-500/10 px-3 py-2 text-sm font-medium text-sky-100 hover:bg-sky-500/15 hover:border-sky-400/40 transition"
                >
                  Contact
                  <ArrowNarrowRight />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-screen-xl px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* About */}
          <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-5 ring-1 ring-white/10">
            <h2 className="text-sm font-semibold text-white">About</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-300">
              {worker.bio || "No bio provided yet."}
            </p>
          </div>

          {/* Recent experiences */}
          <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-5 ring-1 ring-white/10">
            <h2 className="text-sm font-semibold text-white">Recent experiences</h2>
            {experiences.length ? (
              <ul className="mt-3 space-y-3">
                {experiences.map((xp, i) => (
                  <li key={i} className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-white">{xp.role_title}</div>
                      <div className="text-[11px] text-slate-400">
                        {fmtDateRange(xp.start_date, xp.end_date, xp.is_current)}
                      </div>
                    </div>
                    {xp.company ? (
                      <div className="mt-0.5 text-xs text-slate-300">{xp.company}</div>
                    ) : null}
                    {xp.description ? (
                      <p className="mt-1 text-xs text-slate-300">{xp.description}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-400">No experiences added.</p>
            )}
          </div>

          {/* Roles */}
          <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-5 ring-1 ring-white/10">
            <h2 className="text-sm font-semibold text-white">Roles</h2>
            {roles.length ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {roles.map((r) => (
                  <li key={r.slug} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                    {r.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-400">No roles selected.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Availability */}
          <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-5 ring-1 ring-white/10">
            <h3 className="text-sm font-semibold text-white">Availability</h3>
            <div className="mt-3">
              {availNow ? (
                <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-[12px] text-emerald-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Available now
                </div>
              ) : availFrom ? (
                <div className="inline-flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-[12px] text-amber-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                  From {availFrom.toLocaleDateString()}
                </div>
              ) : (
                <div className="text-sm text-slate-400">Availability not specified.</div>
              )}
            </div>
          </div>

          {/* Working rights */}
          <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-5 ring-1 ring-white/10">
            <h3 className="text-sm font-semibold text-white">Working rights</h3>
            <div className="mt-3 text-sm text-slate-300">
              {workingRights ? workingRights.name : "Not specified."}
            </div>
          </div>

          {/* Contact */}
          <div id="contact" className="rounded-2xl border border-white/12 bg-white/[0.04] p-5 ring-1 ring-white/10">
            <h3 className="text-sm font-semibold text-white">Contact</h3>
            <p className="mt-2 text-sm text-slate-300">
              Send a request to connect with {displayName}. We’ll notify them with your details.
            </p>
            <Link
              href={`/contact?worker=${worker.id}`}
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-sky-400/30 bg-sky-500/10 px-3 py-2 text-sm font-medium text-sky-100 hover:bg-sky-500/15 hover:border-sky-400/40 transition"
            >
              Start request
              <ArrowNarrowRight />
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}

function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || "").join("");
}

function Sparkles({ className = "" }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" className={className}>
      <path
        fill="currentColor"
        d="M12 2l1.2 3.6L17 7l-3.8 1.4L12 12l-1.2-3.6L7 7l3.8-1.4L12 2zm6 8l.8 2.4L21 13l-2.2.6L18 16l-.8-2.4L15 13l2.2-.6L18 10zM6 14l.8 2.4L9 17l-2.2.6L6 20l-.8-2.4L3 17l2.2-.6L6 14z"
      />
    </svg>
  );
}

function ArrowNarrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" className="text-slate-300">
      <path fill="currentColor" d="M11 5l4 5-4 5v-3H5v-4h6V5z" />
    </svg>
  );
}

function fmtDateRange(start, end, isCurrent) {
  const s = start ? new Date(start) : null;
  const e = end ? new Date(end) : null;
  const fmt = (d) => d?.toLocaleDateString(undefined, { year: "numeric", month: "short" });
  if (s && (e || isCurrent)) return `${fmt(s)} – ${isCurrent ? "Present" : fmt(e)}`;
  if (s) return fmt(s);
  return "";
}