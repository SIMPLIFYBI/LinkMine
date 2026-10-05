import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { generateTalentAlias, getTalentAliasParts, isTalentAlias } from "@/lib/talentAliases";

const VISIBILITY_VALUES = new Set(["public", "private"]);
const STATUS_VALUES = new Set(["draft", "pending", "approved", "rejected"]);

async function supabaseFromCookies() {
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => jar.get(name)?.value,
        set() {},
        remove() {},
      },
    }
  );
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanNullableText(value) {
  const cleaned = cleanText(value);
  return cleaned || null;
}

function toAchievements(value) {
  const lines = String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.length ? lines : null;
}

function normaliseExperience(experience, index) {
  const roleTitle = cleanText(experience?.roleTitle);
  const company = cleanNullableText(experience?.company);
  const description = cleanNullableText(experience?.description);
  const location = cleanNullableText(experience?.location);
  const startDate = cleanNullableText(experience?.startDate);
  const isCurrent = Boolean(experience?.isCurrent);
  const endDate = isCurrent ? null : cleanNullableText(experience?.endDate);
  const achievements = toAchievements(experience?.achievementsText);
  const position = Number.isFinite(Number(experience?.position)) ? Number(experience.position) : index;

  const hasContent = Boolean(
    roleTitle || company || description || location || startDate || endDate || achievements?.length
  );

  if (!hasContent) return null;
  if (!roleTitle) return { error: "Each saved experience needs a role title." };

  return {
    role_title: roleTitle,
    company,
    description,
    location,
    start_date: startDate,
    end_date: endDate,
    is_current: isCurrent,
    achievements,
    position,
  };
}

async function canManageWorker(sb, user, workerId) {
  if (workerId === user.id) return true;

  const [{ data: adminRow }, email] = await Promise.all([
    sb.from("app_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
    Promise.resolve(user.email?.toLowerCase() || ""),
  ]);
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return Boolean(adminRow) || (email && adminEmails.includes(email));
}

async function getProfileAccess(req, payload = {}) {
  const sb = await supabaseFromCookies();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };

  const workerId = new URL(req.url).searchParams.get("workerId") || payload.workerId || user.id;
  const canManage = await canManageWorker(sb, user, workerId);
  if (!canManage) return { error: NextResponse.json({ error: "Not authorized" }, { status: 403 }) };

  return { sb, workerId, isOwnProfile: workerId === user.id };
}

function toClientExperience(experience) {
  return {
    id: experience.id,
    roleTitle: experience.role_title || "",
    company: experience.company || "",
    description: experience.description || "",
    location: experience.location || "",
    startDate: experience.start_date || "",
    endDate: experience.end_date || "",
    isCurrent: Boolean(experience.is_current),
    achievementsText: Array.isArray(experience.achievements)
      ? experience.achievements.join("\n")
      : typeof experience.achievements === "string"
        ? experience.achievements
        : "",
    position: experience.position ?? 0,
  };
}

export async function GET(req) {
  const access = await getProfileAccess(req);
  if (access.error) return access.error;

  const [profileResult, availabilityResult, servicesResult, experiencesResult] = await Promise.all([
    access.sb.from("talent_hub_profiles").select("worker_id, talent_alias, headline, bio, location, visibility, status, working_rights_slug").eq("worker_id", access.workerId).maybeSingle(),
    access.sb.from("worker_availability").select("available_now, available_from").eq("worker_id", access.workerId).maybeSingle(),
    access.sb.from("worker_service_interests").select("service_id").eq("worker_id", access.workerId),
    access.sb.from("worker_experiences").select("id, role_title, company, description, location, start_date, end_date, is_current, achievements, position").eq("worker_id", access.workerId).order("position", { ascending: true }),
  ]);
  const error = profileResult.error || availabilityResult.error || servicesResult.error || experiencesResult.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const profile = profileResult.data || {};
  const aliasParts = getTalentAliasParts(profile.talent_alias);
  return NextResponse.json({
    profile: {
      id: access.workerId,
      talentAlias: profile.talent_alias || "",
      aliasDescriptor: aliasParts?.descriptor || "",
      aliasAnimal: aliasParts?.animal || "",
      headline: profile.headline || "",
      bio: profile.bio || "",
      location: profile.location || "",
      visibility: profile.visibility || "public",
      status: profile.status || "draft",
      workingRightsSlug: profile.working_rights_slug || "",
      availableNow: Boolean(availabilityResult.data?.available_now),
      availableFrom: availabilityResult.data?.available_from || "",
      roleCategoryIds: (servicesResult.data || []).map((row) => row.service_id).filter(Boolean),
      experiences: (experiencesResult.data || []).map(toClientExperience),
    },
  });
}

