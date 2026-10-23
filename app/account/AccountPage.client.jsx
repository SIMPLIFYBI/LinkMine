"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import NotificationsPreferences from "./NotificationsPreferences.client.jsx";
import AccountTabs from "./AccountTabs.jsx";

const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean);

const TABS = [
  { key: "account", label: "Account" },
  { key: "activity", label: "Activity", href: "/account?tab=activity" },
  { key: "notifications", label: "Notifications" },
  { key: "profiles", label: "Profile" },
];

export default function AccountPageClient({ initialTab = "account" }) {
  const router = useRouter();
  const sbRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [consultants, setConsultants] = useState([]);
  const [profileError, setProfileError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAppAdmin, setIsAppAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState(
    TABS.some((t) => t.key === initialTab) ? initialTab : "account"
  );

  // NEW: profile form state for the Account tab
  const [profileForm, setProfileForm] = useState({
    organisationName: "",
    firstName: "",
    lastName: "",
  });
  const [profileSaveError, setProfileSaveError] = useState("");
  const [profileSaveMessage, setProfileSaveMessage] = useState("");
  const [isSavingProfile, startSavingProfile] = useTransition();

  useEffect(() => {
    let mounted = true;
    const sb = supabaseBrowser();
    sbRef.current = sb;

    async function init() {
      const { data } = await sb.auth.getSession();
      if (!mounted) return;

      const currentSession = data.session ?? null;
      setSession(currentSession);
      setLoading(false);

      if (!currentSession) {
        router.replace("/signup");
        return;
      }

      const userId = currentSession.user.id;
      const email = currentSession.user.email?.toLowerCase() ?? "";

      const [
        { data: adminRow },
        { data: consultantRows, error: consultantError },
        { data: profileRow, error: profileFetchError },
      ] = await Promise.all([
        sb.from("app_admins").select("user_id").eq("user_id", userId).maybeSingle(),
        sb
          .from("consultants")
          .select("id, display_name, claimed_by, profile_type")
          .eq("claimed_by", userId)
          .order("display_name"),
        sb
          .from("user_profiles")
          .select(
            "organisation_name, first_name, last_name"
          )
          .eq("id", userId)
          .maybeSingle(),
      ]);

      if (!mounted) return;

      setIsAppAdmin(Boolean(adminRow?.user_id));
      setIsAdmin(Boolean(adminRow) || (email && adminEmails.includes(email)));

      if (consultantError) {
        setProfileError(consultantError.message);
        setConsultants([]);
      } else {
        setConsultants(consultantRows ?? []);
      }

      if (profileFetchError) {
        // don’t block the page, just surface error near the form later if you like
        console.error("Error loading profile:", profileFetchError.message);
      } else if (profileRow) {
        setProfileForm((prev) => ({
          ...prev,
          organisationName: profileRow.organisation_name ?? "",
          firstName: profileRow.first_name ?? "",
          lastName: profileRow.last_name ?? "",
        }));
      }
    }

    init();

    const { data: sub } = sb.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      if (!nextSession) router.replace("/signup");
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [router]);

  const signOut = async () => {
    const sb = sbRef.current;
    if (!sb) return;
    await sb.auth.signOut();
    router.push("/login");
  };

  const userEmail = session?.user?.email ?? "Unknown";
  const userId = session?.user?.id ?? null;

  const ownedProfiles = useMemo(() => {
    if (!userId) return [];
    return consultants
      .map((row) => ({
        id: row.id,
        name: row.display_name,
        profileType: String(row.profile_type || "consultant"),
        isOwner: row.claimed_by === userId,
      }));
  }, [consultants, userId]);

  function updateProfileField(field, value) {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    if (!session?.access_token) return;

    setProfileSaveError("");
    setProfileSaveMessage("");

    startSavingProfile(async () => {
      try {
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            organisationName: profileForm.organisationName?.trim() || null,
            firstName: profileForm.firstName?.trim(),
            lastName: profileForm.lastName?.trim(),
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Could not save profile.");
        }

        setProfileSaveMessage("Details updated.");
      } catch (err) {
        setProfileSaveError(err.message || "Unable to save your details.");
      }
    });
  }

  const isProfileSubmitDisabled =
    !profileForm.firstName.trim() ||
    isSavingProfile;

  if (loading) {
    return (
      <main className="p-10">
        <div className="animate-pulse rounded-xl border border-white/10 bg-white/5 p-6 text-sm">
          Loading…
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {/* Tab Navigation */}
      <div className="mb-10 flex flex-wrap items-center gap-4">
        <AccountTabs tabs={TABS} active={activeTab} onChange={(key) => setActiveTab(key)} />
        {isAdmin && (
          <>
            <Link
              href="/consultants/review"
              className="ml-2 rounded-full border border-amber-400/40 bg-amber-500/15 px-5 py-2 text-sm font-semibold text-amber-100 shadow-sm hover:bg-amber-500/25"
            >
              Admin Centre
            </Link>
            <Link
              href="/admin/social"
              className="rounded-full border border-cyan-400/35 bg-cyan-500/15 px-5 py-2 text-sm font-semibold text-cyan-100 shadow-sm hover:bg-cyan-500/25"
            >
              Social Studio
            </Link>
          </>
        )}
        <div className="ml-auto">
          <button
            onClick={signOut}
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 ring-1 ring-white/10 transition hover:from-sky-400 hover:via-cyan-400 hover:to-blue-500 hover:shadow-sky-500/30 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
          >
            <svg
              className="h-4 w-4 opacity-90 transition group-hover:opacity-100"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H9m9 0-3-3m3 3-3 3" />
            </svg>
            Sign out
          </button>
        </div>
      </div>

      {/* Account tab: modern profile card + editable details */}
      {activeTab === "account" && (
        <section className="mb-12 space-y-6">
          <header className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-lg font-semibold text-white ring-2 ring-slate-900/80 shadow-lg shadow-sky-500/20">
                {(profileForm.firstName || profileForm.lastName || userEmail)
                  .split(" ")
                  .filter(Boolean)
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "•"}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
                  Account settings
                </h1>
                <p className="mt-0.5 text-xs sm:text-sm text-slate-300">
                  Signed in as{" "}
                  <strong className="text-slate-100 break-all">{userEmail}</strong>
                </p>
              </div>
            </div>
          </header>

          <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)] items-start">
            {/* Editable profile form */}
            <form
              onSubmit={handleProfileSave}
              className="space-y-5 rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-lg shadow-black/20 ring-1 ring-white/10"
            >
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-300">
                Profile details
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300">
                    First name <span className="text-rose-300">*</span>
                  </label>
                  <input
                    type="text"
                    value={profileForm.firstName}
                    onChange={(e) => updateProfileField("firstName", e.target.value)}
                    maxLength={60}
                    required
                    className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                    placeholder="Jane"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">
                    Last name <span className="text-slate-500">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={profileForm.lastName}
                    onChange={(e) => updateProfileField("lastName", e.target.value)}
                    maxLength={60}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                    placeholder="Smith"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Organisation name <span className="text-slate-500">(optional)</span>
                </label>
                <input
                  type="text"
                  value={profileForm.organisationName}
                  onChange={(e) =>
                    updateProfileField("organisationName", e.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
                  placeholder="YouMine Pty Ltd"
                />
              </div>

              {profileSaveError && (
                <p className="text-sm text-rose-300">{profileSaveError}</p>
              )}
              {profileSaveMessage && (
                <p className="text-sm text-emerald-300">{profileSaveMessage}</p>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={isProfileSubmitDisabled}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-sky-500/30 transition disabled:opacity-60"
                >
                  {isSavingProfile ? "Saving…" : "Save changes"}
                </button>
                <p className="text-xs text-slate-400">
                  These are private account details. Public profile details are managed separately.
                </p>
              </div>
            </form>

            {/* Compact read-only summary card */}
            <aside className="space-y-4">
              <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/80 via-slate-900/80 to-slate-950/90 p-5 shadow-lg shadow-black/30">
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Snapshot
                </h2>
                <dl className="mt-2 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-400">Name</dt>
                    <dd className="text-right text-slate-100">
                      {profileForm.firstName || profileForm.lastName
                        ? `${profileForm.firstName} ${profileForm.lastName}`.trim()
                        : "Not set"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-400">Organisation</dt>
                    <dd className="text-right text-slate-100">
                      {profileForm.organisationName || "Not set"}
                    </dd>
                  </div>
                </dl>
              </section>

            </aside>
          </div>
        </section>
      )}

      {activeTab === "profiles" && (
        <section className="mb-12 space-y-6">
          <header className="relative overflow-hidden rounded-3xl border border-sky-300/20 bg-[linear-gradient(118deg,rgba(14,116,144,0.26),rgba(15,23,42,0.82)_48%,rgba(30,41,59,0.68))] px-6 py-7 shadow-[0_24px_60px_-38px_rgba(56,189,248,0.7)] ring-1 ring-white/10 sm:px-8">
            <div className="pointer-events-none absolute -right-14 -top-20 h-52 w-52 rounded-full border border-sky-200/15 bg-sky-300/10 blur-2xl" />
            <div className="relative max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-200">Public profile</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Your public presence</h1>
              <p className="mt-3 text-sm leading-6 text-slate-200 sm:text-base">This is the profile people see when they discover your consultancy or creator work on YouMine.</p>
            </div>
          </header>
          {profileError ? (
            <p className="text-sm text-red-400">{profileError}</p>
          ) : ownedProfiles.length === 0 ? (
            <section className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-10 text-center shadow-[0_22px_48px_-38px_rgba(0,0,0,0.85)]">
              <p className="text-sm font-medium text-slate-100">No public profile yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-300">Create a consultancy or creator profile to give people a clear way to find and connect with you.</p>
            </section>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {ownedProfiles.map((item) => (
                <li
                  key={item.id}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.09),rgba(255,255,255,0.025))] p-5 shadow-[0_20px_42px_-34px_rgba(0,0,0,0.95)] transition duration-200 hover:-translate-y-1 hover:border-sky-300/45 hover:shadow-[0_24px_50px_-30px_rgba(14,165,233,0.5)]"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-200/60 to-transparent" />
                  <div className="text-slate-100">
                    <div className="flex items-start justify-between gap-3">
                      <strong className="text-lg font-semibold tracking-tight text-white">{item.name}</strong>
                      <span className="inline-flex shrink-0 rounded-full border border-sky-200/20 bg-sky-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-sky-100">
                      {item.profileType === "both"
                        ? "Both"
                        : item.profileType === "creator"
                          ? "Creator"
                          : "Consultancy"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-300">{item.profileType === "both" ? "Consultancy and creator profile" : `${item.profileType === "creator" ? "Creator" : "Consultancy"} public profile`}</p>
                    <div className="mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-4">
                      <Link
                        href={`/consultants/${item.id}`}
                        className="inline-flex items-center justify-center rounded-full border border-sky-200/30 bg-sky-400/10 px-3.5 py-2 text-xs font-semibold text-sky-100 transition hover:border-sky-100/60 hover:bg-sky-400 hover:text-slate-950"
                      >
                        View profile
                      </Link>
                      {item.isOwner ? (
                        <Link
                          href={`/consultants/${item.id}/edit`}
                          className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-2 text-xs font-semibold text-white transition hover:border-white/30 hover:bg-white/[0.12]"
                        >
                          Edit profile
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {activeTab === "notifications" && (
        <section className="mb-12 space-y-6">
          <NotificationsPreferences userId={userId} />
        </section>
      )}
    </main>
  );
}