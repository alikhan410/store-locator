/**
 * Setup script to load database configuration before running Prisma commands
 * This ensures DATABASE_URL is set in the environment for Prisma 7 migrations
 */

// Load .env file first
import 'dotenv/config';

import { databaseUrl } from '../app/config/database.js';
import { execSync } from 'child_process';

// Set DATABASE_URL for Prisma
process.env.DATABASE_URL = databaseUrl;

console.log('Database URL configured for environment:', process.env.ENVIRONMENT || 'development');
console.log('DATABASE_URL is set:', !!databaseUrl);

// Run Prisma commands with DATABASE_URL set
// Pass DATABASE_URL explicitly to child processes
const env = { ...process.env, DATABASE_URL: databaseUrl };

// prisma generate doesn't need the config file, just DATABASE_URL
console.log('Running prisma generate...');
execSync('npx prisma generate', { stdio: 'inherit', env });

console.log('Running prisma migrate deploy...');
console.log('DATABASE_URL in env:', !!env.DATABASE_URL);
execSync('npx prisma migrate deploy', { stdio: 'inherit', env });

