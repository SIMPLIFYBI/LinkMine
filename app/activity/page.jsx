export const runtime = "nodejs";

import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import JobsRequestedTable from "@/app/jobs/JobsRequestedTable";

export const metadata = {
  title: "My Activity",
};

// --- helpers (for consultant logo in metadata jsonb) ---
function asObject(v) {
  if (!v) return null;
  if (typeof v === "object") return v;
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return null;
    }
  }
  return null;
}

function buildStoragePublicUrl(supabaseUrl, bucket, path) {
  if (!supabaseUrl || !bucket || !path) return null;
  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${String(path).replace(/^\//, "")}`;
}

function pickLogoFromMetadata(supabaseUrl, metadata) {
  const m = asObject(metadata);
  if (!m) return null;

  const direct =
    m.logo_url ||
    m.logoUrl ||
    m.avatar_url ||
    m.avatarUrl ||
    m.image_url ||
    m.imageUrl ||
    m.photo_url ||
    m.photoUrl;

  if (typeof direct === "string" && direct.startsWith("http")) return direct;

  const logoObj = asObject(m.logo) || asObject(m.branding?.logo) || asObject(m.profile?.logo);
  const nestedUrl = logoObj?.url || logoObj?.publicUrl;
  if (typeof nestedUrl === "string" && nestedUrl.startsWith("http")) return nestedUrl;

  const bucket = logoObj?.bucket || m.logo_bucket || m.bucket;
  const path = logoObj?.path || logoObj?.key || m.logo_path || m.path;
  if (bucket && path) return buildStoragePublicUrl(supabaseUrl, bucket, path);

  // fallback for stored paths like "portfolio/..."
  const maybePath = logoObj?.path || direct;
  if (typeof maybePath === "string") {
    const cleaned = maybePath.replace(/^\//, "");
    if (cleaned.startsWith("http")) return cleaned;

    const parts = cleaned.split("/");
    if (parts.length >= 2) {
      const maybeBucket = parts[0];
      const rest = parts.slice(1).join("/");
      if (maybeBucket === "portfolio" || maybeBucket === "public") {
        return buildStoragePublicUrl(supabaseUrl, maybeBucket, rest);
      }
      // assume "portfolio" if bucket omitted
      return buildStoragePublicUrl(supabaseUrl, "portfolio", cleaned);
    }
  }

  return null;
}

export default async function MyActivityPage({ searchParams }) {
  const sb = await supabaseServerClient();
  const { data: auth } = await sb.auth.getUser();
  const user = auth?.user;
  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent("/activity")}`);
  }

  const requestedTab = String(searchParams?.tab ?? "contacts").toLowerCase();
  const tab = ["contacts", "jobs", "favourites", "training"].includes(requestedTab) ? requestedTab : "contacts";

  // Only fetch what we need per-tab
  let rows = null;
  let error = null;

  let favs = null;
  let favError = null;

  let trainingBookings = null;
  let trainingError = null;

  if (tab === "contacts") {
    const res = await sb
      .from("consultant_contacts")
      .select(`
        id,
        created_at,
        subject,
        status,
        message,
        location,
        budget,
        consultant:consultant_id ( id, display_name )
      `)
      .eq("sender_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    rows = res.data || null;
    error = res.error || null;
  }

  if (tab === "favourites") {
    const res = await sb
      .from("consultant_favourites")
      .select(
        `
        id,
        created_at,
        consultant:consultant_id (
          id,
          display_name,
          metadata
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);

    favs = res.data || null;
    favError = res.error || null;
  }

  if (tab === "training") {
    const res = await sb
      .from("training_session_bookings")
      .select(`
        id,
        booked_at,
        cancelled_at,
        booking_name,
        booking_email,
        booking_phone,
        status,
        session:training_sessions!inner (
          id,
          starts_at,
          ends_at,
          timezone,
          delivery_method,
          location_name,
          suburb,
          state,
          country,
          join_url,
          booking_url,
          price_cents,
          currency,
          course:training_courses!inner (
            id,
            title,
            slug,
            consultant:consultants!inner (
              id,
              display_name,
              metadata
            )
          )
        )
      `)
      .eq("user_id", user.id)
      .order("booked_at", { ascending: false })
      .limit(100);

    trainingBookings = res.data || null;
    trainingError = res.error || null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">My Activity</h1>
        <p className="mt-1 text-slate-400">A private log of your activity across YouMine.</p>
      </header>

      <TabNav activeTab={tab} />

      {tab === "contacts" ? (
        error ? (
          <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-rose-100">
            Couldn’t load your contacts. Please try again shortly.
          </div>
        ) : !rows || rows.length === 0 ? (
          <div className="mt-4">
            <EmptyState />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {rows.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 ring-1 ring-white/10 transition hover:border-sky-400/30 hover:bg-sky-500/5"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <StatusPill status={r.status} />
                      <h3 className="truncate text-base font-semibold text-white">{r.subject || "(no subject)"}</h3>
                    </div>
                    <div className="mt-1 text-sm text-slate-400">
                      <span className="text-slate-300">{r.consultant?.display_name || "Consultant"}</span>
                      <span className="mx-2 text-slate-500">•</span>
                      <time dateTime={r.created_at}>{new Date(r.created_at).toLocaleString()}</time>
                      {r.location ? (
                        <>
                          <span className="mx-2 text-slate-500">•</span>
                          <span>{r.location}</span>
                        </>
                      ) : null}
                      {r.budget ? (
                        <>
                          <span className="mx-2 text-slate-500">•</span>
                          <span>Budget: {r.budget}</span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <a
                      href={`/consultants/${r.consultant?.id ?? ""}`}
                      className="inline-flex items-center gap-1 rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-1.5 text-sm font-semibold text-sky-100 hover:bg-sky-500/20"
                    >
                      View profile <span aria-hidden>→</span>
                    </a>
                  </div>
                </div>

                {r.message ? <p className="mt-3 text-sm text-slate-200/90">{r.message}</p> : null}
              </li>
            ))}
          </ul>
        )
      ) : tab === "jobs" ? (
        <div className="mt-4">
          <JobsRequestedTable />
        </div>
      ) : tab === "favourites" ? (
        favError ? (
          <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-rose-100">
            Couldn’t load your favourites. Please try again shortly.
          </div>
        ) : !favs || favs.length === 0 ? (
          <div className="mt-4">
            <FavouritesEmptyState />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {favs.map((f) => {
              const c = f.consultant;
              const logoUrl = pickLogoFromMetadata(supabaseUrl, c?.metadata);

              return (
                <Link
                  key={f.id}
                  href={`/consultants/${c?.id ?? ""}`}
                  className="group rounded-2xl border border-white/10 bg-white/[0.04] p-3 ring-1 ring-white/10 transition hover:border-sky-400/30 hover:bg-sky-500/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/10">
                      {logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logoUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-xs font-semibold text-slate-300">
                          {(c?.display_name || "C").slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">{c?.display_name || "Consultant"}</div>
                      <div className="mt-0.5 text-xs text-slate-400">
                        Favourited{" "}
                        <time dateTime={f.created_at}>{new Date(f.created_at).toLocaleDateString()}</time>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-sky-200 opacity-90 transition group-hover:opacity-100">
                    View profile <span aria-hidden>→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )
      ) : tab === "training" ? (
        trainingError ? (
          <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-rose-100">
            Couldn’t load your training bookings. Please try again shortly.
          </div>
        ) : !trainingBookings || trainingBookings.length === 0 ? (
          <div className="mt-4">
            <TrainingEmptyState />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {trainingBookings.map((booking) => {
              const session = booking.session;
              const course = session?.course;
              const consultant = course?.consultant;
              const logoUrl = pickLogoFromMetadata(supabaseUrl, consultant?.metadata);

              return (
                <li
                  key={booking.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 ring-1 ring-white/10 transition hover:border-sky-400/30 hover:bg-sky-500/5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/10">
                          {logoUrl ? (
                            <img src={logoUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-xs font-semibold text-slate-300">
                              {(consultant?.display_name || "T").slice(0, 1).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <TrainingStatusPill status={booking.status} />
                            <h3 className="truncate text-base font-semibold text-white">{course?.title || "Training booking"}</h3>
                          </div>
                          <div className="mt-1 text-sm text-slate-400">
                            <span className="text-slate-300">{consultant?.display_name || "Provider"}</span>
                            <span className="mx-2 text-slate-500">•</span>
                            <time dateTime={booking.booked_at}>{new Date(booking.booked_at).toLocaleString()}</time>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2.5">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Session</div>
                          <div className="mt-1 text-sm text-white">{session?.starts_at ? new Date(session.starts_at).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" }) : "TBA"}</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2.5">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Delivery</div>
                          <div className="mt-1 text-sm text-white">{session?.delivery_method === "online" ? "Online" : [session?.location_name, session?.suburb, session?.state].filter(Boolean).join(", ") || "TBA"}</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2.5">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Price</div>
                          <div className="mt-1 text-sm text-white">{session?.price_cents != null ? (session.price_cents / 100).toLocaleString("en-AU", { style: "currency", currency: session.currency || "AUD", minimumFractionDigits: 0 }) : "TBA"}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {consultant?.id ? (
                        <a
                          href={`/consultants/${consultant.id}`}
                          className="inline-flex items-center gap-1 rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-1.5 text-sm font-semibold text-sky-100 hover:bg-sky-500/20"
                        >
                          View provider <span aria-hidden>→</span>
                        </a>
                      ) : null}
                      {session?.booking_url ? (
                        <a
                          href={session.booking_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-slate-100 hover:bg-white/10"
                        >
                          Provider site
                        </a>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )
      ) : null}
    </div>
  );
}

function TabNav({ activeTab }) {
  const tabs = [
    { key: "contacts", label: "Direct contacts", href: "/activity?tab=contacts" },
    { key: "jobs", label: "My Jobs", href: "/activity?tab=jobs" },
    { key: "favourites", label: "Favourites", href: "/activity?tab=favourites" },
    { key: "training", label: "Training", href: "/activity?tab=training" },
  ];

  return (
    <nav
      aria-label="Activity sections"
      className="mb-2 flex gap-3 overflow-x-auto rounded-full border border-white/10 bg-white/[0.04] p-1 text-sm text-slate-100"
    >
      {tabs.map((t) => {
        const active = activeTab === t.key;
        return (
          <Link
            key={t.key}
            href={t.href}
            prefetch={false}
            className={`flex-1 whitespace-nowrap rounded-full px-4 py-2 font-semibold transition ${
              active ? "bg-sky-500 text-slate-900 shadow" : "text-slate-300 hover:bg-white/5"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

function StatusPill({ status }) {
  const map = {
    pending: "border-amber-400/40 bg-amber-500/10 text-amber-100",
    sent: "border-sky-400/40 bg-sky-500/10 text-sky-100",
    delivered: "border-emerald-400/40 bg-emerald-500/10 text-emerald-100",
    failed: "border-rose-400/40 bg-rose-500/10 text-rose-100",
    bounced: "border-rose-400/40 bg-rose-500/10 text-rose-100",
    opened: "border-violet-400/40 bg-violet-500/10 text-violet-100",
    replied: "border-indigo-400/40 bg-indigo-500/10 text-indigo-100",
  };
  const cls = map[status] || "border-white/20 bg-white/10 text-slate-100";
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${cls}`}>{status}</span>;
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center ring-1 ring-white/10">
      <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-sky-500/15 text-sky-300">✉️</div>
      <h3 className="text-lg font-semibold text-white">No activity yet</h3>
      <p className="mt-1 text-slate-400">When you contact a consultant, you’ll see it here.</p>
      <a
        href="/consultants"
        className="mt-4 inline-flex items-center rounded-full border border-sky-400/40 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-100 hover:bg-sky-500/20"
      >
        Browse consultants
      </a>
    </div>
  );
}

function TrainingStatusPill({ status }) {
  const map = {
    pending: "border-amber-400/40 bg-amber-500/10 text-amber-100",
    confirmed: "border-emerald-400/40 bg-emerald-500/10 text-emerald-100",
    waitlisted: "border-amber-400/40 bg-amber-500/10 text-amber-100",
    cancelled: "border-rose-400/40 bg-rose-500/10 text-rose-100",
  };
  const cls = map[status] || "border-white/20 bg-white/10 text-slate-100";
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${cls}`}>{status}</span>;
}

function FavouritesEmptyState() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center ring-1 ring-white/10">
      <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-indigo-500/15 text-indigo-200">★</div>
      <h3 className="text-lg font-semibold text-white">No favourites yet</h3>
      <p className="mt-1 text-slate-400">Tap the favourite button on a consultant to save them here.</p>
      <a
        href="/consultants"
        className="mt-4 inline-flex items-center rounded-full border border-sky-400/40 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-100 hover:bg-sky-500/20"
      >
        Browse consultants
      </a>
    </div>
  );
}

function TrainingEmptyState() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center ring-1 ring-white/10">
      <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-sky-500/15 text-sky-300">⌁</div>
      <h3 className="text-lg font-semibold text-white">No training bookings yet</h3>
      <p className="mt-1 text-slate-400">When you book or join a waitlist for a session, it will appear here.</p>
      <a
        href="/training/schedule"
        className="mt-4 inline-flex items-center rounded-full border border-sky-400/40 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-100 hover:bg-sky-500/20"
      >
        Browse training
      </a>
    </div>
  );
}