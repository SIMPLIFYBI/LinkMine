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

export const TALENT_AVATAR_BACKGROUNDS = [
  { id: "sage", color: "#617965", label: "Sage" },
  { id: "dusty-blue", color: "#607b96", label: "Dusty blue" },
  { id: "muted-teal", color: "#4f7c7c", label: "Muted teal" },
  { id: "sand", color: "#9b8663", label: "Sand" },
  { id: "terracotta", color: "#9a6756", label: "Terracotta" },
  { id: "lavender", color: "#7b6b95", label: "Lavender" },
  { id: "slate", color: "#596b7d", label: "Slate" },
  { id: "muted-rose", color: "#956b78", label: "Muted rose" },
  { id: "moss", color: "#6f826e", label: "Moss" },
  { id: "stone", color: "#7e7270", label: "Stone" },
];

export const TALENT_AVATAR_BACKGROUND_IDS = TALENT_AVATAR_BACKGROUNDS.map((background) => background.id);

export const TALENT_AVATAR_BACKGROUND_PALETTE = TALENT_AVATAR_BACKGROUNDS.map((background) => background.color);

export function getTalentAnimal(animal) {
  return TALENT_ANIMALS.find((candidate) => candidate.id === String(animal || "").toLowerCase()) || null;
}

export function getTalentAvatarBackground(backgroundId, alias) {
  const selectedBackground = TALENT_AVATAR_BACKGROUNDS.find((background) => background.id === backgroundId);
  if (selectedBackground) return selectedBackground.color;

  const identity = String(alias || "").trim().toLowerCase();
  if (!identity) return TALENT_AVATAR_BACKGROUND_PALETTE[0];

  let hash = 0;
  for (let index = 0; index < identity.length; index += 1) {
    hash = ((hash * 31) + identity.charCodeAt(index)) >>> 0;
  }

  return TALENT_AVATAR_BACKGROUND_PALETTE[hash % TALENT_AVATAR_BACKGROUND_PALETTE.length];
}