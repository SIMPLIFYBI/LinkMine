const animalIds = [
  "alpaca", "anteater", "armadillo", "badger", "bandicoot", "bear", "bighorn", "bilby",
  "bison", "bobcat", "capybara", "caracal", "caribou", "cassowary", "condor", "cougar",
  "coyote", "deer", "dingo", "eagle", "echidna", "elk", "emu", "falcon", "fox", "gecko",
  "guanaco", "grizzly", "hawk", "iguana", "jaguar", "kangaroo", "kookaburra", "lynx",
  "meerkat", "moose", "numbat", "ocelot", "osprey", "owl", "pangolin", "peregrine", "platypus",
  "puma", "quokka", "raven", "roadrunner", "sloth", "tapir", "tasmanian-devil", "toucan",
  "vicuna", "wallaby", "wapiti", "wolverine", "wombat", "wolf", "yak",
];

function toLabel(id) {
  return id.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export const TALENT_ANIMALS = animalIds.map((id) => ({
  id,
  label: toLabel(id),
  assetPath: `/talent-avatars/${id}.png`,
}));

export const TALENT_ANIMAL_IDS = TALENT_ANIMALS.map((animal) => animal.id);

export const TALENT_AVATAR_BACKGROUND_PALETTE = [
  "#617965", // sage
  "#607b96", // dusty blue
  "#4f7c7c", // muted teal
  "#9b8663", // sand
  "#9a6756", // terracotta
  "#7b6b95", // lavender
  "#596b7d", // slate
  "#956b78", // muted rose
  "#6f826e", // moss
  "#7e7270", // stone
];

export function getTalentAnimal(animal) {
  return TALENT_ANIMALS.find((candidate) => candidate.id === String(animal || "").toLowerCase()) || null;
}

export function getTalentAvatarBackground(alias) {
  const identity = String(alias || "").trim().toLowerCase();
  if (!identity) return TALENT_AVATAR_BACKGROUND_PALETTE[0];

  let hash = 0;
  for (let index = 0; index < identity.length; index += 1) {
    hash = ((hash * 31) + identity.charCodeAt(index)) >>> 0;
  }

  return TALENT_AVATAR_BACKGROUND_PALETTE[hash % TALENT_AVATAR_BACKGROUND_PALETTE.length];
}