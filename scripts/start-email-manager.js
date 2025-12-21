#!/usr/bin/env node

/**
 * Simple Email Manager Service
 * Starts a local HTTP server that wraps the @bernierllc/email-manager library
 * 
 * Usage: node scripts/start-email-manager.js
 * 
 * The service will run on http://localhost:3001 by default
 * Set PORT environment variable to change the port
 * 
 * Required environment variables:
 * - SENDGRID_API_KEY: Your SendGrid API key
 */

import { createServer } from 'http';
import { URL } from 'url';
import { config } from 'dotenv';
import { EmailManager } from '@bernierllc/email-manager';

// Load environment variables from .env file
config();

const PORT = process.env.PORT || 3001;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (!SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY environment variable is required');
  console.error('   Set it with: set SENDGRID_API_KEY=your-key-here');
  process.exit(1);
}

// Initialize EmailManager with SendGrid provider
const emailManager = new EmailManager({
  providers: [
    {
      id: 'sendgrid-default',
      type: 'sendgrid',
      isActive: true,
      isDefault: true,
      config: {
        apiKey: SENDGRID_API_KEY,
        fromEmail: process.env.FROM_EMAIL || 'noreply@storetrail.com',
      },
    },
  ],
  scheduling: {
    enabled: false, // Disable scheduling for now
  },
  analytics: {
    enabled: true,
  },
});

// Helper to read request body
async function readBody(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk.toString();
  }
  return body ? JSON.parse(body) : {};
}

// Helper to send JSON response
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const server = createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  try {
    // Health check
    if (pathname === '/health' && req.method === 'GET') {
      sendJson(res, 200, { status: 'ok', service: 'email-manager' });
      return;
    }

    // Create template - POST /templates
    if (pathname === '/templates' && req.method === 'POST') {
      const templateData = await readBody(req);
      await emailManager.createTemplate(templateData);
      sendJson(res, 201, { success: true, message: 'Template created' });
      return;
    }

    // Get template - GET /templates/:id
    if (pathname.startsWith('/templates/') && req.method === 'GET') {
      const templateId = pathname.split('/templates/')[1];
      const template = await emailManager.getTemplate(templateId);
      sendJson(res, 200, template);
      return;
    }

    // Send email - POST /send
    if (pathname === '/send' && req.method === 'POST') {
      const emailData = await readBody(req);
      
      // If templateId is provided, use sendTemplatedEmail
      if (emailData.templateId) {
        const result = await emailManager.sendTemplatedEmail(
          emailData.templateId,
          emailData.data || {},
          emailData.to
        );
        sendJson(res, 200, { success: result.success, ...result });
      } else {
        // Otherwise use regular sendEmail
        const result = await emailManager.sendEmail(emailData);
        sendJson(res, 200, { success: result.success, ...result });
      }
      return;
    }

    // 404 for unknown routes
    sendJson(res, 404, { error: 'Not found', path: pathname });
  } catch (error) {
    console.error('Error handling request:', error);
    sendJson(res, 500, { 
      error: 'Internal server error', 
      message: error.message 
    });
  }
});

server.listen(PORT, () => {
  console.log(`✅ Email Manager service running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   API endpoint: http://localhost:${PORT}`);
  console.log(`   Press Ctrl+C to stop\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Email Manager service...');
  server.close(() => {
    console.log('✅ Email Manager service stopped');
    process.exit(0);
  });
});

