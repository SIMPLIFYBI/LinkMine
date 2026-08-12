"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatResourceBytes } from "@/lib/resourceHub";
import { RESOURCE_LAUNCH_LIMITS } from "@/lib/resourceHub";

const MAX_PREVIEW_IMAGES = RESOURCE_LAUNCH_LIMITS.maxPreviewImages;
const MAX_PREVIEW_IMAGE_BYTES = RESOURCE_LAUNCH_LIMITS.maxPreviewImageBytes;

const RESOURCE_FORMAT_OPTIONS = [
  { value: "website", label: "Website" },
  { value: "repository", label: "Repository" },
  { value: "excel", label: "Excel" },
  { value: "word", label: "Word" },
  { value: "powerpoint", label: "PowerPoint" },
  { value: "script", label: "Script / Code" },
  { value: "app", label: "Application" },
  { value: "pdf", label: "PDF" },
  { value: "generic", label: "Generic resource" },
];

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusTone(status) {
  if (["approved", "paid", "active", "available"].includes(status)) {
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
  }
  if (["pending", "draft"].includes(status)) {
    return "border-amber-400/30 bg-amber-500/10 text-amber-100";
  }
  if (["rejected", "failed", "cancelled", "disabled"].includes(status)) {
    return "border-red-400/30 bg-red-500/10 text-red-100";
  }
  return "border-cyan-400/30 bg-cyan-500/10 text-cyan-100";
}

