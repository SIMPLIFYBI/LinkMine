import { supabaseServer } from "@/lib/supabaseServer";
import DirectoryDropdown from "./DirectoryDropdown";
import DirectoryMobile from "./DirectoryMobile";

export default async function DirectoryMenu({ variant = "desktop" }) {
  const sb = supabaseServer();
  const { data } = await sb
    .from("service_categories_with_children")
    .select("*")
    .order("position", { ascending: true });

  const categories = (data || []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    services: (Array.isArray(c.services) ? c.services : []).map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
    })),
  }));

  if (variant === "mobile") return <DirectoryMobile categories={categories} />;
  return <DirectoryDropdown categories={categories} />;
}