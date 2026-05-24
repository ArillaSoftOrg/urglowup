import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { writeFileSync } from "fs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const b = await prisma.business.findFirst({ select: { id: true, name: true, slug: true } });
  const medias = await prisma.postMedia.findMany({
    take: 6,
    select: { url: true, type: true, width: true, height: true },
  });
  const out = JSON.stringify({ b, medias }, null, 2);
  writeFileSync(".seed-query-result.json", out);
  process.stdout.write(out + "\n");
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
