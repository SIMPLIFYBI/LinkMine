"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { generateTalentIdentity, getNextTalentIdentity, getTalentAliasParts } from "@/lib/talentAliases";
import { TALENT_AVATAR_BACKGROUNDS } from "@/lib/talentAvatarConfig";
import { TALENT_OPPORTUNITY_STATUSES } from "@/lib/talentOpportunityStatuses";
import MarketToggle from "@/app/components/MarketToggle.client";
import TalentAvatar from "./TalentAvatar.client";

function FieldShell({ label, hint, children }) {
  return (
    <label className="block space-y-2">
      <div>
        <div className="text-sm font-semibold text-white">{label}</div>
        {hint ? <div className="mt-1 text-xs text-slate-400">{hint}</div> : null}
      </div>
      {children}
    </label>
  );
}

function inputClasses() {
  return "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-300/20";
}

function textareaClasses() {
  return `${inputClasses()} min-h-[132px] resize-y`;
}

function selectOptionStyle() {
  return { backgroundColor: "#08111c", color: "#f8fafc" };
}

const workflowStatusDetails = {
  draft: { label: "Draft", note: "This profile is not yet submitted for review.", markerClass: "bg-slate-400" },
  pending: { label: "Pending review", note: "This profile is waiting for an administrator review.", markerClass: "bg-amber-300" },
  approved: { label: "Approved", note: "This profile is approved and can be visible in Talent Hub.", markerClass: "bg-emerald-300" },
  rejected: { label: "Needs changes", note: "An administrator has requested changes before approval.", markerClass: "bg-rose-300" },
};

function groupedRoleOptions(roleOptions) {
  const grouped = new Map();

  for (const option of roleOptions || []) {
    const key = option.groupName || "Other roles";
    const current = grouped.get(key) || [];
    current.push(option);
    grouped.set(key, current);
  }

  return Array.from(grouped.entries());
}

function createEmptyExperience(position = 0) {
  return {
    id: `new-${position}-${Date.now()}`,
    roleTitle: "",
    company: "",
    description: "",
    location: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    achievementsText: "",
    position,
  };
}

function createProfileIdentity(initialProfile, currentProfile = {}) {
  const isSameProfile = currentProfile.id === initialProfile.id;
  const currentAlias = isSameProfile ? currentProfile.talentAlias : "";
  const alias = currentAlias || initialProfile.talentAlias;
  const generatedIdentity = alias ? null : generateTalentIdentity();
  const aliasParts = alias ? getTalentAliasParts(alias) : generatedIdentity;

  return {
    ...initialProfile,
    talentAlias: alias || generatedIdentity.alias,
    aliasDescriptor: aliasParts?.descriptor || initialProfile.aliasDescriptor || "",
    aliasAnimal: aliasParts?.animal || initialProfile.aliasAnimal || "",
  };
}

