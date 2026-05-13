import { db } from "./db";
import { slugify } from "./slugify";

export { slugify };

export async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  if (!base) return `business-${Date.now()}`;

  let slug = base;
  let counter = 0;

  while (await db.business.findUnique({ where: { slug } })) {
    counter++;
    slug = `${base}-${counter}`;
  }

  return slug;
}
