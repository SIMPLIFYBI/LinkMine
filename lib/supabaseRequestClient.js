import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a server-side client that forwards the incoming Authorization header to PostgREST
export function supabaseFromRequest(req) {
  const authHeader = req.headers.get("authorization") || "";
  const globalHeaders = authHeader ? { Authorization: authHeader } : {};
  return createClient(url, anon, {
    global: { headers: globalHeaders },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}