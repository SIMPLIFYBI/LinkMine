// Social post kits for YouMine Intelligence reports. Every number is copied from the report the kit names;
// recheck a kit whenever its report changes.
// Voice: posted from James Blue's own LinkedIn and X accounts, so the copy is first person ("I"), never "we".
// The YouMine company page reshares rather than posting its own copy.

// Report pages are served publicly at /intelligence/<slug> (noindex while the reports are drafts).
export const PUBLIC_BASE = "https://youmine.io/intelligence";

export const LINKEDIN_LIMIT = 3000;
export const X_LIMIT = 280;
const X_LINK_LENGTH = 23;

export function reportUrl(slug, network) {
  return `${PUBLIC_BASE}/${slug}?utm_source=${network}&utm_medium=social&utm_campaign=${slug}`;
}

// X counts every link as 23 characters, however long it is.
export function xLength(text) {
  return Array.from(text.replace(/https?:\/\/\S+/g, "x".repeat(X_LINK_LENGTH))).length;
}

export function fillUrl(text, url) {
  return text.replaceAll("{url}", url);
}

export const KITS = {
  "bauxite-to-aluminium": {
    kicker: "From bauxite to aluminium",
    sourceLine: "Source: USGS Mineral Commodity Summaries 2026. Shares of world production in 2024.",
    slides: [
      {
        type: "stat",
        accent: "lost",
        big: "33% vs 0.25%",
        label: "Guinea’s share of bauxite mining and alumina refining",
        sub: "So who makes the metal?",
        alt: "In 2024 Guinea mined 33% of the world’s bauxite and produced 0.25% of its alumina.",
      },
    ],
    linkedin:
      "Guinea mines a third of the world’s bauxite. It makes just 0.25% of the world’s alumina.\n\n" +
      "Bauxite is the rock. Alumina is the powder made from it. One more step gets you the metal. I followed the numbers through all three stages and found a different leader by the time you get to aluminium.\n\n" +
      "The full chart, with Guinea, Australia and China side by side, is on YouMine. Link in the comments.",
    linkedinComment: "See the three-stage comparison, production figures and sources: {url}",
    hashtags: "#mining #aluminium #commodities",
    x: "Guinea mined 33% of the world’s bauxite in 2024 and made 0.25% of its alumina. So who makes the metal? I charted all three stages on YouMine.",
    xReply: "From bauxite to aluminium: {url}",
  },

  "australia-qatar-gas": {
    kicker: "Australia and Qatar on gas",
    sourceLine: "Source: EIA International Energy Statistics. Dry natural gas production, annual averages.",
    slides: [
      {
        type: "stat",
        accent: "gain",
        big: "40% → 90%",
        label: "Australia’s gas production as a share of Qatar’s",
        sub: "2013–15 vs 2022–24. When did Australia close most of the gap?",
        alt: "Australia produced 40% as much dry natural gas as Qatar in 2013 to 2015 and 90% as much in 2022 to 2024.",
      },
    ],
    linkedin:
      "Australia went from producing 40% as much natural gas as Qatar to 90%, comparing 2013–15 with 2022–24.\n\n" +
      "I charted both countries back to 2000. The surprise was how close they were at the start, and how quickly Australia closed most of the gap after Qatar pulled away.\n\n" +
      "The chart and annual figures are on YouMine. Link in the comments.",
    linkedinComment: "See the full chart and annual dry gas production figures: {url}",
    hashtags: "#naturalgas #LNG #energy",
    x: "Australia went from producing 40% as much dry natural gas as Qatar in 2013–15 to 90% in 2022–24. The annual chart shows how quickly the gap closed.",
    xReply: "See the chart and annual figures on YouMine: {url}",
  },

  "the-handover": {
    kicker: "The Handover",
    sourceLine: "Source: BGS World Mineral Statistics; USGS. Shares of countries reporting to BGS.",
    slides: [
      {
        type: "stat",
        accent: "lost",
        big: "85% \u2192 38%",
        label: "China's share of world antimony mining",
        sub: "Average of 2002\u201304 against average of 2022\u201324.",
        alt: "Large text reading 85 percent to 38 percent. China's share of reported world antimony mine output fell from 85 percent in 2002 to 2004 to 38 percent in 2022 to 2024.",
      },
      {
        type: "bars",
        title: "Five minerals changed hands",
        fromLabel: "2002\u201304",
        toLabel: "2022\u201324",
        max: 100,
        rows: [
          { label: "Antimony", detail: "China", from: 85, to: 38 },
          { label: "Nickel", detail: "Indonesia", from: 10, to: 55 },
          { label: "Cobalt", detail: "DR Congo", from: 34, to: 72 },
          { label: "Uranium", detail: "Kazakhstan", from: 9, to: 39 },
          { label: "Phosphate rock", detail: "China", from: 18, to: 44 },
        ],
        alt: "Bar chart of one country's share of world mine output, 2002 to 2004 against 2022 to 2024. Antimony, China: 85 to 38 percent. Nickel, Indonesia: 10 to 55. Cobalt, DR Congo: 34 to 72. Uranium, Kazakhstan: 9 to 39. Phosphate rock, China: 18 to 44.",
      },
      {
        type: "points",
        title: "How solid is this?",
        points: [
          { head: "Tested with other years", text: "The same five countries come out as the biggest movers whichever years I compare." },
          { head: "Cross-checked", text: "The US Geological Survey puts the same country first in antimony, nickel, cobalt and phosphate rock." },
          { head: "The honest limit", text: "BGS publishes no world total, so these are shares of the countries that report to it." },
        ],
        alt: "Three notes on reliability. Tested with other years: the same five countries come out as the biggest movers whichever years are compared. Cross-checked: the US Geological Survey puts the same country first in four of the minerals. The honest limit: BGS publishes no world total, so these are shares of the countries that report to it.",
      },
    ],
    linkedin:
      "In 2002\u201304 China mined 85% of the world's reported antimony. By 2022\u201324 it mined 38%.\n\n" +
      "I compared who mines what, twenty years apart, across 20 minerals. In five of them, one country gained or lost between a quarter and half of world output:\n\n" +
      "\u2022 Antimony: China 85% \u2192 38%\n\u2022 Nickel: Indonesia 10% \u2192 55%\n\u2022 Cobalt: DR Congo 34% \u2192 72%\n\u2022 Uranium: Kazakhstan 9% \u2192 39%\n\u2022 Phosphate rock: China 18% \u2192 44%\n\n" +
      "Two cautions. The British Geological Survey publishes no world total, so these are shares of the countries that report to it. And the US Geological Survey agrees on who comes first, but not always by how much: it puts Indonesia's nickel share higher still.\n\n" +
      "My full analysis, with the method, sources and every country, is on YouMine: link in the comments.",
    linkedinComment: "Full analysis, with the method, sources and every country: {url}",
    hashtags: "#mining #criticalminerals #commodities #resources",
    x:
      "In 2002\u201304 China mined 85% of the world's reported antimony. In 2022\u201324: 38%.\n\n" +
      "Five minerals, 20 years: one country gained or lost a quarter to half of world output. Nickel: Indonesia 10% to 55%. Cobalt: DR Congo 34% to 72%. Uranium: Kazakhstan 9% to 39%.\n\n" +
      "Method and sources below.",
    xReply: "Full report with the method, sources and all 20 minerals: {url}\n\nShares are of countries reporting to the British Geological Survey, cross-checked against USGS.",
  },

  "mine-dependent-six": {
    kicker: "The Mine-Dependent Six",
    sourceLine: "Source: World Bank Open Data (CC BY 4.0); BGS World Mineral Statistics (gold).",
    slides: [
      {
        type: "stat",
        accent: "rent",
        big: "6",
        label: "countries pass both tests of mining dependence",
        sub: "Mongolia, DR Congo, Zambia, Papua New Guinea, Chile and Peru. Every period I checked.",
        alt: "Large number 6. Six countries pass both tests of mining dependence: Mongolia, DR Congo, Zambia, Papua New Guinea, Chile and Peru.",
      },
      {
        type: "bars",
        title: "Ores and metals, share of exports",
        fromLabel: "2015\u201319",
        toLabel: "2021\u201323",
        max: 100,
        accent: "trade",
        rows: [
          { label: "DR Congo", detail: "mining profits 8.4% of GDP", from: 62, to: 77 },
          { label: "Zambia", detail: "profits 8.1%", from: 76, to: 75 },
          { label: "Chile", detail: "profits 5.4%", from: 52, to: 55 },
          { label: "Peru", detail: "profits 5.0%", from: 43, to: 47 },
          { label: "Mongolia", detail: "profits 9.7%", from: 45, to: 36 },
          { label: "Papua New Guinea", detail: "profits 5.6%", from: 42, to: 29 },
        ],
        alt: "Bar chart of ores and metals as a share of exports, 2015 to 2019 against 2021 to 2023. DR Congo 62 to 77 percent, Zambia 76 to 75, Chile 52 to 55, Peru 43 to 47, Mongolia 45 to 36, Papua New Guinea 42 to 29. Mining profits average 5 to 10 percent of GDP in each.",
      },
      {
        type: "points",
        title: "What the export figures miss",
        points: [
          { head: "Gold doesn't count", text: "Mining profits in Mali and Burkina Faso are 6.8% and 5.3% of GDP, but gold is left out of the export figures." },
          { head: "Profits swing with prices", text: "DR Congo's ran from 2.5% to 28.8% of GDP across 2015\u201321. I use averages and ranges." },
          { head: "Two pass marks, no score", text: "Mining profits 3%+ of GDP and ores and metals 25%+ of exports, in every period." },
        ],
        alt: "Three notes. Gold doesn't count: mining profits in Mali and Burkina Faso are 6.8 and 5.3 percent of GDP, but gold is left out of the export figures. Profits swing with prices: DR Congo's ran from 2.5 to 28.8 percent of GDP. Two pass marks, no score: mining profits of 3 percent or more of GDP and ores and metals of 25 percent or more of exports.",
      },
    ],
    linkedin:
      "Which economies actually depend on mining?\n\n" +
      "I asked two simple questions of every country. Is mining a big share of what it sells to the world? And is mining a big share of its whole economy? Only six say yes to both, in every period I checked: Mongolia, DR Congo, Zambia, Papua New Guinea, Chile and Peru.\n\n" +
      "In those six, ores and metals are 29% to 77% of exports, and mining profits are at least 3% of GDP.\n\n" +
      "Two more, Mali and Burkina Faso, rely on mining just as heavily but miss the first test, because the World Bank's export figures leave out gold.\n\n" +
      "Mining profits swing with prices (DR Congo: 2.5% to 28.8% of GDP across 2015\u201321), so I use averages and ranges, not one year. The World Bank figures run to 2021 for profits and 2023 for exports.\n\n" +
      "My full analysis, with the rule, every near-miss and sources, is on YouMine: link in the comments.",
    linkedinComment: "Full analysis, with the rule, every near-miss and sources: {url}",
    hashtags: "#mining #resources #economics #developmenteconomics",
    x:
      "Which economies depend on mining? Two tests: is it a big share of exports, and of the whole economy? Six pass both: Mongolia, DR Congo, Zambia, Papua New Guinea, Chile, Peru.\n\n" +
      "Mali and Burkina Faso miss only because export figures leave out gold.\n\n" +
      "Sources below.",
    xReply: "Full report with the tests, every near-miss and sources: {url}\n\nData: World Bank Open Data (CC BY 4.0). Mining profits to 2021, exports to 2023.",
  },

  "peak-was-yesterday": {
    kicker: "Peak Was Yesterday",
    sourceLine: "Source: BGS World Mineral Statistics, 1970\u20132024. Three-year averages; \u201Cnow\u201D is 2022\u201324.",
    slides: [
      {
        type: "stat",
        accent: "lost",
        big: "15%",
        label: "of its 1971 peak: world mercury mining today",
        sub: "One of nine minerals whose world production has already peaked.",
        alt: "Large text reading 15 percent. World mercury production in 2022 to 2024 is 15 percent of its 1971 peak.",
      },
      {
        type: "bars",
        title: "World production now, against its own peak",
        fromLabel: "At peak",
        toLabel: "2022\u201324",
        max: 100,
        accent: "lost",
        rows: [
          { label: "Mercury", detail: "peak 1971", from: 100, to: 15 },
          { label: "Asbestos", detail: "peak 1978", from: 100, to: 26 },
          { label: "Sillimanite", detail: "peak 1989", from: 100, to: 53 },
          { label: "Antimony", detail: "peak 2013", from: 100, to: 60 },
          { label: "Diamond", detail: "peak 2006", from: 100, to: 66 },
        ],
        alt: "Bar chart of world production in 2022 to 2024 as a percentage of each mineral's peak, set to 100. Mercury 15, asbestos 26, sillimanite minerals 53, antimony 60, diamond 66.",
      },
      {
        type: "points",
        title: "How I kept it honest",
        points: [
          { head: "Three-year averages", text: "A single big year is usually a reporting quirk, so every figure is a three-year average." },
          { head: "Four dropped on purpose", text: "Cement, rare earths, mica and aggregates were left out: the data couldn't support a trend." },
          { head: "Not running out", text: "Past peak doesn't mean running out. Antimony, on US and EU critical lists, is at 60% of 2013." },
        ],
        alt: "Three notes. Three-year averages, because a single big year is usually a reporting quirk. Four minerals were left out because the data couldn't support a trend. Past peak doesn't mean running out.",
      },
    ],
    linkedin:
      "Copper, iron ore, gold, bauxite and lithium are at or near record output. Nine minerals peaked years ago.\n\n" +
      "Using 55 years of British Geological Survey data (1970\u20132024), I compared each mineral's world production today with its best year:\n\n" +
      "\u2022 Mercury: 15% of its 1971 peak\n\u2022 Asbestos: 26% of 1978\n\u2022 Sillimanite minerals: 53% of 1989\n\u2022 Antimony: 60% of 2013, and on the US and EU critical minerals lists\n\u2022 Diamond: 66% of 2006\n\n" +
      "Every figure is a three-year average, because a single big year is usually a reporting quirk. I left out four candidates (cement, rare earths, mica and aggregates) because the data couldn't support a trend.\n\n" +
      "Past peak doesn't mean running out. This is about production, not reserves.\n\n" +
      "My full analysis, with the method and sources, is on YouMine: link in the comments.",
    linkedinComment: "Full analysis, with the method and sources: {url}",
    hashtags: "#mining #criticalminerals #commodities #data",
    x:
      "Copper, iron ore and gold are at or near record output. But nine minerals have already peaked.\n\n" +
      "Mercury: 15% of its 1971 peak. Asbestos: 26% of 1978. Antimony (US and EU critical): 60% of 2013. Diamond: 66% of 2006.\n\n" +
      "55 years of BGS data, 3-year averages. Details below.",
    xReply: "Full report with the method, the nine minerals and what I excluded: {url}\n\nPast peak is not the same as running out.",
  },

  "reserve-report": {
    kicker: "Reserve Rich, Production Poor",
    sourceLine: "Source: USGS Mineral Commodity Summaries 2026; coal from U.S. EIA. 29 minerals ranked.",
    slides: [
      {
        type: "stat",
        accent: "lost",
        big: "9 vs 1",
        label: "minerals where Australia has top-two reserves, against those it also leads in mining",
        sub: "The one is lithium. 29 minerals ranked across 98 countries.",
        alt: "Large text reading 9 versus 1. Australia has the world's biggest or second-biggest reserves of nine minerals, but leads the world in mining only one of them, lithium.",
      },
      {
        type: "stat",
        accent: "lost",
        big: "2nd → 8th",
        label: "Australia's copper rank: reserves, then mining",
        sub: "Nickel is the same: 2nd for reserves, 8th of 9 for mining.",
        alt: "Large text reading 2nd to 8th. Australia is 2nd in the world for copper reserves but 8th for copper mining. Nickel is the same: 2nd for reserves, 8th of 9 for mining.",
      },
      {
        type: "points",
        title: "How to read it",
        points: [
          { head: "Not a countdown", text: "Years of reserves is reserves divided by a year of mining. Reserves grow as exploration finds more." },
          { head: "Six not ranked", text: "Iron ore, bauxite and four others don't line up across sources. Australia leads iron ore mining." },
          { head: "Nickel needs care", text: "556 years uses an estimated 2025 output under half of 2024's. JORC-compliant reserves alone: 244 years." },
        ],
        alt: "Three notes. Not a countdown: years of reserves is reserves divided by a year of mining, and reserves grow as exploration finds more. Six minerals, including iron ore, are not ranked because their figures don't line up across sources. Nickel needs care: its 556 years rests on an estimated 2025 output.",
      },
    ],
    linkedin:
      "Australia has the world's biggest or second-biggest reserves of nine minerals. It leads the world in mining just one of them: lithium.\n\n" +
      "I ranked 29 minerals across 98 countries using US Geological Survey data, comparing what each country holds in the ground with what it mines each year.\n\n" +
      "Where Australia holds far more than it digs:\n\n" +
      "• Copper: 2nd for reserves, 8th of 14 for mining\n• Nickel: 2nd for reserves, 8th of 9 for mining\n• Cobalt: 2nd for reserves, 5th of 12 for mining\n• Tungsten: 2nd for reserves, 5th of 8 for mining\n\n" +
      "Two cautions. Six minerals aren't ranked because their figures don't line up across sources, and Australia leads iron ore and zirconium mining among them, so this covers the 29 ranked minerals only. And the nickel figure rests on an estimated 2025 output that is less than half of 2024's.\n\n" +
      "The full ranking, where you can look up any country and mineral, is on YouMine: link in the comments.",
    linkedinComment: "Full ranking, any country, any mineral, with the method and sources: {url}",
    hashtags: "#mining #criticalminerals #Australia #resources",
    x:
      "Australia has the world's biggest or second-biggest reserves of 9 minerals. It leads the world in mining only one: lithium.\n\n" +
      "Copper: 2nd for reserves, 8th for mining. Nickel: 2nd and 8th. Cobalt: 2nd and 5th.\n\n" +
      "USGS data, 29 minerals. Details below.",
    xReply: "Full ranking, any country, any mineral: {url}\n\nSix minerals, including iron ore, aren't ranked because their figures don't line up across sources.",
  },

  "energy-flip": {
    kicker: "The Energy Flip",
    sourceLine: "Source: U.S. EIA International Energy Statistics, 1990\u20132025. 178 countries, oil and gas.",
    slides: [
      {
        type: "stat",
        accent: "lost",
        big: "1993",
        label: "the year China stopped covering its own oil demand",
        sub: "Every country, oil and gas, 1990\u20132025: every switch between producing enough and relying on imports, dated.",
        alt: "Large text reading 1993. China stopped covering its own oil demand in 1993.",
      },
      {
        type: "stat",
        accent: "lost",
        big: "26 vs 12",
        label: "times a country slipped into relying on imports, against times one climbed out",
        sub: "Oil and gas, 178 countries, 1990\u20132025. Only crossings that stuck are counted.",
        alt: "Large text reading 26 versus 12. Twenty-six times a country slipped into relying on oil or gas imports for good, and twelve times one climbed out.",
      },
      {
        type: "points",
        title: "Three crossings",
        points: [
          { head: "China, oil, 1993", text: "An exporter until then. It has not covered its own demand since." },
          { head: "United Kingdom", text: "A net importer of oil since 2006 and of gas since 2004." },
          { head: "United States", text: "Went the other way: self-sufficient in gas from 2017 and in oil from 2022." },
        ],
        alt: "Three crossings. China, oil, 1993. The United Kingdom, a net importer of oil since 2006 and gas since 2004. The United States, which went the other way: gas in 2017 and oil in 2022.",
      },
    ],
    linkedin:
      "China was an oil exporter until 1993.\n\n" +
      "I checked 178 countries, oil and gas, from 1990 to 2025, and dated every time one switched for good between producing enough for itself and relying on imports.\n\n" +
      "26 times a country slipped into relying on imports. 12 times one climbed out.\n\n" +
      "\u2022 China: stopped covering its own oil demand in 1993\n\u2022 United Kingdom: net importer of oil since 2006 and gas since 2004\n\u2022 United States: the reverse, with gas in 2017 and oil in 2022\n\n" +
      "My full analysis, with the method, sources and every crossing, is on YouMine: link in the comments.",
    linkedinComment: "Full analysis, with the method, sources and every crossing: {url}",
    hashtags: "#energy #oilandgas #energysecurity #data",
    x:
      "China was an oil exporter until 1993.\n\n" +
      "I dated every time a country switched for good between producing enough oil or gas and relying on imports, 178 countries, 1990\u20132025. 26 slipped into imports. 12 climbed out.\n\n" +
      "Method and sources below.",
    xReply: "Full report with every crossing, the method and sources: {url}",
  },
};

export function getKit(slug) {
  return KITS[slug] || null;
}
