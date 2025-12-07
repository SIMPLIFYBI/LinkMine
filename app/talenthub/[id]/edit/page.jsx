export const runtime = "nodejs";

import { notFound, redirect } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import EditWorkerForm from "./EditWorkerForm.client";

export default async function EditWorkerPage({ params }) {
  const { id } = params;
  const sb = await supabaseServerClient();

  // Auth + ownership
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect(`/talenthub/${id}`);

  const { data: worker } = await sb
    .from("workers")
    .select("id, display_name, public_profile_name, working_rights_slug, headline, bio, location")
    .eq("id", id)
    .maybeSingle();

  if (!worker) return notFound();
  if (user.id !== worker.id) redirect(`/talenthub/${id}`);

  // Role options
  const { data: roleOptions = [] } = await sb
    .from("role_categories")
    .select("id, name, slug, position")
    .order("position", { ascending: true });

  // Working rights options
  const { data: workingRightsOptions = [] } = await sb
    .from("working_rights_categories")
    .select("name, slug, position")
    .order("position", { ascending: true });

  // Experiences (limit to 3 for edit UX)
  const { data: experiences = [] } = await sb
    .from("worker_experiences")
    .select("id, role_title, company, description, position")
    .eq("worker_id", id)
    .order("position", { ascending: true })
    .limit(3);

  // Current roles
  const { data: roleRows = [] } = await sb
    .from("worker_roles")
    .select("role_categories(slug)")
    .eq("worker_id", worker.id);

  const selectedRoleSlugs = (roleRows || [])
    .map((r) => r.role_categories?.slug)
    .filter(Boolean);

  // Availability
  const { data: avail } = await sb
    .from("worker_availability")
    .select("available_now, available_from")
    .eq("worker_id", worker.id)
    .maybeSingle();

  const availableNow = !!avail?.available_now;
  const availableFrom =
    avail?.available_from ? new Date(avail.available_from).toISOString().slice(0, 10) : "";

  return (
    <main className="min-h-screen">
      <section className="relative border-b border-white/10">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(59,130,246,0.18),transparent_60%)]" />
        <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="mx-auto max-w-screen-xl px-4 py-8 md:py-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-500/10 px-3 py-1.5 text-[11px] font-medium text-sky-200 ring-1 ring-sky-400/15">
            <Sparkles />
            Talent Hub
          </div>
          <h1 className="mt-4 text-2xl md:text-3xl font-semibold text-white">Edit your profile</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Update your details, roles, working rights, and availability.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-screen-xl px-4 py-8">
        <EditWorkerForm
          workerId={worker.id}
          initial={{
            display_name: worker.display_name || "",
            public_profile_name: worker.public_profile_name || "",
            working_rights_slug: worker.working_rights_slug || "",
            headline: worker.headline || "",
            bio: worker.bio || "",
            location: worker.location || "",
            roles: selectedRoleSlugs,
            available_now: availableNow,
            available_from: availableFrom,
            experiences: experiences || [],
          }}
          roleOptions={roleOptions}
          workingRightsOptions={workingRightsOptions}
        />
      </section>
    </main>
  );
}

function Sparkles() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" className="text-sky-300/90">
      <path
        fill="currentColor"
        d="M12 2l1.2 3.6L17 7l-3.8 1.4L12 12l-1.2-3.6L7 7l3.8-1.4L12 2zm6 8l.8 2.4L21 13l-2.2.6L18 16l-.8-2.4L15 13l2.2-.6L18 10zM6 14l.8 2.4L9 17l-2.2.6L6 20l-.8-2.4L3 17l2.2-.6L6 14z"
      />
    </svg>
  );
}