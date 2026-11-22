import "@/app/intelligence/tokens.css";
import { yiFontClasses } from "@/app/intelligence/fonts";
import IntelligenceNav from "@/app/intelligence/IntelligenceNav.client";

export default function IntelligenceAdminLayout({ children }) {
  return (
    <div className={`yi ${yiFontClasses}`}>
      <IntelligenceNav />
      {children}
    </div>
  );
}
