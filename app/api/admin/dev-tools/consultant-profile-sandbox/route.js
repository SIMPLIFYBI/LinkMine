export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { supabaseAdminClient } from "@/lib/supabaseAdminClient";
import { siteUrl } from "@/lib/siteUrl";

const TEST_EMAIL = "jaymeblue@gmail.com";
const SANDBOX_SLUG = "dev-jaymeblue-consultant-sandbox";
const SANDBOX_MARKER = "consultant-profile-sandbox";

async function getAdminContext(req) {
  const sb = await supabaseServerClient();
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  let user = null;

  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    const { data } = await sb.auth.getUser(authHeader.slice(7).trim());
    user = data?.user || null;
  }

  if (!user) {
    const { data } = await sb.auth.getUser();
    user = data?.user || null;
  }
  if (!user) return { ok: false, status: 401, error: "Not authenticated" };

  const [{ data: adminRow }, email] = await Promise.all([
    sb.from("app_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
    Promise.resolve(user.email?.toLowerCase() || ""),
  ]);
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (!adminRow && !adminEmails.includes(email)) {
    return { ok: false, status: 403, error: "Forbidden" };
  }
  return { ok: true };
}

async function getTestUser(admin) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error(error.message || "Could not look up the test account.");
  return data?.users?.find((user) => user.email?.toLowerCase() === TEST_EMAIL) || null;
}

async function getSandbox(admin) {
  const { data, error } = await admin
    .from("consultants")
    .select("id, slug, display_name, contact_email, user_id, claimed_by, visibility, status, metadata, created_at")
    .eq("slug", SANDBOX_SLUG)
    .maybeSingle();
  if (error) throw new Error(error.message || "Could not load the consultant sandbox.");
  return data;
}

function isSandboxRecord(consultant) {
  return consultant?.metadata?.dev_tool === SANDBOX_MARKER;
}

export async function POST(req) {
  try {
    const adminCheck = await getAdminContext(req);
    if (!adminCheck.ok) {
      return NextResponse.json({ ok: false, error: adminCheck.error }, { status: adminCheck.status });
    }

    const { mode = "preview", confirmText = "" } = await req.json().catch(() => ({}));
    const admin = supabaseAdminClient();
    const testUser = await getTestUser(admin);
    const sandbox = await getSandbox(admin);

    if (mode === "preview") {
      return NextResponse.json({
        ok: true,
        testEmail: TEST_EMAIL,
        testAccountExists: Boolean(testUser),
        sandbox: sandbox
          ? { id: sandbox.id, displayName: sandbox.display_name, status: sandbox.status, visibility: sandbox.visibility, isManaged: isSandboxRecord(sandbox) }
          : null,
        profileUrl: sandbox ? siteUrl(`/consultants/${sandbox.id}`, req) : null,
      });
    }

    if (mode === "create") {
      if (!testUser) {
        return NextResponse.json({ ok: false, error: `No auth account exists for ${TEST_EMAIL}.` }, { status: 409 });
      }
      if (sandbox && !isSandboxRecord(sandbox)) {
        return NextResponse.json({ ok: false, error: "The sandbox slug is already used by a non-sandbox consultant." }, { status: 409 });
      }

      const payload = {
        slug: SANDBOX_SLUG,
        display_name: "DevTools Consultant Sandbox",
        company: "DevTools Test Profile",
        headline: "Private developer-only consultant profile for testing.",
        location: "Perth, WA",
        country_code: "AU",
        global_region: "oceania",
        contact_email: TEST_EMAIL,
        user_id: testUser.id,
        claimed_by: testUser.id,
        claimed_at: new Date().toISOString(),
        visibility: "private",
        status: "pending",
        metadata: { dev_tool: SANDBOX_MARKER, test_email: TEST_EMAIL },
      };

      let query;
      if (sandbox) {
        query = admin.from("consultants").update(payload).eq("id", sandbox.id);
      } else {
        query = admin.from("consultants").insert(payload);
      }
      const { data, error } = await query.select("id, display_name, status, visibility").single();
      if (error) throw new Error(error.message || "Could not create the consultant sandbox.");

      return NextResponse.json({
        ok: true,
        action: "created",
        sandbox: data,
        profileUrl: siteUrl(`/consultants/${data.id}`, req),
      });
    }

    if (mode === "delete") {
      if (confirmText.trim() !== "DELETE TEST PROFILE") {
        return NextResponse.json({ ok: false, error: "Type DELETE TEST PROFILE to confirm deletion." }, { status: 400 });
      }
      if (!sandbox) {
        return NextResponse.json({ ok: false, error: "No consultant sandbox exists." }, { status: 404 });
      }
      if (!isSandboxRecord(sandbox) || sandbox.contact_email?.toLowerCase() !== TEST_EMAIL) {
        return NextResponse.json({ ok: false, error: "Refusing to delete a record that is not this DevTools sandbox." }, { status: 403 });
      }

      const { error } = await admin.from("consultants").delete().eq("id", sandbox.id);
      if (error) throw new Error(error.message || "Could not delete the consultant sandbox.");
      return NextResponse.json({ ok: true, action: "deleted" });
    }

    return NextResponse.json({ ok: false, error: "Unsupported sandbox action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error?.message || "Consultant sandbox request failed." }, { status: 500 });
  }
}