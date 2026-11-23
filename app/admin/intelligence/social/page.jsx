import Link from "next/link";
import "@/app/intelligence/social/social.css";
import SocialKit from "@/app/intelligence/social/SocialKit.client";
import { requireIntelligenceAdmin } from "@/lib/intelligence/adminPage";
import { REPORTS } from "@/lib/intelligence/reports";
import { PUBLIC_BASE, fillUrl, getKit, reportUrl } from "@/lib/intelligence/social";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Social posts · Intelligence · YouMine",
  robots: { index: false, follow: false },
};

export default async function IntelligenceSocialPage({ searchParams }) {
  await requireIntelligenceAdmin("/admin/intelligence/social");

  const { r } = await searchParams;
  const ready = REPORTS.filter((report) => getKit(report.slug));
  const waiting = REPORTS.filter((report) => !getKit(report.slug));
  const report = ready.find((item) => item.slug === r) || ready[0] || null;
  const kit = report ? getKit(report.slug) : null;

  const liUrl = report ? reportUrl(report.slug, "linkedin") : "";
  const xUrl = report ? reportUrl(report.slug, "x") : "";

  const slides = kit
    ? [
        ...kit.slides.map((slide) => ({ alt: slide.alt })),
        { alt: `Closing slide. Read the whole analysis, ${kit.kicker}, on YouMine: the method, sources, every number and every caveat. Link in the comments.` },
      ]
    : [];

  return (
    <main className="yi-wrap yi-wrap--wide">
      <p className="yi-kicker">Social · Admin only</p>
      <h1 className="yi-title yi-title--sm">Social posts</h1>
      <p className="yi-lede">
        A post kit for each report: three highlight images and a closing call to action, the post text for LinkedIn and X, alt text, and
        tracked links. Edit any text here before you copy it; changes are not saved.
      </p>

      <p className="yi-flag" role="note">
        Public report pages do not exist yet, so the links below ({PUBLIC_BASE}/&hellip;) will not resolve until the reports are published.
        Do not post until they do.
      </p>

      <div className="yi-chips yis-pick" role="group" aria-label="Choose a report">
        {ready.map((item) => (
          <Link
            key={item.slug}
            href={`/admin/intelligence/social?r=${item.slug}`}
            className={`yi-btn${report && item.slug === report.slug ? " yi-btn--primary" : ""}`}
            aria-current={report && item.slug === report.slug ? "true" : undefined}
          >
            {item.title}
          </Link>
        ))}
      </div>
      {waiting.length ? (
        <p className="yis-hint">
          No kit yet: {waiting.map((item) => item.title).join(", ")}. A kit is a block of copied-from-the-report numbers and text in
          <code> lib/intelligence/social.js</code>.
        </p>
      ) : null}

      {kit ? (
        <SocialKit
          key={report.slug}
          slug={report.slug}
          title={report.title}
          slides={slides}
          linkedin={`${kit.linkedin}\n\n${kit.hashtags}`}
          linkedinComment={fillUrl(kit.linkedinComment, liUrl)}
          x={kit.x}
          xReply={fillUrl(kit.xReply, xUrl)}
          urls={{ linkedin: liUrl, x: xUrl }}
        />
      ) : (
        <p className="yi-flag">No social kits have been written yet.</p>
      )}
    </main>
  );
}
