import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicKey, getSupabaseUrl } from "./supabaseEnv";

let client;
export function supabaseBrowser() {
  if (!client) {
    const url = getSupabaseUrl();
    const key = getSupabasePublicKey();
    if (!url || !key) {
      throw new Error("Missing Supabase public config. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).");
    }
    client = createBrowserClient(url, key);
  }
  return client;
}