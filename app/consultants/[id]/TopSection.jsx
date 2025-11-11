import Link from "next/link";
import ConsultantTabs from "./ConsultantTabs";
import PermissionsGate from "./PermissionsGate.client.jsx";
import TrackView from "./TrackView.client.jsx";
import ConsultantSocialLinks from "@/app/components/ConsultantSocialLinks";
import ContactConsultantButton from "./ContactConsultantButton.client.jsx";

export default function TopSection({
  consultantId,
  consultant,
  initialViewsCount = 0,
  active = "profile",
  showTrack = true,
}) {
  return (
    <>
      {showTrack && (
        <TrackView consultantId={consultantId} source="consultant_profile" />
      )}

      <div className="flex items-start justify-between">
        <Link href="/consultants" className="text-sky-300 hover:underline">
          ← Back
        </Link>
        <PermissionsGate
          consultantId={consultantId}
          displayName={consultant.display_name}
          initialViewsCount={Number(initialViewsCount ?? 0)}
        />
      </div>

      <header className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          {consultant?.metadata?.logo?.url ? (
            <img
              src={consultant.metadata.logo.url}
              alt={`${consultant.display_name} logo`}
              width={112}
              height={112}
              decoding="async"
              loading="eager"
              className="h-28 w-28 shrink-0 rounded-lg bg-white/5 object-contain"
            />
          ) : null}
          <div>
            <h1 className="text-3xl font-semibold text-slate-50">
              {consultant.display_name}
            </h1>
            {consultant.abn_verified ? (
              <div className="mt-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/50 bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-100">
                  ✓ ABN verified
                </span>
              </div>
            ) : null}
            {consultant.headline ? (
              <p className="mt-1 text-sm text-slate-300">{consultant.headline}</p>
            ) : null}
            <ConsultantSocialLinks
              links={{
                linkedin_url: consultant.linkedin_url,
                facebook_url: consultant.facebook_url,
                twitter_url: consultant.twitter_url,
                instagram_url: consultant.instagram_url,
              }}
              className="mt-3"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ContactConsultantButton
            consultantId={consultantId}
            consultantName={consultant.display_name}
          />
        </div>
      </header>

      <ConsultantTabs consultantId={consultantId} active={active} />
    </>
  );
}