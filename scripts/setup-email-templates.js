#!/usr/bin/env node

/**
 * Setup script to initialize email templates in the Email Manager
 * Run this once after installing the email manager packages
 * 
 * Usage: node scripts/setup-email-templates.js
 */

import { config } from 'dotenv';
import { initializeEmailTemplates } from '../app/helper/emailManager.js';

// Load environment variables from .env file
config();

async function setup() {
  console.log('🚀 Initializing email templates...\n');

  try {
    const result = await initializeEmailTemplates();
    
    if (result.success) {
      console.log('✅ Email templates initialized successfully!');
      console.log('\nTemplates created:');
      console.log('  - support-request (Support Request Email)');
      console.log('  - submission-approved (Store Submission Approved)');
      console.log('  - submission-rejected (Store Submission Rejected)');
      console.log('  - submission-notification (Store Submission Notification)');
      console.log('\n✨ Email manager is ready to use!');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Failed to initialize email templates:', error.message);
    console.error('\n⚠️  Make sure:');
    console.log('  1. EMAIL_MANAGER_BASE_URL is set and points to a running Email Manager service');
    console.log('  2. The Email Manager service is running and accessible');
    console.log('  3. SENDGRID_API_KEY is set in your environment variables');
    console.log('  4. Your SendGrid API key has the correct permissions');
    console.log('  5. The email manager packages are installed');
    if (error.message.includes('fetch failed') || error.message.includes('NetworkError')) {
      console.log('\n💡 Network Error: The Email Manager service is not reachable.');
      console.log('   - If running locally, start the Email Manager service first');
      console.log('   - Or set EMAIL_MANAGER_BASE_URL to your deployed service URL');
    }
    process.exit(1);
  }
}

setup();

