import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function PATCH(req, context) {
  const cookieStore = await cookies();
  const sb = createRouteHandlerClient({
    cookies: {
      get: (name) => cookieStore.get(name)?.value,
      set: (name, value, options) =>
        cookieStore.set({ name, value, ...options }),
      remove: (name, options) =>
        cookieStore.delete({ name, ...options }),
    },
  });

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Not authenticated." }, { status: 401 });
  }

  const { consultantId } = await context.params;
  if (!consultantId) {
    return NextResponse.json({ ok: false, error: "Missing consultant id." }, { status: 400 });
  }

  const payload = await req.json().catch(() => ({}));
  const nextStatus = payload?.status?.toLowerCase?.();
  if (!["pending", "approved", "rejected"].includes(nextStatus)) {
    return NextResponse.json({ ok: false, error: "Invalid status." }, { status: 400 });
  }

  const reviewerNotes =
    typeof payload?.reviewerNotes === "string" && payload.reviewerNotes.trim()
      ? payload.reviewerNotes.trim()
      : null;

  const { data, error } = await sb
    .from("consultants")
    .update({
      status: nextStatus,
      reviewer_notes: reviewerNotes,
      reviewed_by: user.id,
      reviewed_at: nextStatus === "pending" ? null : new Date().toISOString(),
    })
    .eq("id", consultantId)
    .select(
      "id, status, display_name, contact_email, reviewed_at, reviewed_by, reviewer_notes"
    )
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, consultant: data });
}