export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

export default async function CreatorsPage() {
  redirect("/vault/creators");
}
