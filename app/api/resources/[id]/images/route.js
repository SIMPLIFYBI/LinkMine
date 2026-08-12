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
  let adminSb = null;
  try {
    adminSb = supabaseAdminClient();
  } catch {}
  const storageClient = adminSb || sb;
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
    .select("id, sort_order")
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
  const usedSortOrders = new Set((existingRows || []).map((row) => row.sort_order));
  const availableSortOrders = [];
  for (let sortOrder = 0; sortOrder < RESOURCE_LIMITS.maxPreviewImages; sortOrder += 1) {
    if (!usedSortOrders.has(sortOrder)) {
      availableSortOrders.push(sortOrder);
    }
  }

  if (availableSortOrders.length < files.length) {
    return NextResponse.json({ ok: false, error: "Not enough preview image slots are available." }, { status: 400 });
  }

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const safeName = sanitizeFileName(file.name || "preview-image");
    const ts = Date.now();
    const sortOrder = availableSortOrders[index];
    const objectPath = `users/${resource.owner_user_id}/resources/${id}/images/${ts}-${sortOrder}-${safeName}`;

    const { error: uploadError } = await storageClient.storage
      .from(RESOURCE_STORAGE_BUCKET)
      .upload(objectPath, file, {
        contentType: cleanText(file.type) || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      if (uploadedPaths.length) {
        await storageClient.storage.from(RESOURCE_STORAGE_BUCKET).remove(uploadedPaths);
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
      sort_order: sortOrder,
      uploaded_by: userId,
    });
  }

  const { data: insertedRows, error: insertError } = await sb
    .from("resource_images")
    .insert(rowsToInsert)
    .select("id, resource_id, bucket_name, object_path, original_filename, mime_type, size_bytes, sort_order, created_at")
    .order("sort_order", { ascending: true });

  if (insertError) {
    await storageClient.storage.from(RESOURCE_STORAGE_BUCKET).remove(uploadedPaths);
    return NextResponse.json({ ok: false, error: insertError.message }, { status: 400 });
  }

  const imageRows = await Promise.all((insertedRows || []).map(async (row) => {
    const { data: signedData, error: signedError } = await storageClient.storage
      .from(row.bucket_name || RESOURCE_STORAGE_BUCKET)
      .createSignedUrl(row.object_path, 60 * 60 * 24 * 7);

    if (signedError || !signedData?.signedUrl) {
      return {
        id: row.id,
        filename: row.original_filename,
        mimeType: row.mime_type,
        sizeBytes: row.size_bytes,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
        url: null,
      };
    }

    return {
      id: row.id,
      filename: row.original_filename,
      mimeType: row.mime_type,
      sizeBytes: row.size_bytes,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      url: signedData.signedUrl,
    };
  }));

  return NextResponse.json({ ok: true, images: imageRows });
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing resource id." }, { status: 400 });
  }

  const sb = await supabaseServerClient();
  let adminSb = null;
  try {
    adminSb = supabaseAdminClient();
  } catch {}
  const storageClient = adminSb || sb;
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

  const payload = await req.json().catch(() => ({}));
  const imageId = cleanText(payload.imageId);
  if (!imageId) {
    return NextResponse.json({ ok: false, error: "imageId is required." }, { status: 400 });
  }

  const { data: imageRow, error: imageError } = await sb
    .from("resource_images")
    .select("id, resource_id, bucket_name, object_path")
    .eq("resource_id", id)
    .eq("id", imageId)
    .maybeSingle();

  if (imageError) {
    return NextResponse.json({ ok: false, error: imageError.message }, { status: 400 });
  }

  if (!imageRow) {
    return NextResponse.json({ ok: false, error: "Image not found." }, { status: 404 });
  }

  const { error: removeStorageError } = await storageClient.storage
    .from(imageRow.bucket_name || RESOURCE_STORAGE_BUCKET)
    .remove([imageRow.object_path]);

  if (removeStorageError) {
    return NextResponse.json({ ok: false, error: removeStorageError.message || "Could not remove image object." }, { status: 400 });
  }

  const { error: deleteRowError } = await sb
    .from("resource_images")
    .delete()
    .eq("resource_id", id)
    .eq("id", imageId);

  if (deleteRowError) {
    return NextResponse.json({ ok: false, error: deleteRowError.message }, { status: 400 });
  }

  const { data: remainingRows, error: remainingError } = await sb
    .from("resource_images")
    .select("id")
    .eq("resource_id", id)
    .order("sort_order", { ascending: true });

  if (remainingError) {
    return NextResponse.json({ ok: false, error: remainingError.message }, { status: 400 });
  }

  for (let index = 0; index < (remainingRows || []).length; index += 1) {
    const row = remainingRows[index];
    const { error: reorderError } = await sb
      .from("resource_images")
      .update({ sort_order: index })
      .eq("id", row.id);

    if (reorderError) {
      return NextResponse.json({ ok: false, error: reorderError.message }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true, deletedImageId: imageId });
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

  const payload = await req.json().catch(() => ({}));
  const imageIds = Array.isArray(payload.imageIds)
    ? payload.imageIds.map((value) => cleanText(value)).filter(Boolean)
    : [];

  if (!imageIds.length) {
    return NextResponse.json({ ok: false, error: "imageIds is required." }, { status: 400 });
  }

  if (imageIds.length > RESOURCE_LIMITS.maxPreviewImages) {
    return NextResponse.json({ ok: false, error: `Maximum ${RESOURCE_LIMITS.maxPreviewImages} images can be ordered.` }, { status: 400 });
  }

  if (new Set(imageIds).size !== imageIds.length) {
    return NextResponse.json({ ok: false, error: "imageIds must not contain duplicates." }, { status: 400 });
  }

  const { data: existingRows, error: existingError } = await sb
    .from("resource_images")
    .select("id, resource_id, bucket_name, object_path, original_filename, mime_type, size_bytes, uploaded_by")
    .eq("resource_id", id)
    .order("sort_order", { ascending: true });

  if (existingError) {
    return NextResponse.json({ ok: false, error: existingError.message }, { status: 400 });
  }

  const existingIds = (existingRows || []).map((row) => row.id);
  if (!existingIds.length) {
    return NextResponse.json({ ok: false, error: "No images available to reorder." }, { status: 404 });
  }

  if (existingIds.length !== imageIds.length) {
    return NextResponse.json({ ok: false, error: "imageIds must include every existing image for this resource." }, { status: 400 });
  }

  const existingSet = new Set(existingIds);
  if (imageIds.some((imageId) => !existingSet.has(imageId))) {
    return NextResponse.json({ ok: false, error: "imageIds contains an image that does not belong to this resource." }, { status: 400 });
  }

  const rowById = new Map((existingRows || []).map((row) => [row.id, row]));
  const reorderedRows = imageIds.map((imageId, index) => {
    const row = rowById.get(imageId);
    return {
      id: row.id,
      resource_id: row.resource_id,
      bucket_name: row.bucket_name,
      object_path: row.object_path,
      original_filename: row.original_filename,
      mime_type: row.mime_type,
      size_bytes: row.size_bytes,
      uploaded_by: row.uploaded_by,
      sort_order: index,
    };
  });

  const { error: reorderError } = await sb
    .from("resource_images")
    .upsert(reorderedRows, { onConflict: "id" });

  if (reorderError) {
    return NextResponse.json({ ok: false, error: reorderError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, imageIds });
}
