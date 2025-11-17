"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NotificationsPreferences from "./NotificationsPreferences.client.jsx";
import AccountTabs from "./AccountTabs.jsx";

const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean);

const TABS = [
  { key: "account", label: "Account" },
  { key: "notifications", label: "Notifications" },
  { key: "consultants", label: "Consultants" },
];

export default function AccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [consultants, setConsultants] = useState([]);
  const [profileError, setProfileError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAppAdmin, setIsAppAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("account");

  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data } = await supabase.auth.getSession();
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

      const [{ data: adminRow }, { data: consultantRows, error }] = await Promise.all([
        supabase.from("app_admins").select("user_id").eq("user_id", userId).maybeSingle(),
        supabase
          .from("consultants")
          .select("id, display_name, claimed_by")
          .eq("claimed_by", userId)
          .order("display_name"),
      ]);

      if (!mounted) return;

      setIsAppAdmin(Boolean(adminRow?.user_id));
      setIsAdmin(Boolean(adminRow) || (email && adminEmails.includes(email)));

      if (error) {
        setProfileError(error.message);
        setConsultants([]);
      } else {
        setConsultants(consultantRows ?? []);
      }
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
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
    await supabase.auth.signOut();
    router.push("/login");
  };

  const userEmail = session?.user?.email ?? "Unknown";
  const userId = session?.user?.id ?? null;

  const ownedConsultants = useMemo(() => {
    if (!userId) return [];
    return consultants.map((row) => ({
      id: row.id,
      name: row.display_name,
      isOwner: row.claimed_by === userId,
    }));
  }, [consultants, userId]);

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
        <AccountTabs
          tabs={TABS}
          active={activeTab}
          onChange={(key) => setActiveTab(key)}
        />
        {isAdmin && (
          <Link
            href="/consultants/review"
            className="ml-2 rounded-full border border-amber-400/40 bg-amber-500/15 px-5 py-2 text-sm font-semibold text-amber-100 shadow-sm hover:bg-amber-500/25"
          >
            Review accounts
          </Link>
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

      {/* Panels */}
      {activeTab === "account" && (
        <section className="mb-12 space-y-6">
          <header>
            <h1 className="text-3xl font-semibold tracking-tight">Account</h1>
            <p className="mt-1 text-sm text-slate-300">
              Signed in as <strong className="text-slate-100">{userEmail}</strong>
            </p>
          </header>

          {!isAdmin && (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <pre className="m-0 max-h-64 overflow-auto p-4 text-xs text-slate-300">
                {JSON.stringify(
                  {
                    email: userEmail,
                    userId: userId,
                    adminEmails,
                    isAppAdmin,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </section>
      )}

      {activeTab === "consultants" && (
        <section className="mb-12 space-y-6">
          <header>
            <h2 className="text-2xl font-semibold tracking-tight">Consultant Ownership</h2>
            <p className="mt-1 text-sm text-slate-300">
              Pages you’ve claimed or manage.
            </p>
          </header>
          {profileError ? (
            <p className="text-sm text-red-400">{profileError}</p>
          ) : ownedConsultants.length === 0 ? (
            <p className="text-sm text-slate-300">
              You don’t own or manage any consultant pages yet.
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {ownedConsultants.map((item) => (
                <li
                  key={item.id}
                  className="group rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-sky-400/50 hover:bg-sky-500/10"
                >
                  <Link
                    href={`/consultants/${item.id}`}
                    className="block text-slate-100 no-underline"
                    aria-label={`Open consultant profile: ${item.name}`}
                  >
                    <strong className="font-semibold">{item.name}</strong>
                    <div className="mt-1 text-xs text-slate-400">
                      {item.isOwner ? "Owner (claimed by you)" : "—"}
                    </div>
                  </Link>
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