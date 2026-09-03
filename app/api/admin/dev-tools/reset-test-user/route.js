export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

const MAX_ALLOWLIST = 200;

function cleanEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function parseAllowlist() {
  const raw = process.env.DEV_RESET_EMAIL_ALLOWLIST || "";
  return raw
    .split(",")
    .map((value) => cleanEmail(value))
    .filter(Boolean)
    .slice(0, MAX_ALLOWLIST);
}

function isAllowedEmail(email) {
  const allowlist = parseAllowlist();
  return allowlist.includes(email);
}

async function getAdminContext(req) {
  const sb = await supabaseServerClient();

  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  let user = null;

  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token) {
      const { data } = await sb.auth.getUser(token);
      user = data?.user || null;
    }
  }

  if (!user) {
    const { data } = await sb.auth.getUser();
    user = data?.user || null;
  }

  if (!user) {
    return { ok: false, status: 401, error: "Not authenticated" };
  }

  const [{ data: adminRow }, email] = await Promise.all([
    sb.from("app_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
    Promise.resolve(user.email?.toLowerCase() || ""),
  ]);

  const envAdmins = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const isAdmin = Boolean(adminRow) || (email && envAdmins.includes(email));

  if (!isAdmin) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true, user };
}

export async function POST(req) {
  try {
    const adminCheck = await getAdminContext(req);
    if (!adminCheck.ok) {
      return NextResponse.json({ ok: false, error: adminCheck.error }, { status: adminCheck.status });
    }

    const body = await req.json().catch(() => ({}));
    const mode = body?.mode === "execute" ? "execute" : "preview";
    const email = cleanEmail(body?.email);

    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "A valid email is required." }, { status: 400 });
    }

    if (!isAllowedEmail(email)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Email is not allowlisted for reset. Add it to DEV_RESET_EMAIL_ALLOWLIST before using this tool.",
        },
        { status: 403 },
      );
    }

    const sb = await supabaseServerClient();
    const { data, error } = await sb.rpc("admin_dev_reset_test_user", {
      p_email: email,
      p_mode: mode,
      p_confirm_text: mode === "execute" ? (body?.confirmText || "").trim() : null,
    });

    if (error) {
      const code = String(error.code || "");
      const status = code === "42501" ? 403 : code === "22023" ? 400 : 500;
      const message = String(error.message || "Reset failed.");

      if (message.toLowerCase().includes("admin_dev_reset_test_user")) {
        return NextResponse.json(
          {
            ok: false,
            error: "Reset RPC is not available yet. Run the latest DB migration and retry.",
          },
          { status: 500 },
        );
      }

      return NextResponse.json({ ok: false, error: message }, { status });
    }

    return NextResponse.json(data || { ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Reset failed.",
      },
      { status: 500 },
    );
  }
}
