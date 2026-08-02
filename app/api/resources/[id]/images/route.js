export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdminClient } from "@/lib/supabaseAdminClient";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import {
  cleanText,
  RESOURCE_LIMITS,
  RESOURCE_STORAGE_BUCKET,
  getResourceAuthContext,
  isAllowedResourceImageUpload,
  sanitizeFileName,
} from "@/lib/resourceHubServer";

export async function POST(req, { params }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing resource id." }, { status: 400 });
  }

  const sb = await supabaseServerClient();
  const adminSb = supabaseAdminClient();
  const { userId, isAdmin } = await getResourceAuthContext(sb);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  const { data: resource, error: resourceError } = await sb
    .from("resources")
    .select("id, owner_user_id")
    .eq("id", id)
    .maybeSingle();

  if (resourceError) {
    return NextResponse.json({ ok: false, error: resourceError.message }, { status: 400 });
  }

  if (!resource) {
    return NextResponse.json({ ok: false, error: "Resource not found." }, { status: 404 });
  }

  if (resource.owner_user_id !== userId && !isAdmin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const files = form
    .getAll("images")
    .filter((value) => typeof value === "object" && value && typeof value.name === "string");

  if (!files.length) {
    return NextResponse.json({ ok: false, error: "No images provided." }, { status: 400 });
  }

  if (files.length > RESOURCE_LIMITS.maxPreviewImages) {
    return NextResponse.json(
      { ok: false, error: `A maximum of ${RESOURCE_LIMITS.maxPreviewImages} preview images can be uploaded at once.` },
      { status: 400 }
    );
  }

  const { data: existingRows, error: existingError } = await sb
    .from("resource_images")
    .select("id")
    .eq("resource_id", id)
    .order("sort_order", { ascending: true });

  if (existingError) {
    return NextResponse.json({ ok: false, error: existingError.message }, { status: 400 });
  }

  const existingCount = (existingRows || []).length;
  if (existingCount + files.length > RESOURCE_LIMITS.maxPreviewImages) {
    return NextResponse.json(
      { ok: false, error: `This resource already has ${existingCount} image(s). Maximum is ${RESOURCE_LIMITS.maxPreviewImages}.` },
      { status: 400 }
    );
  }

  for (const file of files) {
    if (file.size > RESOURCE_LIMITS.maxPreviewImageBytes) {
      return NextResponse.json(
        {
          ok: false,
          error: `Image \"${cleanText(file.name) || "upload"}\" is too large. Max ${Math.round(RESOURCE_LIMITS.maxPreviewImageBytes / (1024 * 1024))} MB per image.`,
        },
        { status: 400 }
      );
    }

    if (!isAllowedResourceImageUpload(file)) {
      return NextResponse.json(
        { ok: false, error: `Image \"${cleanText(file.name) || "upload"}\" must be JPG, PNG, or WEBP.` },
        { status: 400 }
      );
    }
  }

  const uploadedPaths = [];
  const rowsToInsert = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const safeName = sanitizeFileName(file.name || "preview-image");
    const ts = Date.now();
    const objectPath = `users/${resource.owner_user_id}/resources/${id}/images/${ts}-${existingCount + index}-${safeName}`;

    const { error: uploadError } = await adminSb.storage
      .from(RESOURCE_STORAGE_BUCKET)
      .upload(objectPath, file, {
        contentType: cleanText(file.type) || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      if (uploadedPaths.length) {
        await adminSb.storage.from(RESOURCE_STORAGE_BUCKET).remove(uploadedPaths);
      }
      return NextResponse.json({ ok: false, error: uploadError.message || "Image upload failed." }, { status: 400 });
    }

    uploadedPaths.push(objectPath);
    rowsToInsert.push({
      resource_id: id,
      bucket_name: RESOURCE_STORAGE_BUCKET,
      object_path: objectPath,
      original_filename: safeName,
      mime_type: cleanText(file.type) || "application/octet-stream",
      size_bytes: file.size,
      sort_order: existingCount + index,
      uploaded_by: userId,
    });
  }

  const { data: insertedRows, error: insertError } = await sb
    .from("resource_images")
    .insert(rowsToInsert)
    .select("id, resource_id, original_filename, mime_type, size_bytes, sort_order, created_at")
    .order("sort_order", { ascending: true });

  if (insertError) {
    await adminSb.storage.from(RESOURCE_STORAGE_BUCKET).remove(uploadedPaths);
    return NextResponse.json({ ok: false, error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, images: insertedRows || [] });
}
