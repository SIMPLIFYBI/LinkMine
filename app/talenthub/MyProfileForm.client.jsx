"use client";

import { useState } from "react";

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

export default function MyProfileForm({ initialProfile, roleOptions, workingRightsOptions }) {
  const [profile, setProfile] = useState(initialProfile);

  function updateField(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

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

  return (
    <section className="mt-6 rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.54),rgba(2,6,23,0.18))] px-4 py-6 shadow-[0_36px_110px_-54px_rgba(8,145,178,0.95)] sm:px-6 sm:py-8">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="section-label">Worker profile</div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">My Profile</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">
            Build out the full candidate card that Talent Hub uses for discovery. This form covers the worker table plus availability, roles, and experience entries.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-xs leading-6 text-amber-100">
          Form UI is ready. Save wiring to Supabase is the next step.
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Core profile</div>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <FieldShell label="Display name" hint="Internal name tied to the worker record.">
                <input className={inputClasses()} value={profile.displayName} onChange={(event) => updateField("displayName", event.target.value)} placeholder="Jane Smith" />
              </FieldShell>
              <FieldShell label="Public profile name" hint="Name shown on the candidate card.">
                <input className={inputClasses()} value={profile.publicProfileName} onChange={(event) => updateField("publicProfileName", event.target.value)} placeholder="J. Smith" />
              </FieldShell>
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
              <FieldShell label="Status" hint="Workflow state for review and publishing.">
                <select className={inputClasses()} value={profile.status} onChange={(event) => updateField("status", event.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </FieldShell>
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
                    <FieldShell label="Position order" hint="Lower numbers appear first.">
                      <input type="number" className={inputClasses()} value={experience.position} onChange={(event) => updateExperience(index, "position", Number(event.target.value || 0))} />
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
                <select className={inputClasses()} value={profile.workingRightsSlug} onChange={(event) => updateField("workingRightsSlug", event.target.value)}>
                  <option value="">Select working rights</option>
                  {(workingRightsOptions || []).map((option) => (
                    <option key={option.slug} value={option.slug}>{option.name}</option>
                  ))}
                </select>
              </FieldShell>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Roles</div>
            <div className="mt-5 space-y-5">
              {groupedRoleOptions(roleOptions).map(([groupName, options]) => (
                <div key={groupName}>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{groupName}</div>
                  <div className="mt-3 grid gap-3">
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
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-emerald-400/20 bg-emerald-500/[0.08] p-5">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-100">Profile completion notes</div>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-emerald-50/90">
              <li>Public profile name, headline, location, and bio drive the deck presentation.</li>
              <li>Role selections feed the skill tags shown on worker cards.</li>
              <li>Availability and working rights help shortlist candidates faster.</li>
              <li>Experience entries should be ordered with the most relevant roles first.</li>
            </ul>
          </section>
        </div>
      </div>
    </section>
  );
}