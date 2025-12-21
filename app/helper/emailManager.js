import { EmailManagerClient } from '@bernierllc/email-manager-client';

// Initialize the email manager client
// The client requires a baseUrl pointing to an email-manager service
// You need to either:
// 1. Run @bernierllc/email-manager as a service and provide its URL
// 2. Or have it deployed somewhere and provide that URL
const emailManager = new EmailManagerClient({
  baseUrl: process.env.EMAIL_MANAGER_BASE_URL || 'http://localhost:3001',
  apiKey: process.env.SENDGRID_API_KEY,
}); 

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'help@storetrail.com';

/**
 * Initialize email templates
 * Call this once to create all templates in the email manager
 */
export async function initializeEmailTemplates() {
  console.log('[Email Manager] ℹ️ Initializing email templates...');
  console.log('[Email Manager] ℹ️ Support email configured:', SUPPORT_EMAIL);
  console.log('[Email Manager] ℹ️ Email Manager Base URL:', process.env.EMAIL_MANAGER_BASE_URL || 'http://localhost:3001 (default)');
  console.log('[Email Manager] ℹ️ SendGrid API Key:', process.env.SENDGRID_API_KEY ? '✓ Set' : '✗ Not set');
  
  if (!process.env.EMAIL_MANAGER_BASE_URL) {
    console.log('[Email Manager] ⚠️  EMAIL_MANAGER_BASE_URL not set, using default: http://localhost:3001');
    console.log('[Email Manager] ⚠️  Make sure the Email Manager service is running at this URL');
  }
  
  try {
    // Template 1: Support Request Email (to support team)
    console.log('[Email Manager] Creating template: support-request');
    await emailManager.createTemplate({
      id: 'support-request',
      name: 'Support Request',
      subject: 'Support Request - {{ issueType }} - {{ shop }}',
      htmlTemplate: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Support Request</h2>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Shop:</strong> {{ shop }}</p>
            <p><strong>Issue Type:</strong> {{ issueType }}</p>
            <p><strong>Subject:</strong> {{ subject }}</p>
            <p><strong>Timestamp:</strong> {{ timestamp }}</p>
          </div>
          <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
            <h3 style="margin-top: 0;">Description:</h3>
            <p style="white-space: pre-wrap;">{{ description }}</p>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            This email was sent from the Store Locator support system.<br>
            Reply to this email to respond to the merchant.
          </p>
        </div>
      `,
      textTemplate: `
New Support Request

Shop: {{ shop }}
Issue Type: {{ issueType }}
Subject: {{ subject }}
Timestamp: {{ timestamp }}

Description:
{{ description }}

---
This email was sent from the Store Locator support system.
Reply to this email to respond to the merchant.
      `,
      variables: [
        { name: 'shop', type: 'string', required: true },
        { name: 'issueType', type: 'string', required: true },
        { name: 'subject', type: 'string', required: true },
        { name: 'description', type: 'string', required: true },
        { name: 'timestamp', type: 'string', required: true },
      ],
      category: 'support',
      version: '1.0.0',
      isActive: true,
    });
    console.log('[Email Manager] ✓ Template created: support-request');

    // Template 2: Submission Approved Email (to submitter)
    console.log('[Email Manager] Creating template: submission-approved');
    await emailManager.createTemplate({
      id: 'submission-approved',
      name: 'Store Submission Approved',
      subject: 'Your Store Submission Has Been Approved - {{ storeName }}',
      htmlTemplate: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">Store Submission Approved!</h2>
          <p>Hi {{ contactName }},</p>
          <p>Great news! Your store submission has been approved and added to the store locator.</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Store Details:</h3>
            <p><strong>Store Name:</strong> {{ storeName }}</p>
            <p><strong>Address:</strong> {{ address }}</p>
            <p><strong>City:</strong> {{ city }}, {{ state }} {{ zip }}</p>
            <p><strong>Country:</strong> {{ country }}</p>
            {{#if website}}
            <p><strong>Website:</strong> <a href="{{ website }}">{{ website }}</a></p>
            {{/if}}
          </div>
          <p>Your store is now visible on the store locator and customers can find your location.</p>
          <p>Thank you for being part of our network!</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            Questions? Contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
          </p>
        </div>
      `,
      textTemplate: `
Store Submission Approved!

Hi {{ contactName }},

Great news! Your store submission has been approved and added to the store locator.

Store Details:
Store Name: {{ storeName }}
Address: {{ address }}
City: {{ city }}, {{ state }} {{ zip }}
Country: {{ country }}
{{#if website}}
Website: {{ website }}
{{/if}}

Your store is now visible on the store locator and customers can find your location.

Thank you for being part of our network!

---
Questions? Contact us at ${SUPPORT_EMAIL}
      `,
      variables: [
        { name: 'contactName', type: 'string', required: true },
        { name: 'storeName', type: 'string', required: true },
        { name: 'address', type: 'string', required: true },
        { name: 'city', type: 'string', required: true },
        { name: 'state', type: 'string', required: true },
        { name: 'zip', type: 'string', required: true },
        { name: 'country', type: 'string', required: true },
        { name: 'website', type: 'string', required: false },
      ],
      category: 'submissions',
      version: '1.0.0',
      isActive: true,
    });
    console.log('[Email Manager] ✓ Template created: submission-approved');

    // Template 3: Submission Rejected Email (to submitter)
    console.log('[Email Manager] Creating template: submission-rejected');
    await emailManager.createTemplate({
      id: 'submission-rejected',
      name: 'Store Submission Rejected',
      subject: 'Store Submission Update - {{ storeName }}',
      htmlTemplate: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">Store Submission Update</h2>
          <p>Hi {{ contactName }},</p>
          <p>Thank you for your interest in being listed in our store locator.</p>
          <p>After reviewing your submission, we're unable to approve it at this time.</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Submission Details:</h3>
            <p><strong>Store Name:</strong> {{ storeName }}</p>
            <p><strong>Address:</strong> {{ address }}</p>
            <p><strong>City:</strong> {{ city }}, {{ state }} {{ zip }}</p>
          </div>
          {{#if adminNotes}}
          <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <p style="margin: 0;"><strong>Notes:</strong></p>
            <p style="margin: 10px 0 0 0; white-space: pre-wrap;">{{ adminNotes }}</p>
          </div>
          {{/if}}
          <p>If you have questions or would like to submit updated information, please contact us.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            Questions? Contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
          </p>
        </div>
      `,
      textTemplate: `
Store Submission Update

Hi {{ contactName }},

Thank you for your interest in being listed in our store locator.

After reviewing your submission, we're unable to approve it at this time.

Submission Details:
Store Name: {{ storeName }}
Address: {{ address }}
City: {{ city }}, {{ state }} {{ zip }}

{{#if adminNotes}}
Notes:
{{ adminNotes }}
{{/if}}

If you have questions or would like to submit updated information, please contact us.

---
Questions? Contact us at ${SUPPORT_EMAIL}
      `,
      variables: [
        { name: 'contactName', type: 'string', required: true },
        { name: 'storeName', type: 'string', required: true },
        { name: 'address', type: 'string', required: true },
        { name: 'city', type: 'string', required: true },
        { name: 'state', type: 'string', required: true },
        { name: 'zip', type: 'string', required: true },
        { name: 'adminNotes', type: 'string', required: false },
      ],
      category: 'submissions',
      version: '1.0.0',
      isActive: true,
    });
    console.log('[Email Manager] ✓ Template created: submission-rejected');

    // Template 4: Submission Notification Email (to support team)
    console.log('[Email Manager] Creating template: submission-notification');
    await emailManager.createTemplate({
      id: 'submission-notification',
      name: 'Store Submission Notification',
      subject: 'Store Submission {{ status }} - {{ storeName }}',
      htmlTemplate: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Store Submission {{ status }}</h2>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Status:</strong> {{ status }}</p>
            <p><strong>Shop:</strong> {{ shop }}</p>
            <p><strong>Submission ID:</strong> {{ submissionId }}</p>
            <p><strong>Timestamp:</strong> {{ timestamp }}</p>
          </div>
          <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Store Details:</h3>
            <p><strong>Store Name:</strong> {{ storeName }}</p>
            <p><strong>Store Type:</strong> {{ storeType }}</p>
            <p><strong>Contact Name:</strong> {{ contactName }}</p>
            <p><strong>Contact Email:</strong> <a href="mailto:{{ contactEmail }}">{{ contactEmail }}</a></p>
            {{#if contactPhone}}
            <p><strong>Contact Phone:</strong> {{ contactPhone }}</p>
            {{/if}}
            <p><strong>Address:</strong> {{ address }}</p>
            {{#if address2}}
            <p><strong>Address 2:</strong> {{ address2 }}</p>
            {{/if}}
            <p><strong>City:</strong> {{ city }}</p>
            <p><strong>State:</strong> {{ state }}</p>
            <p><strong>Zip:</strong> {{ zip }}</p>
            <p><strong>Country:</strong> {{ country }}</p>
            {{#if website}}
            <p><strong>Website:</strong> <a href="{{ website }}">{{ website }}</a></p>
            {{/if}}
          </div>
          {{#if adminNotes}}
          <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <p style="margin: 0;"><strong>Admin Notes:</strong></p>
            <p style="margin: 10px 0 0 0; white-space: pre-wrap;">{{ adminNotes }}</p>
          </div>
          {{/if}}
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            This is an automated notification from the Store Locator system.
          </p>
        </div>
      `,
      textTemplate: `
Store Submission {{ status }}

Status: {{ status }}
Shop: {{ shop }}
Submission ID: {{ submissionId }}
Timestamp: {{ timestamp }}

Store Details:
Store Name: {{ storeName }}
Store Type: {{ storeType }}
Contact Name: {{ contactName }}
Contact Email: {{ contactEmail }}
{{#if contactPhone}}
Contact Phone: {{ contactPhone }}
{{/if}}
Address: {{ address }}
{{#if address2}}
Address 2: {{ address2 }}
{{/if}}
City: {{ city }}
State: {{ state }}
Zip: {{ zip }}
Country: {{ country }}
{{#if website}}
Website: {{ website }}
{{/if}}

{{#if adminNotes}}
Admin Notes:
{{ adminNotes }}
{{/if}}

---
This is an automated notification from the Store Locator system.
      `,
      variables: [
        { name: 'status', type: 'string', required: true },
        { name: 'shop', type: 'string', required: true },
        { name: 'submissionId', type: 'string', required: true },
        { name: 'timestamp', type: 'string', required: true },
        { name: 'storeName', type: 'string', required: true },
        { name: 'storeType', type: 'string', required: true },
        { name: 'contactName', type: 'string', required: true },
        { name: 'contactEmail', type: 'string', required: true },
        { name: 'contactPhone', type: 'string', required: false },
        { name: 'address', type: 'string', required: true },
        { name: 'address2', type: 'string', required: false },
        { name: 'city', type: 'string', required: true },
        { name: 'state', type: 'string', required: true },
        { name: 'zip', type: 'string', required: true },
        { name: 'country', type: 'string', required: true },
        { name: 'website', type: 'string', required: false },
        { name: 'adminNotes', type: 'string', required: false },
      ],
      category: 'submissions',
      version: '1.0.0',
      isActive: true,
    });
    console.log('[Email Manager] ✓ Template created: submission-notification');

    console.log('[Email Manager] ✅ All email templates initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('[Email Manager] ❌ Failed to initialize email templates:', error);
    console.error('[Email Manager] Error details:', {
      message: error.message,
      stack: error.stack,
    });
    
    // If templates already exist, this is okay
    if (error.message?.includes('already exists')) {
      console.log('[Email Manager] ℹ️ Templates already exist, skipping initialization');
      return { success: true, message: 'Templates already exist' };
    }
    
    // Network/connection errors
    if (error.message?.includes('fetch failed') || error.message?.includes('NetworkError') || error.statusCode === 0) {
      console.error('[Email Manager] ⚠️  Network Error: The Email Manager service is not reachable.');
      console.error('[Email Manager] ⚠️  Make sure:');
      console.log('  1. EMAIL_MANAGER_BASE_URL is set and points to a running Email Manager service');
      console.log('     Current URL:', process.env.EMAIL_MANAGER_BASE_URL || 'http://localhost:3001 (default)');
      console.log('  2. The Email Manager service is running and accessible at the base URL');
      console.log('  3. If running locally, start the Email Manager service first');
      console.log('  4. Or set EMAIL_MANAGER_BASE_URL to your deployed service URL');
    }
    
    throw error;
  }
}

/**
 * Send support request email to support team
 */
export async function sendSupportRequestEmail({ subject, issueType, description, shop }) {
  console.log('[Email Manager] 📧 Sending support request email...');
  console.log('[Email Manager] Request details:', {
    shop,
    issueType,
    subject,
    descriptionLength: description?.length || 0,
    recipient: SUPPORT_EMAIL,
  });

  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('[Email Manager] ⚠️ SendGrid API key not configured');
      return { success: false, message: 'Email service not configured' };
    }
    console.log('[Email Manager] ✓ SendGrid API key found');

    const emailData = {
      shop,
      issueType,
      subject,
      description,
      timestamp: new Date().toISOString(),
    };
    console.log('[Email Manager] Email data prepared:', {
      ...emailData,
      description: emailData.description?.substring(0, 100) + '...',
    });

    const result = await emailManager.sendEmail({
      templateId: 'support-request',
      to: [SUPPORT_EMAIL],
      replyTo: `${shop}@storetrail.app`, // Allow easy reply to merchant
      data: emailData,
    });

    console.log('[Email Manager] ✅ Support request email sent successfully');
    console.log('[Email Manager] Send result:', {
      success: result?.success,
      messageId: result?.messageId,
      recipient: SUPPORT_EMAIL,
    });
    return { success: true, result };
  } catch (error) {
    console.error('[Email Manager] ❌ Failed to send support request email');
    console.error('[Email Manager] Error:', {
      message: error.message,
      stack: error.stack,
      shop,
      issueType,
      recipient: SUPPORT_EMAIL,
    });
    throw new Error(`Failed to send support request email: ${error.message}`);
  }
}

/**
 * Send submission approval emails to both submitter and support team
 */
export async function sendSubmissionApprovedEmail(submission, shop) {
  console.log('[Email Manager] 📧 Sending submission approved emails...');
  console.log('[Email Manager] Submission details:', {
    submissionId: submission.id,
    shop,
    storeName: submission.storeName,
    submitterEmail: submission.contactEmail,
    supportEmail: SUPPORT_EMAIL,
  });

  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('[Email Manager] ⚠️ SendGrid API key not configured');
      return { success: false, message: 'Email service not configured' };
    }
    console.log('[Email Manager] ✓ SendGrid API key found');

    // Email to submitter
    console.log('[Email Manager] Sending approval email to submitter:', submission.contactEmail);
    const submitterData = {
      contactName: submission.contactName,
      storeName: submission.storeName,
      address: submission.address,
      city: submission.city,
      state: submission.state,
      zip: submission.zip,
      country: submission.country,
      website: submission.website || '',
    };
    console.log('[Email Manager] Submitter email data:', submitterData);

    const submitterResult = await emailManager.sendEmail({
      templateId: 'submission-approved',
      to: [submission.contactEmail],
      replyTo: SUPPORT_EMAIL,
      data: submitterData,
    });
    console.log('[Email Manager] ✅ Approval email sent to submitter');

    // Notification to support team
    console.log('[Email Manager] Sending notification email to support team:', SUPPORT_EMAIL);
    const supportData = {
      status: 'APPROVED',
      shop,
      submissionId: submission.id,
      timestamp: new Date().toISOString(),
      storeName: submission.storeName,
      storeType: submission.storeType,
      contactName: submission.contactName,
      contactEmail: submission.contactEmail,
      contactPhone: submission.contactPhone || '',
      address: submission.address,
      address2: submission.address2 || '',
      city: submission.city,
      state: submission.state,
      zip: submission.zip,
      country: submission.country,
      website: submission.website || '',
      adminNotes: submission.adminNotes || '',
    };
    console.log('[Email Manager] Support notification data:', {
      ...supportData,
      adminNotes: supportData.adminNotes?.substring(0, 50) + '...',
    });

    const supportResult = await emailManager.sendEmail({
      templateId: 'submission-notification',
      to: [SUPPORT_EMAIL],
      data: supportData,
    });
    console.log('[Email Manager] ✅ Notification email sent to support team');

    console.log('[Email Manager] ✅ All submission approved emails sent successfully');
    console.log('[Email Manager] Results:', {
      submitterSuccess: submitterResult?.success,
      supportSuccess: supportResult?.success,
    });
    return { success: true, submitterResult, supportResult };
  } catch (error) {
    console.error('[Email Manager] ❌ Failed to send submission approved emails');
    console.error('[Email Manager] Error:', {
      message: error.message,
      stack: error.stack,
      submissionId: submission.id,
      shop,
      submitterEmail: submission.contactEmail,
      supportEmail: SUPPORT_EMAIL,
    });
    throw new Error(`Failed to send submission approved emails: ${error.message}`);
  }
}

/**
 * Send submission rejection emails to both submitter and support team
 */
export async function sendSubmissionRejectedEmail(submission, shop) {
  console.log('[Email Manager] 📧 Sending submission rejected emails...');
  console.log('[Email Manager] Submission details:', {
    submissionId: submission.id,
    shop,
    storeName: submission.storeName,
    submitterEmail: submission.contactEmail,
    supportEmail: SUPPORT_EMAIL,
    hasAdminNotes: !!submission.adminNotes,
  });

  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('[Email Manager] ⚠️ SendGrid API key not configured');
      return { success: false, message: 'Email service not configured' };
    }
    console.log('[Email Manager] ✓ SendGrid API key found');

    // Email to submitter
    console.log('[Email Manager] Sending rejection email to submitter:', submission.contactEmail);
    const submitterData = {
      contactName: submission.contactName,
      storeName: submission.storeName,
      address: submission.address,
      city: submission.city,
      state: submission.state,
      zip: submission.zip,
      adminNotes: submission.adminNotes || '',
    };
    console.log('[Email Manager] Submitter email data:', {
      ...submitterData,
      adminNotes: submitterData.adminNotes?.substring(0, 50) + '...',
    });

    const submitterResult = await emailManager.sendEmail({
      templateId: 'submission-rejected',
      to: [submission.contactEmail],
      replyTo: SUPPORT_EMAIL,
      data: submitterData,
    });
    console.log('[Email Manager] ✅ Rejection email sent to submitter');

    // Notification to support team
    console.log('[Email Manager] Sending notification email to support team:', SUPPORT_EMAIL);
    const supportData = {
      status: 'REJECTED',
      shop,
      submissionId: submission.id,
      timestamp: new Date().toISOString(),
      storeName: submission.storeName,
      storeType: submission.storeType,
      contactName: submission.contactName,
      contactEmail: submission.contactEmail,
      contactPhone: submission.contactPhone || '',
      address: submission.address,
      address2: submission.address2 || '',
      city: submission.city,
      state: submission.state,
      zip: submission.zip,
      country: submission.country,
      website: submission.website || '',
      adminNotes: submission.adminNotes || '',
    };
    console.log('[Email Manager] Support notification data:', {
      ...supportData,
      adminNotes: supportData.adminNotes?.substring(0, 50) + '...',
    });

    const supportResult = await emailManager.sendEmail({
      templateId: 'submission-notification',
      to: [SUPPORT_EMAIL],
      data: supportData,
    });
    console.log('[Email Manager] ✅ Notification email sent to support team');

    console.log('[Email Manager] ✅ All submission rejected emails sent successfully');
    console.log('[Email Manager] Results:', {
      submitterSuccess: submitterResult?.success,
      supportSuccess: supportResult?.success,
    });
    return { success: true, submitterResult, supportResult };
  } catch (error) {
    console.error('[Email Manager] ❌ Failed to send submission rejected emails');
    console.error('[Email Manager] Error:', {
      message: error.message,
      stack: error.stack,
      submissionId: submission.id,
      shop,
      submitterEmail: submission.contactEmail,
      supportEmail: SUPPORT_EMAIL,
    });
    throw new Error(`Failed to send submission rejected emails: ${error.message}`);
  }
}

export default emailManager;

