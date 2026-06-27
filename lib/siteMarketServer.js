import { cookies } from "next/headers";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { normaliseSiteMarket, SITE_MARKET_COOKIE } from "@/lib/siteMarket";

export async function getResolvedSiteMarket(explicitMarket) {
  const explicit = typeof explicitMarket === "string" && explicitMarket.trim() ? explicitMarket : null;
  if (explicit) {
    return {
      market: normaliseSiteMarket(explicit),
      user: null,
      isAdmin: false,
    };
  }

  const cookieStore = await cookies();
  const cookieMarket = normaliseSiteMarket(cookieStore.get(SITE_MARKET_COOKIE)?.value);

  try {
    const authClient = await supabaseServerClient();
    const { data: auth } = await authClient.auth.getUser();
    const user = auth?.user || null;

    if (!user) {
      return {
        market: cookieMarket,
        user: null,
        isAdmin: false,
      };
    }

    const [{ data: adminRow }, email] = await Promise.all([
      authClient.from("app_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
      Promise.resolve(user.email?.toLowerCase() || ""),
    ]);

    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    const isAdmin = Boolean(adminRow) || (email && adminEmails.includes(email));

    return {
      market: cookieMarket,
      user,
      isAdmin,
    };
  } catch {
    return {
      market: cookieMarket,
      user: null,
      isAdmin: false,
    };
  }
}