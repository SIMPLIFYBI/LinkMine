// Server component wrapper – receives searchParams automatically.
export const dynamic = "force-dynamic";

import ClaimPageClient from "./ClaimPageClient.jsx";

export default function ClaimPage({ searchParams }) {
  const consultantId = searchParams?.consultant || "";
  return <ClaimPageClient consultantIdInitial={consultantId} />;
}