export const runtime = "nodejs";

import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import JobsRequestedTable from "@/app/jobs/JobsRequestedTable"; // NEW: use the table component

export const metadata = {
  title: "My Activity",
};

export default async function MyActivityPage({ searchParams }) {
  const sb = await supabaseServerClient();
  const { data: auth } = await sb.auth.getUser();
  const user = auth?.user;
  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent("/activity")}`);
  }

  const tab = (searchParams?.tab ?? "contacts").toLowerCase();

  // Only fetch contacts for the contacts tab
  let rows = null;
  let error = null;

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

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">My Activity</h1>
        <p className="text-slate-400 mt-1">A private log of your activity across YouMine.</p>
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
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 ring-1 ring-white/10 hover:border-sky-400/30 hover:bg-sky-500/5 transition"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <StatusPill status={r.status} />
                      <h3 className="truncate text-base font-semibold text-white">
                        {r.subject || "(no subject)"}
                      </h3>
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
      ) : (
        // My Jobs tab now shows your jobs table
        <div className="mt-4">
          <JobsRequestedTable />
        </div>
      )}
    </div>
  );
}

function TabNav({ activeTab }) {
  const tabs = [
    { key: "contacts", label: "Direct contacts", href: "/activity?tab=contacts" },
    { key: "jobs", label: "My Jobs", href: "/activity?tab=jobs" },
  ];
  return (
    <div className="mb-2 flex items-center gap-2">
      {tabs.map((t) => {
        const active = activeTab === t.key;
        return (
          <Link
            key={t.key}
            href={t.href}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
              active
                ? "border-sky-400/30 bg-sky-500/10 text-sky-200"
                : "border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10"
            }`}
            prefetch={false}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
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
      <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-sky-500/15 text-sky-300 grid place-items-center">✉️</div>
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