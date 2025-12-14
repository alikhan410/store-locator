#!/usr/bin/env node

/**
 * Environment Setup Script for Store Locator App
 * This script helps users set up their environment variables
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupEnvironment() {
  console.log('🚀 Store Locator App - Environment Setup\n');
  
  const envPath = path.join(process.cwd(), '.env');
  const envExists = fs.existsSync(envPath);
  
  if (envExists) {
    console.log('⚠️  .env file already exists. This will append to it.\n');
  }
  
  let envContent = '';
  
  // Google Maps API Key
  console.log('📍 Google Maps Configuration');
  console.log('You need a Google Maps API key for the map functionality.');
  console.log('Get one from: https://console.cloud.google.com/apis/credentials\n');
  
  const googleMapsKey = await question('Enter your Google Maps API key (or press Enter to skip): ');
  
  if (googleMapsKey.trim()) {
    envContent += `GOOGLE_MAPS_PUBLIC_KEY=${googleMapsKey.trim()}\n`;
    console.log('✅ Google Maps API key configured\n');
  } else {
    console.log('⚠️  Google Maps API key not set. Map functionality will use fallback mode.\n');
  }
  
  // Database URLs
  console.log('🗄️  Database Configuration');
  console.log('You need PostgreSQL database URLs for development and production.\n');
  
  const devDbUrl = await question('Enter development database URL (or press Enter to skip): ');
  if (devDbUrl.trim()) {
    envContent += `PRISMA_POSTGRES_DATABASE_URL_DEV=${devDbUrl.trim()}\n`;
    console.log('✅ Development database configured\n');
  }
  
  const prodDbUrl = await question('Enter production database URL (or press Enter to skip): ');
  if (prodDbUrl.trim()) {
    envContent += `PRISMA_POSTGRES_DATABASE_URL_PROD=${prodDbUrl.trim()}\n`;
    console.log('✅ Production database configured\n');
  }
  
  // Environment selection
  console.log('🌍 Environment Selection');
  const environment = await question('Select environment (development/production) [development]: ') || 'development';
  envContent += `ENVIRONMENT=${environment}\n`;
  
  // Write to .env file
  if (envContent) {
    fs.appendFileSync(envPath, envContent);
    console.log('\n✅ Environment variables saved to .env file');
  } else {
    console.log('\n⚠️  No environment variables were set');
  }
  
  console.log('\n📋 Next Steps:');
  console.log('1. If you set up Google Maps API key, test the map functionality');
  console.log('2. If you set up database URLs, run: npm run db:push');
  console.log('3. Start the development server: npm run dev');
  console.log('4. For Google Maps setup help, see: docs/google-maps-setup.md');
  
  rl.close();
}

setupEnvironment().catch(console.error); 