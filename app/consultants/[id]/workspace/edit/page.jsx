import { notFound, redirect } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import WorkspaceEditor from "./WorkspaceEditor.client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EditConsultantWorkspacePage({ params, searchParams }) {
  const { id } = await params;
  const resolvedSearchParams = (await searchParams) || {};
  const requestedResourceId = typeof resolvedSearchParams.resourceId === "string"
    ? resolvedSearchParams.resourceId
    : "";
  const requestedResourceTab = typeof resolvedSearchParams.resourceTab === "string"
    ? resolvedSearchParams.resourceTab
    : "library";
  const sb = await supabaseServerClient();

  const { data: auth } = await sb.auth.getUser();
  const userId = auth?.user?.id || null;

  const { data: consultant, error } = await sb
    .from("consultants")
    .select(`
      id,
      display_name,
      headline,
      bio,
      company,
      location,
      country_code,
      global_region,
      contact_email,
      website_url,
      metadata,
      claimed_by,
      linkedin_url,
      facebook_url,
      twitter_url,
      instagram_url,
      place_id,
      status,
      provider_kind,
      profile_type,
      abn,
      acn,
      abn_verified,
      abn_status,
      abn_entity_name,
      abn_entity_type,
      abn_gst_registered_from,
      abn_last_checked
    `)
    .eq("id", id)
    .maybeSingle();

  if (error || !consultant) return notFound();

  let isAdmin = false;
  if (userId) {
    const { data: adminRow } = await sb
      .from("app_admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    isAdmin = Boolean(adminRow);
  }

  if (!userId) {
    redirect(`/login?redirect=${encodeURIComponent(`/consultants/${id}/workspace/edit`)}`);
  }

  if (consultant.claimed_by !== userId && !isAdmin) {
    redirect(`/consultants/${id}`);
  }

  let resourcesQuery = sb
    .from("resources")
    .select("id, title, summary, status, resource_type, resource_format, updated_at")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (consultant.claimed_by) {
    resourcesQuery = resourcesQuery.or(
      `consultant_id.eq.${consultant.id},owner_user_id.eq.${consultant.claimed_by}`
    );
  } else {
    resourcesQuery = resourcesQuery.eq("consultant_id", consultant.id);
  }

  const { data: resources = [] } = await resourcesQuery;

  return (
    <WorkspaceEditor
      consultant={consultant}
      resources={resources}
      initialResourceId={requestedResourceId}
      initialResourceTab={requestedResourceTab}
    />
  );
}
