// Minimal runtime validation helpers for landing entries.
export const requiredString = (v, name) => {
  if (typeof v !== "string" || !v.trim()) throw new Error(`Landing entry missing ${name}`);
};

export function validateEntry(e) {
  requiredString(e.slug, "slug");
  requiredString(e.title, "title");
  requiredString(e.description, "description");
  if (!e.hero || !e.hero.heading) throw new Error(`Landing entry ${e.slug} missing hero.heading`);
  return e;
}