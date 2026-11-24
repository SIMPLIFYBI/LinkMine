// Social post kits for YouMine Intelligence reports. Every number is copied from the report the kit names;
// recheck a kit whenever its report changes.
// Voice: posted from James Blue's own LinkedIn and X accounts, so the copy is first person ("I"), never "we".
// The YouMine company page reshares rather than posting its own copy.

// Use the standalone report URL so the tracking parameters reach the report.
export const PUBLIC_BASE = "https://youmine.io/intelligence";

export const LINKEDIN_LIMIT = 3000;
export const X_LIMIT = 280;
const X_LINK_LENGTH = 23;

export function reportUrl(slug, network) {
  return `${PUBLIC_BASE}/raw/${slug}?utm_source=${network}&utm_medium=social&utm_campaign=${slug}`;
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
    sourceLine: "Source: USGS Mineral Commodity Summaries 2026 (2024 shares); BGS World Mineral Statistics, by permission.",
    slides: [
      {
        type: "bars",
        title: "Three countries now refine nearly 80% of alumina",
        subtitle: "Share of reported output from the top three producers at each stage and period",
        sourceLine: "Source: BGS World Mineral Statistics, by permission. Producers ranked separately for each period.",
        fromLabel: "2000–02",
        toLabel: "2022–24",
        fromColor: "#b44920",
        accent: "gain",
        max: 100,
        rows: [
          { label: "Bauxite mining", from: 59.7, to: 72.5 },
          { label: "Alumina refining", from: 47.3, to: 79.4 },
          { label: "Primary aluminium", from: 39.5, to: 70.6 },
        ],
        alt: "The three biggest producers at each stage grew their share of reported output from 2000–02 to 2022–24. Bauxite mining rose from 59.7% to 72.5%, alumina refining from 47.3% to 79.4%, and primary aluminium from 39.5% to 70.6%. Source: British Geological Survey.",
      },
      {
        type: "bars",
        title: "Where bauxite is mined and alumina is refined",
        subtitle: "Share of world output in 2024",
        fromColor: "#b44920",
        fromLabel: "Bauxite mined",
        toLabel: "Alumina refined",
        max: 100,
        accent: "gain",
        rows: [
          { label: "Guinea", detail: "biggest miner", from: 33, to: 0.25 },
          { label: "Australia", detail: "2nd biggest miner", from: 23, to: 12 },
          { label: "China", detail: "3rd biggest miner", from: 19, to: 60 },
        ],
        alt: "Bar chart of share of world output in 2024, bauxite mined against alumina refined. Guinea 33 percent of bauxite, 0.25 percent of alumina. Australia 23 and 12. China 19 and 60.",
      },
      {
        type: "points",
        title: "How solid is this?",
        points: [
          { head: "Two sources agree", text: "USGS and the British Geological Survey both put Guinea first for bauxite and China first for alumina." },
          { head: "Not a one-year blip", text: "USGS estimates for 2025: Guinea 34% of world bauxite, 0.24% of alumina." },
          { head: "Refining went backwards", text: "Since 2000–02 Guinea’s bauxite output grew about sevenfold. Its alumina output halved." },
        ],
        alt: "Three notes. Two sources agree: the USGS and the British Geological Survey both put Guinea first for bauxite and China first for alumina. Not a one-year blip: USGS estimates for 2025 give Guinea 34 percent of bauxite and 0.24 percent of alumina. Refining went backwards: Guinea’s bauxite output grew about sevenfold since 2000 to 2002 while its alumina output halved.",
      },
    ],
    linkedin:
      "Guinea mines a third of the world’s bauxite. It makes 0.25% of the world’s alumina.\n\n" +
      "Bauxite is the rock. A refinery turns it into alumina, a white powder, and a smelter turns that into aluminium. I followed 2024 production through all three steps:\n\n" +
      "• Guinea: 33% of the bauxite, 0.25% of the alumina\n• Australia: 23% of the bauxite, 12% of the alumina, 2% of the aluminium\n• China: 19% of the bauxite, 60% of the alumina, 60% of the aluminium\n\n" +
      "Over two decades it got more lopsided. Guinea’s bauxite output grew about sevenfold while its alumina output halved. In October 2024 Guinea suspended one company’s bauxite exports, and the US Geological Survey says the main reason was the company’s unmet promise to build a refinery in Guinea.\n\n" +
      "One caution: production isn’t trade. About 70% of Guinea’s bauxite and alumina exports went to China, but these figures can’t say how much of China’s metal started as Guinean rock.\n\n" +
      "My full analysis, with a map of all three steps from 2000 to 2024, is on YouMine: link in the comments.",
    linkedinComment: "Full analysis, with the map, the figures and sources: {url}",
    hashtags: "#mining #aluminium #bauxite #commodities",
    x:
      "Guinea mined 33% of the world’s bauxite in 2024. It made 0.25% of the world’s alumina.\n\n" +
      "By the metal, China leads: 60% of the alumina and 60% of the aluminium.\n\n" +
      "Guinea’s bauxite output grew ~7x in 20 years. Its refining halved. Details below.",
    xReply: "Full analysis, with a map of all three steps from 2000 to 2024: {url}\n\nSources: USGS and the British Geological Survey.",
  },

  "australia-qatar-gas": {
    kicker: "Australia and Qatar on gas",
    sourceLine: "Source: U.S. EIA International Energy Statistics. Dry natural gas production.",
    slides: [
      {
        type: "stat",
        accent: "gain",
        big: "40% → 90%",
        label: "Australia’s gas output as a share of Qatar’s",
        sub: "Annual averages, 2013–15 then 2022–24.",
        alt: "Large text reading 40 percent to 90 percent. Australia produced 40 percent as much natural gas as Qatar in 2013 to 2015 and 90 percent as much in 2022 to 2024.",
      },
      {
        type: "stat",
        accent: "gain",
        big: "92 → 22",
        label: "the gap with Qatar, billion cubic metres a year, 2015 then 2019",
        sub: "Australia’s output doubled in four years as its LNG exports grew.",
        alt: "Large text reading 92 to 22. The gap between Qatar’s and Australia’s gas output fell from 92 billion cubic metres a year in 2015 to 22 in 2019.",
      },
      {
        type: "points",
        title: "How solid is this?",
        points: [
          { head: "One source throughout", text: "EIA figures for every country, so the comparison is like for like." },
          { head: "Only three grew more", text: "The US, China and Iran added more gas a year than Australia." },
          { head: "The gap may reopen", text: "The EIA’s early 2025 estimate puts it at 26 bcm, up from 16 in 2024." },
        ],
        alt: "Three notes. One source throughout: EIA figures for every country. Only three grew more: the United States, China and Iran added more gas a year than Australia. The gap may reopen: the EIA’s early 2025 estimate puts it at 26 billion cubic metres, up from 16 in 2024.",
      },
    ],
    linkedin:
      "In 2013–15 Australia produced 40% as much natural gas as Qatar. By 2022–24 it was producing 90% as much.\n\n" +
      "I charted both countries back to 2000. They started almost level. Qatar pulled away in the 2000s, then Australia closed most of the gap in four years: from 92 billion cubic metres a year in 2015 to 22 in 2019, as Queensland’s LNG exports began and more large LNG plants came online.\n\n" +
      "Only the United States, China and Iran added more gas a year over the same period.\n\n" +
      "Two cautions. The EIA’s early estimate for 2025 has the gap widening again, to 26 billion cubic metres. And Australia exports about 70% of the gas it produces, as LNG, which is why one of the world’s biggest producers can still worry about supply at home.\n\n" +
      "My full analysis, with the annual figures and the ten biggest producers, is on YouMine: link in the comments.",
    linkedinComment: "Full analysis, with the annual figures, the top ten producers and sources: {url}",
    hashtags: "#naturalgas #LNG #energy #Australia",
    x:
      "In 2013–15 Australia produced 40% as much gas as Qatar. By 2022–24: 90%.\n\n" +
      "The gap fell from 92 bcm a year in 2015 to 22 in 2019. The EIA’s early 2025 estimate has it widening again, to 26.\n\n" +
      "Chart and figures below.",
    xReply: "Full analysis, with annual figures for both countries and the top ten producers: {url}",
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

const LEAD_STORIES = {
  "bauxite-to-aluminium": {
    title: "Guinea mines the ore. Refining happens elsewhere.",
    context: "Guinea’s share of world output in 2024",
    bars: [["Bauxite mining", 33], ["Alumina refining", 0.25]],
    unit: "%",
    max: 100,
  },
  "australia-qatar-gas": {
    title: "Australia nearly caught Qatar on gas",
    context: "Australia’s dry gas output as a share of Qatar’s, annual averages",
    bars: [["2013–15", 40], ["2022–24", 90]],
    unit: "%",
    max: 100,
  },
  "the-handover": {
    title: "China’s grip on antimony mining loosened",
    context: "China’s share of reported world mine output",
    bars: [["2002–04", 85], ["2022–24", 38]],
    unit: "%",
    max: 100,
  },
  "mine-dependent-six": {
    title: "The economies most tied to mining",
    context: "Ores and metals as a share of exports, 2021–23. Top three of the six that pass both tests.",
    bars: [["DR Congo", 77], ["Zambia", 75], ["Chile", 55]],
    unit: "%",
    max: 100,
  },
  "peak-was-yesterday": {
    title: "Mercury mining fell to 15% of its peak",
    context: "Reported world mine output, indexed to the 1971 peak",
    bars: [["1971 peak", 100], ["2022–24 average", 15]],
    unit: "%",
    max: 100,
  },
  "reserve-report": {
    title: "Australia’s mineral reserves outrank its output",
    context: "Of 29 minerals ranked, Australia led production in only one of the nine where it held top-two reserves.",
    bars: [["Top-two reserves", 9], ["Also first in mining", 1]],
    unit: "",
    max: 9,
  },
  "energy-flip": {
    title: "More countries fell into fuel import dependence",
    context: "Lasting oil or gas self-sufficiency crossings, 1990–2025",
    bars: [["Fell below own demand", 26], ["Rose above own demand", 12]],
    unit: "",
    max: 26,
  },
};

export function getKit(slug) {
  const kit = KITS[slug];
  const story = LEAD_STORIES[slug];
  if (!kit || !story) return kit || null;

  const values = story.bars.map(([label, value]) => `${label}, ${value}${story.unit}`).join(". ");
  const lead = { ...story, type: "lead", alt: `${story.title}. ${story.context}. ${values}.` };
  return { ...kit, slides: [lead, ...kit.slides] };
}
