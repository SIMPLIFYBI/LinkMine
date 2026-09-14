export const runtime = "nodejs";
import { redirect } from "next/navigation";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    alternates: { canonical: `/consultants/${id}` },
    robots: { index: false, follow: true },
  };
}

export default async function CreatorPage({ params }) {
  const { id } = await params;
  redirect(`/consultants/${id}`);
}
