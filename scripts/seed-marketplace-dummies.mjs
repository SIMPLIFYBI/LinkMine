import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.");
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const dummyResources = [
  {
    slug: "dummy-qld-open-data-gis-links",
    title: "Dummy QLD Open Data GIS Links",
    categorySlug: "gis-spatial",
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
    categorySlug: "drill-blast",
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
    categorySlug: "mine-planning",
    summary: "A placeholder planning resource to verify category filtering in marketplace.",
    description: "Seeded dummy external resource for manual QA of marketplace filters, summary text, and approved resource retrieval.",
    sourceName: "Mining Shared Reference",
    sourceUrl: "https://www.mining.com/",
    licenseName: "Public website",
    licenseUrl: "https://www.mining.com/privacy-policy/",
  },
];

async function main() {
  const { data: categories, error: categoriesError } = await admin
    .from("resource_categories")
    .select("id, slug, name")
    .order("sort_order", { ascending: true });

  if (categoriesError) {
    throw categoriesError;
  }

  const { data: userData, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 20 });
  if (usersError) {
    throw usersError;
  }

  const owner = (userData?.users || []).find((user) => user.email) || (userData?.users || [])[0];
  if (!owner) {
    throw new Error("No auth users found. A valid owner_user_id is required before seeding dummy marketplace resources.");
  }

  const categoryBySlug = new Map((categories || []).map((category) => [category.slug, category]));
  const now = new Date().toISOString();

  const rows = dummyResources.map((resource) => {
    const category = categoryBySlug.get(resource.categorySlug);
    if (!category) {
      throw new Error(`Missing resource category with slug '${resource.categorySlug}'.`);
    }

    return {
      owner_user_id: owner.id,
      category_id: category.id,
      title: resource.title,
      slug: resource.slug,
      summary: resource.summary,
      description: resource.description,
      resource_type: "external",
      status: "approved",
      source_name: resource.sourceName,
      source_url: resource.sourceUrl,
      license_name: resource.licenseName,
      license_url: resource.licenseUrl,
      estimated_size_bytes: null,
      price_cents: 0,
      currency_code: "AUD",
      is_featured: false,
      submitted_at: now,
      approved_at: now,
      approved_by: owner.id,
    };
  });

  const { data: resources, error: resourcesError } = await admin
    .from("resources")
    .upsert(rows, { onConflict: "slug" })
    .select("id, title, slug, status, owner_user_id");

  if (resourcesError) {
    throw resourcesError;
  }

  for (const resource of resources || []) {
    const { error: entitlementError } = await admin
      .from("resource_entitlements")
      .insert({
        user_id: resource.owner_user_id,
        resource_id: resource.id,
        grant_source: "owner",
        revoked_at: null,
      });

    if (entitlementError && entitlementError.code !== "23505") {
      throw entitlementError;
    }
  }

  console.log(JSON.stringify({
    owner: { id: owner.id, email: owner.email || null },
    inserted: resources || [],
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});