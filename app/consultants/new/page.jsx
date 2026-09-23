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
    <main className="relative mx-auto w-full max-w-5xl overflow-hidden px-4 py-8 sm:px-6 sm:py-12">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />

      <section className="relative overflow-hidden rounded-[28px] border border-cyan-200/20 bg-[linear-gradient(135deg,rgba(8,30,51,0.98),rgba(8,49,73,0.92)_55%,rgba(10,39,67,0.96))] px-6 py-7 shadow-[0_32px_80px_-45px_rgba(14,165,233,0.85)] sm:px-9 sm:py-9">
        <div aria-hidden="true" className="absolute right-[-2rem] top-[-4rem] h-52 w-52 rounded-full border border-cyan-200/20 bg-cyan-200/10" />
        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100/25 bg-cyan-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-100">
            Your public presence
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">Build a profile people can trust.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200 sm:text-base">
            Set the foundations for your public consultant or creator profile. You can refine your content, services, and branding after this step.
          </p>
        </div>

        <ol className="relative mt-7 grid gap-3 text-xs sm:grid-cols-3">
          {[
            ["1", "Choose profile", "Set how you appear on YouMine"],
            ["2", "Add essentials", "Give visitors the right context"],
            ["3", "Finish setup", "Review and publish your profile"],
          ].map(([number, title, description], index) => (
            <li key={number} className={`flex items-center gap-3 rounded-2xl border px-3.5 py-3 ${index === 0 ? "border-cyan-200/40 bg-cyan-200/15 text-white" : "border-white/10 bg-slate-950/15 text-slate-300"}`}>
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${index === 0 ? "bg-cyan-200 text-slate-950" : "bg-white/10 text-slate-200"}`}>{number}</span>
              <span><span className="block font-semibold">{title}</span><span className="mt-0.5 block text-[11px] text-slate-300/80">{description}</span></span>
            </li>
          ))}
        </ol>
      </section>

      <div className="relative mt-5 rounded-[28px] border border-white/10 bg-slate-950/55 p-4 shadow-[0_30px_70px_-45px_rgba(0,0,0,0.95)] ring-1 ring-white/5 sm:mt-6 sm:p-7">
        <ProfileSetupBasic services={services} initialProfileType={initialProfileType} />
      </div>
    </main>
  );
}