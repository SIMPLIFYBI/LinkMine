import "@/app/intelligence/tokens.css";
import { yiFontClasses } from "@/app/intelligence/fonts";
import IntelligenceNav from "@/app/intelligence/IntelligenceNav.client";

// Admin-only intelligence tooling (the social post kits). The reader-facing pages live under /intelligence.
export default function IntelligenceAdminLayout({ children }) {
  return (
    <div className={`yi ${yiFontClasses}`}>
      <IntelligenceNav admin />
      {children}
    </div>
  );
}
