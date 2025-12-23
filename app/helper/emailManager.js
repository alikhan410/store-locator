import sgMail from '@sendgrid/mail';

// Track if SendGrid API key has been set
let apiKeyConfigured = false;

/**
 * Ensure SendGrid is configured with API key
 */
function ensureConfigured() {
  if (!apiKeyConfigured && process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    apiKeyConfigured = true;
  }
}

/**
 * Get support email from environment (with fallback)
 */
function getSupportEmail() {
  return process.env.SUPPORT_EMAIL || 'help@storetrail.app';
}

/**
 * Send an email via SendGrid
 */
async function sendEmail({ to, subject, html, text, replyTo }) {
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL;

  if (!SENDGRID_API_KEY) {
    console.warn('[SendGrid] SendGrid API key not configured');
    return { success: false, message: 'Email service not configured' };
  }

  if (!FROM_EMAIL) {
    console.warn('[SendGrid] FROM_EMAIL not configured');
    return { success: false, message: 'FROM_EMAIL not configured' };
  }

  ensureConfigured();

  const msg = {
    to,
    from: FROM_EMAIL,
    subject,
    text,
    html,
    ...(replyTo && { replyTo }),
  };

  try {
    const [response] = await sgMail.send(msg);
    console.log('[SendGrid] Email sent successfully:', {
      to,
      subject,
      statusCode: response.statusCode,
    });
    return { success: true, statusCode: response.statusCode };
  } catch (error) {
    console.error('[SendGrid] Failed to send email:', {
      to,
      subject,
      error: error.message,
      response: error.response?.body,
    });
    throw error;
  }
}

/**
 * Send support request email to support team
 */
