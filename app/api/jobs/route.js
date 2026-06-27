import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isValidCountryCode, isValidGlobalRegion } from "@/lib/geoOptions";

export const runtime = "nodejs";

async function createSupabaseFromCookies() {
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => jar.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );
}

export async function POST(req) {
  const sb = await createSupabaseFromCookies();
  const { data: auth } = await sb.auth.getUser();
  const user = auth?.user;
  if (!user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  const { job = {} } = await req.json().catch(() => ({ job: {} }));
  const allowed = [
    "title",
    "description",
    "location",
    "country_code",
    "global_region",
    "preferred_payment_type",
    "urgency",
    "listing_type",
    "service_id",
    "recipient_ids",
    "company",
    "budget",
    "close_date",      // ensure already present
    "contact_name",
    "contact_email",
    "category_id",
    "status"           // NEW: allow but will sanitize
  ];
  const payload = Object.fromEntries(Object.entries(job).filter(([key]) => allowed.includes(key)));

  // Validate required fields
  if (!payload.close_date) {
    return NextResponse.json({ ok: false, error: "close_date required" }, { status: 400 });
  }

  if (!payload.country_code || !isValidCountryCode(payload.country_code)) {
    return NextResponse.json({ ok: false, error: "Valid country required" }, { status: 400 });
  }

  if (!payload.global_region || !isValidGlobalRegion(payload.global_region)) {
    return NextResponse.json({ ok: false, error: "Valid global region required" }, { status: 400 });
  }

  // Sanitize status (server decides)
  payload.status = 'pending';

  if ("consultant_ids" in payload) {
    return NextResponse.json(
      { ok: false, error: "Use recipient_ids instead of consultant_ids" },
      { status: 400 }
    );
  }
  const listingType = payload.listing_type ?? "Private";
  const recipientIds = Array.isArray(payload.recipient_ids) ? payload.recipient_ids : [];
  const requiresRecipients = listingType === "Private" || listingType === "Both";

  if (requiresRecipients && recipientIds.length === 0) {
    return NextResponse.json(
      { error: "recipient_ids required" },
      { status: 400 }
    );
  }

  payload.listing_type = listingType;
  payload.recipient_ids = recipientIds;
  payload.contact_email ??= user.email;

  const insert = { ...payload, created_by: user.id };
  const { data, error } = await sb
    .from("jobs")
    .insert(insert)
    .select(
      "id, title, description, location, country_code, global_region, preferred_payment_type, urgency, listing_type, service_id, recipient_ids, company, budget, close_date, contact_name, contact_email, created_by, created_at"
    )
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, job: data, moderation: "pending" });
}