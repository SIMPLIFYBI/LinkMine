import { redirect } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EditConsultantWorkspacePage({ params, searchParams }) {
  const { id } = await params;
  const resolvedSearchParams = (await searchParams) || {};
  const requestedResourceId = typeof resolvedSearchParams.resourceId === "string"
    ? resolvedSearchParams.resourceId
    : "";

  redirect(requestedResourceId ? `/vault/${requestedResourceId}/edit` : `/consultants/${id}/edit`);
}
