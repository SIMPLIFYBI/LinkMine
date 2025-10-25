import { createClient } from "@supabase/supabase-js";

let client;
export function supabasePublicServer() {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: { persistSession: false, autoRefreshToken: false },
      }
    );
  }
  return client;
}