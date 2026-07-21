export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import {
  buildResourceRoutePayload,
  cleanNullableText,
  cleanText,
  DEFAULT_RESOURCE_SELECT,
  getResourceAuthContext,
  listSelectableConsultantsForUser,
  resolveResourceConsultantIcons,
  isValidResourceFormat,
  isSafeHttpUrl,
  isValidResourceType,
  normaliseTagIds,
  sanitizeSlug,
} from "@/lib/resourceHubServer";

function asNullablePositiveInteger(value) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.trunc(parsed);
}

export async function GET(_req, { params }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing resource id." }, { status: 400 });
  }

  const sb = await supabaseServerClient();
  const { user } = await getResourceAuthContext(sb);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await sb
    .from("resources")
    .select(DEFAULT_RESOURCE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  if (!data) {
    return NextResponse.json({ ok: false, error: "Resource not found." }, { status: 404 });
  }

  const consultantIconByResourceId = await resolveResourceConsultantIcons(sb, [data]);

  return NextResponse.json({
    ok: true,
    resource: buildResourceRoutePayload(
      {
        ...data,
        consultant_icon_url: consultantIconByResourceId.get(data.id) || null,
      },
      data.resource_tag_links || []
    ),
  });
}

export async function PATCH(req, { params }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing resource id." }, { status: 400 });
  }

  const sb = await supabaseServerClient();
  const { userId, isAdmin } = await getResourceAuthContext(sb);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  const { data: existing, error: existingError } = await sb
    .from("resources")
    .select("id, owner_user_id, resource_type, status, consultant_id")
    .eq("id", id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ ok: false, error: existingError.message }, { status: 400 });
  }

  if (!existing) {
    return NextResponse.json({ ok: false, error: "Resource not found." }, { status: 404 });
  }

  if (existing.owner_user_id !== userId && !isAdmin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { resource = {} } = await req.json().catch(() => ({ resource: {} }));

  const title = cleanText(resource.title);
  const slug = resource.slug != null ? sanitizeSlug(resource.slug) : null;
  const summary = resource.summary !== undefined ? cleanNullableText(resource.summary) : undefined;
  const description = resource.description !== undefined ? cleanNullableText(resource.description) : undefined;
  const categoryId = resource.categoryId !== undefined ? cleanNullableText(resource.categoryId) : undefined;
  const sourceName = resource.sourceName !== undefined ? cleanNullableText(resource.sourceName) : undefined;
  const sourceUrl = resource.sourceUrl !== undefined ? cleanNullableText(resource.sourceUrl) : undefined;
  const licenseName = resource.licenseName !== undefined ? cleanNullableText(resource.licenseName) : undefined;
  const licenseUrl = resource.licenseUrl !== undefined ? cleanNullableText(resource.licenseUrl) : undefined;
  const estimatedSizeBytes = resource.estimatedSizeBytes !== undefined
    ? asNullablePositiveInteger(resource.estimatedSizeBytes)
    : undefined;
  const requestedType = resource.resourceType !== undefined ? cleanText(resource.resourceType) : undefined;
  const requestedFormat = resource.resourceFormat !== undefined ? cleanText(resource.resourceFormat) : undefined;
  const requestedConsultantId = resource.consultantId !== undefined ? cleanNullableText(resource.consultantId) : undefined;
  const requestedStatus = resource.status !== undefined ? cleanText(resource.status) : undefined;
  const tagIds = resource.tagIds !== undefined ? normaliseTagIds(resource.tagIds) : null;

  const update = {};

  if (resource.title !== undefined) {
    if (!title) {
      return NextResponse.json({ ok: false, error: "Title cannot be empty." }, { status: 400 });
    }
    update.title = title;
  }

  if (resource.slug !== undefined) {
    if (!slug) {
      return NextResponse.json({ ok: false, error: "Slug cannot be empty." }, { status: 400 });
    }
    update.slug = slug;
  }

  if (summary !== undefined) update.summary = summary;
  if (description !== undefined) update.description = description;
  if (categoryId !== undefined) update.category_id = categoryId;
  if (licenseName !== undefined) update.license_name = licenseName;
  if (estimatedSizeBytes !== undefined) update.estimated_size_bytes = estimatedSizeBytes;

  if (licenseUrl !== undefined) {
    if (licenseUrl && !isSafeHttpUrl(licenseUrl)) {
      return NextResponse.json({ ok: false, error: "License URL must be http or https." }, { status: 400 });
    }
    update.license_url = licenseUrl;
  }

  const nextType = requestedType || existing.resource_type;
  if (requestedType !== undefined) {
    if (!isValidResourceType(requestedType)) {
      return NextResponse.json({ ok: false, error: "Invalid resource type." }, { status: 400 });
    }
    update.resource_type = requestedType;
  }

  if (requestedFormat !== undefined) {
    if (!isValidResourceFormat(requestedFormat)) {
      return NextResponse.json({ ok: false, error: "Invalid resource format." }, { status: 400 });
    }
    update.resource_format = requestedFormat;
  }

  if (requestedConsultantId !== undefined) {
    if (!requestedConsultantId) {
      update.consultant_id = null;
    } else {
      const availableConsultants = await listSelectableConsultantsForUser(sb, existing.owner_user_id);
      const allowedIds = new Set(availableConsultants.map((item) => item.id));
      if (!allowedIds.has(requestedConsultantId)) {
        return NextResponse.json({ ok: false, error: "Selected consultancy is not available for this resource owner." }, { status: 400 });
      }
      update.consultant_id = requestedConsultantId;
    }
  }

  if (sourceName !== undefined) update.source_name = nextType === "external" ? sourceName : null;

  if (sourceUrl !== undefined || requestedType !== undefined) {
    const nextSourceUrl = sourceUrl !== undefined ? sourceUrl : null;
    if (nextType === "external") {
      if (!isSafeHttpUrl(nextSourceUrl)) {
        return NextResponse.json({ ok: false, error: "External resources require a valid source URL." }, { status: 400 });
      }
      update.source_url = nextSourceUrl;
    } else {
      update.source_url = null;
    }
  }

  if (requestedStatus !== undefined) {
    if (!["draft", "pending"].includes(requestedStatus)) {
      return NextResponse.json({ ok: false, error: "Status must be draft or pending." }, { status: 400 });
    }

    update.status = requestedStatus;
    update.submitted_at = requestedStatus === "pending"
      ? existing.status === "pending"
        ? undefined
        : new Date().toISOString()
      : null;

    if (requestedStatus === "pending") {
      update.approved_at = null;
      update.approved_by = null;
      update.rejected_at = null;
      update.rejection_notes = null;
    }
  }

  if (Object.keys(update).length === 0 && tagIds === null) {
    return NextResponse.json({ ok: false, error: "No changes provided." }, { status: 400 });
  }

  const cleanedUpdate = Object.fromEntries(
    Object.entries(update).filter(([, value]) => value !== undefined)
  );

  if (Object.keys(cleanedUpdate).length) {
    const { error: updateError } = await sb.from("resources").update(cleanedUpdate).eq("id", id);
    if (updateError) {
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 400 });
    }
  }

  if (tagIds !== null) {
    const { error: clearError } = await sb.from("resource_tag_links").delete().eq("resource_id", id);
    if (clearError) {
      return NextResponse.json({ ok: false, error: clearError.message }, { status: 400 });
    }

    if (tagIds.length) {
      const { error: tagError } = await sb
        .from("resource_tag_links")
        .insert(tagIds.map((tagId) => ({ resource_id: id, tag_id: tagId })));

      if (tagError) {
        return NextResponse.json({ ok: false, error: tagError.message }, { status: 400 });
      }
    }
  }

  const { data, error } = await sb
    .from("resources")
    .select(DEFAULT_RESOURCE_SELECT)
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  const consultantIconByResourceId = await resolveResourceConsultantIcons(sb, [data]);

  return NextResponse.json({
    ok: true,
    resource: buildResourceRoutePayload(
      {
        ...data,
        consultant_icon_url: consultantIconByResourceId.get(data.id) || null,
      },
      data.resource_tag_links || []
    ),
  });
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing resource id." }, { status: 400 });
  }

  const url = new URL(req.url);
  const hardDelete = ["1", "true", "yes"].includes(String(url.searchParams.get("hard") || "").toLowerCase());

  const sb = await supabaseServerClient();
  const { userId, isAdmin } = await getResourceAuthContext(sb);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  const { data: existing, error: existingError } = await sb
    .from("resources")
    .select("id, owner_user_id, status")
    .eq("id", id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ ok: false, error: existingError.message }, { status: 400 });
  }

  if (!existing) {
    return NextResponse.json({ ok: false, error: "Resource not found." }, { status: 404 });
  }

  if (existing.owner_user_id !== userId && !isAdmin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  if (hardDelete) {
    const { error } = await sb
      .from("resources")
      .delete()
      .eq("id", id);

    if (error) {
      if (error.code === "23503") {
        return NextResponse.json(
          {
            ok: false,
            error: "This resource cannot be permanently deleted because it is referenced by existing records (for example orders).",
          },
          { status: 409 }
        );
      }

      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, deleted: true });
  }

  const { error } = await sb
    .from("resources")
    .update({ status: "archived" })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, archived: true });
}
