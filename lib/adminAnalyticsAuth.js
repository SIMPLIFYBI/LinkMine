import "server-only";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

export async function getAnalyticsAdminContext() {
  const sb = await supabaseServerClient();
  const { data: auth } = await sb.auth.getUser();
  const user = auth?.user || null;
  if (!user) return { ok: false, status: 401, error: "Not authenticated." };
  const { data: adminRow } = await sb.from("app_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
  if (!adminRow && !adminEmails.includes(String(user.email || "").toLowerCase())) return { ok: false, status: 403, error: "Forbidden." };
  return { ok: true };
}