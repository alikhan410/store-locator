import { environment, databaseUrl, isProduction, isDevelopment, isTest } from "./config/database.js";
import { PrismaClient } from "@prisma/client";

// Ensure DATABASE_URL is set (database.js sets process.env.DATABASE_URL)
// Prisma 7: For direct connections, PrismaClient reads from process.env.DATABASE_URL
// The connection URL is configured in prisma/config.ts for migrations

if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobal) {
    global.prismaGlobal = new PrismaClient();
  }
}

const prisma = global.prismaGlobal ?? new PrismaClient();

export default prisma;
