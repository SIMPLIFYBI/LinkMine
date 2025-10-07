import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function loadData() {
  const sb = supabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) redirect("/signup");

  const [{ data: profile }, { data: consultants }, { data: jobs }] =
    await Promise.all([
      sb
        .from("user_profiles")
        .select(
          "user_type, organisation_size, organisation_name, profession"
        )
        .eq("id", user.id)
        .maybeSingle(),
      sb
        .from("consultants")
        .select("id, display_name, claimed_by, user_id, created_at")
        .or(`claimed_by.eq.${user.id},user_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(3),
      sb
        .from("jobs")
        .select("id, title, created_at, listing_type")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false })
        .limit(3),
    ]);

  return { user, profile, consultants: consultants ?? [], jobs: jobs ?? [] };
}

export default async function HomePage() {
  const { user, profile, consultants, jobs } = await loadData();
  const displayName =
    profile?.organisation_name || user.email?.split("@")[0] || "there";

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 space-y-10">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-sky-600/20 via-indigo-600/25 to-slate-900/60 p-8 text-slate-100 shadow-xl ring-1 ring-white/10">
        <h1 className="text-3xl font-semibold text-white">
          Welcome back, {displayName}.
        </h1>
        <p className="mt-2 text-sm text-slate-200/80">
          {profile?.profession
            ? `It looks like you’re working as ${profile.profession}. Here’s what’s next on MineLink.`
            : "Complete your profile to unlock tailored recommendations."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/jobs/post"
            className="inline-flex items-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-slate-100"
          >
            Post a job
          </Link>
          <Link
            href="/consultants"
            className="inline-flex items-center rounded-full border border-white/30 px-5 py-2 text-sm font-semibold text-white hover:border-white/60"
          >
            Browse consultants
          </Link>
          <Link
            href="/consultants/claim"
            className="inline-flex items-center rounded-full border border-white/30 px-5 py-2 text-sm font-semibold text-white hover:border-white/60"
          >
            Claim a consultant page
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <article className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg ring-1 ring-white/5">
          <header className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent jobs</h2>
            <Link
              href="/jobs?tab=my-jobs"
              className="text-xs font-semibold text-sky-300 hover:text-sky-200"
            >
              View all
            </Link>
          </header>
          <div className="mt-4 space-y-4 text-sm text-slate-200">
            {jobs.length ? (
              jobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-2xl border border-white/10 bg-slate-900/40 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white">{job.title}</p>
                    <span className="text-xs uppercase tracking-wide text-slate-400">
                      {job.listing_type}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Created {new Date(job.created_at).toLocaleDateString()}
                  </p>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="mt-3 inline-flex text-xs font-semibold text-sky-300 hover:text-sky-200"
                  >
                    View job →
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">
                You haven’t posted any jobs yet.{" "}
                <Link
                  href="/jobs/post"
                  className="text-sky-300 hover:text-sky-200"
                >
                  Post your first job
                </Link>
                .
              </p>
            )}
          </div>
        </article>

        <article className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg ring-1 ring-white/5">
          <header className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Your consultant pages
            </h2>
            <Link
              href="/consultants"
              className="text-xs font-semibold text-sky-300 hover:text-sky-200"
            >
              Browse directory
            </Link>
          </header>
          <div className="mt-4 space-y-4 text-sm text-slate-200">
            {consultants.length ? (
              consultants.map((consultant) => (
                <div
                  key={consultant.id}
                  className="rounded-2xl border border-white/10 bg-slate-900/40 p-4"
                >
                  <p className="font-semibold text-white">
                    {consultant.display_name}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Managed since{" "}
                    {new Date(consultant.created_at).toLocaleDateString()}
                  </p>
                  <div className="mt-3 flex gap-3 text-xs">
                    <Link
                      href={`/consultants/${consultant.id}`}
                      className="font-semibold text-sky-300 hover:text-sky-200"
                    >
                      View profile →
                    </Link>
                    <Link
                      href={`/consultants/${consultant.id}/claim`}
                      className="font-semibold text-slate-300 hover:text-slate-100"
                    >
                      Manage →
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">
                No consultant pages linked yet.{" "}
                <Link
                  href="/consultants/claim"
                  className="text-sky-300 hover:text-sky-200"
                >
                  Claim an existing profile
                </Link>{" "}
                or{" "}
                <Link
                  href="/consultants/new"
                  className="text-sky-300 hover:text-sky-200"
                >
                  create a new one
                </Link>
                .
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg ring-1 ring-white/5">
        <h2 className="text-lg font-semibold text-white">Account snapshot</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 text-sm text-slate-200">
          <Stat label="Email" value={user.email} />
          <Stat label="Role" value={profile?.user_type || "Not set"} />
          <Stat
            label="Organisation size"
            value={profile?.organisation_size || "Not set"}
          />
          <Stat label="Profession" value={profile?.profession || "Not set"} />
        </dl>
        <Link
          href="/account"
          className="mt-5 inline-flex items-center rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-sky-400/60 hover:text-sky-200"
        >
          Manage account →
        </Link>
      </section>
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <div className="space-y-1 rounded-2xl border border-white/10 bg-slate-900/40 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="text-sm font-semibold text-white">{value}</div>
    </div>
  );
}