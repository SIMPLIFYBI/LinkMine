import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import ConsultantClaimConfirm from "@/app/components/ConsultantClaimConfirm";
import ClaimCodeEntry from "@/app/components/ClaimCodeEntry.client.jsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function isUuid(v) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(v || "")
  );
}

export default async function ConsultantClaimPage({ params, searchParams }) {
  // Await dynamic APIs before using
  const p = await params;
  const sp = await searchParams;

  const id = p?.id || "";
  const token = sp?.token || "";
  const debugEnabled =
    process.env.NODE_ENV !== "production" || sp?.debug === "1";

  const sb = await supabaseServerClient();
  const [{ data: authData }, { data: consultant, error: selectError }] =
    await Promise.all([
      sb.auth.getUser(),
      sb
        .from("consultants")
        .select(
          "id, display_name, contact_email, claim_token, claimed_at, claimed_by"
        )
        .eq("id", id)
        .maybeSingle(),
    ]);

  const user = authData?.user ?? null;

  // Support email (public hint): prefer a public support alias if provided
  const supportEmail =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL ||
    process.env.EMAIL_FROM ||
    "support@youmine.com.au";

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
          selectError
            ? { message: selectError.message, code: selectError.code }
            : null,
        serverUser: user ? { id: user.id, email: user.email } : null,
      }
    : null;

  if (debugEnabled) {
    console.log("[Claim Debug]", debugInfo);
  }

  if (selectError || !consultant) {
    if (!debugEnabled) {
      return renderMessage({
        heading: "Consultant not found",
        body: "The link points to a consultant that does not exist.",
        supportEmail,
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
      supportEmail,
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
      supportEmail,
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
      supportEmail,
    });
  }

  if (!user) {
    const redirect = encodeURIComponent(
      `/consultants/${consultant.id}/claim?token=${token}`
    );
    return renderMessage({
      heading: "Sign in to complete the claim",
      body: `You must be logged in to finish claiming ${consultant.display_name}.`,
      ctas: (
        <div className="mt-5 flex justify-center gap-3 text-sm">
          <Link
            href={`/login?redirect=${redirect}`}
            className="inline-flex items-center rounded-full border border-sky-400/60 bg-sky-500/15 px-4 py-2 font-semibold text-sky-100 ring-1 ring-sky-300/30 backdrop-blur hover:border-sky-300 hover:bg-sky-500/25"
          >
            Log in
          </Link>
          <Link
            href={`/signup?redirect=${redirect}`}
            className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-4 py-2 font-semibold text-white ring-1 ring-white/10 backdrop-blur hover:bg-white/20"
          >
            Create an account (free)
          </Link>
        </div>
      ),
      debug: debugEnabled ? debugInfo : null,
      supportEmail,
    });
  }

  // Modern, polished claim card
  const mailSubject = encodeURIComponent(
    `Help claiming consultant profile: ${consultant.display_name}`
  );
  const mailBody = encodeURIComponent(
    `Hi team,%0D%0A%0D%0AI’m having trouble claiming this profile.%0D%0A%0D%0AProfile ID: ${consultant.id}%0D%0AMy account: ${user.email || user.id}%0D%0A%0D%0AThanks!`
  );
  const supportHref = `mailto:${supportEmail}?subject=${mailSubject}&body=${mailBody}`;

  return (
    <main className="relative mx-auto mt-12 w-full max-w-2xl px-6">
      {/* ambient gradient glow */}
      <div className="pointer-events-none absolute inset-x-0 -top-28 mx-auto h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 -top-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-2xl" />

      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 text-slate-100 shadow-xl ring-1 ring-white/10 backdrop-blur">
        <header className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/50 bg-sky-500/15 px-2.5 py-1 text-[11px] font-semibold text-sky-100 ring-1 ring-sky-300/30">
            {/* shield-check icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" className="text-sky-200" fill="currentColor" aria-hidden="true">
              <path d="M12 2l8 4v6c0 5.25-3.96 10.12-8 10.75C8 22.12 4 17.25 4 12V6l8-4zm-1 13l6-6-1.41-1.41L11 12.17 8.41 9.59 7 11l4 4z" />
            </svg>
            Secure claim
          </span>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            Claim {consultant.display_name}
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            You requested to manage this consultant profile. Confirm below to take ownership.
          </p>
        </header>

        {user && consultant.claimed_by === null ? (
          <div className="mt-6">
            <ConsultantClaimConfirm consultant={consultant} user={user} token={token} />
          </div>
        ) : (
          <section className="mt-6 space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
              <h2 className="text-lg font-semibold text-white text-center">Enter your claim code</h2>
              <p className="mt-2 text-center text-sm text-slate-300">
                Check your email for the 12‑character code. Paste it below to take ownership.
              </p>
              <div className="mt-5">
                <ClaimCodeEntry consultantId={consultant.id} />
              </div>
            </div>
            <div className="rounded-2xl border border-sky-400/30 bg-sky-500/10 p-4 text-xs text-sky-100">
              Didn’t get an email? Verify the contact email on the profile or reach us at{" "}
              <a href={`mailto:${supportEmail}`} className="underline font-semibold">
                {supportEmail}
              </a>.
            </div>
          </section>
        )}

        {/* Support + fine print */}
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              {/* info icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" className="mt-[2px] text-slate-200" fill="currentColor" aria-hidden="true">
                <path d="M11 9h2v2h-2V9zm0 4h2v6h-2v-6z" />
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" opacity=".3"/>
              </svg>
              <p>
                Having trouble claiming this profile?{" "}
                <a href={supportHref} className="font-semibold text-sky-200 underline underline-offset-2 hover:text-sky-100">
                  Email our team
                </a>{" "}
                and we’ll sort it out for you.
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs text-slate-400">
            By claiming, you confirm you’re authorised to manage this profile and agree to our{" "}
            <Link href="/terms" className="text-slate-300 underline underline-offset-2 hover:text-white">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-slate-300 underline underline-offset-2 hover:text-white">
              Privacy Policy
            </Link>.
          </div>
        </div>
      </section>

      {debugEnabled && (
        <details className="mt-6 rounded-xl border border-sky-500/30 bg-sky-500/5 p-4 text-xs text-sky-100">
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

function renderMessage({ heading, body, extra = null, ctas = null, supportEmail }) {
  const supportHref = supportEmail
    ? `mailto:${supportEmail}?subject=${encodeURIComponent("Help with claim link")}`
    : null;

  return (
    <main className="relative mx-auto mt-16 w-full max-w-2xl px-6">
      <div className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 text-center text-slate-100 shadow-xl ring-1 ring-white/10 backdrop-blur">
        <h1 className="text-2xl font-semibold text-white">{heading}</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-300">{body}</p>
        {ctas}
        {/* Support hint */}
        {supportHref ? (
          <p className="mx-auto mt-5 max-w-xl text-xs text-slate-400">
            Need a hand?{" "}
            <a href={supportHref} className="font-semibold text-sky-200 underline underline-offset-2 hover:text-sky-100">
              Email our team
            </a>{" "}
            and we’ll help you get set up.
          </p>
        ) : null}
        {extra}
      </section>
    </main>
  );
}

return (
  <main className="mx-auto mt-24 max-w-md px-6 text-center text-slate-100">
    <h1 className="text-xl font-semibold">Claim flow updated</h1>
    <p className="mt-3 text-sm text-slate-300">
      Use the claim code from your email on the new page.
    </p>
    <a
      href={`/claim?consultant=${consultant.id}`}
      className="mt-6 inline-flex items-center rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white"
    >
      Go to claim page
    </a>
  </main>
);