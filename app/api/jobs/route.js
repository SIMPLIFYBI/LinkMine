import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { postmarkClient, jobEmailPayload } from "@/lib/postmark";

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
    "preferred_payment_type",
    "urgency",
    "listing_type",
    "service_id",
    "recipient_ids",
    "company",
    "budget",
    "close_date",
    "contact_name",
    "contact_email",
  ];
  const payload = Object.fromEntries(Object.entries(job).filter(([key]) => allowed.includes(key)));

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
      "id, title, description, location, preferred_payment_type, urgency, listing_type, service_id, recipient_ids, company, budget, close_date, contact_name, contact_email, created_by, created_at"
    )
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const { data: consultants, error: consultantsError } = await sb
    .from("consultants")
    .select("id, display_name, contact_email")
    .in("id", payload.recipient_ids);

  if (consultantsError) {
    return NextResponse.json({ ok: false, error: consultantsError.message }, { status: 500 });
  }

  const client = postmarkClient();
  const from = process.env.EMAIL_FROM;
  if (!from) {
    return NextResponse.json({ ok: false, error: "EMAIL_FROM missing" }, { status: 500 });
  }

  const log = [];
  for (const consultant of consultants ?? []) {
    if (!consultant.contact_email) continue;
    const message = jobEmailPayload({
      to: consultant.contact_email,
      from,
      job: data,
      consultant,
    });
    const response = await client.sendEmail(message);
    log.push({ consultant_id: consultant.id, message_id: response.MessageID, submitted_at: response.SubmittedAt });
  }

  await sb.from("jobs").update({ email_log: log }).eq("id", data.id);

  return NextResponse.json({ ok: true, job: { ...data, email_log: log } });
}