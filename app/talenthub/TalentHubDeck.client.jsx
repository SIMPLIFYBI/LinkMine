"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, HeartHandshake, Pencil, Send } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { getTalentOpportunityStatus } from "@/lib/talentOpportunityStatuses";
import { INITIAL_CONNECTION_CONTACT_DETAILS_MESSAGE, initialConnectionMessageHasContactDetails } from "@/lib/talentConnectionMessage";
import WorkerFavouriteButton from "./WorkerFavouriteButton.client";
import MyProfileForm from "./MyProfileForm.client";
import TalentAvatar from "./TalentAvatar.client";

const darkSelectStyle = { backgroundColor: "#08111c", color: "#f8fafc" };

function darkSelectClasses(baseClasses) {
  return `${baseClasses} appearance-auto bg-[linear-gradient(180deg,rgba(8,17,28,0.98),rgba(7,20,34,0.98))] text-white [color-scheme:dark]`;
}

const tabs = [
  { key: "candidates", label: "Candidates" },
  { key: "favourites", label: "Favourites" },
  { key: "connections", label: "Connections" },
  { key: "my-profile", label: "My Profile" },
];

function formatExperienceWindow(startDate, endDate, isCurrent) {
  if (!startDate && !endDate && !isCurrent) return null;

  const formatter = new Intl.DateTimeFormat("en-AU", {
    month: "short",
    year: "numeric",
  });

  const start = startDate ? formatter.format(new Date(startDate)) : null;
  const end = isCurrent ? "Now" : endDate ? formatter.format(new Date(endDate)) : null;

  if (start && end) return `${start} - ${end}`;
  return start || end;
}

function formatAvailabilityPreview(profile) {
  if (profile?.availableNow) {
    return { tone: "now", label: "Available now" };
  }

  if (profile?.availableFrom) {
    return {
      tone: "later",
      label: `Available from ${new Intl.DateTimeFormat("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(profile.availableFrom))}`,
    };
  }

  return null;
}

function createWorkerPreview(profile, roleOptions, workingRightsOptions) {
  const displayName = profile?.talentAlias || "Unnamed talent";
  const bio = String(profile?.bio || "").trim();
  const selectedRoleIds = new Set(profile?.roleCategoryIds || []);
  const roles = (roleOptions || [])
    .filter((option) => selectedRoleIds.has(option.id))
    .map((option) => ({ name: option.name, slug: option.slug }));
  const workingRights = (workingRightsOptions || []).find(
    (option) => option.slug === profile?.workingRightsSlug
  )?.name || null;
  const experiences = (profile?.experiences || [])
    .slice()
    .sort((a, b) => Number(a?.position ?? 0) - Number(b?.position ?? 0))
    .slice(0, 3)
    .map((experience) => ({
      roleTitle: experience?.roleTitle || "",
      company: experience?.company || "",
      description: experience?.description || "",
      dateRange: formatExperienceWindow(experience?.startDate, experience?.endDate, experience?.isCurrent),
    }));

  return {
    id: profile?.id,
    displayName,
    aliasDescriptor: profile?.aliasDescriptor || "",
    aliasAnimal: profile?.aliasAnimal || "",
    avatarBackground: profile?.avatarBackground || "sage",
    headline: profile?.headline || "Mining professional ready for the next opportunity.",
    bioPreview: bio ? bio.slice(0, 240) : "No bio added yet.",
    location: profile?.location || "Location not specified",
    roles,
    opportunityStatus: getTalentOpportunityStatus(profile?.opportunityStatus)?.label || null,
    availability: formatAvailabilityPreview(profile),
    workingRights,
    experiences,
    isTestProfile: Boolean(profile?.isTestProfile),
  };
}

