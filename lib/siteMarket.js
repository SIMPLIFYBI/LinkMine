export const SITE_MARKET_COOKIE = "youmine-market";

export function normaliseSiteMarket(value) {
  return value === "oil-gas" || value === "oil_gas" ? "oil_gas" : "mining";
}

export function siteMarketToUrlValue(value) {
  return normaliseSiteMarket(value) === "oil_gas" ? "oil-gas" : "mining";
}

export function siteMarketLabel(value) {
  return normaliseSiteMarket(value) === "oil_gas" ? "Oil & Gas" : "Mining";
}

export function readSiteMarketCookieValue(cookieValue) {
  return normaliseSiteMarket(cookieValue);
}