import { createClient } from "@supabase/supabase-js";

let serverClient;
export function supabaseServer() {
  if (!serverClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    serverClient = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return serverClient;
}