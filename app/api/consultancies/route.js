import { createClient } from "@supabase/supabase-js";
import { sendNewConsultancyNotification } from "@/lib/emails/sendNewConsultancy";
import { siteUrl } from "@/lib/siteUrl";

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, phone, message } = body || {};

    if (!name || !email) {
      return new Response(JSON.stringify({ error: "name and email required" }), { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !adminKey) {
      console.error("supabase env missing");
      return new Response(JSON.stringify({ error: "server misconfigured" }), { status: 500 });
    }

    const db = createClient(supabaseUrl, adminKey, { auth: { persistSession: false } });

    const payload = {
      name,
      contact_email: email,
      phone: phone || null,
      message: message || null,
      created_at: new Date().toISOString(),
    };

    const { data: consultancy, error } = await db.from("consultancies").insert([payload]).select().single();
    if (error) {
      console.error("consultancy insert error:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    // Fire-and-forget notification to admin, but log any error server-side
    sendNewConsultancyNotification({ consultancy, createdBy: { email } })
      .then(() => console.log("admin notified for consultancy:", consultancy.id))
      .catch((err) => console.error("new consultancy notification error:", err));

    return new Response(JSON.stringify({ ok: true, consultancyId: consultancy.id }), { status: 201 });
  } catch (err) {
    console.error("consultancies.post error:", err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), { status: 500 });
  }
}