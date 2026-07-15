export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import {
  buildResourceRoutePayload,
  DEFAULT_RESOURCE_SELECT,
  getResourceAuthContext,
} from "@/lib/resourceHubServer";

const DUMMY_RESOURCES = [
  {
    slug: "dummy-qld-open-data-gis-links",
    title: "Dummy QLD Open Data GIS Links",
    categorySlug: "gis_spatial",
    summary: "A placeholder external listing for testing marketplace discovery cards.",
    description: "Seeded dummy external resource used to verify the marketplace discover view and card rendering.",
    sourceName: "Queensland Government Open Data",
    sourceUrl: "https://www.data.qld.gov.au/",
    licenseName: "Open data source",
    licenseUrl: "https://www.data.qld.gov.au/article/terms-and-conditions",
  },
  {
    slug: "dummy-drill-blast-reference-links",
    title: "Dummy Drill & Blast Reference Links",
    categorySlug: "drill_blast",
    summary: "A placeholder drill and blast reference listing for marketplace smoke testing.",
    description: "Seeded dummy external resource to confirm approved resources appear under discover without using the upload path.",
    sourceName: "Example Industry Reference",
    sourceUrl: "https://www.icmm.com/",
    licenseName: "Public reference",
    licenseUrl: "https://www.icmm.com/en-gb/terms-and-conditions",
  },
  {
    slug: "dummy-mine-planning-template-links",
    title: "Dummy Mine Planning Template Links",
    categorySlug: "mine_planning",
    summary: "A placeholder planning resource to verify category filtering in marketplace.",
    description: "Seeded dummy external resource for manual QA of marketplace filters, summary text, and approved resource retrieval.",
    sourceName: "Mining Shared Reference",
    sourceUrl: "https://www.mining.com/",
    licenseName: "Public website",
    licenseUrl: "https://www.mining.com/privacy-policy/",
  },
];

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  const sb = await supabaseServerClient();
  const { userId } = await getResourceAuthContext(sb);

  if (!userId) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  const { data: categories, error: categoriesError } = await sb
    .from("resource_categories")
    .select("id, slug");

  if (categoriesError) {
    return NextResponse.json({ ok: false, error: categoriesError.message }, { status: 400 });
  }

  const categoryBySlug = new Map((categories || []).map((category) => [category.slug, category.id]));
  const userSuffix = userId.slice(0, 8).toLowerCase();
  const now = new Date().toISOString();

  const rows = DUMMY_RESOURCES.map((resource) => {
    const categoryId = categoryBySlug.get(resource.categorySlug);
    if (!categoryId) {
      throw new Error(`Missing category '${resource.categorySlug}'.`);
    }

    return {
      owner_user_id: userId,
      category_id: categoryId,
      title: resource.title,
      slug: `${resource.slug}-${userSuffix}`,
      summary: resource.summary,
      description: resource.description,
      resource_type: "external",
      status: "approved",
      source_name: resource.sourceName,
      source_url: resource.sourceUrl,
      license_name: resource.licenseName,
      license_url: resource.licenseUrl,
      price_cents: 0,
      currency_code: "AUD",
      is_featured: false,
      submitted_at: now,
      approved_at: now,
      approved_by: null,
    };
  });

  const { data: inserted, error: insertError } = await sb
    .from("resources")
    .upsert(rows, { onConflict: "slug" })
    .select(DEFAULT_RESOURCE_SELECT);

  if (insertError) {
    return NextResponse.json({ ok: false, error: insertError.message }, { status: 400 });
  }

  for (const resource of inserted || []) {
    const { error: entitlementError } = await sb
      .from("resource_entitlements")
      .insert({
        user_id: userId,
        resource_id: resource.id,
        grant_source: "owner",
        revoked_at: null,
      });

    if (entitlementError && entitlementError.code !== "23505") {
      return NextResponse.json({ ok: false, error: entitlementError.message }, { status: 400 });
    }
  }

  return NextResponse.json({
    ok: true,
    resources: (inserted || []).map((row) => buildResourceRoutePayload(row, row.resource_tag_links || [])),
  });
}