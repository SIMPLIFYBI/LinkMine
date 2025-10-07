import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default function LegacyMyJobsPage() {
  redirect("/jobs?tab=my-jobs");
}