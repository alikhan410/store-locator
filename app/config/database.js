/**
 * Database configuration
 * Uses DATABASE_URL directly from environment variables
 * 
 * Note: The .env file should be loaded before importing this module.
 * Use 'dotenv/config' import or ensure DATABASE_URL is set in the environment.
 */

const environment = process.env.ENVIRONMENT || 'development';

// Get DATABASE_URL directly from environment
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  
  if (!url) {
    throw new Error(
      'DATABASE_URL is required. Please set it in your environment variables.'
    );
  }
  
  return url;
};

export { environment };
export const databaseUrl = getDatabaseUrl();
export const isProduction = environment === 'production';
export const isDevelopment = environment === 'development';
export const isTest = environment === 'test'; 