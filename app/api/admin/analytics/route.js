import { NextResponse } from "next/server";
import { getGa4Report } from "@/lib/ga4Reporting";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

export const runtime = "nodejs";

async function getAdminContext() {
  const sb = await supabaseServerClient();
  const { data: auth } = await sb.auth.getUser();
  const user = auth?.user || null;

  if (!user) {
    return { ok: false, status: 401, error: "Not authenticated." };
  }

  const { data: adminRow } = await sb
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin = Boolean(adminRow) || adminEmails.includes(String(user.email || "").toLowerCase());

  if (!isAdmin) {
    return { ok: false, status: 403, error: "Forbidden." };
  }

  return { ok: true };
}

export async function GET(request) {
  const admin = await getAdminContext();
  if (!admin.ok) {
    return NextResponse.json({ ok: false, error: admin.error }, { status: admin.status });
  }

  const days = new URL(request.url).searchParams.get("days") || "30";

  try {
    const report = await getGa4Report(days);
    return NextResponse.json(
      { ok: true, report },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    const isConfigurationError = error?.code === "GA4_NOT_CONFIGURED";
    return NextResponse.json(
      {
        ok: false,
        error: isConfigurationError
          ? "Google Analytics reporting has not been configured."
          : "Google Analytics reporting is temporarily unavailable.",
      },
      { status: isConfigurationError ? 503 : 502 }
    );
  }
}