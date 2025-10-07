import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

export const revalidate = 120;
export const runtime = "nodejs";

async function loadPublicJobs() {
  const sb = supabaseServer();
  const { data } = await sb
    .from("jobs")
    .select(
      `
        id,
        title,
        description,
        location,
        preferred_payment_type,
        urgency,
        listing_type,
        company,
        created_at,
        service:services(id, name)
      `
    )
    .or("listing_type.eq.Public,listing_type.eq.Both")
    .order("created_at", { ascending: false });

  return data ?? [];
}

export default async function JobsBoardSection() {
  const jobs = await loadPublicJobs();

  return (
    <section className="space-y-8">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold text-slate-50">Jobs board</h1>
        <p className="text-sm text-slate-300">
          Explore recently posted roles that are open for discussion.
        </p>
      </header>

      {jobs.length === 0 ? (
        <p className="text-center text-sm text-slate-300">
          No public jobs available right now. Check back soon.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <article
              key={job.id}
              className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg ring-1 ring-white/5 transition hover:border-sky-300/60 hover:ring-sky-400/30"
            >
              <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
                <span>{job.service?.name || "General"}</span>
                <span>{job.listing_type}</span>
              </div>

              <h2 className="text-lg font-semibold text-slate-50">
                {job.title}
              </h2>

              <p className="mt-2 line-clamp-3 text-sm text-slate-300">
                {job.description || "No description supplied."}
              </p>

              <dl className="mt-4 space-y-2 text-sm text-slate-200/80">
                <Detail label="Company" value={job.company} />
                <Detail label="Location" value={job.location} />
                <Detail label="Payment" value={job.preferred_payment_type} />
                <Detail label="Urgency" value={job.urgency} />
                <Detail
                  label="Listed"
                  value={
                    job.created_at
                      ? new Date(job.created_at).toLocaleDateString()
                      : null
                  }
                />
              </dl>

              <div className="mt-auto pt-6">
                <Link
                  href={`/jobs/${job.id}`}
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-sky-300/60 hover:bg-sky-500/10"
                >
                  View job
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-slate-100">
        {value || "Not provided"}
      </span>
    </div>
  );
}