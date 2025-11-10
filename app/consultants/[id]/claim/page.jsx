import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import ConsultantClaimConfirm from "@/app/components/ConsultantClaimConfirm";
import ClaimCodeEntry from "@/app/components/ClaimCodeEntry.client.jsx";

export const runtime = "nodejs";

import { redirect } from "next/navigation";

export default async function LegacyClaimRedirect({ params }) {
  const id = params?.id;
  const token = params?.token;
  const siteUrl = "https://www.theservice.com";

  // Always send to the single code-entry page
  redirect(`/claim?consultant=${id}`);
}