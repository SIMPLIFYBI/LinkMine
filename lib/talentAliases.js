import { TALENT_ANIMALS, getTalentAnimal } from "@/lib/talentAvatarConfig";

const descriptors = [
  "Amber", "Basalt", "Beryl", "Bluegum", "Bronze", "Canyon", "Carbon", "Cedar",
  "Cinnabar", "Cobalt", "Copper", "Coral", "Crimson", "Crystal", "Dune", "Ember",
  "Flint", "Forest", "Fossil", "Galena", "Garnet", "Glacier", "Golden", "Granite",
  "Graphite", "Iron", "Jade", "Jasper", "Kaolin", "Lapis", "Marble", "Mica",
  "Nickel", "Ochre", "Onyx", "Opal", "Pebble", "Quartz", "Redgum", "River",
  "Saffron", "Sandstone", "Sapphire", "Scarlet", "Sediment", "Shale", "Silver", "Sky",
  "Slate", "Solar", "Spinel", "Summit", "Sunstone", "Talc", "Terrain", "Titanium",
  "Topaz", "Tundra", "Umber", "Valley", "Verdant", "Violet", "Wattle", "Willow",
  "Zinc", "Acacia", "Alloy", "Aurora", "Bauxite", "Boreal", "Brass", "Calcite",
  "Cirrus", "Clay", "Coastal", "Dolerite", "Eclipse", "Feldspar", "Hematite", "Indigo",
  "Lunar", "Magnetite", "Malachite", "Manganese", "Mesa", "Moss", "Obsidian", "Palladium",
  "Pine", "Platinum", "Porphyry", "Pyrite", "Rainforest", "Raven", "Ridge", "Ruby",
  "Sienna", "Steel", "Teal", "Tourmaline", "Travertine", "Turquoise", "Volcanic", "Wildflower",
];

const animals = TALENT_ANIMALS.map((animal) => animal.label);

export const TALENT_ALIAS_POOL_SIZE = descriptors.length * animals.length;

export function isTalentAlias(value) {
  return typeof value === "string" && talentAliasSet.has(value);
}

export function generateTalentAlias(excludedAliases = []) {
  return generateTalentIdentity(excludedAliases).alias;
}

export function generateTalentIdentity(excludedAliases = []) {
  const excluded = new Set(excludedAliases);
  const startIndex = Math.floor(Math.random() * TALENT_ALIAS_POOL_SIZE);

  for (let offset = 0; offset < TALENT_ALIAS_POOL_SIZE; offset += 1) {
    const index = (startIndex + offset) % TALENT_ALIAS_POOL_SIZE;
    const descriptor = descriptors[Math.floor(index / animals.length)];
    const animal = animals[index % animals.length];
    const alias = `${descriptor} ${animal}`;
    if (!excluded.has(alias)) {
      return { alias, descriptor: descriptor.toLowerCase(), animal: animal.toLowerCase() };
    }
  }

  throw new Error("No Talent Aliases are available.");
}

export function getNextTalentIdentity(currentAlias) {
  const currentIndex = aliasPool.indexOf(currentAlias);
  const nextIndex = currentIndex >= 0 ? (currentIndex + animals.length + 1) % TALENT_ALIAS_POOL_SIZE : 0;
  const descriptor = descriptors[Math.floor(nextIndex / animals.length)];
  const animal = animals[nextIndex % animals.length];
  return { alias: `${descriptor} ${animal}`, descriptor: descriptor.toLowerCase(), animal: animal.toLowerCase() };
}

export function getTalentAliasParts(alias) {
  if (!isTalentAlias(alias)) return null;
  const [descriptor, ...animalWords] = alias.split(" ");
  const animal = getTalentAnimal(animalWords.join("-").toLowerCase());
  return animal ? { descriptor: descriptor.toLowerCase(), animal: animal.id } : null;
}

const talentAliasSet = new Set(
  descriptors.flatMap((descriptor) => animals.map((animal) => `${descriptor} ${animal}`))
);

const aliasPool = Array.from(talentAliasSet);