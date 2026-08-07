import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const TAG_CATEGORY_MAP: Array<{ slug: string; categorySlug: string }> = [
  // Barber Shop
  { slug: "taper-fade", categorySlug: "barber-shop" },
  { slug: "mid-fade", categorySlug: "barber-shop" },
  { slug: "low-fade", categorySlug: "barber-shop" },
  { slug: "buzz-cut", categorySlug: "barber-shop" },
  { slug: "crew-cut", categorySlug: "barber-shop" },
  // Hair Salon
  { slug: "wolf-cut", categorySlug: "hair-salon" },
  { slug: "butterfly-cut", categorySlug: "hair-salon" },
  { slug: "blunt-cut", categorySlug: "hair-salon" },
  { slug: "balayage", categorySlug: "hair-salon" },
  { slug: "keratin-bakimi", categorySlug: "hair-salon" },
  { slug: "ombre-sac", categorySlug: "hair-salon" },
  // Tattoo & Piercing
  { slug: "fine-line", categorySlug: "tattoo-piercing" },
  { slug: "minimal-dovme", categorySlug: "tattoo-piercing" },
  { slug: "blackwork", categorySlug: "tattoo-piercing" },
  { slug: "realism", categorySlug: "tattoo-piercing" },
  { slug: "old-school", categorySlug: "tattoo-piercing" },
  { slug: "neo-traditional", categorySlug: "tattoo-piercing" },
  // Nail Salon
  { slug: "french-nail", categorySlug: "nail-salon" },
  { slug: "ombre-nail", categorySlug: "nail-salon" },
  { slug: "nail-art", categorySlug: "nail-salon" },
  { slug: "jel-tirnak", categorySlug: "nail-salon" },
  { slug: "chrome-nails", categorySlug: "nail-salon" },
  // Skin Care
  { slug: "hydrafacial", categorySlug: "skin-care" },
  { slug: "cilt-bakimi", categorySlug: "skin-care" },
  { slug: "kimyasal-peeling", categorySlug: "skin-care" },
  { slug: "mikrodermabrazyon", categorySlug: "skin-care" },
  // Makeup Artist
  { slug: "gelin-makyaji", categorySlug: "makeup-artist" },
  { slug: "smokey-eye", categorySlug: "makeup-artist" },
  { slug: "dogal-makyaj", categorySlug: "makeup-artist" },
  { slug: "kontur", categorySlug: "makeup-artist" },
  // Spa & Massage
  { slug: "deep-tissue", categorySlug: "spa-massage" },
  { slug: "aromaterapi", categorySlug: "spa-massage" },
  { slug: "hot-stone", categorySlug: "spa-massage" },
  // Eyebrow & Lash
  { slug: "kirpik-lifting", categorySlug: "eyebrow-lash" },
  { slug: "kas-laminasyonu", categorySlug: "eyebrow-lash" },
  { slug: "microblading", categorySlug: "eyebrow-lash" },
  { slug: "kirpik-uzatma", categorySlug: "eyebrow-lash" },
  // Aesthetic Clinic
  { slug: "botoks", categorySlug: "aesthetic-clinic" },
  { slug: "dolgu", categorySlug: "aesthetic-clinic" },
  { slug: "prp", categorySlug: "aesthetic-clinic" },
  { slug: "lazer-epilasyon", categorySlug: "aesthetic-clinic" },
];

async function main() {
  const categories = await db.businessCategory.findMany({ select: { id: true, slug: true } });
  const catMap = new Map(categories.map((c: { slug: string; id: string }) => [c.slug, c.id]));

  if (catMap.size === 0) {
    console.error("ERROR: No BusinessCategory rows found. Run prisma/seed.ts first.");
    process.exit(1);
  }

  console.log(`Found ${catMap.size} categories in DB.`);

  let updated = 0;
  let skipped = 0;
  let missingTag = 0;
  let missingCat = 0;

  for (const { slug, categorySlug } of TAG_CATEGORY_MAP) {
    const tag = await db.styleTag.findFirst({ where: { slug } });

    if (!tag) {
      console.warn(`MISSING tag: ${slug}`);
      missingTag++;
      continue;
    }

    const categoryId = catMap.get(categorySlug);
    if (!categoryId) {
      console.warn(`MISSING category: ${categorySlug} (for tag: ${slug})`);
      missingCat++;
      continue;
    }

    if (tag.categoryId === categoryId) {
      console.log(`SKIP (already set): ${slug} → ${categorySlug}`);
      skipped++;
      continue;
    }

    await db.styleTag.update({
      where: { id: tag.id },
      data: { categoryId },
    });
    console.log(`UPDATED: ${slug} → ${categorySlug}`);
    updated++;
  }

  console.log(
    `\nDone — updated: ${updated}, skipped: ${skipped}, missing tag: ${missingTag}, missing category: ${missingCat}`
  );
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
