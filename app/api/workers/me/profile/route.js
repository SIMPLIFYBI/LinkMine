import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

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

export async function PUT(req) {
  const sb = await supabaseFromCookies();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const payload = await req.json().catch(() => ({}));
  const displayName = cleanText(payload.displayName);
  const publicProfileName = cleanText(payload.publicProfileName);
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

  const workerRow = {
    id: user.id,
    display_name: displayName || publicProfileName || user.email || "Unnamed worker",
    public_profile_name: publicProfileName || null,
    headline: headline || null,
    bio: bio || null,
    location: location || null,
    visibility,
    status,
    working_rights_slug: workingRightsSlug,
    updated_at: new Date().toISOString(),
  };

  const { error: workerError } = await sb.from("workers").upsert(workerRow, { onConflict: "id" });
  if (workerError) {
    return NextResponse.json({ error: workerError.message }, { status: 400 });
  }

  const { error: availabilityError } = await sb.from("worker_availability").upsert({
    worker_id: user.id,
    available_now: availableNow,
    available_from: availableFrom,
    updated_at: new Date().toISOString(),
  }, { onConflict: "worker_id" });

  if (availabilityError) {
    return NextResponse.json({ error: availabilityError.message }, { status: 400 });
  }

  const { error: deleteRolesError } = await sb.from("worker_roles").delete().eq("worker_id", user.id);
  if (deleteRolesError) {
    return NextResponse.json({ error: deleteRolesError.message }, { status: 400 });
  }

  if (roleCategoryIds.length) {
    const { error: insertRolesError } = await sb.from("worker_roles").insert(
      roleCategoryIds.map((roleCategoryId) => ({
        worker_id: user.id,
        role_category_id: roleCategoryId,
      }))
    );

    if (insertRolesError) {
      return NextResponse.json({ error: insertRolesError.message }, { status: 400 });
    }
  }

  const { error: deleteExperiencesError } = await sb.from("worker_experiences").delete().eq("worker_id", user.id);
  if (deleteExperiencesError) {
    return NextResponse.json({ error: deleteExperiencesError.message }, { status: 400 });
  }

  let savedExperiences = [];
  if (experiences.length) {
    const { data, error: insertExperiencesError } = await sb
      .from("worker_experiences")
      .insert(experiences.map((experience) => ({ ...experience, worker_id: user.id })))
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
      id: user.id,
      displayName: workerRow.display_name || "",
      publicProfileName: workerRow.public_profile_name || "",
      headline: workerRow.headline || "",
      bio: workerRow.bio || "",
      location: workerRow.location || "",
      visibility: workerRow.visibility,
      status: workerRow.status,
      workingRightsSlug: workerRow.working_rights_slug || "",
      availableNow,
      availableFrom: availableFrom || "",
      roleCategoryIds,
      experiences: savedExperiences,
    },
  });
}