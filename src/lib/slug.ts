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

/**
 * Generates a globally unique slug for a BusinessService from the parent
 * business name + service name (e.g. "ayse-guzellik-balayage"). Combining
 * both keeps /services/[slug] URLs flat while avoiding collisions between
 * businesses that offer similarly named services.
 */
export async function generateUniqueServiceSlug(
  businessName: string,
  serviceName: string
): Promise<string> {
  const base = slugify(`${businessName}-${serviceName}`);
  if (!base) return `service-${Date.now()}`;

  let slug = base;
  let counter = 0;

  while (await db.businessService.findUnique({ where: { slug } })) {
    counter++;
    slug = `${base}-${counter}`;
  }

  return slug;
}

/**
 * Generates a globally unique slug for a Professional from their display
 * name (e.g. "ayse-yilmaz"). Professionals are listed at the flat /pro/[slug]
 * route, so the slug must be unique across all businesses.
 */
export async function generateUniqueProfessionalSlug(
  displayName: string
): Promise<string> {
  const base = slugify(displayName);
  if (!base) return `pro-${Date.now()}`;

  let slug = base;
  let counter = 0;

  while (await db.professional.findUnique({ where: { slug } })) {
    counter++;
    slug = `${base}-${counter}`;
  }

  return slug;
}
