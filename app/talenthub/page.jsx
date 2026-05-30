import TalentHubDeck from "./TalentHubDeck.client";
import { notFound } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { supabasePublicServer } from "@/lib/supabasePublicServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Talent Hub",
  description: "Browse mining talent in a deck-style format and review concise worker CV snapshots.",
};

function formatAvailability(availability) {
  if (!availability) return null;
  if (availability.available_now) {
    return { tone: "now", label: "Available now" };
  }

  if (availability.available_from) {
    return {
      tone: "later",
      label: `Available from ${new Intl.DateTimeFormat("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(availability.available_from))}`,
    };
  }

  return null;
}

function formatExperienceWindow(startDate, endDate, isCurrent) {
  if (!startDate && !endDate && !isCurrent) return null;

  const formatter = new Intl.DateTimeFormat("en-AU", {
    month: "short",
    year: "numeric",
  });

  const start = startDate ? formatter.format(new Date(startDate)) : null;
  const end = isCurrent ? "Now" : endDate ? formatter.format(new Date(endDate)) : null;

  if (start && end) return `${start} - ${end}`;
  return start || end;
}

function normaliseAchievements(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean).join("\n");
  }
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    return Object.values(value).map((item) => String(item || "").trim()).filter(Boolean).join("\n");
  }
  return "";
}

