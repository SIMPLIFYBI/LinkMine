import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicKey, getSupabaseUrl } from "./supabaseEnv";

let client;
export function supabasePublicServer() {
  if (!client) {
    client = createClient(
      getSupabaseUrl(),
      getSupabasePublicKey(),
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }
  return client;
}