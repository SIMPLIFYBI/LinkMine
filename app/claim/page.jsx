// Server component wrapper – receives searchParams automatically.
export const dynamic = "force-dynamic";

import ClaimPageClient from "./ClaimPageClient.jsx";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

export default async function ClaimPage({ searchParams }) {
  const consultantId = searchParams?.consultant || "";
  let consultantName = "";
  let claimRecipientEmail = "";

  if (consultantId) {
    try {
      const sb = await supabaseServerClient();
      const { data: consultant } = await sb
        .from("consultants")
        .select("display_name, name, contact_email")
        .eq("id", consultantId)
        .maybeSingle();

      consultantName = consultant?.display_name || consultant?.name || "";
      claimRecipientEmail = consultant?.contact_email || "";
    } catch {
      // Keep page usable even if lookup fails.
    }
  }

  return (
    <ClaimPageClient
      consultantIdInitial={consultantId}
      consultantNameInitial={consultantName}
      claimRecipientEmail={claimRecipientEmail}
    />
  );
}