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
            .select("id, display_name, owner, user_id, claimed_by")
            .or(`owner.eq.${userId},user_id.eq.${userId},claimed_by.eq.${userId}`)
            .order("display_name"),
        ]);

      if (!mounted) return;

      setIsAppAdmin(Boolean(adminRow?.user_id));
      setIsAdmin(
        Boolean(adminRow) || (email && adminEmails.includes(email))
      );

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
      isOwner: row.owner === userId,
      isAssigned: row.user_id === userId,
      isClaimed: row.claimed_by === userId,
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
          style={{
            marginTop: 8,
            padding: "10px 14px",
            borderRadius: 6,
            border: "1px solid #ddd",
            background: "white",
            cursor: "pointer",
          }}
        >
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
                  padding: 16,
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <strong>{item.name}</strong>
                <div
                  style={{
                    fontSize: 13,
                    marginTop: 4,
                    color: "#555",
                  }}
                >
                  {item.isOwner
                    ? "Owner"
                    : item.isAssigned
                    ? "Assigned manager"
                    : "Claimed profile"}
                </div>
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