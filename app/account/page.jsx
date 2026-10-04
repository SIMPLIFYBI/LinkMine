import AccountPageClient from "./AccountPage.client.jsx";
import MyActivityPage from "@/app/activity/page";

export const dynamic = "force-dynamic";

const ALLOWED_TABS = new Set(["account", "notifications", "profiles"]);

export default async function Page({ searchParams }) {
  const params = await searchParams;
  const rawTab = params?.tab;
  const tab = rawTab === "consultants" || rawTab === "creators" ? "profiles" : rawTab;
  const activityTab = params?.activityTab;

  if (rawTab === "activity") {
    return <MyActivityPage searchParams={{ tab: activityTab }} embedded />;
  }

  const initialTab =
    tab && ALLOWED_TABS.has(tab.toLowerCase())
      ? tab.toLowerCase()
      : "account";
  return <AccountPageClient initialTab={initialTab} />;
}