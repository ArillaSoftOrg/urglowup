import { statSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient, Prisma } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export { Prisma };
export type { PrismaClient };
export * from "./generated/prisma/enums";

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
  // DATABASE_URL already points at Neon's pooled (PgBouncer-style) endpoint,
  // but each serverless function instance still opens its own node-postgres
  // pool on top of that — pg's un-set default is `max: 10`, which multiplies
  // fast across concurrent instances. Kept small and env-overridable rather
  // than hardcoded, since the right ceiling depends on the provider's
  // connection limit and expected instance concurrency.
  const adapter = new PrismaPg({
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    idleTimeoutMillis: Number(process.env.DATABASE_POOL_IDLE_TIMEOUT_MS ?? 10_000),
    connectionTimeoutMillis: Number(process.env.DATABASE_POOL_CONNECTION_TIMEOUT_MS ?? 10_000),
  });
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
