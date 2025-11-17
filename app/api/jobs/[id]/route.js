export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

async function userClient() {
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (n) => jar.get(n)?.value,
        set: (n, v, o) => jar.set({ name: n, value: v, ...o }),
        remove: (n, o) => jar.delete({ name: n, ...o }),
      },
    }
  );
}

export async function PATCH(req, { params }) {
  const u = await userClient();
  const a = await supabaseServerClient();
  const { data: auth } = await u.auth.getUser();
  const user = auth?.user;
  if (!user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  const patch = await req.json().catch(() => ({}));

  // Expanded editable fields to cover your job form
  const allowed = [
    "title",
    "description",
    "location",
    "company",
    "preferred_payment_type",
    "urgency",
    "listing_type",
    "service_id",
    "category_id",
    "close_date",
    "contact_name",
    "contact_email",
    "recipient_ids",
    "status", // includes soft delete or manual close
  ];
  const update = Object.fromEntries(Object.entries(patch).filter(([k]) => allowed.includes(k)));
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: false, error: "No changes" }, { status: 400 });
  }

  const { data, error } = await a
    .from("jobs")
    .update(update)
    .eq("id", params.id)
    .eq("created_by", user.id)
    .select(`
      id, title, description, location, company,
      preferred_payment_type, urgency, listing_type,
      service_id, category_id, close_date,
      contact_name, contact_email, recipient_ids, status, created_at
    `)
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, job: data });
}

export async function DELETE(_req, { params }) {
  // Soft delete: set status='deleted'
  const u = await userClient();
  const a = await supabaseServerClient();
  const { data: auth } = await u.auth.getUser();
  const user = auth?.user;
  if (!user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  const { error } = await a
    .from("jobs")
    .update({ status: "deleted" })
    .eq("id", params.id)
    .eq("created_by", user.id);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}