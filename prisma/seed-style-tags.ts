import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const tags: Array<{ name: string; slug: string; categorySlug: string | null; sortOrder: number }> = [
  // Barber Shop
  { name: "Taper Fade", slug: "taper-fade", categorySlug: "barber-shop", sortOrder: 10 },
  { name: "Mid Fade", slug: "mid-fade", categorySlug: "barber-shop", sortOrder: 11 },
  { name: "Low Fade", slug: "low-fade", categorySlug: "barber-shop", sortOrder: 12 },
  { name: "Buzz Cut", slug: "buzz-cut", categorySlug: "barber-shop", sortOrder: 13 },
  { name: "Crew Cut", slug: "crew-cut", categorySlug: "barber-shop", sortOrder: 14 },
  // Hair Salon
  { name: "Wolf Cut", slug: "wolf-cut", categorySlug: "hair-salon", sortOrder: 20 },
  { name: "Butterfly Cut", slug: "butterfly-cut", categorySlug: "hair-salon", sortOrder: 21 },
  { name: "Blunt Cut", slug: "blunt-cut", categorySlug: "hair-salon", sortOrder: 22 },
  { name: "Balayage", slug: "balayage", categorySlug: "hair-salon", sortOrder: 23 },
  { name: "Keratin Bakımı", slug: "keratin-bakimi", categorySlug: "hair-salon", sortOrder: 24 },
  { name: "Ombre Saç", slug: "ombre-sac", categorySlug: "hair-salon", sortOrder: 25 },
  // Tattoo & Piercing
  { name: "Fine Line", slug: "fine-line", categorySlug: "tattoo-piercing", sortOrder: 30 },
  { name: "Minimal Dövme", slug: "minimal-dovme", categorySlug: "tattoo-piercing", sortOrder: 31 },
  { name: "Blackwork", slug: "blackwork", categorySlug: "tattoo-piercing", sortOrder: 32 },
  { name: "Realism", slug: "realism", categorySlug: "tattoo-piercing", sortOrder: 33 },
  { name: "Old School", slug: "old-school", categorySlug: "tattoo-piercing", sortOrder: 34 },
  { name: "Neo Traditional", slug: "neo-traditional", categorySlug: "tattoo-piercing", sortOrder: 35 },
  // Nail Salon
  { name: "French Nail", slug: "french-nail", categorySlug: "nail-salon", sortOrder: 40 },
  { name: "Ombre Nail", slug: "ombre-nail", categorySlug: "nail-salon", sortOrder: 41 },
  { name: "Nail Art", slug: "nail-art", categorySlug: "nail-salon", sortOrder: 42 },
  { name: "Jel Tırnak", slug: "jel-tirnak", categorySlug: "nail-salon", sortOrder: 43 },
  { name: "Chrome Nails", slug: "chrome-nails", categorySlug: "nail-salon", sortOrder: 44 },
  // Skin Care
  { name: "HydraFacial", slug: "hydrafacial", categorySlug: "skin-care", sortOrder: 50 },
  { name: "Cilt Bakımı", slug: "cilt-bakimi", categorySlug: "skin-care", sortOrder: 51 },
  { name: "Kimyasal Peeling", slug: "kimyasal-peeling", categorySlug: "skin-care", sortOrder: 52 },
  { name: "Mikrodermabrazyon", slug: "mikrodermabrazyon", categorySlug: "skin-care", sortOrder: 53 },
  // Makeup Artist
  { name: "Gelin Makyajı", slug: "gelin-makyaji", categorySlug: "makeup-artist", sortOrder: 60 },
  { name: "Smokey Eye", slug: "smokey-eye", categorySlug: "makeup-artist", sortOrder: 61 },
  { name: "Doğal Makyaj", slug: "dogal-makyaj", categorySlug: "makeup-artist", sortOrder: 62 },
  { name: "Kontur", slug: "kontur", categorySlug: "makeup-artist", sortOrder: 63 },
  // Spa & Massage
  { name: "Deep Tissue Masaj", slug: "deep-tissue", categorySlug: "spa-massage", sortOrder: 70 },
  { name: "Aromaterapi", slug: "aromaterapi", categorySlug: "spa-massage", sortOrder: 71 },
  { name: "Hot Stone Masaj", slug: "hot-stone", categorySlug: "spa-massage", sortOrder: 72 },
  // Eyebrow & Lash
  { name: "Kirpik Lifting", slug: "kirpik-lifting", categorySlug: "eyebrow-lash", sortOrder: 80 },
  { name: "Kaş Laminasyonu", slug: "kas-laminasyonu", categorySlug: "eyebrow-lash", sortOrder: 81 },
  { name: "Microblading", slug: "microblading", categorySlug: "eyebrow-lash", sortOrder: 82 },
  { name: "Kirpik Uzatma", slug: "kirpik-uzatma", categorySlug: "eyebrow-lash", sortOrder: 83 },
  // Aesthetic Clinic
  { name: "Botoks", slug: "botoks", categorySlug: "aesthetic-clinic", sortOrder: 90 },
  { name: "Dolgu", slug: "dolgu", categorySlug: "aesthetic-clinic", sortOrder: 91 },
  { name: "PRP", slug: "prp", categorySlug: "aesthetic-clinic", sortOrder: 92 },
  { name: "Lazer Epilasyon", slug: "lazer-epilasyon", categorySlug: "aesthetic-clinic", sortOrder: 93 },
];

async function main() {
  const categories = await db.businessCategory.findMany({ select: { id: true, slug: true } });
  const catMap = new Map(categories.map((c: { slug: string; id: string }) => [c.slug, c.id]));

  for (const tag of tags) {
    const categoryId = tag.categorySlug ? (catMap.get(tag.categorySlug) ?? null) : null;
    await db.styleTag.upsert({
      where: { slug: tag.slug },
      update: { name: tag.name, categoryId, sortOrder: tag.sortOrder },
      create: { name: tag.name, slug: tag.slug, categoryId, sortOrder: tag.sortOrder },
    });
  }

  console.log(`Seeded ${tags.length} style tags.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
