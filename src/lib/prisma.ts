import { PrismaClient } from "@wishi/prisma-client";

const globalForPrisma = global as unknown as { wishiPrisma: PrismaClient };

export const prisma = globalForPrisma.wishiPrisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.wishiPrisma = prisma;