export default function MyProfileForm({ initialProfile, roleOptions, workingRightsOptions, market, onSave, profileEndpoint = "/api/workers/me/profile", title = "My Profile" }) {
  const [profile, setProfile] = useState(() => createProfileIdentity(initialProfile));
  const [saving, setSaving] = useState(false);
  const [aliasChangeVersion, setAliasChangeVersion] = useState(0);
  const [isAliasPreviewAnimating, setIsAliasPreviewAnimating] = useState(false);
  const [status, setStatus] = useState(null);
  const [specialisationMarket, setSpecialisationMarket] = useState(market);

  useEffect(() => {
    setProfile((current) => createProfileIdentity(initialProfile, current));
  }, [initialProfile]);

  useEffect(() => {
    setSpecialisationMarket(market);
  }, [market]);

  useEffect(() => {
    if (!isAliasPreviewAnimating) return undefined;

    const timeout = window.setTimeout(() => setIsAliasPreviewAnimating(false), 700);
    return () => window.clearTimeout(timeout);
  }, [isAliasPreviewAnimating, aliasChangeVersion]);

  function updateField(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  const visibleRoleOptions = (roleOptions || []).filter(
    (option) => specialisationMarket === "both" || option.market === specialisationMarket
  );

  function toggleRole(roleId) {
    setProfile((current) => {
      const nextIds = current.roleCategoryIds.includes(roleId)
        ? current.roleCategoryIds.filter((id) => id !== roleId)
        : [...current.roleCategoryIds, roleId];
      return { ...current, roleCategoryIds: nextIds };
    });
  }

  function updateExperience(index, field, value) {
    setProfile((current) => ({
      ...current,
      experiences: current.experiences.map((experience, experienceIndex) =>
        experienceIndex === index ? { ...experience, [field]: value } : experience
      ),
    }));
  }

  function addExperience() {
    setProfile((current) => ({
      ...current,
      experiences: [...current.experiences, createEmptyExperience(current.experiences.length)],
    }));
  }

  function removeExperience(index) {
    setProfile((current) => ({
      ...current,
      experiences: current.experiences.filter((_, experienceIndex) => experienceIndex !== index),
    }));
  }

  async function saveProfile(profileToSave, { stayOnProfile = false, successMessage = "" } = {}) {
    setSaving(true);
    setStatus(null);

    try {
      const res = await fetch(profileEndpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileToSave),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to save profile.");
      }

      const savedProfile = data?.profile || profile;
      setProfile(savedProfile);
      if (onSave) {
        await onSave(savedProfile, { stayOnProfile });
      }
      if (successMessage) {
        setStatus({ ok: true, msg: successMessage });
      }
    } catch (error) {
      setStatus({ ok: false, msg: error?.message || "Failed to save profile." });
    } finally {
      setSaving(false);
    }
  }

  function handleSave() {
    return saveProfile(profile);
  }

  function regenerateTalentAlias() {
    const nextProfile = { ...profile, ...getNextTalentIdentity(profile.talentAlias) };
    setProfile(nextProfile);
    setAliasChangeVersion((current) => current + 1);
    setIsAliasPreviewAnimating(true);
    setStatus({ ok: true, msg: "New Talent Alias selected. Save to keep it." });
  }

  return (
    <section className="mt-6 touch-pan-y overscroll-y-contain rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.54),rgba(2,6,23,0.18))] px-4 py-6 pb-[calc(env(safe-area-inset-bottom)+9rem)] shadow-[0_36px_110px_-54px_rgba(8,145,178,0.95)] sm:px-6 sm:py-8 sm:pb-32">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="section-label">Talent identity</div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">
            Shape the profile employers see in Talent Hub. Your Talent Alias is your public identity until a future match is mutually approved.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-xs leading-6 text-amber-100">
          Your real name is not shown in Talent Hub.
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Core profile</div>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <FieldShell label="Talent Alias" hint="This is the name Talent Hub uses for your candidate profile.">
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-cyan-300/25 bg-cyan-400/[0.08] px-4 py-3">
                    <div key={aliasChangeVersion} className={isAliasPreviewAnimating ? "animate-pulse" : ""} aria-live="polite">
                      <TalentAvatar animal={profile.aliasAnimal} descriptor={profile.aliasDescriptor} alias={profile.talentAlias} background={profile.avatarBackground} size="lg" />
                    </div>
                    <span key={`${profile.talentAlias}-${aliasChangeVersion}`} className={`min-w-0 flex-1 truncate text-lg font-semibold text-cyan-50 ${isAliasPreviewAnimating ? "animate-pulse" : ""}`} aria-live="polite">
                      {profile.talentAlias}
                    </span>
                    <button
                      type="button"
                      onClick={regenerateTalentAlias}
                      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-cyan-300/30 px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/10"
                    >
                      <RefreshCw className="h-4 w-4" aria-hidden="true" />
                      Regenerate
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="mr-1 text-xs font-semibold text-slate-300">Avatar background</span>
                    {TALENT_AVATAR_BACKGROUNDS.map((background) => {
                      const selected = profile.avatarBackground === background.id;
                      return (
                        <button
                          key={background.id}
                          type="button"
                          onClick={() => updateField("avatarBackground", background.id)}
                          aria-label={`Use ${background.label} avatar background`}
                          aria-pressed={selected}
                          title={background.label}
                          className={`h-8 w-8 rounded-full border-2 transition focus:outline-none focus:ring-2 focus:ring-cyan-300/50 ${selected ? "scale-110 border-cyan-100 ring-2 ring-cyan-300/50" : "border-white/20 hover:scale-105 hover:border-white/70"}`}
                          style={{ backgroundColor: background.color }}
                        />
                      );
                    })}
                  </div>
                </FieldShell>
              </div>
              <FieldShell label="Headline" hint="Short one-line summary for the deck.">
                <input className={inputClasses()} value={profile.headline} onChange={(event) => updateField("headline", event.target.value)} placeholder="Senior mine planner open to contract work" />
              </FieldShell>
              <FieldShell label="Location" hint="Primary working location or home base.">
                <input className={inputClasses()} value={profile.location} onChange={(event) => updateField("location", event.target.value)} placeholder="Perth, WA" />
              </FieldShell>
              <FieldShell label="Visibility" hint="Controls whether the profile can be shown publicly.">
                <select className={inputClasses()} value={profile.visibility} onChange={(event) => updateField("visibility", event.target.value)}>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </FieldShell>
              <FieldShell label="Status" hint="Managed by Talent Hub administrators.">
                {(() => {
                  const workflowStatus = workflowStatusDetails[profile.status] || workflowStatusDetails.draft;
                  return (
                    <div className="group relative flex min-h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-100" tabIndex={0}>
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${workflowStatus.markerClass}`} aria-hidden="true" />
                      <span className="font-semibold">{workflowStatus.label}</span>
                      <span className="ml-auto text-xs text-slate-400">Admin managed</span>
                      <span role="tooltip" className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 w-64 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs leading-5 text-slate-200 opacity-0 shadow-xl transition group-hover:opacity-100 group-focus:opacity-100">
                        {workflowStatus.note}
                      </span>
                    </div>
                  );
                })()}
              </FieldShell>
              <div className="md:col-span-2">
                <fieldset>
                  <legend className="text-sm font-semibold text-white">Opportunity status</legend>
                  <p className="mt-1 text-xs text-slate-400">Signals how open you are to hearing about work.</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {TALENT_OPPORTUNITY_STATUSES.map((opportunityStatus) => {
                      const selected = profile.opportunityStatus === opportunityStatus.value;
                      return (
                        <button
                          key={opportunityStatus.value}
                          type="button"
                          onClick={() => updateField("opportunityStatus", opportunityStatus.value)}
                          aria-pressed={selected}
                          className={`min-h-24 rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-cyan-300/40 ${selected ? "border-cyan-300/55 bg-cyan-400/15 text-cyan-50 shadow-[0_12px_32px_-20px_rgba(34,211,238,0.9)]" : "border-white/10 bg-white/[0.03] text-slate-200 hover:border-white/20 hover:bg-white/[0.06]"}`}
                        >
                          <span className="block text-sm font-semibold">{opportunityStatus.label}</span>
                          <span className={`mt-1 block text-xs leading-5 ${selected ? "text-cyan-100/85" : "text-slate-400"}`}>{opportunityStatus.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              </div>
              <div className="md:col-span-2">
                <FieldShell label="Bio" hint="Long-form summary used for the CV snapshot and modal.">
                  <textarea className={textareaClasses()} value={profile.bio} onChange={(event) => updateField("bio", event.target.value)} placeholder="Summarise experience, strengths, sector exposure, and the type of roles you want next." />
                </FieldShell>
              </div>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Availability</div>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <FieldShell label="Availability state" hint="Use available now for immediate start, otherwise set a date.">
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-100">
                  <input
                    id="available-now"
                    type="checkbox"
                    checked={profile.availableNow}
                    onChange={(event) => updateField("availableNow", event.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-slate-950 text-cyan-300 focus:ring-cyan-300/30"
                  />
                  <label htmlFor="available-now" className="cursor-pointer">Available now</label>
                </div>
              </FieldShell>
              <FieldShell label="Available from" hint="Only needed when not available immediately.">
                <input
                  type="date"
                  className={inputClasses()}
                  value={profile.availableFrom}
                  onChange={(event) => updateField("availableFrom", event.target.value)}
                  disabled={profile.availableNow}
                />
              </FieldShell>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Experience</div>
            <div className="mt-5 space-y-5">
              {profile.experiences.map((experience, index) => (
                <article key={experience.id || index} className="rounded-[1.5rem] border border-white/10 bg-black/15 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white">Experience #{index + 1}</div>
                    <button
                      type="button"
                      onClick={() => removeExperience(index)}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300 transition hover:bg-white/5"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <FieldShell label="Role title">
                      <input className={inputClasses()} value={experience.roleTitle} onChange={(event) => updateExperience(index, "roleTitle", event.target.value)} placeholder="Senior geologist" />
                    </FieldShell>
                    <FieldShell label="Company">
                      <input className={inputClasses()} value={experience.company} onChange={(event) => updateExperience(index, "company", event.target.value)} placeholder="MineralCo" />
                    </FieldShell>
                    <FieldShell label="Location">
                      <input className={inputClasses()} value={experience.location} onChange={(event) => updateExperience(index, "location", event.target.value)} placeholder="Pilbara, WA" />
                    </FieldShell>
                    <FieldShell label="Start date">
                      <input type="date" className={inputClasses()} value={experience.startDate} onChange={(event) => updateExperience(index, "startDate", event.target.value)} />
                    </FieldShell>
                    <FieldShell label="End date">
                      <input type="date" className={inputClasses()} value={experience.endDate} onChange={(event) => updateExperience(index, "endDate", event.target.value)} disabled={experience.isCurrent} />
                    </FieldShell>
                    <FieldShell label="Current role">
                      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-100">
                        <input
                          id={`experience-current-${index}`}
                          type="checkbox"
                          checked={experience.isCurrent}
                          onChange={(event) => updateExperience(index, "isCurrent", event.target.checked)}
                          className="h-4 w-4 rounded border-white/20 bg-slate-950 text-cyan-300 focus:ring-cyan-300/30"
                        />
                        <label htmlFor={`experience-current-${index}`} className="cursor-pointer">This is my current role</label>
                      </div>
                    </FieldShell>
                    <div className="md:col-span-2">
                      <FieldShell label="Description">
                        <textarea className={textareaClasses()} value={experience.description} onChange={(event) => updateExperience(index, "description", event.target.value)} placeholder="Key responsibilities, environment, and impact." />
                      </FieldShell>
                    </div>
                    <div className="md:col-span-2">
                      <FieldShell label="Achievements" hint="Store achievements as line-separated entries for now.">
                        <textarea className={textareaClasses()} value={experience.achievementsText} onChange={(event) => updateExperience(index, "achievementsText", event.target.value)} placeholder={"Improved recovery by 8%\nLed shutdown planning for three sites"} />
                      </FieldShell>
                    </div>
                  </div>
                </article>
              ))}

              <button
                type="button"
                onClick={addExperience}
                className="inline-flex items-center rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/16"
              >
                Add experience
              </button>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Working rights</div>
            <div className="mt-5 space-y-3">
              <FieldShell label="Working rights category" hint="Maps to the working_rights_slug field on the worker record.">
                <select
                  className={`${inputClasses()} bg-[linear-gradient(180deg,rgba(8,17,28,0.98),rgba(7,20,34,0.98))] text-white [color-scheme:dark]`}
                  value={profile.workingRightsSlug}
                  onChange={(event) => updateField("workingRightsSlug", event.target.value)}
                  style={selectOptionStyle()}
                >
                  <option value="" style={selectOptionStyle()}>Select working rights</option>
                  {(workingRightsOptions || []).map((option) => (
                    <option key={option.slug} value={option.slug} style={selectOptionStyle()}>{option.name}</option>
                  ))}
                </select>
              </FieldShell>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Specialisations</div>
                <p className="mt-2 text-sm leading-6 text-slate-400">Choose the same categories and services used across YouMine consultant profiles.</p>
              </div>
              <MarketToggle market={specialisationMarket} onMarketChange={setSpecialisationMarket} />
            </div>
            <div className="mt-5 space-y-5">
              {groupedRoleOptions(visibleRoleOptions).map(([groupName, options]) => (
                <details
                  key={groupName}
                  open={options.some((option) => profile.roleCategoryIds.includes(option.id))}
                  className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/15"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-left marker:hidden transition hover:bg-white/[0.03]">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{groupName}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {options.filter((option) => profile.roleCategoryIds.includes(option.id)).length} selected
                      </div>
                    </div>
                    <span className="text-lg text-slate-400 transition group-open:rotate-180">⌄</span>
                  </summary>

                  <div className="grid gap-3 border-t border-white/10 px-4 py-4">
                    {options.map((option) => {
                      const checked = profile.roleCategoryIds.includes(option.id);
                      return (
                        <label key={option.id} className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm transition ${checked ? "border-cyan-300/35 bg-cyan-400/10 text-cyan-50" : "border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.05]"}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleRole(option.id)}
                            className="mt-0.5 h-4 w-4 rounded border-white/20 bg-slate-950 text-cyan-300 focus:ring-cyan-300/30"
                          />
                          <span>
                            <span className="block font-medium">{option.name}</span>
                            {option.description ? <span className="mt-1 block text-xs text-slate-400">{option.description}</span> : null}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </details>
              ))}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-emerald-400/20 bg-emerald-500/[0.08] p-5">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-100">Profile completion notes</div>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-emerald-50/90">
              <li>Your Talent Alias, headline, location, and bio drive the deck presentation.</li>
              <li>Specialisation selections use the shared YouMine consultant taxonomy.</li>
              <li>Opportunity status, availability, and working rights help shortlist candidates faster.</li>
              <li>Experience entries should be ordered with the most relevant roles first.</li>
            </ul>
          </section>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] z-40 flex justify-center px-4 sm:bottom-5">
        <div className="pointer-events-auto flex w-full max-w-xl items-center justify-between gap-3 rounded-[1.5rem] border border-cyan-300/20 bg-slate-950/92 px-4 py-3 shadow-[0_24px_80px_-30px_rgba(8,145,178,0.9)] backdrop-blur-xl">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/85">{title}</div>
            <div className="truncate text-sm text-slate-300">
              {status?.msg || "Save changes to publish this profile back into the candidate deck."}
            </div>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex shrink-0 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-400/12 px-5 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/18 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </section>
  );
}