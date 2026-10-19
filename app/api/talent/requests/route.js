import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { supabaseAdminClient } from "@/lib/supabaseAdminClient";
import { sendEmail } from "@/lib/emailPostmark";
import { buildTalentConnectionRequestEmail } from "@/lib/emails/talentConnectionRequest";
import { siteUrl } from "@/lib/siteUrl";
import { INITIAL_CONNECTION_CONTACT_DETAILS_MESSAGE, initialConnectionMessageHasContactDetails } from "@/lib/talentConnectionMessage";

const INTENTS = new Set(["role", "contract", "consulting", "exploratory"]);

function cleanText(value, maximum = 0) {
  const text = typeof value === "string" ? value.trim() : "";
  return maximum ? text.slice(0, maximum) : text;
}

async function getAuthenticatedUser() {
  const sb = await supabaseServerClient();
  const { data: auth, error } = await sb.auth.getUser();
  if (error || !auth?.user) return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  return { sb, user: auth.user };
}

export async function GET(req) {
  const access = await getAuthenticatedUser();
  if (access.error) return access.error;

  const view = new URL(req.url).searchParams.get("view") === "received" ? "received" : "sent";
  const query = access.sb
    .from("talent_connection_requests")
    .select("id, candidate_worker_id, requester_user_id, intent, opportunity_title, opportunity_location, opportunity_url, message, status, responded_at, withdrawn_at, last_message_at, created_at")
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const { data, error } = view === "received"
    ? await query.eq("candidate_worker_id", access.user.id)
    : await query.eq("requester_user_id", access.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const requesterIds = Array.from(new Set((data || []).map((request) => request.requester_user_id).filter(Boolean)));
  const { data: requesterProfiles, error: requesterProfilesError } = requesterIds.length
    ? await access.sb
      .from("talent_requester_profiles")
      .select("user_id, display_name, company_name, role_title")
      .in("user_id", requesterIds)
    : { data: [], error: null };
  if (requesterProfilesError) return NextResponse.json({ error: requesterProfilesError.message }, { status: 400 });

  const profilesByUserId = new Map((requesterProfiles || []).map((profile) => [profile.user_id, profile]));
  return NextResponse.json({
    requests: (data || []).map((request) => ({
      ...request,
      requesterProfile: profilesByUserId.get(request.requester_user_id) || null,
    })),
  });
}

export async function POST(req) {
  const access = await getAuthenticatedUser();
  if (access.error) return access.error;

  const body = await req.json().catch(() => ({}));
  const candidateWorkerId = cleanText(body.candidateWorkerId);
  const intent = cleanText(body.intent) || "role";
  const message = cleanText(body.message, 4000);
  const opportunityTitle = cleanText(body.opportunityTitle, 200);
  const opportunityLocation = cleanText(body.opportunityLocation, 200);
  const opportunityUrl = cleanText(body.opportunityUrl, 2048);

  if (!candidateWorkerId || candidateWorkerId === access.user.id) {
    return NextResponse.json({ error: "Choose another candidate to request a connection." }, { status: 400 });
  }
  if (!INTENTS.has(intent)) return NextResponse.json({ error: "Invalid connection intent." }, { status: 400 });
  if (!message) return NextResponse.json({ error: "Write a short message for the candidate." }, { status: 400 });
  if (initialConnectionMessageHasContactDetails(message)) {
    return NextResponse.json({ error: INITIAL_CONNECTION_CONTACT_DETAILS_MESSAGE }, { status: 400 });
  }
  if (opportunityUrl) {
    try {
      new URL(opportunityUrl);
    } catch {
      return NextResponse.json({ error: "Enter a valid opportunity link." }, { status: 400 });
    }
  }

  const [{ data: profile }, { data: candidate, error: candidateError }] = await Promise.all([
    access.sb.from("talent_requester_profiles").select("user_id").eq("user_id", access.user.id).maybeSingle(),
    access.sb.from("talent_hub_public_profiles").select("worker_id").eq("worker_id", candidateWorkerId).maybeSingle(),
  ]);

  if (!profile) return NextResponse.json({ error: "Set up your requester profile before contacting a candidate." }, { status: 400 });
  if (candidateError || !candidate) return NextResponse.json({ error: "This candidate is not available for requests." }, { status: 404 });

  const { data, error } = await access.sb
    .from("talent_connection_requests")
    .insert({
      candidate_worker_id: candidateWorkerId,
      requester_user_id: access.user.id,
      intent,
      opportunity_title: opportunityTitle || null,
      opportunity_location: opportunityLocation || null,
      opportunity_url: opportunityUrl || null,
      message,
    })
    .select("id, status, created_at")
    .single();

  if (error) {
    const messageText = error.code === "23505"
      ? "You already have an active request with this candidate."
      : error.message;
    return NextResponse.json({ error: messageText }, { status: 400 });
  }

  // Email is a prompt back into the private in-app decision flow. A delivery
  // problem must never undo a successfully recorded request.
  try {
    const admin = supabaseAdminClient();
    const [{ data: candidateUser, error: candidateUserError }, { data: candidateProfile }] = await Promise.all([
      admin.auth.admin.getUserById(candidateWorkerId),
      admin.from("talent_hub_profiles").select("talent_alias").eq("worker_id", candidateWorkerId).maybeSingle(),
    ]);
    const candidateEmail = candidateUser?.user?.email;
    if (candidateUserError) throw candidateUserError;
    if (candidateEmail) {
      const email = buildTalentConnectionRequestEmail({
        candidateAlias: candidateProfile?.talent_alias,
        requester: {
          displayName: profile.display_name,
          companyName: profile.company_name,
          roleTitle: profile.role_title,
        },
        intent,
        opportunityTitle,
        opportunityLocation,
        talentHubUrl: siteUrl("/talenthub", req),
      });
      await sendEmail({ to: candidateEmail, ...email });
    }
  } catch (notificationError) {
    console.error("Talent Hub connection request email failed:", notificationError);
  }

  return NextResponse.json({ ok: true, request: data }, { status: 201 });
}