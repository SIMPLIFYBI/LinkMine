import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

export async function PATCH(req, context) {
  const sb = await supabaseServerClient({
    global: {
      headers: {
        Authorization: req.headers.get("Authorization") ?? "",
      },
    },
  });

  const {
    data: { user },
    error: authError,
  } = await sb.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: authError?.message ?? "Not authenticated" },
      { status: 401 }
    );
  }

  const params = await context.params;
  const consultantId = params?.consultantId;
  if (!consultantId) {
    return NextResponse.json(
      { ok: false, error: "Missing consultant id." },
      { status: 400 }
    );
  }

  const payload = await req.json().catch(() => ({}));
  console.log("PATCH payload", payload);
  const nextStatus = payload?.status?.toLowerCase?.();
  if (!["pending", "approved", "rejected"].includes(nextStatus)) {
    return NextResponse.json(
      { ok: false, error: "Invalid status." },
      { status: 400 }
    );
  }

  const reviewerNotes =
    typeof payload?.reviewerNotes === "string" && payload.reviewerNotes.trim()
      ? payload.reviewerNotes.trim()
      : null;

  const { data, error } = await sb
    .from("consultants")
    .update({
      status: nextStatus,
      reviewer_notes: payload?.reviewer_notes ?? null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", consultantId)
    .select("id, status, reviewed_by, reviewed_at, reviewer_notes")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  if (!data) {
    return NextResponse.json(
      { ok: false, error: "Consultant not found or update prevented by policy." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, consultant: data });
}