export default async function TalentHubPage() {
  const authClient = await supabaseServerClient();
  const { data: auth } = await authClient.auth.getUser();
  const user = auth?.user || null;

  if (!user) {
    notFound();
  }

  const [{ data: adminRow }, email] = await Promise.all([
    authClient.from("app_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
    Promise.resolve(user.email?.toLowerCase() || ""),
  ]);

  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const isAdmin = Boolean(adminRow) || (email && adminEmails.includes(email));

  if (!isAdmin) {
    notFound();
  }

  const sb = supabasePublicServer();

  const [currentWorkerResult, currentWorkerAvailabilityResult, currentWorkerRolesResult, currentWorkerExperiencesResult, roleCategoriesResult, workingRightsOptionsResult] = await Promise.all([
    sb
      .from("workers")
      .select("id, display_name, public_profile_name, headline, bio, location, visibility, status, working_rights_slug")
      .eq("id", user.id)
      .maybeSingle(),
    sb
      .from("worker_availability")
      .select("worker_id, available_now, available_from")
      .eq("worker_id", user.id)
      .maybeSingle(),
    sb
      .from("worker_roles")
      .select("role_category_id")
      .eq("worker_id", user.id),
    sb
      .from("worker_experiences")
      .select("id, role_title, company, description, location, start_date, end_date, is_current, achievements, position")
      .eq("worker_id", user.id)
      .order("position", { ascending: true })
      .order("start_date", { ascending: false }),
    sb
      .from("role_categories")
      .select("id, name, slug, description, group_name, group_position, position")
      .order("group_position", { ascending: true })
      .order("position", { ascending: true })
      .order("name", { ascending: true }),
    sb
      .from("working_rights_categories")
      .select("slug, name, description, position")
      .order("position", { ascending: true })
      .order("name", { ascending: true }),
  ]);

  const { data: workersRaw = [] } = await sb
    .from("workers")
    .select("id, display_name, public_profile_name, headline, bio, location, working_rights_slug, created_at")
    .eq("visibility", "public")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(24);

  const workerIds = workersRaw.map((worker) => worker.id).filter(Boolean);
  const workingRightsSlugs = Array.from(
    new Set(workersRaw.map((worker) => worker.working_rights_slug).filter(Boolean))
  );

  const [rolesResult, availabilityResult, experiencesResult, workingRightsResult] = await Promise.all([
    workerIds.length
      ? sb
          .from("worker_roles")
          .select("worker_id, role_categories(name, slug)")
          .in("worker_id", workerIds)
      : Promise.resolve({ data: [] }),
    workerIds.length
      ? sb
          .from("worker_availability")
          .select("worker_id, available_now, available_from")
          .in("worker_id", workerIds)
      : Promise.resolve({ data: [] }),
    workerIds.length
      ? sb
          .from("worker_experiences")
          .select("worker_id, role_title, company, description, start_date, end_date, is_current, position")
          .in("worker_id", workerIds)
          .order("is_current", { ascending: false })
          .order("position", { ascending: true })
          .order("start_date", { ascending: false })
      : Promise.resolve({ data: [] }),
    workingRightsSlugs.length
      ? sb
          .from("working_rights_categories")
          .select("slug, name")
          .in("slug", workingRightsSlugs)
      : Promise.resolve({ data: [] }),
  ]);

  const rolesByWorker = new Map();
  for (const row of rolesResult.data || []) {
    const current = rolesByWorker.get(row.worker_id) || [];
    if (row.role_categories?.name) {
      current.push({
        name: row.role_categories.name,
        slug: row.role_categories.slug,
      });
    }
    rolesByWorker.set(row.worker_id, current);
  }

  const availabilityByWorker = new Map();
  for (const row of availabilityResult.data || []) {
    availabilityByWorker.set(row.worker_id, row);
  }

  const experiencesByWorker = new Map();
  for (const row of experiencesResult.data || []) {
    const current = experiencesByWorker.get(row.worker_id) || [];
    if (current.length < 3) {
      current.push({
        roleTitle: row.role_title,
        company: row.company,
        description: row.description,
        dateRange: formatExperienceWindow(row.start_date, row.end_date, row.is_current),
      });
      experiencesByWorker.set(row.worker_id, current);
    }
  }

  const workingRightsBySlug = new Map(
    (workingRightsResult.data || []).map((row) => [row.slug, row.name])
  );

  const currentWorker = currentWorkerResult.data || null;
  const currentProfile = {
    displayName: currentWorker?.display_name || "",
    publicProfileName: currentWorker?.public_profile_name || "",
    headline: currentWorker?.headline || "",
    bio: currentWorker?.bio || "",
    location: currentWorker?.location || "",
    visibility: currentWorker?.visibility || "public",
    status: currentWorker?.status || "draft",
    workingRightsSlug: currentWorker?.working_rights_slug || "",
    availableNow: Boolean(currentWorkerAvailabilityResult.data?.available_now),
    availableFrom: currentWorkerAvailabilityResult.data?.available_from || "",
    roleCategoryIds: (currentWorkerRolesResult.data || []).map((row) => row.role_category_id).filter(Boolean),
    experiences: (currentWorkerExperiencesResult.data || []).map((experience) => ({
      id: experience.id,
      roleTitle: experience.role_title || "",
      company: experience.company || "",
      description: experience.description || "",
      location: experience.location || "",
      startDate: experience.start_date || "",
      endDate: experience.end_date || "",
      isCurrent: Boolean(experience.is_current),
      achievementsText: normaliseAchievements(experience.achievements),
      position: experience.position ?? 0,
    })),
  };

  if (!currentProfile.experiences.length) {
    currentProfile.experiences = [
      {
        id: "new-0",
        roleTitle: "",
        company: "",
        description: "",
        location: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
        achievementsText: "",
        position: 0,
      },
    ];
  }

  const roleOptions = (roleCategoriesResult.data || []).map((role) => ({
    id: role.id,
    name: role.name,
    slug: role.slug,
    description: role.description || "",
    groupName: role.group_name || "Other roles",
  }));

  const workingRightsOptions = (workingRightsOptionsResult.data || []).map((option) => ({
    slug: option.slug,
    name: option.name,
    description: option.description || "",
  }));

  const workers = workersRaw.map((worker) => {
    const displayName = worker.public_profile_name || worker.display_name || "Unnamed worker";
    const bio = (worker.bio || "").trim();

    return {
      id: worker.id,
      displayName,
      headline: worker.headline || "Mining professional ready for the next opportunity.",
      bioPreview: bio ? bio.slice(0, 240) : "No bio added yet.",
      location: worker.location || "Location not specified",
      roles: rolesByWorker.get(worker.id) || [],
      availability: formatAvailability(availabilityByWorker.get(worker.id)),
      workingRights: worker.working_rights_slug
        ? workingRightsBySlug.get(worker.working_rights_slug) || null
        : null,
      experiences: experiencesByWorker.get(worker.id) || [],
    };
  });

  return (
    <main className="min-h-screen pb-12">
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:py-8">
        <TalentHubDeck
          workers={workers}
          currentProfile={currentProfile}
          roleOptions={roleOptions}
          workingRightsOptions={workingRightsOptions}
        />
      </section>
    </main>
  );
}