export async function sendSupportRequestEmail({ subject, issueType, description, shop }) {
  console.log('[SendGrid] Sending support request email...');

  const timestamp = new Date().toISOString();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Support Request</h2>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Shop:</strong> ${shop}</p>
        <p><strong>Issue Type:</strong> ${issueType}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Timestamp:</strong> ${timestamp}</p>
      </div>
      <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h3 style="margin-top: 0;">Description:</h3>
        <p style="white-space: pre-wrap;">${description}</p>
      </div>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #666; font-size: 12px;">
        This email was sent from the Store Locator support system.<br>
        Reply to this email to respond to the merchant.
      </p>
    </div>
  `;

  const text = `
New Support Request

Shop: ${shop}
Issue Type: ${issueType}
Subject: ${subject}
Timestamp: ${timestamp}

Description:
${description}

---
This email was sent from the Store Locator support system.
Reply to this email to respond to the merchant.
  `.trim();

  return sendEmail({
    to: getSupportEmail(),
    subject: `Support Request - ${issueType} - ${shop}`,
    html,
    text,
    replyTo: `${shop}@storetrail.app`,
  });
}

/**
 * Send submission approval emails to both submitter and support team
 */
export async function sendSubmissionApprovedEmail(submission, shop) {
  console.log('[SendGrid] Sending submission approved emails...');

  const timestamp = new Date().toISOString();

  // Email to submitter
  const submitterHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #28a745;">Store Submission Approved!</h2>
      <p>Hi ${submission.contactName},</p>
      <p>Great news! Your store submission has been approved and added to the store locator.</p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Store Details:</h3>
        <p><strong>Store Name:</strong> ${submission.storeName}</p>
        <p><strong>Address:</strong> ${submission.address}</p>
        <p><strong>City:</strong> ${submission.city}, ${submission.state} ${submission.zip}</p>
        <p><strong>Country:</strong> ${submission.country}</p>
        ${submission.website ? `<p><strong>Website:</strong> <a href="${submission.website}">${submission.website}</a></p>` : ''}
      </div>
      <p>Your store is now visible on the store locator and customers can find your location.</p>
      <p>Thank you for being part of our network!</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #666; font-size: 12px;">
        Questions? Contact us at <a href="mailto:${getSupportEmail()}">${getSupportEmail()}</a>
      </p>
    </div>
  `;

  const submitterText = `
Store Submission Approved!

Hi ${submission.contactName},

Great news! Your store submission has been approved and added to the store locator.

Store Details:
Store Name: ${submission.storeName}
Address: ${submission.address}
City: ${submission.city}, ${submission.state} ${submission.zip}
Country: ${submission.country}
${submission.website ? `Website: ${submission.website}` : ''}

Your store is now visible on the store locator and customers can find your location.

Thank you for being part of our network!

---
Questions? Contact us at ${getSupportEmail()}
  `.trim();

  // Send to submitter
  const submitterResult = await sendEmail({
    to: submission.contactEmail,
    subject: `Your Store Submission Has Been Approved - ${submission.storeName}`,
    html: submitterHtml,
    text: submitterText,
    replyTo: getSupportEmail(),
  });

  // Notification to support team
  const supportHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Store Submission APPROVED</h2>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Status:</strong> APPROVED</p>
        <p><strong>Shop:</strong> ${shop}</p>
        <p><strong>Submission ID:</strong> ${submission.id}</p>
        <p><strong>Timestamp:</strong> ${timestamp}</p>
      </div>
      <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Store Details:</h3>
        <p><strong>Store Name:</strong> ${submission.storeName}</p>
        <p><strong>Store Type:</strong> ${submission.storeType || 'N/A'}</p>
        <p><strong>Contact Name:</strong> ${submission.contactName}</p>
        <p><strong>Contact Email:</strong> <a href="mailto:${submission.contactEmail}">${submission.contactEmail}</a></p>
        ${submission.contactPhone ? `<p><strong>Contact Phone:</strong> ${submission.contactPhone}</p>` : ''}
        <p><strong>Address:</strong> ${submission.address}</p>
        ${submission.address2 ? `<p><strong>Address 2:</strong> ${submission.address2}</p>` : ''}
        <p><strong>City:</strong> ${submission.city}</p>
        <p><strong>State:</strong> ${submission.state}</p>
        <p><strong>Zip:</strong> ${submission.zip}</p>
        <p><strong>Country:</strong> ${submission.country}</p>
        ${submission.website ? `<p><strong>Website:</strong> <a href="${submission.website}">${submission.website}</a></p>` : ''}
      </div>
      ${submission.adminNotes ? `
      <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
        <p style="margin: 0;"><strong>Admin Notes:</strong></p>
        <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${submission.adminNotes}</p>
      </div>
      ` : ''}
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #666; font-size: 12px;">
        This is an automated notification from the Store Locator system.
      </p>
    </div>
  `;

  const supportText = `
Store Submission APPROVED

Status: APPROVED
Shop: ${shop}
Submission ID: ${submission.id}
Timestamp: ${timestamp}

Store Details:
Store Name: ${submission.storeName}
Store Type: ${submission.storeType || 'N/A'}
Contact Name: ${submission.contactName}
Contact Email: ${submission.contactEmail}
${submission.contactPhone ? `Contact Phone: ${submission.contactPhone}` : ''}
Address: ${submission.address}
${submission.address2 ? `Address 2: ${submission.address2}` : ''}
City: ${submission.city}
State: ${submission.state}
Zip: ${submission.zip}
Country: ${submission.country}
${submission.website ? `Website: ${submission.website}` : ''}

${submission.adminNotes ? `Admin Notes:\n${submission.adminNotes}` : ''}

---
This is an automated notification from the Store Locator system.
  `.trim();

  const supportResult = await sendEmail({
    to: getSupportEmail(),
    subject: `Store Submission APPROVED - ${submission.storeName}`,
    html: supportHtml,
    text: supportText,
  });

  return { success: true, submitterResult, supportResult };
}

/**
 * Send submission rejection emails to both submitter and support team
 */
export async function sendSubmissionRejectedEmail(submission, shop) {
  console.log('[SendGrid] Sending submission rejected emails...');

  const timestamp = new Date().toISOString();

  // Email to submitter
  const submitterHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc3545;">Store Submission Update</h2>
      <p>Hi ${submission.contactName},</p>
      <p>Thank you for your interest in being listed in our store locator.</p>
      <p>After reviewing your submission, we're unable to approve it at this time.</p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Submission Details:</h3>
        <p><strong>Store Name:</strong> ${submission.storeName}</p>
        <p><strong>Address:</strong> ${submission.address}</p>
        <p><strong>City:</strong> ${submission.city}, ${submission.state} ${submission.zip}</p>
      </div>
      ${submission.adminNotes ? `
      <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
        <p style="margin: 0;"><strong>Notes:</strong></p>
        <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${submission.adminNotes}</p>
      </div>
      ` : ''}
      <p>If you have questions or would like to submit updated information, please contact us.</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #666; font-size: 12px;">
        Questions? Contact us at <a href="mailto:${getSupportEmail()}">${getSupportEmail()}</a>
      </p>
    </div>
  `;

  const submitterText = `
Store Submission Update

Hi ${submission.contactName},

Thank you for your interest in being listed in our store locator.

After reviewing your submission, we're unable to approve it at this time.

Submission Details:
Store Name: ${submission.storeName}
Address: ${submission.address}
City: ${submission.city}, ${submission.state} ${submission.zip}

${submission.adminNotes ? `Notes:\n${submission.adminNotes}` : ''}

If you have questions or would like to submit updated information, please contact us.

---
Questions? Contact us at ${getSupportEmail()}
  `.trim();

  // Send to submitter
  const submitterResult = await sendEmail({
    to: submission.contactEmail,
    subject: `Store Submission Update - ${submission.storeName}`,
    html: submitterHtml,
    text: submitterText,
    replyTo: getSupportEmail(),
  });

  // Notification to support team
  const supportHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Store Submission REJECTED</h2>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Status:</strong> REJECTED</p>
        <p><strong>Shop:</strong> ${shop}</p>
        <p><strong>Submission ID:</strong> ${submission.id}</p>
        <p><strong>Timestamp:</strong> ${timestamp}</p>
      </div>
      <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Store Details:</h3>
        <p><strong>Store Name:</strong> ${submission.storeName}</p>
        <p><strong>Store Type:</strong> ${submission.storeType || 'N/A'}</p>
        <p><strong>Contact Name:</strong> ${submission.contactName}</p>
        <p><strong>Contact Email:</strong> <a href="mailto:${submission.contactEmail}">${submission.contactEmail}</a></p>
        ${submission.contactPhone ? `<p><strong>Contact Phone:</strong> ${submission.contactPhone}</p>` : ''}
        <p><strong>Address:</strong> ${submission.address}</p>
        ${submission.address2 ? `<p><strong>Address 2:</strong> ${submission.address2}</p>` : ''}
        <p><strong>City:</strong> ${submission.city}</p>
        <p><strong>State:</strong> ${submission.state}</p>
        <p><strong>Zip:</strong> ${submission.zip}</p>
        <p><strong>Country:</strong> ${submission.country}</p>
        ${submission.website ? `<p><strong>Website:</strong> <a href="${submission.website}">${submission.website}</a></p>` : ''}
      </div>
      ${submission.adminNotes ? `
      <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
        <p style="margin: 0;"><strong>Admin Notes:</strong></p>
        <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${submission.adminNotes}</p>
      </div>
      ` : ''}
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #666; font-size: 12px;">
        This is an automated notification from the Store Locator system.
      </p>
    </div>
  `;

  const supportText = `
Store Submission REJECTED

Status: REJECTED
Shop: ${shop}
Submission ID: ${submission.id}
Timestamp: ${timestamp}

Store Details:
Store Name: ${submission.storeName}
Store Type: ${submission.storeType || 'N/A'}
Contact Name: ${submission.contactName}
Contact Email: ${submission.contactEmail}
${submission.contactPhone ? `Contact Phone: ${submission.contactPhone}` : ''}
Address: ${submission.address}
${submission.address2 ? `Address 2: ${submission.address2}` : ''}
City: ${submission.city}
State: ${submission.state}
Zip: ${submission.zip}
Country: ${submission.country}
${submission.website ? `Website: ${submission.website}` : ''}

${submission.adminNotes ? `Admin Notes:\n${submission.adminNotes}` : ''}

---
This is an automated notification from the Store Locator system.
  `.trim();

  const supportResult = await sendEmail({
    to: getSupportEmail(),
    subject: `Store Submission REJECTED - ${submission.storeName}`,
    html: supportHtml,
    text: supportText,
  });

  return { success: true, submitterResult, supportResult };
}
