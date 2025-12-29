import 'dotenv/config';

// Ensure Prisma client is generated before importing (for Vercel serverless functions)
if (process.env.NODE_ENV === "production") {
  try {
    const { execSync } = await import("child_process");
    const { fileURLToPath } = await import("url");
    const { dirname, join } = await import("path");
    const { existsSync } = await import("fs");
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const projectRoot = join(__dirname, "../..");
    const prismaClientPath = join(projectRoot, "node_modules/.prisma/client");
    
    if (!existsSync(prismaClientPath)) {
      console.log("[db.server] Prisma client not found, generating...");
      execSync("npx prisma generate --config prisma/config.js", {
        cwd: projectRoot,
        stdio: "pipe",
        env: { ...process.env },
      });
    }
  } catch (error) {
    console.warn("[db.server] Failed to ensure Prisma client generation:", error.message);
  }
}

import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');
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

// Create PostgreSQL connection pool
const pool = new Pool({ connectionString });

// Create Prisma adapter
const adapter = new PrismaPg({ pool });

// Create PrismaClient with adapter
if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobal) {
    global.prismaGlobal = new PrismaClient({ adapter });
  }
}

const prisma = global.prismaGlobal ?? new PrismaClient({ adapter });

export default prisma;