function TalentHubTabs({ activeTab, onChange, pendingRequestCount = 0, showAddProfile = false }) {
  return (
    <nav className="flex gap-3 overflow-x-auto rounded-full border border-white/10 bg-white/[0.04] p-1 text-sm text-slate-100">
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        const isCreateProfileTab = showAddProfile && tab.key === "my-profile";
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 font-semibold transition ${
              isActive
                ? "bg-cyan-300 text-slate-950 shadow"
                : isCreateProfileTab
                  ? "bg-cyan-300/10 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.2)] hover:bg-cyan-300/16"
                  : "text-slate-300 hover:bg-white/5"
            }`}
          >
            <span>{isCreateProfileTab ? "Create Profile" : tab.label}</span>
            {tab.key === "connections" && pendingRequestCount > 0 ? (
              <span className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none ${isActive ? "bg-slate-950 text-cyan-100" : "bg-amber-300 text-slate-950"}`} aria-label={`${pendingRequestCount} pending connection ${pendingRequestCount === 1 ? "request" : "requests"}`}>
                {pendingRequestCount > 99 ? "99+" : pendingRequestCount}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

function Badge({ children, tone = "neutral" }) {
  const classes = {
    neutral: "border-white/12 bg-white/[0.05] text-slate-200",
    now: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
    later: "border-amber-400/30 bg-amber-500/10 text-amber-100",
    accent: "border-cyan-300/30 bg-cyan-400/10 text-cyan-100",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium ${classes[tone] || classes.neutral}`}>
      {children}
    </span>
  );
}

function NewConnectionMatchModal({ request, onDismiss, onReview }) {
  if (!request) return null;

  const requester = request.requesterProfile;
  const requesterName = requester?.display_name || "A YouMine member";
  const requesterDetail = [requester?.role_title, requester?.company_name].filter(Boolean).join(" at ");

  return (
    <div className="talent-match-backdrop fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="talent-match-title">
      <div className="talent-match-sheet relative w-full max-w-md overflow-hidden rounded-[2rem] border border-cyan-300/25 bg-[linear-gradient(160deg,rgba(8,30,44,0.98),rgba(8,17,28,0.99))] p-6 shadow-[0_36px_120px_-36px_rgba(8,145,178,0.85)] sm:p-8">
        <div className="talent-match-halo pointer-events-none absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="relative">
          <div className="talent-match-icon mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-200/35 bg-cyan-300/10 text-cyan-100 shadow-[0_0_32px_rgba(34,211,238,0.2)]">
            <HeartHandshake className="h-8 w-8" aria-hidden="true" />
          </div>
          <p className="talent-match-copy mt-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/80">Talent Hub</p>
          <h2 id="talent-match-title" className="talent-match-copy mt-3 text-center text-3xl font-semibold text-white">You have a match</h2>
          <p className="talent-match-copy mt-3 text-center text-sm leading-6 text-slate-300">{requesterName} would like to connect with you.</p>
          {requesterDetail || request.opportunity_title ? (
            <div className="talent-match-copy mt-6 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center">
              <p className="text-sm font-semibold text-slate-100">{request.opportunity_title || requesterDetail}</p>
              {request.opportunity_title && requesterDetail ? <p className="mt-1 text-xs text-slate-400">{requesterDetail}</p> : null}
            </div>
          ) : null}
          <p className="talent-match-copy mt-5 text-center text-sm leading-6 text-slate-400">Review the request when you are ready. Your details remain private unless you choose to connect.</p>
          <div className="talent-match-copy mt-7 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={onDismiss} className="min-h-11 rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/5">Not now</button>
            <button type="button" onClick={onReview} className="min-h-11 rounded-xl bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-200">Review request</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RequestConnectionPanel({ worker, onSent }) {
  const [profile, setProfile] = useState({ displayName: "", companyName: "", roleTitle: "", contactEmail: "" });
  const [request, setRequest] = useState({ intent: "role", opportunityTitle: "", opportunityLocation: "", opportunityUrl: "", message: "" });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let active = true;
    fetch("/api/talent/requester-profile")
      .then((response) => response.json().then((data) => ({ response, data })))
      .then(({ response, data }) => {
        if (!active) return;
        if (!response.ok) throw new Error(data?.error || "Unable to load requester profile.");
        if (data.profile) {
          setProfile({
            displayName: data.profile.display_name || "",
            companyName: data.profile.company_name || "",
            roleTitle: data.profile.role_title || "",
            contactEmail: data.profile.contact_email || "",
          });
        }
      })
      .catch((error) => active && setStatus({ ok: false, text: error.message || "Unable to load your details." }))
      .finally(() => active && setLoadingProfile(false));
    return () => { active = false; };
  }, []);

  function updateProfile(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function updateRequest(field, value) {
    setRequest((current) => ({ ...current, [field]: value }));
  }

  const messageHasContactDetails = initialConnectionMessageHasContactDetails(request.message);

  async function submit(event) {
    event.preventDefault();
    if (messageHasContactDetails) {
      setStatus({ ok: false, text: INITIAL_CONNECTION_CONTACT_DETAILS_MESSAGE });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const profileResponse = await fetch("/api/talent/requester-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const profileData = await profileResponse.json().catch(() => ({}));
      if (!profileResponse.ok) throw new Error(profileData?.error || "Unable to save requester details.");

      const requestResponse = await fetch("/api/talent/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateWorkerId: worker.id, ...request }),
      });
      const requestData = await requestResponse.json().catch(() => ({}));
      if (!requestResponse.ok) throw new Error(requestData?.error || "Unable to send connection request.");
      setStatus({ ok: true, text: "Request sent. The candidate can now decide whether to connect." });
      onSent?.(requestData.request);
    } catch (error) {
      setStatus({ ok: false, text: error?.message || "Unable to send connection request." });
    } finally {
      setSaving(false);
    }
  }

  const fieldClass = "w-full rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/20";

  return (
    <form onSubmit={submit} className="mt-6 rounded-[1.5rem] border border-cyan-300/20 bg-cyan-400/[0.06] p-5">
      <div className="flex items-start gap-3">
        <Send className="mt-0.5 h-5 w-5 shrink-0 text-cyan-200" aria-hidden="true" />
        <div>
          <h3 className="text-sm font-semibold text-white">Request to connect</h3>
          <p className="mt-1 text-sm leading-6 text-slate-300">Your identity and note go to {worker.displayName}. Contact details stay private unless they choose to share them.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <input className={fieldClass} value={profile.displayName} onChange={(event) => updateProfile("displayName", event.target.value)} placeholder="Your name" disabled={loadingProfile || saving} required />
        <input className={fieldClass} value={profile.companyName} onChange={(event) => updateProfile("companyName", event.target.value)} placeholder="Company" disabled={loadingProfile || saving} />
        <input className={fieldClass} value={profile.roleTitle} onChange={(event) => updateProfile("roleTitle", event.target.value)} placeholder="Your role" disabled={loadingProfile || saving} />
        <input type="email" className={fieldClass} value={profile.contactEmail} onChange={(event) => updateProfile("contactEmail", event.target.value)} placeholder="Work email (optional)" disabled={loadingProfile || saving} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <select className={darkSelectClasses(fieldClass)} value={request.intent} onChange={(event) => updateRequest("intent", event.target.value)} disabled={saving} style={darkSelectStyle}>
          <option value="role" style={darkSelectStyle}>Permanent role</option>
          <option value="contract" style={darkSelectStyle}>Contract</option>
          <option value="consulting" style={darkSelectStyle}>Consulting</option>
          <option value="exploratory" style={darkSelectStyle}>Exploratory conversation</option>
        </select>
        <input className={fieldClass} value={request.opportunityTitle} onChange={(event) => updateRequest("opportunityTitle", event.target.value)} placeholder="Opportunity title (optional)" disabled={saving} />
        <input className={fieldClass} value={request.opportunityLocation} onChange={(event) => updateRequest("opportunityLocation", event.target.value)} placeholder="Location / work arrangement" disabled={saving} />
        <input type="url" className={fieldClass} value={request.opportunityUrl} onChange={(event) => updateRequest("opportunityUrl", event.target.value)} placeholder="Opportunity link (optional)" disabled={saving} />
      </div>
      <textarea className={`${fieldClass} mt-3 min-h-28 resize-y ${messageHasContactDetails ? "border-rose-400/70 focus:border-rose-300/70 focus:ring-rose-300/20" : ""}`} value={request.message} onChange={(event) => updateRequest("message", event.target.value)} placeholder="Why would this be a worthwhile conversation?" disabled={saving} required maxLength={4000} aria-describedby="connection-message-guidance" />
      <p id="connection-message-guidance" className={`mt-2 text-xs leading-5 ${messageHasContactDetails ? "text-rose-200" : "text-slate-400"}`}>
        {messageHasContactDetails ? INITIAL_CONNECTION_CONTACT_DETAILS_MESSAGE : "Explain who you are and why you would like to connect. Contact details can be shared after acceptance."}
      </p>

      {status ? <p className={`mt-3 text-sm ${status.ok ? "text-emerald-200" : "text-rose-200"}`} role="status">{status.text}</p> : null}
      <button type="submit" disabled={loadingProfile || saving || status?.ok || messageHasContactDetails} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60">
        <Send className="h-4 w-4" aria-hidden="true" />
        {saving ? "Sending request" : status?.ok ? "Request sent" : "Send request"}
      </button>
    </form>
  );
}

function WorkerDetailModal({ worker, onClose, isAdmin = false, onEdit, isEditing = false, onRequestSent }) {
  useEffect(() => {
    if (!worker) return undefined;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [worker, onClose]);

  if (!worker) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-xl" onClick={onClose}>
      <div
        className="relative max-h-[90vh] w-full max-w-3xl overflow-auto rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(7,20,34,0.94),rgba(8,17,28,0.96))] p-6 text-slate-100 shadow-[0_36px_120px_-44px_rgba(8,145,178,0.8)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/[0.12]"
        >
          Close
        </button>

        <div className="flex flex-col gap-4 pr-16 sm:flex-row sm:pr-20">
          <TalentAvatar animal={worker.aliasAnimal} descriptor={worker.aliasDescriptor} alias={worker.displayName} background={worker.avatarBackground} size="lg" />
          <div className="w-full">
            <p className="section-label">Profile summary</p>
            <h2 className="mt-4 text-3xl font-semibold text-white">{worker.displayName}</h2>
            {worker.availability || worker.isTestProfile ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {worker.availability ? <Badge tone={worker.availability.tone}>{worker.availability.label}</Badge> : null}
                {worker.isTestProfile ? <Badge tone="later">Test profile</Badge> : null}
              </div>
            ) : null}
            <p className="mt-2 text-lg text-slate-200">{worker.headline}</p>
            {isAdmin ? (
              <button
                type="button"
                onClick={() => onEdit?.(worker.id)}
                disabled={isEditing}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100 transition hover:bg-cyan-400/16 disabled:cursor-wait disabled:opacity-60"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                {isEditing ? "Loading editor" : "Edit profile"}
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Badge tone="accent">{worker.location}</Badge>
          {worker.opportunityStatus ? <Badge tone="accent">{worker.opportunityStatus}</Badge> : null}
        </div>

        <section className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">CV snapshot</h3>
          <p className="mt-4 text-sm leading-7 text-slate-200">{worker.bioPreview}</p>
        </section>

        <div className="mt-6 grid gap-6 md:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Recent experience</h3>
            <div className="mt-3 space-y-3">
              {worker.experiences.length ? worker.experiences.map((experience, index) => (
                <article key={`${worker.id}-detail-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{experience.roleTitle}</div>
                      {experience.company ? <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">{experience.company}</div> : null}
                    </div>
                    {experience.dateRange ? <div className="text-xs text-slate-400">{experience.dateRange}</div> : null}
                  </div>
                  {experience.description ? <p className="mt-3 text-sm leading-6 text-slate-300">{experience.description}</p> : null}
                </article>
              )) : (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">
                  No experience added yet.
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Roles</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {worker.roles.length ? worker.roles.map((role) => (
                  <Badge key={`${worker.id}-${role.slug || role.name}`}>{role.name}</Badge>
                )) : <div className="text-sm text-slate-400">No roles added.</div>}
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-300/16 bg-cyan-400/[0.05] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-100/80">Hiring read</div>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                Strong fit for a fast first-pass review. The deck is designed to answer: should this person move to shortlist?
              </p>
            </div>
          </aside>
        </div>
        <RequestConnectionPanel worker={worker} onSent={onRequestSent} />
      </div>
    </div>
  );
}

function WorkerCard({ worker, onOpen, className = "", compact = false, cardRef = null, preview = false }) {
  const isInteractive = !preview && typeof onOpen === "function";

  function handleKeyDown(event) {
    if (!isInteractive) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  }

  return (
    <div
      ref={cardRef}
      onClick={isInteractive ? onOpen : undefined}
      onKeyDown={handleKeyDown}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      className={`group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(7,20,34,0.98),rgba(8,17,28,0.98))] text-left shadow-[0_30px_110px_-48px_rgba(8,145,178,0.85)] transition hover:-translate-y-1 hover:border-cyan-300/30 hover:shadow-[0_36px_130px_-50px_rgba(8,145,178,0.95)] focus:outline-none focus:ring-2 focus:ring-cyan-300/40 ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_26%),radial-gradient(circle_at_82%_14%,rgba(56,189,248,0.16),transparent_20%)]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:34px_34px]" />

      <div className={`relative flex flex-col ${compact ? "p-5" : "p-6 pb-4 sm:p-8"}`}>
        <div>
          <div className="flex flex-col items-start gap-3 pr-16 sm:flex-row sm:pr-20">
            <TalentAvatar animal={worker.aliasAnimal} descriptor={worker.aliasDescriptor} alias={worker.displayName} background={worker.avatarBackground} size={compact ? "sm" : "md"} />
            <div className="w-full min-w-0 sm:pt-1">
              <p className="section-label truncate">{worker.displayName}</p>
              {worker.availability || worker.opportunityStatus ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {worker.availability ? <Badge tone={worker.availability.tone}>{worker.availability.label}</Badge> : null}
                  {worker.opportunityStatus ? <Badge tone="accent">{worker.opportunityStatus}</Badge> : null}
                  {worker.isTestProfile ? <Badge tone="later">Test profile</Badge> : null}
                </div>
              ) : worker.isTestProfile ? <div className="mt-2"><Badge tone="later">Test profile</Badge></div> : null}
            </div>
          </div>
          <p className={`${compact ? "mt-2 line-clamp-2 text-sm" : "mt-2 text-sm sm:text-base"} leading-7 text-slate-200`}>{worker.headline}</p>
          {!preview ? (
            <div className="absolute right-6 top-6 flex items-center gap-2 sm:right-8 sm:top-8">
              <WorkerFavouriteButton workerId={worker.id} />
              <span className="hidden rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100 transition group-hover:bg-white/[0.12] sm:inline-flex">
                Open
              </span>
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Badge tone="accent">{worker.location}</Badge>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-3 text-xs uppercase tracking-[0.18em] text-slate-400 sm:mt-5 sm:pt-4">
          <span>Swipe or scroll</span>
          <span>Tap to open</span>
        </div>
      </div>
    </div>
  );
}

function MyCardPreviewModal({ worker, onClose }) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 py-6 backdrop-blur-xl" onClick={onClose}>
      <div className="relative w-full max-w-3xl" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-slate-950/80 text-xl text-slate-100 transition hover:bg-slate-900"
          aria-label="Close card preview"
        >
          ×
        </button>
        <WorkerCard worker={worker} preview />
      </div>
    </div>
  );
}

function ConnectionThread({ requestId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/talent/requests/${requestId}/messages`)
      .then((response) => response.json().then((data) => ({ response, data })))
      .then(({ response, data }) => {
        if (!response.ok) throw new Error(data?.error || "Unable to load messages.");
        if (active) setMessages(data.messages || []);
      })
      .catch((messageError) => active && setError(messageError.message || "Unable to load messages."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [requestId]);

  async function sendMessage(event) {
    event.preventDefault();
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch(`/api/talent/requests/${requestId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Unable to send message.");
      setMessages((current) => [...current, data.message]);
      setBody("");
    } catch (messageError) {
      setError(messageError.message || "Unable to send message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-slate-950/35 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-white">YouMine conversation</h3>
        <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-300 transition hover:bg-white/5">Close</button>
      </div>
      <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
        {loading ? <p className="text-sm text-slate-400">Loading conversation...</p> : null}
        {!loading && !messages.length ? <p className="text-sm text-slate-400">No messages yet. Start the conversation here.</p> : null}
        {messages.map((message) => <p key={message.id} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm leading-6 text-slate-200">{message.body}</p>)}
      </div>
      {error ? <p className="mt-3 text-sm text-rose-200">{error}</p> : null}
      <form onSubmit={sendMessage} className="mt-4 flex gap-2">
        <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={4000} placeholder="Write a message" className="min-h-11 flex-1 resize-y rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-300/50" />
        <button type="submit" disabled={sending || !body.trim()} className="h-11 self-end rounded-xl bg-cyan-300 px-4 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 disabled:opacity-60">Send</button>
      </form>
    </div>
  );
}

function ConnectionRequests({ isCandidate, focusRequestId = null }) {
  const [view, setView] = useState(isCandidate ? "received" : "sent");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [openThreadId, setOpenThreadId] = useState(null);

  useEffect(() => {
    setView(isCandidate ? "received" : "sent");
  }, [isCandidate]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    fetch(`/api/talent/requests?view=${view}`)
      .then((response) => response.json().then((data) => ({ response, data })))
      .then(({ response, data }) => {
        if (!response.ok) throw new Error(data?.error || "Unable to load connection requests.");
        if (active) setRequests(data.requests || []);
      })
      .catch((requestError) => active && setError(requestError.message || "Unable to load connection requests."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [view]);

  useEffect(() => {
    if (!focusRequestId || loading || view !== "received") return;
    const requestElement = document.getElementById(`talent-request-${focusRequestId}`);
    requestElement?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusRequestId, loading, view]);

  async function updateRequest(requestId, status) {
    setBusyId(requestId);
    setError("");
    try {
      const response = await fetch(`/api/talent/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Unable to update this request.");
      setRequests((current) => current.map((request) => request.id === requestId ? { ...request, ...data.request } : request));
    } catch (requestError) {
      setError(requestError.message || "Unable to update this request.");
    } finally {
      setBusyId(null);
    }
  }

  async function shareResume(requestId) {
    setBusyId(requestId);
    setError("");
    try {
      const response = await fetch(`/api/talent/requests/${requestId}/resume`, { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Unable to share your resume.");
      setRequests((current) => current.map((request) => request.id === requestId ? { ...request, resumeShared: true } : request));
    } catch (requestError) {
      setError(requestError.message || "Unable to share your resume.");
    } finally {
      setBusyId(null);
    }
  }

  async function downloadResume(requestId) {
    setBusyId(requestId);
    setError("");
    try {
      const response = await fetch(`/api/talent/requests/${requestId}/resume`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Unable to check the shared resume.");
      if (!data.shared) throw new Error("The candidate has not shared a resume yet.");
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (requestError) {
      setError(requestError.message || "Unable to download the resume.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="mt-6 rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.54),rgba(2,6,23,0.18))] p-5 shadow-[0_36px_110px_-54px_rgba(8,145,178,0.95)] sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-label">Private connection requests</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{view === "received" ? "Requests for you" : "Your requests"}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{view === "received" ? "Review who wants to connect before deciding. Accepting keeps the first conversation in YouMine." : "Track the connection requests you have sent. Candidates decide whether to accept."}</p>
        </div>
        {isCandidate ? (
          <div className="flex rounded-xl border border-white/10 p-1 text-sm">
            {["received", "sent"].map((nextView) => (
              <button key={nextView} type="button" onClick={() => setView(nextView)} className={`rounded-lg px-3 py-2 font-semibold transition ${view === nextView ? "bg-cyan-300 text-slate-950" : "text-slate-300 hover:bg-white/5"}`}>
                {nextView === "received" ? "Received" : "Sent"}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {error ? <p className="mt-5 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</p> : null}
      {loading ? <p className="mt-6 text-sm text-slate-400">Loading requests...</p> : null}
      {!loading && !requests.length ? <p className="mt-6 rounded-xl border border-dashed border-white/15 px-4 py-10 text-center text-sm text-slate-400">{view === "received" ? "No connection requests yet." : "You have not sent any connection requests yet."}</p> : null}
      <div className="mt-6 space-y-4">
        {requests.map((request) => {
          const requester = request.requesterProfile;
          const pending = request.status === "pending";
          return (
            <article id={`talent-request-${request.id}`} key={request.id} className={`rounded-2xl border bg-white/[0.035] p-5 transition ${focusRequestId === request.id ? "border-cyan-300/60 shadow-[0_0_32px_-12px_rgba(34,211,238,0.55)]" : "border-white/10"}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{view === "received" ? requester?.display_name || "YouMine member" : request.opportunity_title || "Connection request"}</p>
                  {view === "received" ? <p className="mt-1 text-sm text-slate-300">{[requester?.role_title, requester?.company_name].filter(Boolean).join(" at ") || "Opportunity details included below"}</p> : null}
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-cyan-100">{request.intent.replace("_", " ")}</p>
                </div>
                <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold capitalize ${request.status === "accepted" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100" : request.status === "declined" || request.status === "blocked" ? "border-rose-400/30 bg-rose-400/10 text-rose-100" : "border-amber-400/30 bg-amber-400/10 text-amber-100"}`}>{request.status}</span>
              </div>
              {request.opportunity_location ? <p className="mt-3 text-sm text-slate-400">{request.opportunity_location}</p> : null}
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-200">{request.message}</p>
              {pending ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {view === "received" ? (
                    <>
                      <button type="button" disabled={busyId === request.id} onClick={() => updateRequest(request.id, "accepted")} className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 disabled:opacity-60">Accept</button>
                      <button type="button" disabled={busyId === request.id} onClick={() => updateRequest(request.id, "declined")} className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/5 disabled:opacity-60">Decline</button>
                      <button type="button" disabled={busyId === request.id} onClick={() => updateRequest(request.id, "blocked")} className="rounded-xl px-3 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/10 disabled:opacity-60">Block</button>
                    </>
                  ) : <button type="button" disabled={busyId === request.id} onClick={() => updateRequest(request.id, "withdrawn")} className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/5 disabled:opacity-60">Withdraw request</button>}
                </div>
              ) : null}
              {request.status === "accepted" ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setOpenThreadId((current) => current === request.id ? null : request.id)} className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/5">{openThreadId === request.id ? "Close conversation" : "Open conversation"}</button>
                  {view === "received" ? (
                    <button type="button" disabled={busyId === request.id || request.resumeShared} onClick={() => shareResume(request.id)} className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/16 disabled:opacity-60">
                      {request.resumeShared ? "Resume shared" : "Share current resume"}
                    </button>
                  ) : (
                    <button type="button" disabled={busyId === request.id} onClick={() => downloadResume(request.id)} className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/16 disabled:opacity-60">View shared resume</button>
                  )}
                </div>
              ) : null}
              {openThreadId === request.id ? <ConnectionThread requestId={request.id} onClose={() => setOpenThreadId(null)} /> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ResumeManager({ hasProfile }) {
  const [resumes, setResumes] = useState([]);
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!hasProfile) return;
    let active = true;
    fetch("/api/talent/resumes")
      .then((response) => response.json().then((data) => ({ response, data })))
      .then(({ response, data }) => {
        if (!response.ok) throw new Error(data?.error || "Unable to load resume.");
        if (active) setResumes(data.resumes || []);
      })
      .catch((error) => active && setStatus(error.message || "Unable to load resume."));
    return () => { active = false; };
  }, [hasProfile]);

  async function uploadResume(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setStatus("");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/talent/resumes", { method: "POST", body: form });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Unable to upload resume.");
      setResumes((current) => [data.resume, ...current.map((resume) => ({ ...resume, is_current: false }))]);
      setStatus("Current resume updated. It remains private until you share it with a match.");
    } catch (error) {
      setStatus(error.message || "Unable to upload resume.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  const current = resumes.find((resume) => resume.is_current);
  return (
    <section className="mt-6 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Private resume</div>
          <p className="mt-2 text-sm leading-6 text-slate-300">{current ? `Current file: ${current.file_name}` : "Upload a current resume to share only with connections you accept."}</p>
        </div>
        <label className={`inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/16 ${uploading ? "pointer-events-none opacity-60" : ""}`}>
          <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={uploadResume} className="sr-only" disabled={!hasProfile || uploading} />
          {uploading ? "Uploading resume" : current ? "Replace resume" : "Upload resume"}
        </label>
      </div>
      {status ? <p className="mt-3 text-sm text-cyan-100" role="status">{status}</p> : null}
    </section>
  );
}

export default function TalentHubDeck({ workers, currentProfile, roleOptions, workingRightsOptions, market, isAdmin = false }) {
  const sb = supabaseBrowser();
  const [activeTab, setActiveTab] = useState("candidates");
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [workersState, setWorkersState] = useState(workers);
  const [currentProfileState, setCurrentProfileState] = useState(currentProfile);
  const [favouriteIds, setFavouriteIds] = useState([]);
  const [favouritesLoaded, setFavouritesLoaded] = useState(false);
  const [pendingFocusWorkerId, setPendingFocusWorkerId] = useState(null);
  const [isMyCardPreviewOpen, setIsMyCardPreviewOpen] = useState(false);
  const [adminEditingProfile, setAdminEditingProfile] = useState(null);
  const [isLoadingAdminProfile, setIsLoadingAdminProfile] = useState(false);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [newMatchRequest, setNewMatchRequest] = useState(null);
  const [focusedRequestId, setFocusedRequestId] = useState(null);
  const trackRef = useRef(null);
  const itemRefs = useRef([]);
  const displayedWorkers = activeTab === "favourites"
    ? workersState.filter((worker) => favouriteIds.includes(worker.id))
    : workersState;
  const selectedWorker = displayedWorkers.find((worker) => worker.id === selectedWorkerId) || null;

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, displayedWorkers.length);
  }, [displayedWorkers.length]);

  useEffect(() => {
    setWorkersState(workers);
  }, [workers]);

  useEffect(() => {
    setCurrentProfileState(currentProfile);
  }, [currentProfile]);

  useEffect(() => {
    let mounted = true;

    async function loadFavourites() {
      const { data: auth } = await sb.auth.getUser();
      const userId = auth?.user?.id || null;

      if (!mounted) return;
      if (!userId) {
        setFavouriteIds([]);
        setFavouritesLoaded(true);
        return;
      }

      const { data, error } = await sb
        .from("worker_favourites")
        .select("worker_id")
        .eq("user_id", userId);

      if (!mounted) return;
      if (error) {
        setFavouriteIds([]);
        setFavouritesLoaded(true);
        return;
      }

      setFavouriteIds((data || []).map((row) => row.worker_id).filter(Boolean));
      setFavouritesLoaded(true);
    }

    loadFavourites();

    return () => {
      mounted = false;
    };
  }, [sb]);

  useEffect(() => {
    function onFavouriteChanged(event) {
      const workerId = event?.detail?.workerId;
      const favourite = Boolean(event?.detail?.favourite);
      if (!workerId) return;

      setFavouriteIds((current) => {
        if (favourite) {
          return current.includes(workerId) ? current : [...current, workerId];
        }
        return current.filter((id) => id !== workerId);
      });
    }

    window.addEventListener("worker-favourite-changed", onFavouriteChanged);
    return () => window.removeEventListener("worker-favourite-changed", onFavouriteChanged);
  }, []);

  useEffect(() => {
    if (!currentProfileState?.id) {
      setPendingRequestCount(0);
      return undefined;
    }

    let mounted = true;
    async function loadPendingRequestCount() {
      try {
        const response = await fetch("/api/talent/requests?view=received");
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.error || "Unable to load pending requests.");
        const pendingRequests = (data.requests || []).filter((request) => request.status === "pending");
        if (!mounted) return;
        setPendingRequestCount(pendingRequests.length);
        let seenRequestIds = new Set();
        try {
          seenRequestIds = new Set(JSON.parse(window.sessionStorage.getItem("youmine-talent-match-seen") || "[]"));
        } catch {
          // Storage is optional; the candidate can still receive the prompt.
        }
        const nextMatch = pendingRequests.find((request) => !seenRequestIds.has(request.id));
        if (nextMatch) {
          seenRequestIds.add(nextMatch.id);
          try {
            window.sessionStorage.setItem("youmine-talent-match-seen", JSON.stringify([...seenRequestIds]));
          } catch {
            // Without storage, the request can be shown again after a refresh.
          }
          setNewMatchRequest(nextMatch);
        }
      } catch {
        if (mounted) setPendingRequestCount(0);
      }
    }

    loadPendingRequestCount();
    window.addEventListener("focus", loadPendingRequestCount);
    return () => {
      mounted = false;
      window.removeEventListener("focus", loadPendingRequestCount);
    };
  }, [currentProfileState?.id]);

  useEffect(() => {
    if (activeTab === "connections") {
      fetch("/api/talent/requests?view=received")
        .then((response) => response.json())
        .then((data) => setPendingRequestCount((data.requests || []).filter((request) => request.status === "pending").length))
        .catch(() => {});
    }
  }, [activeTab]);

  useEffect(() => {
    setActiveIndex(0);
    setSelectedWorkerId(null);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "candidates" || !pendingFocusWorkerId) return;

    const index = displayedWorkers.findIndex((worker) => worker.id === pendingFocusWorkerId);
    if (index < 0) return;

    scrollToIndex(index);
    setSelectedWorkerId(pendingFocusWorkerId);
    setPendingFocusWorkerId(null);
  }, [activeTab, displayedWorkers, pendingFocusWorkerId]);

  useEffect(() => {
    const container = trackRef.current;
    if (!container) return undefined;

    let frame = null;
    let settleTimeout = null;

    function updateActiveCard() {
      frame = null;
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.left + (containerRect.width / 2);

      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      itemRefs.current.forEach((element, index) => {
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const cardCenter = rect.left + (rect.width / 2);
        const distance = Math.abs(cardCenter - containerCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveIndex((current) => (current === closestIndex ? current : closestIndex));
    }

    function onScroll() {
      if (frame != null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateActiveCard);
      if (settleTimeout != null) window.clearTimeout(settleTimeout);
      settleTimeout = window.setTimeout(updateActiveCard, 140);
    }

    updateActiveCard();
    container.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      container.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame != null) cancelAnimationFrame(frame);
      if (settleTimeout != null) window.clearTimeout(settleTimeout);
    };
  }, [displayedWorkers.length]);

  function scrollToIndex(index) {
    const boundedIndex = Math.max(0, Math.min(index, displayedWorkers.length - 1));
    const element = itemRefs.current[boundedIndex];
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    setActiveIndex(boundedIndex);
  }

  async function handleProfileSaved(savedProfile, { stayOnProfile = false } = {}) {
    setCurrentProfileState(savedProfile);

    const savedWorker = createWorkerPreview(savedProfile, roleOptions, workingRightsOptions);
    if (savedWorker?.id) {
      setWorkersState((current) => {
        const existingIndex = current.findIndex((worker) => worker.id === savedWorker.id);
        if (existingIndex === -1) {
          return [savedWorker, ...current];
        }

        const next = current.slice();
        next[existingIndex] = savedWorker;
        return next;
      });
      setPendingFocusWorkerId(savedWorker.id);
    }

    if (!stayOnProfile) {
      setActiveTab("candidates");
    }
  }

  async function handleAdminProfileEdit(workerId) {
    if (!workerId || isLoadingAdminProfile) return;

    setIsLoadingAdminProfile(true);
    try {
      const response = await fetch(`/api/workers/me/profile?workerId=${encodeURIComponent(workerId)}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.profile) {
        throw new Error(data?.error || "Unable to load this profile.");
      }

      setAdminEditingProfile(data.profile);
      setSelectedWorkerId(null);
      setActiveTab("my-profile");
    } finally {
      setIsLoadingAdminProfile(false);
    }
  }

  function handleAdminProfileSaved(savedProfile) {
    setAdminEditingProfile(savedProfile);
    const savedWorker = createWorkerPreview(savedProfile, roleOptions, workingRightsOptions);
    setWorkersState((current) => current.map((worker) => (
      worker.id === savedWorker.id ? savedWorker : worker
    )));
  }

  function handleProfileDeleted() {
    const deletedWorkerId = currentProfileState?.id;
    setCurrentProfileState({
      id: null,
      talentAlias: "",
      aliasDescriptor: "",
      aliasAnimal: "",
      headline: "",
      bio: "",
      location: "",
      visibility: "public",
      status: "approved",
      opportunityStatus: "open_to_opportunities",
      avatarBackground: "sage",
      workingRightsSlug: "",
      availableNow: false,
      availableFrom: "",
      roleCategoryIds: [],
      experiences: [],
    });
    setWorkersState((current) => current.filter((worker) => worker.id !== deletedWorkerId));
    setFavouriteIds((current) => current.filter((workerId) => workerId !== deletedWorkerId));
    setPendingRequestCount(0);
    setActiveTab("candidates");
  }

  function reviewNewMatch() {
    if (!newMatchRequest) return;
    setFocusedRequestId(newMatchRequest.id);
    setNewMatchRequest(null);
    setActiveTab("connections");
  }

  const emptyCandidates = !workersState.length;
  const emptyFavourites = favouritesLoaded && favouriteIds.length === 0;
  const showAddProfile = !currentProfileState?.id;
  const myCardPreview = createWorkerPreview(currentProfileState, roleOptions, workingRightsOptions);

  if (activeTab === "connections") {
    return (
      <div>
        <TalentHubTabs activeTab={activeTab} onChange={setActiveTab} pendingRequestCount={pendingRequestCount} showAddProfile={showAddProfile} />
        <ConnectionRequests isCandidate={Boolean(currentProfileState?.id)} focusRequestId={focusedRequestId} />
        <NewConnectionMatchModal request={newMatchRequest} onDismiss={() => setNewMatchRequest(null)} onReview={reviewNewMatch} />
      </div>
    );
  }

  if (activeTab === "my-profile") {
    return (
      <>
        <div>
          <TalentHubTabs activeTab={activeTab} onChange={setActiveTab} pendingRequestCount={pendingRequestCount} showAddProfile={showAddProfile} />
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => setIsMyCardPreviewOpen(true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-cyan-300/35 bg-cyan-400/10 px-4 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/16 focus:outline-none focus:ring-2 focus:ring-cyan-300/50"
            >
              <Eye className="h-5 w-5" aria-hidden="true" />
              View My Card
            </button>
          </div>

          <MyProfileForm
            initialProfile={adminEditingProfile || currentProfileState}
            roleOptions={roleOptions}
            workingRightsOptions={workingRightsOptions}
            market={market}
            profileEndpoint={adminEditingProfile ? `/api/workers/me/profile?workerId=${encodeURIComponent(adminEditingProfile.id)}` : undefined}
            title={adminEditingProfile ? "Edit candidate profile" : "My Profile"}
            onSave={adminEditingProfile ? handleAdminProfileSaved : handleProfileSaved}
            onDelete={adminEditingProfile ? undefined : handleProfileDeleted}
            canManageTestProfile={Boolean(adminEditingProfile) && isAdmin}
          />
          {!adminEditingProfile ? <ResumeManager hasProfile={Boolean(currentProfileState?.id)} /> : null}
        </div>

        <WorkerDetailModal worker={selectedWorker} onClose={() => setSelectedWorkerId(null)} isAdmin={isAdmin} onEdit={handleAdminProfileEdit} isEditing={isLoadingAdminProfile} />
        {isMyCardPreviewOpen ? <MyCardPreviewModal worker={myCardPreview} onClose={() => setIsMyCardPreviewOpen(false)} /> : null}
        <NewConnectionMatchModal request={newMatchRequest} onDismiss={() => setNewMatchRequest(null)} onReview={reviewNewMatch} />
      </>
    );
  }

  if ((activeTab === "candidates" && emptyCandidates) || (activeTab === "favourites" && emptyFavourites)) {
    return (
      <>
        <div>
          <TalentHubTabs activeTab={activeTab} onChange={setActiveTab} pendingRequestCount={pendingRequestCount} showAddProfile={showAddProfile} />

          <div className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.04] px-6 py-16 text-center text-slate-300 shadow-[0_28px_80px_-44px_rgba(15,23,42,0.9)]">
            <h2 className="text-xl font-semibold text-white">
              {activeTab === "favourites" ? "No favourites yet." : "No workers are live yet."}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              {activeTab === "favourites"
                ? "Favourite a candidate to keep them in a shortlist here."
                : "The tables are ready, but there are no approved public workers to render in the deck yet."}
            </p>
          </div>
        </div>

        <WorkerDetailModal worker={selectedWorker} onClose={() => setSelectedWorkerId(null)} isAdmin={isAdmin} onEdit={handleAdminProfileEdit} isEditing={isLoadingAdminProfile} />
        <NewConnectionMatchModal request={newMatchRequest} onDismiss={() => setNewMatchRequest(null)} onReview={reviewNewMatch} />
      </>
    );
  }

  return (
    <>
      <div>
        <TalentHubTabs activeTab={activeTab} onChange={setActiveTab} pendingRequestCount={pendingRequestCount} showAddProfile={showAddProfile} />

        <section className="relative mt-6 overflow-hidden rounded-[2.25rem] border border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.54),rgba(2,6,23,0.12))] px-4 py-6 shadow-[0_36px_110px_-54px_rgba(8,145,178,0.95)] sm:px-6 sm:py-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.1),transparent_18%)]" />
          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex - 1)}
            disabled={activeIndex === 0}
            className="absolute left-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-slate-950/72 text-slate-100 backdrop-blur-xl transition hover:bg-slate-900/90 disabled:cursor-not-allowed disabled:opacity-30 md:inline-flex"
            aria-label="Show previous worker"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex + 1)}
            disabled={activeIndex === displayedWorkers.length - 1}
            className="absolute right-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-slate-950/72 text-slate-100 backdrop-blur-xl transition hover:bg-slate-900/90 disabled:cursor-not-allowed disabled:opacity-30 md:inline-flex"
            aria-label="Show next worker"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" />
            </svg>
          </button>

          <div className="relative talenthub-carousel-mask">
            <div
              ref={trackRef}
              className="no-scrollbar flex touch-auto snap-x snap-mandatory gap-5 overflow-x-auto px-[10vw] py-2 scroll-smooth md:px-[16vw]"
            >
              {displayedWorkers.map((worker, index) => (
                <WorkerCard
                  key={worker.id}
                  worker={worker}
                  compact={false}
                  className={`w-[78vw] min-w-[78vw] shrink-0 snap-center snap-always md:w-[68vw] md:min-w-[68vw] xl:w-[58vw] xl:min-w-[58vw] transition duration-300 ${activeIndex === index ? "scale-100 opacity-100" : "scale-[0.92] opacity-45"}`}
                  onOpen={() => setSelectedWorkerId(worker.id)}
                  cardRef={(element) => {
                    itemRefs.current[index] = element;
                  }}
                />
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-3 md:hidden">
            <button
              type="button"
              onClick={() => scrollToIndex(activeIndex - 1)}
              disabled={activeIndex === 0}
              className="rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => scrollToIndex(activeIndex + 1)}
              disabled={activeIndex === displayedWorkers.length - 1}
              className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/16 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-400">
            {displayedWorkers.map((worker, index) => (
              <button
                key={`${worker.id}-dot`}
                type="button"
                onClick={() => scrollToIndex(index)}
                aria-label={`Jump to ${worker.displayName}`}
                className={`h-2.5 rounded-full transition ${activeIndex === index ? "w-8 bg-cyan-300" : "w-2.5 bg-white/20 hover:bg-white/35"}`}
              />
            ))}
          </div>
        </section>
      </div>

      <WorkerDetailModal worker={selectedWorker} onClose={() => setSelectedWorkerId(null)} isAdmin={isAdmin} onEdit={handleAdminProfileEdit} isEditing={isLoadingAdminProfile} />
      <NewConnectionMatchModal request={newMatchRequest} onDismiss={() => setNewMatchRequest(null)} onReview={reviewNewMatch} />
    </>
  );
}