"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean);

export default function AccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [consultants, setConsultants] = useState([]);
  const [profileError, setProfileError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAppAdmin, setIsAppAdmin] = useState(false);

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

      const [{ data: adminRow }, { data: consultantRows, error }] =
        await Promise.all([
          supabase
            .from("app_admins")
            .select("user_id")
            .eq("user_id", userId)
            .maybeSingle(),
          supabase
            .from("consultants")
            .select("id, display_name, claimed_by") // removed owner,user_id
            .eq("claimed_by", userId)               // filter by claimant
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
    router.push("/login"); // Change from "/signup" to "/login"
  };

  const userEmail = session?.user?.email ?? "Unknown";
  const ownedConsultants = useMemo(() => {
    if (!session?.user?.id) return [];
    const userId = session.user.id;
    return consultants.map((row) => ({
      id: row.id,
      name: row.display_name,
      isOwner: row.claimed_by === userId, // ownership via claimed_by
    }));
  }, [consultants, session?.user?.id]);

  if (loading) {
    return (
      <main style={{ padding: 36 }}>
        Loading…
      </main>
    );
  }

  return (
    <main style={{ padding: 36, display: "grid", gap: 24 }}>
      <nav style={{ display: "flex", gap: 12 }}>
        <span
          style={{
            padding: "10px 18px",
            borderRadius: 999,
            background:
              "linear-gradient(120deg, rgba(56,189,248,0.25), rgba(129,140,248,0.25))",
            color: "#fff",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Account details
        </span>
        {isAdmin ? (
          <Link
            href="/consultants/review"
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#cbd5f5",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            Review accounts
          </Link>
        ) : null}
      </nav>

      <section>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Account</h1>
        <p style={{ marginBottom: 16 }}>
          Signed in as <strong>{userEmail}</strong>
        </p>
        <button
          onClick={signOut}
          className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 ring-1 ring-white/10 transition hover:from-sky-400 hover:via-cyan-400 hover:to-blue-500 hover:shadow-sky-500/30 focus:outline-none focus:ring-2 focus:ring-sky-400/60 disabled:opacity-60"
        >
          <svg
            className="h-4 w-4 opacity-90 transition group-hover:opacity-100"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H9m9 0-3-3m3 3-3 3" />
          </svg>
          Sign out
        </button>
      </section>

      <section>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Consultant ownership</h2>
        {profileError ? (
          <p style={{ color: "#e64545" }}>{profileError}</p>
        ) : ownedConsultants.length === 0 ? (
          <p>You don’t own or manage any consultant pages yet.</p>
        ) : (
          <ul
            style={{
              display: "grid",
              gap: 12,
              listStyle: "none",
              padding: 0,
            }}
          >
            {ownedConsultants.map((item) => (
              <li
                key={item.id}
                style={{
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <Link
                  href={`/consultants/${item.id}`}
                  style={{
                    display: "block",
                    padding: 16,
                    color: "inherit",
                    textDecoration: "none",
                  }}
                  aria-label={`Open consultant profile: ${item.name}`}
                >
                  <strong>{item.name}</strong>
                  <div
                    style={{
                      fontSize: 13,
                      marginTop: 4,
                      color: "#555",
                    }}
                  >
                    {item.isOwner ? "Owner (claimed by you)" : "—"}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!isAdmin && (
        <pre
          style={{
            padding: 16,
            borderRadius: 12,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.12)",
            fontSize: 12,
            overflow: "auto",
          }}
        >
          {JSON.stringify(
            {
              email: userEmail,
              userId: session?.user?.id ?? null,
              adminEmails,
              isAppAdmin,
            },
            null,
            2
          )}
        </pre>
      )}
    </main>
  );
}