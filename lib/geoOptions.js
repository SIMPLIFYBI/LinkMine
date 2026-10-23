export const GLOBAL_REGION_OPTIONS = [
  { value: "oceania", label: "Oceania" },
  { value: "north_america", label: "North America" },
  { value: "south_america", label: "South America" },
  { value: "asia", label: "Asia" },
  { value: "europe", label: "Europe" },
  { value: "africa", label: "Africa" },
  { value: "middle_east", label: "Middle East" },
  { value: "global", label: "Global" },
];

export const COUNTRY_OPTIONS = [
  { value: "AU", label: "Australia" },
  { value: "NZ", label: "New Zealand" },
  { value: "PG", label: "Papua New Guinea" },
  { value: "FJ", label: "Fiji" },
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "MX", label: "Mexico" },
  { value: "BR", label: "Brazil" },
  { value: "AR", label: "Argentina" },
  { value: "CL", label: "Chile" },
  { value: "CO", label: "Colombia" },
  { value: "PE", label: "Peru" },
  { value: "GB", label: "United Kingdom" },
  { value: "IE", label: "Ireland" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "ES", label: "Spain" },
  { value: "PT", label: "Portugal" },
  { value: "IT", label: "Italy" },
  { value: "NL", label: "Netherlands" },
  { value: "BE", label: "Belgium" },
  { value: "LU", label: "Luxembourg" },
  { value: "CH", label: "Switzerland" },
  { value: "AT", label: "Austria" },
  { value: "SE", label: "Sweden" },
  { value: "NO", label: "Norway" },
  { value: "FI", label: "Finland" },
  { value: "DK", label: "Denmark" },
  { value: "PL", label: "Poland" },
  { value: "CZ", label: "Czechia" },
  { value: "RO", label: "Romania" },
  { value: "GR", label: "Greece" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "SA", label: "Saudi Arabia" },
  { value: "QA", label: "Qatar" },
  { value: "KW", label: "Kuwait" },
  { value: "BH", label: "Bahrain" },
  { value: "OM", label: "Oman" },
  { value: "IL", label: "Israel" },
  { value: "JO", label: "Jordan" },
  { value: "LB", label: "Lebanon" },
  { value: "ZA", label: "South Africa" },
  { value: "GH", label: "Ghana" },
  { value: "BW", label: "Botswana" },
  { value: "NA", label: "Namibia" },
  { value: "ZM", label: "Zambia" },
  { value: "CD", label: "Democratic Republic of the Congo" },
  { value: "EG", label: "Egypt" },
  { value: "MA", label: "Morocco" },
  { value: "TN", label: "Tunisia" },
  { value: "CN", label: "China" },
  { value: "JP", label: "Japan" },
  { value: "KR", label: "South Korea" },
  { value: "IN", label: "India" },
  { value: "SG", label: "Singapore" },
  { value: "MY", label: "Malaysia" },
  { value: "ID", label: "Indonesia" },
  { value: "TH", label: "Thailand" },
  { value: "VN", label: "Vietnam" },
  { value: "PH", label: "Philippines" },
];

const COUNTRY_GLOBAL_REGIONS = {
  oceania: ["AU", "NZ", "PG", "FJ"],
  north_america: ["US", "CA", "MX"],
  south_america: ["BR", "AR", "CL", "CO", "PE"],
  europe: ["GB", "IE", "DE", "FR", "ES", "PT", "IT", "NL", "BE", "LU", "CH", "AT", "SE", "NO", "FI", "DK", "PL", "CZ", "RO", "GR"],
  middle_east: ["AE", "SA", "QA", "KW", "BH", "OM", "IL", "JO", "LB"],
  africa: ["ZA", "GH", "BW", "NA", "ZM", "CD", "EG", "MA", "TN"],
  asia: ["CN", "JP", "KR", "IN", "SG", "MY", "ID", "TH", "VN", "PH"],
};

export function getGlobalRegionForCountry(countryCode) {
  const code = String(countryCode || "").trim().toUpperCase();
  return Object.entries(COUNTRY_GLOBAL_REGIONS).find(([, countries]) => countries.includes(code))?.[0] || "";
}

export function isValidCountryCode(value) {
  if (!value) return true;
  return COUNTRY_OPTIONS.some((option) => option.value === value);
}

export function isValidGlobalRegion(value) {
  if (!value) return true;
  return GLOBAL_REGION_OPTIONS.some((option) => option.value === value);
}