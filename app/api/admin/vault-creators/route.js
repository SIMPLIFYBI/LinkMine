export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import {
  cleanNullableText,
  cleanText,
  isSafeHttpUrl,
  isValidResourceFormat,
  isValidResourceType,
  sanitizeSlug,
} from "@/lib/resourceHubServer";
import { sendEmail } from "@/lib/emailPostmark";
import { logEmailSent } from "@/lib/emails/trackEmail";
import { buildVaultCreatorClaimEmail } from "@/lib/emails/vaultCreatorClaim";
import { siteUrl } from "@/lib/siteUrl";

const EMAIL_TYPE = "vault_creator_claim_outreach_2026";

function uniqueSlug(value) {
  const base = sanitizeSlug(value).slice(0, 64) || "creator";
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function getAdmin(req) {
  const sb = await supabaseServerClient({
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Not authenticated", status: 401 };

  const { data: adminRow } = await sb
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (!adminRow && !adminEmails.includes(String(user.email || "").toLowerCase())) {
    return { error: "Forbidden", status: 403 };
  }
  return { sb, user };
}

export async function GET(req) {
  const admin = await getAdmin(req);
  if (admin.error) return NextResponse.json({ ok: false, error: admin.error }, { status: admin.status });

  const { data: creators, error } = await admin.sb
    .from("consultants")
    .select("id, display_name, contact_email, metadata, created_at")
    .in("profile_type", ["creator", "both"])
    .eq("visibility", "private")
    .eq("status", "approved")
    .is("claimed_by", null)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  const creatorIds = (creators || []).map((creator) => creator.id);
  const { data: resources } = creatorIds.length
    ? await admin.sb
      .from("resources")
      .select("id, consultant_id, title, status")
      .in("consultant_id", creatorIds)
      .order("created_at", { ascending: false })
    : { data: [] };
  const resourceRows = resources || [];
  const resourceIds = resourceRows.map((resource) => resource.id);
  const { data: images } = resourceIds.length
    ? await admin.sb.from("resource_images").select("resource_id").in("resource_id", resourceIds)
    : { data: [] };
  const imageCountByResource = new Map();
  (images || []).forEach((image) => imageCountByResource.set(image.resource_id, (imageCountByResource.get(image.resource_id) || 0) + 1));

  return NextResponse.json({
    ok: true,
    creators: (creators || []).map((creator) => ({
      ...creator,
      hasLogo: Boolean(creator.metadata?.logo?.url),
      resources: resourceRows
        .filter((resource) => resource.consultant_id === creator.id)
        .map((resource) => ({ ...resource, imageCount: imageCountByResource.get(resource.id) || 0 })),
    })),
  });
}

export async function POST(req) {
  const admin = await getAdmin(req);
  if (admin.error) return NextResponse.json({ ok: false, error: admin.error }, { status: admin.status });
  const { sb, user } = admin;

  const body = await req.json().catch(() => ({}));
  const profile = body.profile || {};
  const resource = body.resource || null;
  const displayName = cleanText(profile.displayName);
  const contactEmail = cleanText(profile.contactEmail).toLowerCase();

  if (!displayName) return NextResponse.json({ ok: false, error: "Creator name is required." }, { status: 400 });
  if (!isValidEmail(contactEmail)) return NextResponse.json({ ok: false, error: "A valid creator email is required." }, { status: 400 });

  const { data: existing } = await sb
    .from("consultants")
    .select("id")
    .eq("contact_email", contactEmail)
    .in("profile_type", ["creator", "both"])
    .limit(1)
    .maybeSingle();
  if (existing) return NextResponse.json({ ok: false, error: "A creator profile already exists for this email." }, { status: 409 });

  const creatorPayload = {
    display_name: displayName,
    company: cleanNullableText(profile.company) || displayName,
    headline: cleanNullableText(profile.headline),
    bio: cleanNullableText(profile.bio),
    location: cleanNullableText(profile.location),
    contact_email: contactEmail,
    profile_type: "creator",
    visibility: "private",
    status: "approved",
    slug: uniqueSlug(displayName),
    user_id: null,
    claimed_by: null,
    claimed_at: null,
    claim_token: null,
  };

  const { data: creator, error: creatorError } = await sb
    .from("consultants")
    .insert(creatorPayload)
    .select("id, display_name, contact_email")
    .single();
  if (creatorError) return NextResponse.json({ ok: false, error: creatorError.message }, { status: 400 });

  let createdResource = null;
  const resourceTitle = cleanText(resource?.title);
  if (resourceTitle) {
    const resourceType = cleanText(resource.resourceType) || "external";
    const resourceFormat = cleanText(resource.resourceFormat);
    const sourceUrl = cleanNullableText(resource.sourceUrl);
    if (!isValidResourceType(resourceType) || !isValidResourceFormat(resourceFormat)) {
      return NextResponse.json({ ok: false, error: "The resource type and format are required." }, { status: 400 });
    }
    if (resourceType === "external" && !isSafeHttpUrl(sourceUrl)) {
      return NextResponse.json({ ok: false, error: "External resources require a valid source URL." }, { status: 400 });
    }

    const { data, error: resourceError } = await sb
      .from("resources")
      .insert({
        owner_user_id: user.id,
        consultant_id: creator.id,
        claim_contact_email: contactEmail,
        title: resourceTitle,
        slug: uniqueSlug(resourceTitle),
        summary: cleanNullableText(resource.summary),
        description: cleanNullableText(resource.description),
        resource_type: resourceType,
        resource_format: resourceFormat,
        source_name: resourceType === "external" ? cleanNullableText(resource.sourceName) : null,
        source_url: resourceType === "external" ? sourceUrl : null,
        status: "draft",
        price_cents: 0,
        currency_code: "AUD",
      })
      .select("id, title")
      .single();
    if (resourceError) {
      await sb.from("consultants").delete().eq("id", creator.id);
      return NextResponse.json({ ok: false, error: resourceError.message }, { status: 400 });
    }
    createdResource = data;
  }

  return NextResponse.json({ ok: true, creator, resource: createdResource }, { status: 201 });
}

export async function PATCH(req) {
  const admin = await getAdmin(req);
  if (admin.error) return NextResponse.json({ ok: false, error: admin.error }, { status: admin.status });
  const { sb } = admin;
  const { creatorId } = await req.json().catch(() => ({}));
  if (!creatorId) return NextResponse.json({ ok: false, error: "Creator id is required." }, { status: 400 });

  const { data: creator, error: creatorError } = await sb
    .from("consultants")
    .select("id, display_name, company, contact_email, claimed_by, profile_type")
    .eq("id", creatorId)
    .maybeSingle();
  if (creatorError || !creator) return NextResponse.json({ ok: false, error: "Creator profile not found." }, { status: 404 });
  if (!["creator", "both"].includes(creator.profile_type || "consultant") || creator.claimed_by) {
    return NextResponse.json({ ok: false, error: "Only unclaimed creator profiles can be published." }, { status: 400 });
  }
  if (!isValidEmail(String(creator.contact_email || ""))) {
    return NextResponse.json({ ok: false, error: "Creator profile needs a valid contact email." }, { status: 400 });
  }

  const { error: publishError } = await sb
    .from("consultants")
    .update({ visibility: "public", status: "approved" })
    .eq("id", creator.id);
  if (publishError) return NextResponse.json({ ok: false, error: publishError.message }, { status: 400 });

  const base = siteUrl("", req);
  const profileUrl = `${base}/consultants/${creator.id}`;
  const email = buildVaultCreatorClaimEmail({ creator, profileUrl, signupUrl: `${base}/signup`, loginUrl: `${base}/login` });
  let inviteSent = false;
  let inviteError = null;
  try {
    const result = await sendEmail({ to: creator.contact_email, subject: email.subject, html: email.html, text: email.text });
    if (!result?.ok) throw new Error(result?.error || "Email delivery failed.");
    inviteSent = true;
  } catch (error) {
    inviteError = error.message || String(error);
  }
  await logEmailSent({ recipient: creator.contact_email, subject: email.subject, emailType: EMAIL_TYPE, relatedId: creator.id, error: inviteError ? new Error(inviteError) : null });

  return NextResponse.json({ ok: true, inviteSent, inviteError });
}