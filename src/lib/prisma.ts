import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

/**
 * Cliente Prisma singleton. Usado apenas quando DATABASE_URL está definida
 * (ex.: deploy trustbank.xyz com Vercel Postgres).
 */
function createPrismaClient(): PrismaClient {
  return new PrismaClient();
}

export function getPrisma(): PrismaClient | null {
  if (!process.env.DATABASE_URL) return null;
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  globalForPrisma.prisma = createPrismaClient();
  return globalForPrisma.prisma;
}
