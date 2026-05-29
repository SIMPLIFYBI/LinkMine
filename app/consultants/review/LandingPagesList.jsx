import Link from "next/link";
import { landingPages } from "@/app/landing/registry";

function getBrowseHref(page) {
  if (page.categorySlug) {
    return `/consultants?category=${encodeURIComponent(page.categorySlug)}`;
  }

  if (page.serviceSlug) {
    return `/consultants?service=${encodeURIComponent(page.serviceSlug)}`;
  }

  return "/consultants";
}

export default function LandingPagesList() {
  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Landing pages</h1>
          <p className="text-sm text-slate-400">
            Current landing pages sourced from the landing registry.
          </p>
        </div>
        <div className="text-sm text-slate-300">
          {landingPages.length} total
        </div>
      </header>

      <div className="overflow-x-auto rounded border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-800/40 text-slate-300">
            <tr>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Slug</th>
              <th className="px-3 py-2">Filter</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {landingPages.map((page) => {
              const filterLabel = page.categorySlug
                ? `Category: ${page.categorySlug}`
                : page.serviceSlug
                  ? `Service: ${page.serviceSlug}`
                  : "None";

              return (
                <tr key={page.slug} className="hover:bg-slate-800/30">
                  <td className="px-3 py-2 text-slate-100">{page.title}</td>
                  <td className="px-3 py-2 text-slate-300">/{page.slug}</td>
                  <td className="px-3 py-2 text-slate-300">{filterLabel}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/landing/${page.slug}`}
                        className="rounded bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20"
                      >
                        View page
                      </Link>
                      <Link
                        href={getBrowseHref(page)}
                        className="rounded bg-sky-500/20 px-3 py-1 text-xs text-sky-100 hover:bg-sky-500/30"
                      >
                        Open consultants
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}