function Badge({ children, tone }) {
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${tone}`}>{children}</span>;
}

function Field({ label, hint, children }) {
  return (
    <label className="block space-y-2 text-sm text-slate-200">
      <span className="font-medium text-white">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}

function TextInput(props) {
  return <input {...props} className="w-full rounded-xl border border-white/12 bg-slate-950/45 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/45 focus:ring-2 focus:ring-sky-400/20" />;
}

function TextArea(props) {
  return <textarea {...props} className="w-full rounded-xl border border-white/12 bg-slate-950/45 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/45 focus:ring-2 focus:ring-sky-400/20" />;
}

function Select(props) {
  return <select {...props} className="w-full rounded-xl border border-white/12 bg-slate-950/45 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-sky-300/45 focus:ring-2 focus:ring-sky-400/20" />;
}

async function readJson(response) {
  const raw = await response.text();
  let parsedBody = {};
  if (raw) {
    try {
      parsedBody = JSON.parse(raw);
    } catch {
      parsedBody = {};
    }
  }
  if (!response.ok) {
    throw new Error(parsedBody?.error || parsedBody?.message || raw || "Request failed.");
  }
  return parsedBody;
}

async function apiSend(path, method, payload, isFormData = false) {
  const response = await fetch(path, {
    method,
    headers: isFormData ? undefined : { "Content-Type": "application/json" },
    body: payload == null ? undefined : isFormData ? payload : JSON.stringify(payload),
  });
  return readJson(response);
}

function buildForm(resource) {
  return {
    id: resource.id,
    title: resource.title || "",
    slug: resource.slug || "",
    categoryId: resource.categoryId || "",
    consultantId: resource.consultantId || "",
    resourceType: resource.resourceType || "hosted",
    resourceFormat: resource.resourceFormat || "generic",
    summary: resource.summary || "",
    description: resource.description || "",
    sourceName: resource.sourceName || "",
    sourceUrl: resource.sourceUrl || "",
    licenseName: resource.licenseName || "",
    licenseUrl: resource.licenseUrl || "",
    tagIds: Array.isArray(resource.tags) ? resource.tags.map((tag) => tag.id) : [],
    status: resource.status || "draft",
  };
}

export default function EditResourcePageClient({ initialResource, categories, consultantOptions = [], initialImages = [] }) {
  const router = useRouter();
  const [busy, startBusy] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resource, setResource] = useState(initialResource);
  const [form, setForm] = useState(() => buildForm(initialResource));
  const [replacementFile, setReplacementFile] = useState(null);
  const [resourceImages, setResourceImages] = useState(Array.isArray(initialImages) ? initialImages : []);
  const [pendingImageFiles, setPendingImageFiles] = useState([]);
  const [dragImageId, setDragImageId] = useState("");

  function resetMessages() {
    setError("");
    setSuccess("");
  }

  function validate() {
    if (!form.title.trim()) {
      throw new Error("Title is required.");
    }
    if (!form.slug.trim()) {
      throw new Error("Slug is required.");
    }
    if (!form.resourceFormat) {
      throw new Error("Resource format is required.");
    }
    if (form.resourceType === "external" && !form.sourceUrl.trim()) {
      throw new Error("External resources require a source URL.");
    }
  }

  function saveResource({ submitForReview = false } = {}) {
    resetMessages();

    startBusy(async () => {
      try {
        validate();

        const nextStatus = submitForReview
          ? "pending"
          : form.status === "pending"
            ? "pending"
            : form.status === "draft"
              ? "draft"
              : undefined;

        const updateBody = {
          resource: {
            title: form.title,
            slug: form.slug,
            categoryId: form.categoryId || null,
            consultantId: form.consultantId || null,
            resourceType: form.resourceType,
            resourceFormat: form.resourceFormat,
            summary: form.summary,
            description: form.description,
            sourceName: form.sourceName,
            sourceUrl: form.sourceUrl,
            licenseName: form.licenseName,
            licenseUrl: form.licenseUrl,
            tagIds: form.tagIds,
            status: nextStatus,
          },
        };

        const result = await apiSend(`/api/resources/${form.id}`, "PATCH", updateBody);

        if (form.resourceType === "hosted" && replacementFile) {
          const uploadForm = new FormData();
          uploadForm.append("file", replacementFile);
          await apiSend(`/api/resources/${form.id}/upload`, "POST", uploadForm, true);
        }

        const updated = result?.resource || resource;
        setResource(updated);
        setForm(buildForm(updated));
        setReplacementFile(null);
        setSuccess(submitForReview ? "Resource updated and submitted for review." : "Resource changes saved.");
        router.refresh();
      } catch (nextError) {
        setError(nextError.message || "Unable to save resource changes.");
      }
    });
  }

  function deleteResource() {
    resetMessages();

    const confirmed = window.confirm("Delete this resource permanently? This cannot be undone.");
    if (!confirmed) return;

    startBusy(async () => {
      try {
        await apiSend(`/api/resources/${form.id}?hard=1`, "DELETE");
        router.push("/marketplace");
        router.refresh();
      } catch (nextError) {
        setError(nextError.message || "Unable to delete this resource.");
      }
    });
  }

  function archiveResource() {
    resetMessages();

    const confirmed = window.confirm("Archive this resource? You can keep historical data while removing it from active listings.");
    if (!confirmed) return;

    startBusy(async () => {
      try {
        await apiSend(`/api/resources/${form.id}`, "DELETE");
        setResource((prev) => ({ ...prev, status: "archived" }));
        setForm((prev) => ({ ...prev, status: "archived" }));
        setSuccess("Resource archived.");
        router.refresh();
      } catch (nextError) {
        setError(nextError.message || "Unable to archive this resource.");
      }
    });
  }

  function choosePreviewImages(fileList) {
    resetMessages();

    const selected = Array.from(fileList || []);
    if (!selected.length) {
      setPendingImageFiles([]);
      return;
    }

    const availableSlots = Math.max(0, MAX_PREVIEW_IMAGES - resourceImages.length);
    if (availableSlots <= 0) {
      setPendingImageFiles([]);
      setError(`This resource already has the maximum of ${MAX_PREVIEW_IMAGES} preview images.`);
      return;
    }

    const invalidBySize = selected.find((file) => Number(file?.size || 0) > MAX_PREVIEW_IMAGE_BYTES);
    if (invalidBySize) {
      setPendingImageFiles([]);
      setError(`Image \"${invalidBySize.name}\" is too large. Max ${Math.round(MAX_PREVIEW_IMAGE_BYTES / (1024 * 1024))} MB per image.`);
      return;
    }

    if (selected.length > availableSlots) {
      setPendingImageFiles(selected.slice(0, availableSlots));
      setError(`Only ${availableSlots} more preview image(s) can be added.`);
      return;
    }

    setPendingImageFiles(selected);
  }

  function uploadPreviewImages() {
    resetMessages();
    if (!pendingImageFiles.length) {
      setError("Select one or more images to upload.");
      return;
    }

    startBusy(async () => {
      try {
        const uploadForm = new FormData();
        for (const file of pendingImageFiles) {
          uploadForm.append("images", file);
        }

        const result = await apiSend(`/api/resources/${form.id}/images`, "POST", uploadForm, true);
        const insertedImages = Array.isArray(result?.images) ? result.images.filter((item) => item?.id && item?.url) : [];

        if (insertedImages.length) {
          setResourceImages((prev) => {
            const merged = [...prev, ...insertedImages];
            return merged
              .sort((left, right) => Number(left.sortOrder || 0) - Number(right.sortOrder || 0))
              .slice(0, MAX_PREVIEW_IMAGES);
          });
        }

        setPendingImageFiles([]);
        setSuccess(`Uploaded ${insertedImages.length || pendingImageFiles.length} preview image(s).`);
        router.refresh();
      } catch (nextError) {
        setError(nextError.message || "Unable to upload preview images.");
      }
    });
  }

  function removePreviewImage(imageId) {
    resetMessages();
    const confirmed = window.confirm("Remove this preview image?");
    if (!confirmed) return;

    startBusy(async () => {
      try {
        await apiSend(`/api/resources/${form.id}/images`, "DELETE", { imageId });
        setResourceImages((prev) => prev.filter((image) => image.id !== imageId));
        setSuccess("Preview image removed.");
        router.refresh();
      } catch (nextError) {
        setError(nextError.message || "Unable to remove preview image.");
      }
    });
  }

  function sortImages(images) {
    return [...images].sort((left, right) => Number(left.sortOrder || 0) - Number(right.sortOrder || 0));
  }

  function reindexImages(images) {
    return images.map((image, index) => ({ ...image, sortOrder: index }));
  }

  function persistImageOrder(nextImages) {
    startBusy(async () => {
      try {
        await apiSend(`/api/resources/${form.id}/images`, "PATCH", { imageIds: nextImages.map((image) => image.id) });
        setSuccess("Preview image order updated.");
        router.refresh();
      } catch (nextError) {
        setError(nextError.message || "Unable to reorder preview images.");
      }
    });
  }

  function movePreviewImage(imageId, direction) {
    resetMessages();
    const ordered = sortImages(resourceImages);
    const fromIndex = ordered.findIndex((image) => image.id === imageId);
    if (fromIndex < 0) return;
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= ordered.length) return;

    const next = [...ordered];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    const reindexed = reindexImages(next);
    setResourceImages(reindexed);
    persistImageOrder(reindexed);
  }

  function handleImageDragStart(imageId) {
    setDragImageId(imageId);
  }

  function handleImageDrop(targetImageId) {
    if (!dragImageId || dragImageId === targetImageId) {
      setDragImageId("");
      return;
    }

    resetMessages();
    const ordered = sortImages(resourceImages);
    const fromIndex = ordered.findIndex((image) => image.id === dragImageId);
    const toIndex = ordered.findIndex((image) => image.id === targetImageId);
    if (fromIndex < 0 || toIndex < 0) {
      setDragImageId("");
      return;
    }

    const next = [...ordered];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    const reindexed = reindexImages(next);
    setResourceImages(reindexed);
    persistImageOrder(reindexed);

    setDragImageId("");
  }

  return (
    <main className="w-full px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/marketplace" className="inline-flex items-center text-sm text-slate-400 transition hover:text-white">
            Back to marketplace
          </Link>
          <Link href={`/marketplace/${resource.id}`} className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.1]">
            View resource page
          </Link>
        </div>

        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] shadow-[0_35px_120px_-60px_rgba(0,0,0,0.9)] ring-1 ring-white/10">
          <div className="grid gap-8 px-6 py-7 sm:px-8 lg:grid-cols-[1.25fr,0.75fr] lg:px-10 lg:py-10">
            <div className="space-y-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={statusTone(resource.status)}>{resource.status}</Badge>
                  {resource.category?.name ? <Badge tone="border-white/10 bg-white/[0.04] text-slate-300">{resource.category.name}</Badge> : null}
                </div>
                <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Edit resource</h1>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  This editor mirrors your resource page layout while letting you update listing content, metadata, tags, and file access settings.
                </p>
              </div>

              {error ? <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}
              {success ? <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{success}</div> : null}

              <form
                className="space-y-4 rounded-[26px] border border-white/10 bg-slate-950/35 p-5 ring-1 ring-white/10"
                onSubmit={(event) => {
                  event.preventDefault();
                  saveResource({ submitForReview: false });
                }}
              >
                <Field label="Title">
                  <TextInput value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
                </Field>

                <Field label="Slug" hint="Used in URLs and internal indexing.">
                  <TextInput value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} />
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Category">
                    <Select value={form.categoryId} onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))}>
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Resource type">
                    <Select value={form.resourceType} onChange={(event) => setForm((prev) => ({ ...prev, resourceType: event.target.value }))}>
                      <option value="hosted">Resource file</option>
                      <option value="external">External source</option>
                    </Select>
                  </Field>
                </div>

                <Field label="Consultancy badge" hint="Choose which consultancy logo appears on marketplace cards for this resource.">
                  <Select value={form.consultantId} onChange={(event) => setForm((prev) => ({ ...prev, consultantId: event.target.value }))}>
                    <option value="">Automatic (owner default)</option>
                    {consultantOptions.map((consultant) => (
                      <option key={consultant.id} value={consultant.id}>
                        {consultant.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Resource format" hint="Used to display the marketplace icon for this resource.">
                  <Select value={form.resourceFormat} onChange={(event) => setForm((prev) => ({ ...prev, resourceFormat: event.target.value }))} required>
                    {RESOURCE_FORMAT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </Select>
                </Field>

                <Field label="Summary">
                  <TextArea rows={3} value={form.summary} onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))} />
                </Field>

                <Field label="Description">
                  <TextArea rows={6} value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
                </Field>

                {form.resourceType === "external" ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Source name">
                      <TextInput value={form.sourceName} onChange={(event) => setForm((prev) => ({ ...prev, sourceName: event.target.value }))} />
                    </Field>
                    <Field label="Source URL">
                      <TextInput value={form.sourceUrl} onChange={(event) => setForm((prev) => ({ ...prev, sourceUrl: event.target.value }))} />
                    </Field>
                  </div>
                ) : null}

                {form.resourceType === "hosted" ? (
                  <Field label="Replace resource file" hint="Optional. Uploading a new file updates the current hosted pack version.">
                    <input
                      type="file"
                      onChange={(event) => setReplacementFile(event.target.files?.[0] || null)}
                      className="block w-full cursor-pointer rounded-xl border border-dashed border-white/20 bg-slate-950/45 px-3.5 py-2.5 text-sm text-slate-300 file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-950"
                    />
                  </Field>
                ) : null}

                <Field
                  label="Preview images"
                  hint={`${resourceImages.length}/${MAX_PREVIEW_IMAGES} uploaded. JPG, PNG, WEBP. Max ${Math.round(MAX_PREVIEW_IMAGE_BYTES / (1024 * 1024))} MB each.`}
                >
                  <div className="space-y-3">
                    {resourceImages.length ? (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {resourceImages.map((image, index) => (
                          <div
                            key={image.id || image.url || index}
                            draggable={!busy}
                            onDragStart={() => handleImageDragStart(image.id)}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={() => handleImageDrop(image.id)}
                            onDragEnd={() => setDragImageId("")}
                            className={[
                              "overflow-hidden rounded-xl border bg-slate-900/45",
                              dragImageId === image.id ? "border-sky-300/60 ring-2 ring-sky-300/25" : "border-white/12",
                            ].join(" ")}
                          >
                            <img
                              src={image.url}
                              alt={image.filename || `Preview image ${index + 1}`}
                              className="h-28 w-full object-cover"
                              loading="lazy"
                            />
                            <div className="px-2.5 pt-2 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                              Drag to reorder
                            </div>
                            <div className="flex items-center justify-between gap-2 px-2.5 py-2">
                              <div className="truncate text-xs text-slate-300">{image.filename || `Preview image ${index + 1}`}</div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={busy || index === 0}
                                  onClick={() => movePreviewImage(image.id, -1)}
                                  className="rounded-full border border-white/15 bg-white/[0.04] px-2 py-1 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Up
                                </button>
                                <button
                                  type="button"
                                  disabled={busy || index === resourceImages.length - 1}
                                  onClick={() => movePreviewImage(image.id, 1)}
                                  className="rounded-full border border-white/15 bg-white/[0.04] px-2 py-1 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Down
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => removePreviewImage(image.id)}
                                  className="rounded-full border border-red-300/25 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-white/20 bg-slate-950/30 px-3 py-3 text-sm text-slate-400">
                        No preview images uploaded yet.
                      </div>
                    )}

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={(event) => choosePreviewImages(event.target.files)}
                      className="block w-full cursor-pointer rounded-xl border border-dashed border-white/20 bg-slate-950/45 px-3.5 py-2.5 text-sm text-slate-300 file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-950"
                    />

                    {pendingImageFiles.length ? (
                      <div className="rounded-xl border border-white/12 bg-slate-950/35 px-3 py-2 text-xs text-slate-300">
                        Ready to upload: {pendingImageFiles.map((file) => file.name).join(", ")}
                      </div>
                    ) : null}

                    <button
                      type="button"
                      disabled={busy || !pendingImageFiles.length}
                      onClick={uploadPreviewImages}
                      className="rounded-full border border-sky-300/25 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busy ? "Working..." : "Upload preview images"}
                    </button>
                  </div>
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="License name">
                    <TextInput value={form.licenseName} onChange={(event) => setForm((prev) => ({ ...prev, licenseName: event.target.value }))} />
                  </Field>
                  <Field label="License URL">
                    <TextInput value={form.licenseUrl} onChange={(event) => setForm((prev) => ({ ...prev, licenseUrl: event.target.value }))} />
                  </Field>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button type="submit" disabled={busy} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60">
                    {busy ? "Saving..." : "Save changes"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => saveResource({ submitForReview: true })}
                    className="rounded-full border border-sky-300/25 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Save and submit
                  </button>
                  <Link href="/marketplace" className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.1]">
                    Exit editor
                  </Link>
                  <button
                    type="button"
                    disabled={busy || form.status === "archived"}
                    onClick={archiveResource}
                    className="rounded-full border border-amber-300/25 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {form.status === "archived" ? "Already archived" : "Archive resource"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={deleteResource}
                    className="rounded-full border border-red-300/25 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Delete permanently
                  </button>
                </div>
              </form>
            </div>

            <aside className="space-y-4">
              <div className="rounded-[28px] border border-white/10 bg-slate-950/35 p-5 ring-1 ring-white/10">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Availability</div>
                <div className="mt-3 text-3xl font-semibold text-white">Included</div>
                <div className="mt-2 text-sm text-slate-400">{resource.downloadCount || 0} downloads</div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-slate-950/35 p-5 ring-1 ring-white/10">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Access</div>
                <div className="mt-3 text-sm text-slate-200">
                  {form.resourceType === "external" ? (form.sourceName || "External source") : "Resource file"}
                </div>
                {form.resourceType === "external" && form.sourceUrl ? <div className="mt-2 break-all text-xs text-slate-400">{form.sourceUrl}</div> : null}
              </div>

              <div className="rounded-[28px] border border-white/10 bg-slate-950/35 p-5 ring-1 ring-white/10">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Metadata</div>
                <div className="mt-3 space-y-2 text-sm text-slate-300">
                  <div>Updated {formatDate(resource.updatedAt) || "Recently"}</div>
                  <div>Created {formatDate(resource.createdAt) || "Recently"}</div>
                  <div>Estimated size {formatResourceBytes(resource.estimatedSizeBytes) || "Not set"}</div>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
