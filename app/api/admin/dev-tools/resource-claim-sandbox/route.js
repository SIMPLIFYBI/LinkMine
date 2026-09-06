export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { siteUrl } from "@/lib/siteUrl";

const SANDBOX = {
  consultantSlug: "dev-claim-sandbox-creator",
  consultantName: "DEV Claim Sandbox Creator",
  resourceSlug: "dev-claim-sandbox-resource",
  resourceTitle: "DEV Claim Sandbox Resource",
  claimEmail: (process.env.DEV_CLAIM_SANDBOX_EMAIL || "dev-claim-sandbox@youmine.invalid")
    .trim()
    .toLowerCase(),
};

async function getAdminContext(req) {
  const sb = await supabaseServerClient({
    global: {
      headers: {
        Authorization: req.headers.get("Authorization") ?? req.headers.get("authorization") ?? "",
      },
    },
  });

  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  let user = null;

  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token) {
      const { data } = await sb.auth.getUser(token);
      user = data?.user || null;
    }
  }

  if (!user) {
    const { data } = await sb.auth.getUser();
    user = data?.user || null;
  }

  if (!user) {
    return { ok: false, status: 401, error: "Not authenticated" };
  }

  const [{ data: adminRow }, email] = await Promise.all([
    sb.from("app_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
    Promise.resolve(user.email?.toLowerCase() || ""),
  ]);

  const envAdmins = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const isAdmin = Boolean(adminRow) || (email && envAdmins.includes(email));

  if (!isAdmin) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true, user };
}

async function ensureSandboxRows(sb, actorUserId) {

  const consultantPayload = {
    slug: SANDBOX.consultantSlug,
    display_name: SANDBOX.consultantName,
    headline: "Developer-only profile for resource-claim flow testing.",
    location: "Perth, WA",
    contact_email: SANDBOX.claimEmail,
    visibility: "public",
    status: "approved",
    claimed_by: null,
    claimed_at: null,
    claim_token: null,
    user_id: null,
  };

  const { data: consultantRows, error: consultantLookupErr } = await sb
    .from("consultants")
    .select("id, slug, created_at")
    .eq("slug", SANDBOX.consultantSlug)
    .order("created_at", { ascending: false })
    .limit(1);

  if (consultantLookupErr) {
    throw new Error(consultantLookupErr.message || "Could not look up sandbox consultant.");
  }

  let consultantId = consultantRows?.[0]?.id || null;

  if (!consultantId) {
    const { data: insertedConsultant, error: consultantInsertErr } = await sb
      .from("consultants")
      .insert(consultantPayload)
      .select("id")
      .single();

    if (consultantInsertErr || !insertedConsultant?.id) {
      throw new Error(consultantInsertErr?.message || "Could not create sandbox consultant.");
    }

    consultantId = insertedConsultant.id;
  }

  // Force reset state each run.
  const { data: consultantReset, error: consultantResetErr } = await sb
    .from("consultants")
    .update({
      contact_email: SANDBOX.claimEmail,
      claimed_by: null,
      claimed_at: null,
      claim_token: null,
      visibility: "public",
      status: "approved",
      user_id: null,
    })
    .eq("id", consultantId)
    .select("id, slug, contact_email, claimed_by, claimed_at")
    .single();

  if (consultantResetErr || !consultantReset?.id) {
    throw new Error(consultantResetErr?.message || "Could not reset sandbox consultant.");
  }

  const consultant = consultantReset;

  const resourcePayload = {
    owner_user_id: actorUserId,
    title: SANDBOX.resourceTitle,
    slug: SANDBOX.resourceSlug,
    summary: "Developer-only record used to repeatedly test the unclaimed resource claim flow.",
    description:
      "This sandbox resource is safe to reset. Claiming this record should never impact real customer resources.",
    resource_type: "external",
    resource_format: "website",
    status: "approved",
    source_name: "YouMine Dev Tools",
    source_url: "https://example.com/dev-claim-sandbox",
    claim_contact_email: SANDBOX.claimEmail,
    consultant_id: null,
    approved_at: new Date().toISOString(),
    approved_by: actorUserId,
  };

  let { data: resource, error: resourceErr } = await sb
    .from("resources")
    .upsert(resourcePayload, { onConflict: "slug" })
    .select("id, slug, owner_user_id, claim_contact_email, consultant_id, status")
    .maybeSingle();

  if (resourceErr || !resource?.id) {
    throw new Error(resourceErr?.message || "Could not create sandbox resource.");
  }

  const { data: resourceReset, error: resourceResetErr } = await sb
    .from("resources")
    .update({
      owner_user_id: actorUserId,
      claim_contact_email: SANDBOX.claimEmail,
      consultant_id: null,
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: actorUserId,
      source_url: "https://example.com/dev-claim-sandbox",
    })
    .eq("id", resource.id)
    .select("id, slug, owner_user_id, claim_contact_email, consultant_id, status")
    .single();

  if (resourceResetErr || !resourceReset?.id) {
    throw new Error(resourceResetErr?.message || "Could not reset sandbox resource.");
  }

  resource = resourceReset;

  return { consultant, resource };
}

async function loadSandboxState(sb) {
  const [{ data: consultantRows }, { data: resource }] = await Promise.all([
    sb
      .from("consultants")
      .select("id, slug, contact_email, claimed_by, claimed_at")
      .eq("slug", SANDBOX.consultantSlug)
      .order("created_at", { ascending: false })
      .limit(1),
    sb
      .from("resources")
      .select("id, slug, owner_user_id, claim_contact_email, consultant_id, status")
      .eq("slug", SANDBOX.resourceSlug)
      .maybeSingle(),
  ]);

  const consultant = consultantRows?.[0] || null;
  return { consultant, resource };
}

export async function POST(req) {
  try {
    const adminCheck = await getAdminContext(req);
    if (!adminCheck.ok) {
      return NextResponse.json({ ok: false, error: adminCheck.error }, { status: adminCheck.status });
    }

    const body = await req.json().catch(() => ({}));
    const mode = body?.mode === "preview" ? "preview" : "reset";

    const sb = await supabaseServerClient({
      global: {
        headers: {
          Authorization: req.headers.get("Authorization") ?? req.headers.get("authorization") ?? "",
        },
      },
    });

    let state = await loadSandboxState(sb);

    if (mode === "reset") {
      state = await ensureSandboxRows(sb, adminCheck.user.id);
    }

    const resourceId = state?.resource?.id || null;
    const consultantId = state?.consultant?.id || null;

    return NextResponse.json({
      ok: true,
      mode,
      sandbox: {
        claimEmail: SANDBOX.claimEmail,
        consultantId,
        resourceId,
        consultantClaimed: Boolean(state?.consultant?.claimed_by),
      },
      links: {
        resource: resourceId ? siteUrl(`/vault/${resourceId}`, req) : null,
        claim: consultantId ? siteUrl(`/claim?consultant=${consultantId}`, req) : null,
      },
      state,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Unable to manage resource claim sandbox.",
      },
      { status: 500 }
    );
  }
}
