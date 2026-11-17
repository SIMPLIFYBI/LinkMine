import { redirect } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import AnalyticsDashboard from "./AnalyticsDashboard.client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Analytics · YouMine",
  description: "Website and search performance reporting for YouMine administrators.",
};

export default async function AnalyticsPage() {
  const sb = await supabaseServerClient();
  const { data: auth } = await sb.auth.getUser();
  const user = auth?.user || null;

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent("/admin/analytics")}`);
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
    redirect("/");
  }

  return <AnalyticsDashboard />;
}