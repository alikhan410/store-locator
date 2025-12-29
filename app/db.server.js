import { environment, databaseUrl, isProduction, isDevelopment, isTest } from "./config/database.js";
import { PrismaClient } from "@prisma/client";

// Ensure DATABASE_URL is set (database.js validates and exports it)
// Explicitly set it for PrismaClient to read
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = databaseUrl;
}

// Log for debugging (remove in production if needed)
if (process.env.NODE_ENV === "production") {
  console.log("[db.server] DATABASE_URL is:", process.env.DATABASE_URL ? "SET" : "NOT SET");
  console.log("[db.server] DIRECT_URL is:", process.env.DIRECT_URL ? "SET" : "NOT SET");
}

if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobal) {
    global.prismaGlobal = new PrismaClient();
  }
}

const prisma = global.prismaGlobal ?? new PrismaClient();

export default prisma;
