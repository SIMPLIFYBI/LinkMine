import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const revalidate = 0;

async function loadJob(sb, id) {
  const { data, error } = await sb
    .from("jobs")
    .select(
      `
        id,
        title,
        description,
        location,
        preferred_payment_type,
        urgency,
        company,
        budget,
        close_date,
        contact_name,
        contact_email,
        listing_type,
        created_at,
        service:services(id, name)
      `
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

export default async function JobDetailPage({ params }) {
  const sb = supabaseServer();
  const job = await loadJob(sb, params.id);
  if (!job) notFound();

  const {
    data: { user } = { user: null },
  } = await sb.auth.getUser();
  const isLoggedIn = Boolean(user);

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12 space-y-8">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold text-slate-50">{job.title}</h1>
        <p className="text-sm text-slate-300">
          Requested {new Date(job.created_at).toLocaleDateString()} •{" "}
          {job.service?.name || "Uncategorised"}
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h2 className="text-lg font-medium text-slate-100">Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Info label="Listing type" value={job.listing_type} />
          <Info label="Location" value={job.location} />
          <Info label="Preferred payment type" value={job.preferred_payment_type} />
          <Info label="Urgency" value={job.urgency} />
          <Info label="Budget" value={job.budget} />
          <Info label="Company" value={job.company} />
          <Info label="Close date" value={job.close_date} />
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h2 className="text-lg font-medium text-slate-100">Job description</h2>
        <p className="whitespace-pre-line text-slate-200">{job.description}</p>
        <ContactEmail email={job.contact_email} jobId={job.id} isLoggedIn={isLoggedIn} />
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
        <h2 className="text-lg font-medium text-slate-100">Contact</h2>
        <p className="text-slate-200">{job.contact_name || "Not supplied"}</p>
        <ContactEmail email={job.contact_email} jobId={job.id} isLoggedIn={isLoggedIn} />
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-100 hover:border-slate-200/60 hover:bg-slate-800"
        >
          Explore YouMine
        </Link>
      </section>
    </main>
  );
}

function Info({ label, value }) {
  return (
    <div className="space-y-1">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-sm text-slate-200">{value || "Not provided"}</div>
    </div>
  );
}

function ContactEmail({ email, jobId, isLoggedIn }) {
  if (!email) return null;

  if (isLoggedIn) {
    return (
      <p className="text-sm text-slate-300">
        Interested? Reach out at{" "}
        <a href={`mailto:${email}`} className="font-semibold text-sky-300 hover:text-sky-200">
          {email}
        </a>
        .
      </p>
    );
  }

  const redirect = encodeURIComponent(`/jobs/${jobId}`);

  return (
    <div className="space-y-2 text-sm text-slate-300">
      <div className="inline-flex items-center gap-2">
        <span className="rounded bg-slate-900/80 px-3 py-1 font-semibold text-slate-100/70 blur-sm select-none">
          {email}
        </span>
        <span className="text-xs text-slate-400 uppercase tracking-wide">Hidden</span>
      </div>
      <p>
        Log in or{" "}
        <Link href={`/signup?redirect=${redirect}`} className="font-semibold text-sky-300 hover:text-sky-200">
          create an account
        </Link>{" "}
        (free) to view contact details.{" "}
        <Link href={`/login?redirect=${redirect}`} className="font-semibold text-sky-300 hover:text-sky-200">
          Log in
        </Link>
        .
      </p>
    </div>
  );
}