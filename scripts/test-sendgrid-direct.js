#!/usr/bin/env node

/**
 * Direct SendGrid Test
 * Tests SendGrid API directly and via emailManager helper
 */

import { config } from 'dotenv';
config();

import { sendSupportRequestEmail } from '../app/helper/emailManager.js';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL;
const TO_EMAIL = process.env.SUPPORT_EMAIL || 'help@storetrail.app';

console.log('SendGrid Integration Test');
console.log('=========================');
console.log(`From: ${FROM_EMAIL}`);
console.log(`To: ${TO_EMAIL}`);
console.log(`API Key: ${SENDGRID_API_KEY ? SENDGRID_API_KEY.substring(0, 10) + '...' : 'NOT SET'}`);
console.log('');

if (!SENDGRID_API_KEY) {
  console.error('SENDGRID_API_KEY not set');
  process.exit(1);
}

if (!FROM_EMAIL) {
  console.error('FROM_EMAIL not set');
  process.exit(1);
}

console.log('Testing sendSupportRequestEmail...');
console.log('');

try {
  const result = await sendSupportRequestEmail({
    subject: 'SendGrid Integration Test',
    issueType: 'Test Email',
    description: 'This is a test email sent via the emailManager helper to verify SendGrid integration is working correctly.',
    shop: 'test-shop.myshopify.com',
  });

  console.log('Result:', JSON.stringify(result, null, 2));

  if (result.success) {
    console.log('');
    console.log('SUCCESS! Email sent via emailManager.');
    console.log(`Check inbox: ${TO_EMAIL}`);
  } else {
    console.log('');
    console.log('FAILED:', result.message || 'Unknown error');
  }
} catch (error) {
  console.error('Error:', error.message);
  if (error.response?.body) {
    console.error('Response:', JSON.stringify(error.response.body, null, 2));
  }
}
