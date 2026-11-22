// What each map report says and how it is shaded. Captions are checked readings from the published data,
// shown when the map reaches their year. Re-check them against the data before editing a number.

export const MAP_REPORTS = [
  {
    id: "oil",
    tab: "Oil",
    title: "Who covers their own oil demand?",
    scale: "selfSufficiency",
    unit: "percent of own oil and liquid fuel demand met by production",
    ariaLabel: "Oil and liquid fuel self-sufficiency",
    captions: [
      { year: 1992, text: "Each country shaded by how much of its own oil and liquid fuel demand it produces. Blue: more than it burns. Orange: less." },
      { year: 1993, text: "China, an oil exporter, falls below its own demand: it produces 97% of what it burns." },
      { year: 2003, text: "Indonesia, an OPEC member, becomes a net importer: about 96% of its demand." },
      { year: 2006, text: "The North Sea decline takes the UK below its own demand for good: about 96%." },
      { year: 2015, text: "Brazil's pre-salt fields lift it above its own demand for good: 101%." },
      { year: 2022, text: "The United States crosses back above 100% for good, on shale oil: 102%." },
      { year: 2025, text: "Guyana produces about 38 times its own demand. 2025 is a publisher estimate." },
    ],
    // EIA leaves non-producing countries blank in these years but records zero in the others.
    rangeNotes: [
      {
        from: 1993,
        to: 2003,
        text: "In 1993 to 2003 the source leaves countries that produce nothing blank instead of recording zero, so about 90 countries show as hatched here. They are not unknown; in other years they appear as deep orange. Producers are unaffected.",
      },
    ],
  },
  {
    id: "gas",
    tab: "Gas",
    title: "Who covers their own gas demand?",
    scale: "selfSufficiency",
    unit: "percent of own natural gas demand met by production",
    ariaLabel: "Natural gas self-sufficiency",
    captions: [
      { year: 1992, text: "Each country shaded by how much of its own natural gas demand it produces. Blue: more than it burns. Orange: less." },
      { year: 2004, text: "The UK slips just under its own gas demand for good, at 97.5%." },
      { year: 2007, text: "China falls below its own gas demand for good: about 98%." },
      { year: 2017, text: "The United States rises above its own gas demand for good: 101%." },
      { year: 2018, text: "The Netherlands falls below its own demand for good (91%) and is down to 30% by 2025." },
      { year: 2025, text: "Norway produces about 25 times its own gas demand and Qatar nearly 4 times. 2025 is a publisher estimate." },
    ],
    rangeNotes: [],
    note: "Hatched means no usable reading, not zero. Where the publisher reported no trade it set consumption equal to production; those country-years are removed here, so about 70 countries are shaded in the latest year.",
  },
  {
    id: "power",
    tab: "Wind and solar",
    title: "Where wind and solar run the grid",
    scale: "share",
    unit: "percent of net electricity generation from wind and solar",
    ariaLabel: "Wind and solar share of electricity generation",
    captions: [
      { year: 1990, text: "Each country shaded by the share of its electricity generation that comes from wind and solar. Darker means more." },
      { year: 2005, text: "Denmark leads at 18%. Spain is next at 8%." },
      { year: 2015, text: "Denmark passes half, at 52%. Luxembourg, Portugal, Ireland, Lithuania and Spain are each near a quarter." },
      { year: 2020, text: "Germany reaches 32%, up from 8% in 2010." },
      { year: 2025, text: "China, with the largest grid in the data, reaches 22%. Chile is at 39% and Australia a third. 2025 is a publisher estimate." },
    ],
    rangeNotes: [],
    note: "Wind and solar generation as a share of all net generation. Hydro, nuclear, biomass and geothermal are not counted as wind or solar. Very small grids swing widely from year to year, so read the largest countries first.",
  },
  {
    id: "copper",
    tab: "Copper",
    title: "Where the world's copper is mined",
    scale: "tonnes",
    unit: "tonnes of copper metal content in ore and concentrate",
    ariaLabel: "Copper mine production",
    captions: [
      { year: 1992, text: "Each country shaded by copper mined that year, on a log scale. Chile leads at 1.9 million tonnes, the United States next at 1.8 million." },
      { year: 2000, text: "Chile more than doubles its output to 4.6 million tonnes, about a third of everything reported that year." },
      { year: 2010, text: "Peru is now second, at 1.2 million tonnes." },
      { year: 2024, text: "The DR Congo mined 33 thousand tonnes in 2000. In 2024 it mines 3.2 million, second only to Chile at 5.5 million." },
    ],
    rangeNotes: [],
    note: "Copper in ore and concentrate, tonnes of metal content. Hatched means no reading in the data, not zero. Shares in the table are of the countries that reported that year.",
  },
];

export const MAP_IDS = MAP_REPORTS.map((r) => r.id);

// Ready-made charts for the Discover sidebar. Each opens the Data area on the series that `match` finds.
export const STANDARD_CHARTS = [
  { label: "Copper mined", blurb: "Top countries since 1970", match: { sector: "mining", measure: "production", commodity_code: "CU", source_code: "M3", basis: "copper, mine | stage=mine | form=ores and concentrates" } },
  { label: "Gold mined", blurb: "Top countries since 1970", match: { sector: "mining", measure: "production", commodity_code: "AU", source_code: "M3", basis: "gold, mine | stage=mine | form=ores and concentrates" } },
  { label: "Crude oil production", blurb: "Top countries since 1980", match: { sector: "petroleum", measure: "production", commodity_code: "57", source_code: "E1" } },
  { label: "Natural gas production", blurb: "Top countries since 1980", match: { sector: "petroleum", measure: "production", commodity_code: "26", source_code: "E1" } },
  { label: "Solar generation", blurb: "Electricity from solar", match: { sector: "power", measure: "net_generation", commodity_code: "SOLAR", source_code: "E1" } },
  { label: "Wind generation", blurb: "Electricity from wind", match: { sector: "power", measure: "net_generation", commodity_code: "WIND", source_code: "E1" } },
];
