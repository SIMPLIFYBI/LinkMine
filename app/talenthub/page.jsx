import TalentHubDeck from "./TalentHubDeck.client";
import { notFound } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { supabasePublicServer } from "@/lib/supabasePublicServer";
import { getResolvedSiteMarket } from "@/lib/siteMarketServer";
import { getTalentAliasParts } from "@/lib/talentAliases";
import { DEFAULT_TALENT_OPPORTUNITY_STATUS, getTalentOpportunityStatus } from "@/lib/talentOpportunityStatuses";

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
  const { market } = await getResolvedSiteMarket();
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

  const [currentTalentProfileResult, currentWorkerAvailabilityResult, currentWorkerServicesResult, currentWorkerExperiencesResult, serviceCategoriesResult, servicesResult, workingRightsOptionsResult] = await Promise.all([
    authClient
      .from("talent_hub_profiles")
      .select("worker_id, talent_alias, headline, bio, location, visibility, status, opportunity_status, avatar_background, working_rights_slug")
      .eq("worker_id", user.id)
      .maybeSingle(),
    sb
      .from("worker_availability")
      .select("worker_id, available_now, available_from")
      .eq("worker_id", user.id)
      .maybeSingle(),
    authClient
      .from("worker_service_interests")
      .select("service_id")
      .eq("worker_id", user.id),
    sb
      .from("worker_experiences")
      .select("id, role_title, company, description, location, start_date, end_date, is_current, achievements, position")
      .eq("worker_id", user.id)
      .order("position", { ascending: true })
      .order("start_date", { ascending: false }),
    sb
      .from("service_categories")
      .select("id, name, slug, description, position, market")
      .in("market", ["mining", "oil_gas"])
      .order("position", { ascending: true })
      .order("name", { ascending: true }),
    sb
      .from("services")
      .select("id, name, slug, description, category_id, position, market")
      .in("market", ["mining", "oil_gas"])
      .order("position", { ascending: true })
      .order("name", { ascending: true }),
    sb
      .from("working_rights_categories")
      .select("slug, name, description, position")
      .order("position", { ascending: true })
      .order("name", { ascending: true }),
  ]);

  const { data: workersRawResult } = await sb
    .from("talent_hub_public_profiles")
    .select("worker_id, talent_alias, headline, bio, location, opportunity_status, avatar_background, working_rights_slug, created_at")
    .order("created_at", { ascending: false })
    .limit(24);
  const workersRaw = workersRawResult || [];

  const workerIds = workersRaw.map((worker) => worker.worker_id).filter(Boolean);
  const workingRightsSlugs = Array.from(
    new Set(workersRaw.map((worker) => worker.working_rights_slug).filter(Boolean))
  );

  const [rolesResult, availabilityResult, experiencesResult, workingRightsResult] = await Promise.all([
    workerIds.length
      ? sb
          .from("talent_hub_public_profile_services")
          .select("worker_id, service_name, service_slug")
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
    if (row.service_name) {
      current.push({
        name: row.service_name,
        slug: row.service_slug,
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

  const currentTalentProfile = currentTalentProfileResult.data || null;
  const currentAliasParts = getTalentAliasParts(currentTalentProfile?.talent_alias);
  const currentProfile = {
    id: currentTalentProfile?.worker_id || null,
    talentAlias: currentTalentProfile?.talent_alias || "",
    aliasDescriptor: currentTalentProfile?.alias_descriptor || currentAliasParts?.descriptor || "",
    aliasAnimal: currentTalentProfile?.alias_animal || currentAliasParts?.animal || "",
    headline: currentTalentProfile?.headline || "",
    bio: currentTalentProfile?.bio || "",
    location: currentTalentProfile?.location || "",
    visibility: currentTalentProfile?.visibility || "public",
    status: currentTalentProfile?.status || "draft",
    opportunityStatus: currentTalentProfile?.opportunity_status || DEFAULT_TALENT_OPPORTUNITY_STATUS,
    avatarBackground: currentTalentProfile?.avatar_background || "sage",
    workingRightsSlug: currentTalentProfile?.working_rights_slug || "",
    availableNow: Boolean(currentWorkerAvailabilityResult.data?.available_now),
    availableFrom: currentWorkerAvailabilityResult.data?.available_from || "",
    roleCategoryIds: (currentWorkerServicesResult.data || []).map((row) => row.service_id).filter(Boolean),
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

  const serviceCategoriesById = new Map(
    (serviceCategoriesResult.data || []).map((category) => [category.id, category])
  );
  const roleOptions = (servicesResult.data || []).flatMap((service) => {
    const category = serviceCategoriesById.get(service.category_id);
    if (!category) return [];
    return [{
      id: service.id,
      name: service.name,
      slug: service.slug,
      description: service.description || "",
      groupName: category.name,
      market: category.market,
    }];
  });

  const workingRightsOptions = (workingRightsOptionsResult.data || []).map((option) => ({
    slug: option.slug,
    name: option.name,
    description: option.description || "",
  }));

  const workers = workersRaw.map((worker) => {
    const bio = (worker.bio || "").trim();
    const aliasParts = getTalentAliasParts(worker.talent_alias);

    return {
      id: worker.worker_id,
      displayName: worker.talent_alias,
      aliasDescriptor: worker.alias_descriptor || aliasParts?.descriptor || "",
      aliasAnimal: worker.alias_animal || aliasParts?.animal || "",
      headline: worker.headline || "Mining professional ready for the next opportunity.",
      bioPreview: bio ? bio.slice(0, 240) : "No bio added yet.",
      location: worker.location || "Location not specified",
      roles: rolesByWorker.get(worker.id) || [],
      opportunityStatus: getTalentOpportunityStatus(worker.opportunity_status)?.label || null,
      avatarBackground: worker.avatar_background || "sage",
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
          market={market}
          isAdmin={isAdmin}
        />
      </section>
    </main>
  );
}