import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const USER_TYPES = new Set(["consultant", "client", "both"]);
const ORG_SIZES = new Set(["individual", "1-8", "8-25", "26-100", "101+"]);

export async function PATCH(req) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";

  if (!token) {
    return NextResponse.json({ error: "Missing access token." }, { status: 401 });
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    }
  );

  const {
    data: { user },
    error: authError,
  } = await sb.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const payload = await req.json().catch(() => ({}));
  const { userType, organisationSize, organisationName, profession } = payload;

  if (!USER_TYPES.has(userType)) {
    return NextResponse.json(
      { error: "Invalid user type." },
      { status: 400 }
    );
  }

  if (!ORG_SIZES.has(organisationSize)) {
    return NextResponse.json(
      { error: "Invalid organisation size." },
      { status: 400 }
    );
  }

  if (typeof profession !== "string" || !profession.trim()) {
    return NextResponse.json(
      { error: "Profession is required." },
      { status: 400 }
    );
  }

  const { error } = await sb.from("user_profiles").upsert(
    {
      id: user.id,
      user_type: userType,
      organisation_size: organisationSize,
      organisation_name: organisationName || null,
      profession: profession.trim(),
    },
    { onConflict: "id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}