import { statSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaMtime: number | undefined;
};

function getGeneratedMtime(): number {
  try {
    const p = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "generated",
      "prisma",
      "client.ts",
    );
    return statSync(p).mtimeMs;
  } catch {
    return 0;
  }
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const adapter = new PrismaPg({ connectionString });
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
