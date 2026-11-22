import "server-only";
import { redirect } from "next/navigation";
import { getAnalyticsAdminContext } from "@/lib/adminAnalyticsAuth";

// Page-level gate: signed-out users go to login and return here, signed-in non-admins go home.
export async function requireIntelligenceAdmin(returnPath) {
  const gate = await getAnalyticsAdminContext();
  if (gate.ok) return;
  if (gate.status === 401) redirect(`/login?redirect=${encodeURIComponent(returnPath)}`);
  redirect("/");
}
