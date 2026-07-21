import { notFound, redirect } from "next/navigation";
import {
  buildResourceRoutePayload,
  DEFAULT_RESOURCE_SELECT,
  getResourceAuthContext,
  listSelectableConsultantsForUser,
} from "@/lib/resourceHubServer";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import EditResourcePageClient from "./EditResourcePage.client.jsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `Edit Resource ${id}`,
  };
}

export default async function MarketplaceResourceEditPage({ params }) {
  const { id } = await params;
  if (!id) {
    notFound();
  }

  const sb = await supabaseServerClient();
  const { userId, isAdmin } = await getResourceAuthContext(sb);

  if (!userId) {
    redirect(`/login?redirect=${encodeURIComponent(`/marketplace/${id}/edit`)}`);
  }

  const [{ data: resourceRow, error: resourceError }, { data: categoriesRows }, { data: tagsRows }] = await Promise.all([
    sb
      .from("resources")
      .select(DEFAULT_RESOURCE_SELECT)
      .eq("id", id)
      .maybeSingle(),
    sb
      .from("resource_categories")
      .select("id, name")
      .order("name", { ascending: true }),
    sb
      .from("resource_tags")
      .select("id, name")
      .order("name", { ascending: true })
      .limit(250),
  ]);

  if (resourceError || !resourceRow) {
    notFound();
  }

  const resource = buildResourceRoutePayload(resourceRow, resourceRow.resource_tag_links || []);

  if (resource.ownerUserId !== userId && !isAdmin) {
    notFound();
  }

  const consultantOptions = await listSelectableConsultantsForUser(sb, resource.ownerUserId);

  return (
    <EditResourcePageClient
      initialResource={resource}
      categories={categoriesRows || []}
      tags={tagsRows || []}
      consultantOptions={consultantOptions}
    />
  );
}
