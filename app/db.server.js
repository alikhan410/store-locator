import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { environment, databaseUrl, isProduction, isDevelopment, isTest } from "./config/database.js";

// Ensure DATABASE_URL is set (database.js validates and exports it)
// Explicitly set it for PrismaClient to read - MUST be before PrismaClient instantiation
const connectionString = process.env.DATABASE_URL || databaseUrl;
process.env.DATABASE_URL = connectionString;

// Log for debugging (remove in production if needed)
if (process.env.NODE_ENV === "production") {
  console.log("[db.server] DATABASE_URL is:", process.env.DATABASE_URL ? "SET" : "NOT SET");
  console.log("[db.server] DATABASE_URL starts with:", process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 50) : "N/A");
  console.log("[db.server] DIRECT_URL is:", process.env.DIRECT_URL ? "SET" : "NOT SET");
  console.log("[db.server] DIRECT_URL starts with:", process.env.DIRECT_URL ? process.env.DIRECT_URL.substring(0, 50) : "N/A");
}

// Create PrismaClient (Prisma 6 - no adapter needed)
if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobal) {
    global.prismaGlobal = new PrismaClient();
  }
}

const prisma = global.prismaGlobal ?? new PrismaClient();

export default prisma;
