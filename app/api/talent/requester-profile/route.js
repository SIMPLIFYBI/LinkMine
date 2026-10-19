import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

function cleanText(value, maximum = 0) {
  const text = typeof value === "string" ? value.trim() : "";
  return maximum ? text.slice(0, maximum) : text;
}

async function getAuthenticatedUser() {
  const sb = await supabaseServerClient();
  const { data: auth, error } = await sb.auth.getUser();
  if (error || !auth?.user) return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  return { sb, user: auth.user };
}

export async function GET() {
  const access = await getAuthenticatedUser();
  if (access.error) return access.error;

  const { data, error } = await access.sb
    .from("talent_requester_profiles")
    .select("display_name, company_name, role_title, contact_email, contact_phone")
    .eq("user_id", access.user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ profile: data || null });
}

export async function PUT(req) {
  const access = await getAuthenticatedUser();
  if (access.error) return access.error;

  const body = await req.json().catch(() => ({}));
  const displayName = cleanText(body.displayName, 120);
  const companyName = cleanText(body.companyName, 160);
  const roleTitle = cleanText(body.roleTitle, 160);
  const contactEmail = cleanText(body.contactEmail, 320).toLowerCase();
  const contactPhone = cleanText(body.contactPhone, 50);

  if (displayName.length < 2) {
    return NextResponse.json({ error: "Enter the name candidates should see." }, { status: 400 });
  }
  if (contactEmail && !/^\S+@\S+\.\S+$/.test(contactEmail)) {
    return NextResponse.json({ error: "Enter a valid contact email." }, { status: 400 });
  }

  const { data, error } = await access.sb
    .from("talent_requester_profiles")
    .upsert({
      user_id: access.user.id,
      display_name: displayName,
      company_name: companyName || null,
      role_title: roleTitle || null,
      contact_email: contactEmail || null,
      contact_phone: contactPhone || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" })
    .select("display_name, company_name, role_title, contact_email, contact_phone")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, profile: data });
}