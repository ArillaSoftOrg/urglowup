import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const categories = [
  { name: "Hair Salon", slug: "hair-salon", sortOrder: 1 },
  { name: "Barber Shop", slug: "barber-shop", sortOrder: 2 },
  { name: "Nail Salon", slug: "nail-salon", sortOrder: 3 },
  { name: "Skin Care", slug: "skin-care", sortOrder: 4 },
  { name: "Makeup Artist", slug: "makeup-artist", sortOrder: 5 },
  { name: "Spa & Massage", slug: "spa-massage", sortOrder: 6 },
  { name: "Eyebrow & Lash", slug: "eyebrow-lash", sortOrder: 7 },
  { name: "Tattoo & Piercing", slug: "tattoo-piercing", sortOrder: 8 },
  { name: "Aesthetic Clinic", slug: "aesthetic-clinic", sortOrder: 9 },
  { name: "Other", slug: "other", sortOrder: 10 },
];

async function main() {
  console.log("Seeding categories...");

  for (const cat of categories) {
    await prisma.businessCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, sortOrder: cat.sortOrder },
      create: cat,
    });
  }

  console.log(`Seeded ${categories.length} categories.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
