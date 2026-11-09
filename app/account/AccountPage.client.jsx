"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
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
];

export default function AccountPageClient({ initialTab = "account" }) {
  const router = useRouter();
  const sbRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [consultants, setConsultants] = useState([]);
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
        console.error("Error loading public profiles:", consultantError.message);
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

  const hasPublicProfile = ownedProfiles.length > 0;
  const primaryPublicProfile = ownedProfiles.find((profile) => profile.isOwner) || ownedProfiles[0];

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
        toast.success("Account details updated.");
      } catch (err) {
        const message = err.message || "Unable to save your details.";
        setProfileSaveError(message);
        toast.error(message);
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

      <section className="relative mb-10 overflow-hidden rounded-3xl border border-cyan-200/30 bg-[linear-gradient(135deg,rgba(8,145,178,0.28),rgba(15,23,42,0.92)_58%,rgba(30,41,59,0.92))] px-5 py-6 shadow-[0_22px_48px_-32px_rgba(34,211,238,0.72)] ring-1 ring-cyan-100/10 sm:px-7">
        <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full border border-cyan-100/20 bg-cyan-300/10 blur-xl" aria-hidden="true" />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-100">{hasPublicProfile ? "Your public presence" : "Share your work"}</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">{hasPublicProfile ? "Keep your public profile current" : "Create a public profile"}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-200">{hasPublicProfile ? "Update the profile clients use to discover your services, resources, training, or events on YouMine." : "Help clients discover your services, resources, training, or events on YouMine."}</p>
          </div>
          <Link
            href={hasPublicProfile ? `/consultants/${primaryPublicProfile.id}/edit` : "/consultants/new?source=account"}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-cyan-100/45 bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_14px_28px_-18px_rgba(103,232,249,0.95)] transition hover:-translate-y-0.5 hover:border-white hover:bg-cyan-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
          >
            {hasPublicProfile ? "Edit public profile" : "Create a public profile"}
            <span className="text-base leading-none" aria-hidden="true">&#8594;</span>
          </Link>
        </div>
      </section>

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

      {activeTab === "notifications" && (
        <section className="mb-12 space-y-6">
          <NotificationsPreferences userId={userId} />
        </section>
      )}
    </main>
  );
}