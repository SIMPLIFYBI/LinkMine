import { redirect } from "next/navigation";
import {
  buildResourceRoutePayload,
  DEFAULT_RESOURCE_SELECT,
  getResourceAuthContext,
} from "@/lib/resourceHubServer";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import MarketplaceAdminPageClient from "./MarketplaceAdminPage.client.jsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Marketplace Admin",
};

export default async function MarketplaceAdminPage() {
  const sb = await supabaseServerClient();
  const { userId, isAdmin } = await getResourceAuthContext(sb);

  if (!userId) {
    redirect(`/login?redirect=${encodeURIComponent("/marketplace/admin")}`);
  }

  if (!isAdmin) {
    redirect("/marketplace");
  }

  const [
    { data: pendingRows },
    { count: pendingCount },
    { count: approvedCount },
    { count: rejectedCount },
  ] = await Promise.all([
    sb
      .from("resources")
      .select(DEFAULT_RESOURCE_SELECT)
      .eq("status", "pending")
      .order("submitted_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true })
      .limit(120),
    sb
      .from("resources")
      .select("id", { head: true, count: "exact" })
      .eq("status", "pending"),
    sb
      .from("resources")
      .select("id", { head: true, count: "exact" })
      .eq("status", "approved"),
    sb
      .from("resources")
      .select("id", { head: true, count: "exact" })
      .eq("status", "rejected"),
  ]);

  const initialQueue = (pendingRows || []).map((row) =>
    buildResourceRoutePayload(row, row.resource_tag_links || [])
  );

  return (
    <MarketplaceAdminPageClient
      initialQueue={initialQueue}
      initialCounts={{
        pending: pendingCount ?? initialQueue.length,
        approved: approvedCount ?? 0,
        rejected: rejectedCount ?? 0,
      }}
    />
  );
}
