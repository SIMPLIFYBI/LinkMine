import { createClient } from "@supabase/supabase-js";

let client;
export function supabaseBrowser() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    client = createClient(url, anon);
  }
  return client;
}