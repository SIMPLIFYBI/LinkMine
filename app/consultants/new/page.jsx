export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import ProfileSetupBasic from "./ProfileSetupBasic.client";

export default async function NewConsultantPage() {
  // Auth guard
  const sb = await supabaseServerClient();
  const { data: auth } = await sb.auth.getUser();
  const userId = auth?.user?.id || null;
  if (!userId) redirect(`/login?redirect=${encodeURIComponent("/consultants/new")}`);

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-white">Create your provider profile</h1>
      <p className="mt-2 text-sm text-slate-300">
        This is your public presence on YouMine. Add services, resources, training, or events when you are ready.
      </p>
      <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.05] p-6">
        <ProfileSetupBasic />
      </div>
    </main>
  );
}