export async function PUT(req) {
  const payload = await req.json().catch(() => ({}));
  const access = await getProfileAccess(req, payload);
  if (access.error) return access.error;
  const { sb, workerId, isOwnProfile } = access;
  const requestedAlias = cleanText(payload.talentAlias);
  const talentAlias = isTalentAlias(requestedAlias) ? requestedAlias : generateTalentAlias();
  const aliasParts = getTalentAliasParts(talentAlias);
  const headline = cleanText(payload.headline);
  const bio = cleanText(payload.bio);
  const location = cleanText(payload.location);
  const visibility = cleanText(payload.visibility) || "public";
  const status = cleanText(payload.status) || "draft";
  const workingRightsSlug = cleanNullableText(payload.workingRightsSlug);
  const availableNow = Boolean(payload.availableNow);
  const availableFrom = availableNow ? null : cleanNullableText(payload.availableFrom);
  const roleCategoryIds = Array.from(new Set(Array.isArray(payload.roleCategoryIds) ? payload.roleCategoryIds.filter(Boolean) : []));
  const rawExperiences = Array.isArray(payload.experiences) ? payload.experiences : [];

  if (!VISIBILITY_VALUES.has(visibility)) {
    return NextResponse.json({ error: "Invalid visibility." }, { status: 400 });
  }

  if (!STATUS_VALUES.has(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const experiences = [];
  for (let index = 0; index < rawExperiences.length; index += 1) {
    const normalized = normaliseExperience(rawExperiences[index], index);
    if (!normalized) continue;
    if (normalized.error) {
      return NextResponse.json({ error: normalized.error }, { status: 400 });
    }
    experiences.push(normalized);
  }

  if (isOwnProfile) {
    const { error: workerError } = await sb.from("workers").upsert({
      id: workerId,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
    if (workerError) {
      return NextResponse.json({ error: workerError.message }, { status: 400 });
    }
  }

  const talentProfileRow = {
    worker_id: workerId,
    talent_alias: talentAlias,
    headline: headline || null,
    bio: bio || null,
    location: location || null,
    visibility,
    status,
    working_rights_slug: workingRightsSlug,
    updated_at: new Date().toISOString(),
  };

  const { error: talentProfileError } = await sb
    .from("talent_hub_profiles")
    .upsert(talentProfileRow, { onConflict: "worker_id" });
  if (talentProfileError) {
    const error = talentProfileError.code === "23505"
      ? "That Talent Alias was just claimed. Regenerate one and save again."
      : talentProfileError.message;
    return NextResponse.json({ error }, { status: 400 });
  }

  const { error: availabilityError } = await sb.from("worker_availability").upsert({
    worker_id: workerId,
    available_now: availableNow,
    available_from: availableFrom,
    updated_at: new Date().toISOString(),
  }, { onConflict: "worker_id" });

  if (availabilityError) {
    return NextResponse.json({ error: availabilityError.message }, { status: 400 });
  }

  const { error: deleteServicesError } = await sb
    .from("worker_service_interests")
    .delete()
    .eq("worker_id", workerId);
  if (deleteServicesError) {
    return NextResponse.json({ error: deleteServicesError.message }, { status: 400 });
  }

  if (roleCategoryIds.length) {
    const { error: insertServicesError } = await sb.from("worker_service_interests").insert(
      roleCategoryIds.map((serviceId) => ({
        worker_id: workerId,
        service_id: serviceId,
      }))
    );

    if (insertServicesError) {
      return NextResponse.json({ error: insertServicesError.message }, { status: 400 });
    }
  }

  const { error: deleteExperiencesError } = await sb.from("worker_experiences").delete().eq("worker_id", workerId);
  if (deleteExperiencesError) {
    return NextResponse.json({ error: deleteExperiencesError.message }, { status: 400 });
  }

  let savedExperiences = [];
  if (experiences.length) {
    const { data, error: insertExperiencesError } = await sb
      .from("worker_experiences")
      .insert(experiences.map((experience) => ({ ...experience, worker_id: workerId })))
      .select("id, role_title, company, description, location, start_date, end_date, is_current, achievements, position")
      .order("position", { ascending: true });

    if (insertExperiencesError) {
      return NextResponse.json({ error: insertExperiencesError.message }, { status: 400 });
    }

    savedExperiences = (data || []).map((experience) => ({
      id: experience.id,
      roleTitle: experience.role_title || "",
      company: experience.company || "",
      description: experience.description || "",
      location: experience.location || "",
      startDate: experience.start_date || "",
      endDate: experience.end_date || "",
      isCurrent: Boolean(experience.is_current),
      achievementsText: Array.isArray(experience.achievements)
        ? experience.achievements.join("\n")
        : typeof experience.achievements === "string"
          ? experience.achievements
          : "",
      position: experience.position ?? 0,
    }));
  }

  return NextResponse.json({
    ok: true,
    profile: {
      id: workerId,
      talentAlias: talentProfileRow.talent_alias,
      aliasDescriptor: aliasParts.descriptor,
      aliasAnimal: aliasParts.animal,
      headline: talentProfileRow.headline || "",
      bio: talentProfileRow.bio || "",
      location: talentProfileRow.location || "",
      visibility: talentProfileRow.visibility,
      status: talentProfileRow.status,
      workingRightsSlug: talentProfileRow.working_rights_slug || "",
      availableNow,
      availableFrom: availableFrom || "",
      roleCategoryIds,
      experiences: savedExperiences,
    },
  });
}