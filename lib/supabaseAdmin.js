import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !service) throw new Error("Service role key missing for admin client.");
export const supabaseAdmin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false }
});