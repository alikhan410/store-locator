/**
 * Database configuration that handles environment-specific database URLs
 * This allows us to use different databases for development and production
 */

const environment = process.env.ENVIRONMENT || 'development';

// Database URL mapping based on environment
const databaseUrls = {
  development: process.env.PRISMA_POSTGRES_DATABASE_URL_DEV,
  production: process.env.PRISMA_POSTGRES_DATABASE_URL_PROD,
  test: process.env.PRISMA_POSTGRES_DATABASE_URL_TEST || process.env.PRISMA_POSTGRES_DATABASE_URL_DEV,
};

// Get the appropriate database URL for the current environment
const getDatabaseUrl = () => {
  const url = databaseUrls[environment];
  
  if (!url) {
    throw new Error(
      `Database URL not found for environment: ${environment}. ` +
      `Please set PRISMA_POSTGRES_DATABASE_URL_${environment.toUpperCase()} in your environment variables.`
    );
  }
  
  return url;
};

// Set the DATABASE_URL environment variable for Prisma
process.env.DATABASE_URL = getDatabaseUrl();

module.exports = {
  environment,
  databaseUrl: getDatabaseUrl(),
  isProduction: environment === 'production',
  isDevelopment: environment === 'development',
  isTest: environment === 'test',
}; 