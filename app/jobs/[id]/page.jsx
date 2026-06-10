import Link from "next/link";
import { notFound } from "next/navigation";
import { supabasePublicServer } from "@/lib/supabasePublicServer";
import ContactEmailClient from "./ContactEmailClient";

export const runtime = "nodejs";
export const revalidate = 180; // cache detail for 3 minutes

function truncateText(value, maxLength = 160) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}

function buildJobDescription(job) {
  const parts = [];

  if (job?.company) parts.push(`${job.company} is hiring.`);
  if (job?.service?.name) parts.push(`Category: ${job.service.name}.`);
  if (job?.location) parts.push(`Location: ${job.location}.`);
  if (job?.description) parts.push(job.description);

  return truncateText(parts.join(" ") || `View ${job?.title || "this job"} on YouMine.`, 160);
}

async function getJob(id) {
  const sb = supabasePublicServer();

  const { data: job } = await sb
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

  return job || null;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    return {
      title: "Job not found · YouMine",
      description: "This job listing is no longer available on YouMine.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const titleParts = [job.title];

  if (job.company) {
    titleParts.push(job.company);
  } else if (job.location) {
    titleParts.push(job.location);
  }

  const description = buildJobDescription(job);
  const canonical = `/jobs/${job.id}`;
  const image = "/og-image.png";
  const title = titleParts.join(" · ");

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "YouMine",
      type: "article",
      images: [
        {
          url: image,
          alt: `${job.title} on YouMine Jobs`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function JobDetailPage({ params }) {
  const { id } = await params;            // await params
  const job = await getJob(id);
  if (!job) notFound();

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12 space-y-8">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold text-slate-50">{job.title}</h1>
        <p className="text-sm text-slate-300">
          Requested {job.created_at ? new Date(job.created_at).toLocaleDateString() : ""}
          {" • "}
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
          <Info label="Company" value={job.company} />
          <Info label="Close date" value={job.close_date} />
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h2 className="text-lg font-medium text-slate-100">Job description</h2>
        <p className="whitespace-pre-line text-slate-200">{job.description}</p>
        <ContactEmailClient email={job.contact_email} jobId={job.id} />
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
        <h2 className="text-lg font-medium text-slate-100">Contact</h2>
        <p className="text-slate-200">{job.contact_name || "Not supplied"}</p>
        <ContactEmailClient email={job.contact_email} jobId={job.id} />
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