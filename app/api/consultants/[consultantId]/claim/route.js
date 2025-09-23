import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function sb() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies }
  );
}

export async function POST(_req, { params }) {
  const supa = sb();
  const { data: { user } = {} } = await supa.auth.getUser();
  if (!user) return new Response(JSON.stringify({ ok: false, error: "Not signed in" }), { status: 401 });

  const { data, error } = await supa
    .from("consultants")
    .update({ user_id: user.id })
    .eq("id", params.consultantId)
    .is("user_id", null)
    .select("id, user_id")
    .maybeSingle();

  if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  if (!data) return new Response(JSON.stringify({ ok: false, error: "Already claimed or not found" }), { status: 409 });

  return new Response(JSON.stringify({ ok: true, consultant: data }), { status: 200 });
}