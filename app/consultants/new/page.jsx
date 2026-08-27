export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { supabasePublicServer } from "@/lib/supabasePublicServer";
import ProfileSetupBasic from "./ProfileSetupBasic.client";

function normaliseInitialProfileType(value) {
  const v = String(value || "").toLowerCase();
  if (v === "consultant" || v === "creator" || v === "both") return v;
  return "";
}

export default async function NewConsultantPage({ searchParams }) {
  // Auth guard
  const sb = await supabaseServerClient();
  const { data: auth } = await sb.auth.getUser();
  const userId = auth?.user?.id || null;
  if (!userId) redirect(`/login?redirect=${encodeURIComponent("/consultants/new")}`);

  // Fetch services (grouped by category for nicer UI if present)
  const sp = supabasePublicServer();
  const { data: services = [] } = await sp
    .from("services")
    .select("id, name, slug, market, category:category_id ( name, slug )")
    .order("name", { ascending: true });

  const spParams = (await searchParams) || {};
  const initialProfileType = normaliseInitialProfileType(spParams.profileType || spParams.profile || "");

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-white">Profile setup</h1>
      <p className="mt-2 text-sm text-slate-300">
        Choose your profile type first, then complete your details.
      </p>
      <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.05] p-6">
        <ProfileSetupBasic services={services} initialProfileType={initialProfileType} />
      </div>
    </main>
  );
}