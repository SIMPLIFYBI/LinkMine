import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import ConsultantClaimConfirm from "@/app/components/ConsultantClaimConfirm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isUuid(v) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(v || "")
  );
}

export default async function ConsultantClaimPage({ params, searchParams }) {
  const token = searchParams?.token ?? "";
  const debugEnabled =
    process.env.NODE_ENV !== "production" || searchParams?.debug === "1";

  if (!token) {
    return renderMessage({
      heading: "Missing claim token",
      body: "This link is incomplete. Please use the claim link from your email.",
    });
  }

  const sb = await supabaseServerClient();
  const [{ data: authData }, { data: consultant, error: selectError }] =
    await Promise.all([
      sb.auth.getUser(),
      sb
        .from("consultants")
        .select(
          "id, display_name, contact_email, claim_token, claimed_at, claimed_by"
        )
        .eq("id", params.id)
        .maybeSingle(),
    ]);

  const user = authData?.user || null;

  // Build rich debug info early
  const projectRef =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^https?:\/\//, "")
      .split(".")[0] || null;

  const debugInfo = debugEnabled
    ? {
        env: process.env.NODE_ENV,
        supabaseProjectRef: projectRef,
        paramsId: params?.id || null,
        paramsIdIsUuid: isUuid(params?.id),
        tokenPreview: token ? `${token.slice(0, 8)}… (${token.length})` : null,
        consultantFound: Boolean(consultant),
        consultantId: consultant?.id || null,
        consultantDisplay: consultant?.display_name || null,
        claimedBy: consultant?.claimed_by || null,
        hasClaimToken: Boolean(consultant?.claim_token),
        claimTokenMatches:
          Boolean(consultant?.claim_token) && consultant?.claim_token === token,
        selectError:
        // expose minimal error info for troubleshooting
          selectError
            ? { message: selectError.message, code: selectError.code }
            : null,
        serverUser: user ? { id: user.id, email: user.email } : null,
      }
    : null;

  if (debugEnabled) {
    // Log to server console to aid debugging in logs
    console.log("[Claim Debug]", debugInfo);
  }

  if (selectError || !consultant) {
    if (!debugEnabled) {
      return renderMessage({
        heading: "Consultant not found",
        body: "The link points to a consultant that does not exist.",
      });
    }
    return renderMessage({
      heading: "Consultant not found",
      body:
        "The link points to a consultant that does not exist. See debug below.",
      extra: (
        <details className="mt-4 rounded-xl border border-sky-500/30 bg-sky-500/5 p-4 text-xs text-sky-100">
          <summary className="cursor-pointer font-semibold text-sky-200">
            Debug details
          </summary>
          <pre className="mt-3 whitespace-pre-wrap break-words text-[11px] text-sky-100/90">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </details>
      ),
    });
  }

  if (!consultant.claim_token || consultant.claim_token !== token) {
    return renderMessage({
      heading: "Invalid or expired link",
      body:
        "This claim link is no longer valid. Request a new one from the consultant profile page.",
      extra:
        debugEnabled && (
          <details className="mt-4 rounded-xl border border-sky-500/30 bg-sky-500/5 p-4 text-xs text-sky-100">
            <summary className="cursor-pointer font-semibold text-sky-200">
              Debug details
            </summary>
            <pre className="mt-3 whitespace-pre-wrap break-words text-[11px] text-sky-100/90">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        ),
    });
  }

  const alreadyClaimed =
    consultant.claimed_by && consultant.claimed_by !== user?.id;

  if (alreadyClaimed) {
    return renderMessage({
      heading: "Profile already claimed",
      body:
        "Another account has already taken ownership of this profile. Contact support if you believe this is a mistake.",
      extra:
        debugEnabled && (
          <details className="mt-4 rounded-xl border border-sky-500/30 bg-sky-500/5 p-4 text-xs text-sky-100">
            <summary className="cursor-pointer font-semibold text-sky-200">
              Debug details
            </summary>
            <pre className="mt-3 whitespace-pre-wrap break-words text-[11px] text-sky-100/90">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        ),
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
        <>
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
          {debugEnabled && (
            <details className="mt-4 rounded-xl border border-sky-500/30 bg-sky-500/5 p-4 text-xs text-sky-100">
              <summary className="cursor-pointer font-semibold text-sky-200">
                Debug details
              </summary>
              <pre className="mt-3 whitespace-pre-wrap break-words text-[11px] text-sky-100/90">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          )}
        </>
      ),
    });
  }

  return (
    <main className="mx-auto mt-12 w-full max-w-2xl space-y-6 rounded-3xl border border-white/10 bg-white/[0.05] px-6 py-8 text-slate-100">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">
          Claim {consultant.display_name}
        </h1>
        <p className="text-sm text-slate-300">
          You requested to manage this consultant profile. Confirm below to take
          ownership.
        </p>
      </header>

      <ConsultantClaimConfirm
        consultant={consultant}
        user={user}
        token={token}
      />

      {debugEnabled && (
        <details className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-4 text-xs text-sky-100">
          <summary className="cursor-pointer font-semibold text-sky-200">
            Debug details
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