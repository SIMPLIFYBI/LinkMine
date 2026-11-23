// The named author of YouMine Intelligence reports. Report pages, slides and social kits all read from here,
// so a change to the byline, bio or disclosure is made once.
export const AUTHOR = {
  name: "James Blue",
  // Short line under the byline. Matches the LinkedIn headline.
  credential: "Co-founder of YouMine · 15 years in the resources industry",
  // First person, so the bio reads in the same voice as the posts that send readers here.
  bio: "I build practical digital tools for mining operations and co-founded YouMine. I have spent 15 years in the resources industry.",
  // Stated on every report page: a reader arriving from a share or an embed never sees the social bios.
  disclosure: "I co-founded YouMine, which publishes this analysis. I hold no positions in the companies or commodities discussed.",
  linkedin: "https://www.linkedin.com/in/james-blue-bi/",
  x: "https://x.com/bluedatamine",
  xHandle: "@bluedatamine",
  // Report pages use a looser crop (more shoulders) than the slides.
  avatar: "/intelligence/james-blue-report-192.jpg",
  photo: "/intelligence/james-blue-512.jpg",
  // Read from disk by the slide renderer; must stay in outputFileTracingIncludes.
  avatarFile: "public/intelligence/james-blue-192.jpg",
};

export function formatReportDate(iso) {
  if (!iso) return null;
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
