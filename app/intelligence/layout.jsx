import "@/app/intelligence/tokens.css";
import { yiFontClasses } from "@/app/intelligence/fonts";
import IntelligenceNav from "@/app/intelligence/IntelligenceNav.client";

// Public, reachable by URL. Not linked from the site navigation yet, and kept out of search results
// (each page sets robots noindex) until the reports are cleared for publication.
export default function IntelligenceLayout({ children }) {
  return (
    <div className={`yi ${yiFontClasses}`}>
      <IntelligenceNav />
      {children}
    </div>
  );
}
