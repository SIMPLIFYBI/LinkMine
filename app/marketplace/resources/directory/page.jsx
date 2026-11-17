import Link from "next/link";
import { notFound } from "next/navigation";
import { supabasePublicServer } from "@/lib/supabasePublicServer";
import { siteUrl } from "@/lib/siteUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

function getPage(searchParams) {
  const rawPage = searchParams?.page;
  if (typeof rawPage !== "string" || !/^[1-9]\d*$/.test(rawPage)) return 1;
  const page = Number(rawPage);
  return Number.isSafeInteger(page) && page <= 100000 ? page : 1;
}

function directoryHref(page) {
  return page > 1 ? `/vault/resources/directory?page=${page}` : "/vault/resources/directory";
}

export async function generateMetadata({ searchParams }) {
  const page = getPage(await searchParams);
  const title = page > 1 ? `Mining Resource Directory - Page ${page}` : "Mining Resource Directory";
  const description = "Browse mining software, templates, training and other industry resources in the YouMine Vault.";
  const canonical = siteUrl(directoryHref(page));
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, siteName: "YouMine", type: "website" },
  };
}

export default async function ResourceDirectoryPage({ searchParams }) {
  const page = getPage(await searchParams);
  const start = (page - 1) * PAGE_SIZE;
  const { data, error } = await supabasePublicServer()
    .from("resources")
    .select("id, title, summary, description, source_name")
    .eq("status", "approved")
    .order("title", { ascending: true })
    .order("id", { ascending: true })
    .range(start, start + PAGE_SIZE);

  if (error) throw new Error("Unable to load the resource directory.");
  const resources = data || [];
  if (page > 1 && resources.length === 0) notFound();
  const hasMore = resources.length > PAGE_SIZE;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/vault/resources" className="text-sm font-semibold text-sky-300 hover:text-sky-100">
        &larr; Back to resource browser
      </Link>
      <div className="mt-7 border-b border-white/10 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">YouMine Vault</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Mining resource directory</h1>
        <p className="mt-3 text-sm text-slate-300">Browse resources and digital tools for mining and exploration.</p>
      </div>

      {resources.length === 0 ? (
        <p className="py-8 text-sm text-slate-300">No resources are available yet.</p>
      ) : (
        <ul className="divide-y divide-white/10">
          {resources.slice(0, PAGE_SIZE).map((resource) => (
            <li key={resource.id} className="py-5">
              <Link href={`/vault/${resource.id}`} className="text-lg font-semibold text-white hover:text-sky-200">
                {resource.title}
              </Link>
              {resource.source_name ? <p className="mt-1 text-sm text-sky-200">{resource.source_name}</p> : null}
              {resource.summary || resource.description ? (
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{resource.summary || resource.description}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <nav aria-label="Resource directory pages" className="flex items-center justify-between gap-4 border-t border-white/10 py-5 text-sm">
        {page > 1 ? <Link href={directoryHref(page - 1)} className="font-semibold text-sky-300 hover:text-sky-100">Previous page</Link> : <span />}
        <span className="text-slate-400">Page {page}</span>
        {hasMore ? <Link href={directoryHref(page + 1)} className="font-semibold text-sky-300 hover:text-sky-100">Next page</Link> : <span />}
      </nav>
    </div>
  );
}