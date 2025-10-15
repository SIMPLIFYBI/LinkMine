import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import ConsultantClaimConfirm from "@/app/components/ConsultantClaimConfirm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ConsultantClaimPage({ params, searchParams }) {
  const token = searchParams?.token ?? "";
  if (!token) {
    return renderMessage({
      heading: "Missing claim token",
      body: "This link is incomplete. Please use the claim link from your email.",
    });
  }

  const sb = await supabaseServerClient();
  const [{ data: authData }, { data: consultant, error }] = await Promise.all([
    sb.auth.getUser(),
    sb
      .from("consultants")
      .select(
        "id, display_name, contact_email, claim_token, claimed_at, claimed_by"
      )
      .eq("id", params.id)
      .maybeSingle(),
  ]);

  if (error || !consultant) {
    notFound();
  }

  if (!consultant.claim_token || consultant.claim_token !== token) {
    return renderMessage({
      heading: "Invalid or expired link",
      body: "This claim link is no longer valid. Request a new one from the consultant profile page.",
    });
  }

  const user = authData?.user || null;
  const alreadyClaimed =
    consultant.claimed_by && consultant.claimed_by !== user?.id;

  if (alreadyClaimed) {
    return renderMessage({
      heading: "Profile already claimed",
      body: "Another account has already taken ownership of this profile. Contact support if you believe this is a mistake.",
    });
  }

  if (!user) {
    const redirect = encodeURIComponent(
      `/consultants/${consultant.id}/claim?token=${token}`
    );
    return renderMessage({
      heading: "Sign in to complete the claim",
      body: `You must be logged in to finish claiming ${consultant.display_name}.`,
      extra: (
        <div className="mt-4 flex justify-center gap-3 text-sm">
          <Link
            href={`/login?redirect=${redirect}`}
            className="inline-flex items-center rounded-full border border-sky-400/60 bg-sky-500/10 px-4 py-2 font-semibold text-sky-100 hover:border-sky-300 hover:bg-sky-500/20"
          >
            Log in
          </Link>
          <Link
            href={`/signup?redirect=${redirect}`}
            className="inline-flex items-center rounded-full border border-slate-200/40 bg-white/10 px-4 py-2 font-semibold text-white hover:border-slate-200/70 hover:bg-white/20"
          >
            Create an account (free)
          </Link>
        </div>
      ),
    });
  }

  const debugInfo =
    process.env.NODE_ENV !== "production" ? { user, consultant, token } : null;

  return (
    <main className="mx-auto mt-12 w-full max-w-2xl space-y-6 rounded-3xl border border-white/10 bg-white/[0.05] px-6 py-8 text-slate-100">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">
          Claim {consultant.display_name}
        </h1>
        <p className="text-sm text-slate-300">
          You requested to manage this consultant profile. Confirm below to take ownership.
        </p>
      </header>

      <ConsultantClaimConfirm consultant={consultant} user={user} token={token} />

      {debugInfo && (
        <details className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-4 text-xs text-sky-100">
          <summary className="cursor-pointer font-semibold text-sky-200">
            Claim debug
          </summary>
          <pre className="mt-3 whitespace-pre-wrap break-words text-[11px] text-sky-100/90">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </details>
      )}
    </main>
  );
}

function renderMessage({ heading, body, extra = null }) {
  return (
    <main className="mx-auto mt-16 w-full max-w-2xl space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-8 text-center text-slate-100">
      <h1 className="text-2xl font-semibold">{heading}</h1>
      <p className="text-sm text-slate-300">{body}</p>
      {extra}
    </main>
  );
}