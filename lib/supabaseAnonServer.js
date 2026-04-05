import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicKey, getSupabaseUrl } from "./supabaseEnv";

export function supabaseAnonServer() {
  const url = getSupabaseUrl();
  const key = getSupabasePublicKey();
  if (!url || !key) {
    throw new Error("Missing Supabase public env vars (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)");
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}