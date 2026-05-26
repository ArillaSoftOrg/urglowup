import { statSync } from "fs";
import { fileURLToPath } from "url";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaMtime: number | undefined;
};

function getGeneratedMtime(): number {
  try {
    const p = fileURLToPath(new URL("../../generated/prisma/client.ts", import.meta.url));
    return statSync(p).mtimeMs;
  } catch {
    return 0;
  }
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

const isDev = process.env.NODE_ENV !== "production";
const mtime = isDev ? getGeneratedMtime() : 0;
const isStale = isDev && globalForPrisma.prisma != null && globalForPrisma.prismaMtime !== mtime;

if (isStale) {
  void globalForPrisma.prisma!.$disconnect();
  globalForPrisma.prisma = undefined;
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (isDev) {
  globalForPrisma.prisma = db;
  globalForPrisma.prismaMtime = mtime;
}
