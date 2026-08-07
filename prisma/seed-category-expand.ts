import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const categories = [
  { name: "Hair Salon", slug: "hair-salon", sortOrder: 1 },
  { name: "Barber Shop", slug: "barber-shop", sortOrder: 2 },
  { name: "Nail Salon", slug: "nail-salon", sortOrder: 3 },
  { name: "Eyebrow & Lash", slug: "eyebrow-lash", sortOrder: 4 },
  { name: "Skin Care", slug: "skin-care", sortOrder: 5 },
  { name: "Hair Removal", slug: "hair-removal", sortOrder: 6 },
  { name: "Spa & Massage", slug: "spa-massage", sortOrder: 7 },
  { name: "Tattoo & Piercing", slug: "tattoo-piercing", sortOrder: 8 },
  { name: "Permanent Makeup", slug: "permanent-makeup", sortOrder: 9 },
  { name: "Makeup Artist", slug: "makeup-artist", sortOrder: 10 },
  { name: "Aesthetic Clinic", slug: "aesthetic-clinic", sortOrder: 11 },
  { name: "Other", slug: "other", sortOrder: 12 },
];

async function main() {
  console.log("Expanding/reordering categories...");

  for (const cat of categories) {
    const result = await db.businessCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, sortOrder: cat.sortOrder },
      create: cat,
    });
    console.log(`OK: ${result.slug} (sortOrder ${result.sortOrder})`);
  }

  console.log(`\nDone — ${categories.length} categories in sync.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
