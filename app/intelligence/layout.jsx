import "@/app/intelligence/tokens.css";
import { yiFontClasses } from "@/app/intelligence/fonts";
import IntelligenceNav from "@/app/intelligence/IntelligenceNav.client";

export default function IntelligenceLayout({ children }) {
  return (
    <div className={`yi ${yiFontClasses}`}>
      <IntelligenceNav />
      {children}
    </div>
  );
}
