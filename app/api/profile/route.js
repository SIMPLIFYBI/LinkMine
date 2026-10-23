import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const NAME_MAX = 60;

function validateName(label, value) {
  if (value == null || value === "") return null; // treat as omitted
  if (typeof value !== "string") return `${label} must be a string.`;
  const trimmed = value.trim();
  if (!trimmed) return `${label} cannot be empty when provided.`;
  if (trimmed.length > NAME_MAX) return `${label} is too long (>${NAME_MAX}).`;
  return null;
}

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
  const {
    organisationName,
    firstName,
    lastName,
  } = payload;

  const organisationNameTrimmed =
    typeof organisationName === "string" ? organisationName.trim() : "";

  if (organisationName != null && typeof organisationName !== "string") {
    return NextResponse.json({ error: "Organisation name must be a string." }, { status: 400 });
  }

  const firstErr = validateName("First name", firstName);
  if (firstErr) return NextResponse.json({ error: firstErr }, { status: 400 });
  if (!firstName?.trim()) {
    return NextResponse.json({ error: "First name is required." }, { status: 400 });
  }
  const lastErr = validateName("Last name", lastName);
  if (lastErr) return NextResponse.json({ error: lastErr }, { status: 400 });

  const upsertRow = {
    id: user.id,
    first_name: firstName.trim(),
    last_name: lastName?.trim() || null,
  };
  if (organisationName !== undefined) {
    upsertRow.organisation_name = organisationNameTrimmed || null;
  }

  const { error } = await sb.from("user_profiles").upsert(upsertRow, { onConflict: "id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    saved: {
      organisationName: organisationNameTrimmed || null,
      firstName: firstName.trim(),
      lastName: lastName?.trim() || null,
    }
  });
}