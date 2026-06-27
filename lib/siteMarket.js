export const SITE_MARKET_COOKIE = "youmine-market";

export function normaliseSiteMarket(value) {
  if (value === "oil-gas" || value === "oil_gas") return "oil_gas";
  if (value === "both" || value === "all") return "both";
  return "mining";
}

export function siteMarketToUrlValue(value) {
  const market = normaliseSiteMarket(value);
  if (market === "oil_gas") return "oil-gas";
  if (market === "both") return "both";
  return "mining";
}

export function siteMarketLabel(value) {
  const market = normaliseSiteMarket(value);
  if (market === "oil_gas") return "Oil & Gas";
  if (market === "both") return "Both";
  return "Mining";
}

export function readSiteMarketCookieValue(cookieValue) {
  return normaliseSiteMarket(cookieValue);
}