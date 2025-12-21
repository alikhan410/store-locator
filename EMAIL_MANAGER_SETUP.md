# Email Manager Setup Guide

This guide explains how to set up and use the Email Manager integration for sending support and submission emails.

## Overview

We've replaced Klaviyo with `@bernierllc/email-manager` and `@bernierllc/email-manager-client` for all email communications. The system now sends emails via SendGrid.

## Installation

1. **Install packages**
   ```bash
   npm install
   ```

2. **Set up environment variable**
   Add your SendGrid API key to your `.env` file:
   ```bash
   SENDGRID_API_KEY=your_sendgrid_api_key_here
   ```

3. **Initialize email templates**
   Run the setup script to create all email templates:
   ```bash
   npm run email:setup
   ```

## Email Templates

The system uses 4 email templates:

### 1. Support Request Email
- **Template ID**: `support-request`
- **Recipient**: help@storetrail.com
- **Trigger**: When a merchant submits a support request
- **Variables**: shop, issueType, subject, description, timestamp

### 2. Submission Approved Email
- **Template ID**: `submission-approved`
- **Recipient**: Store submitter (contactEmail)
- **Trigger**: When a store submission is approved
- **Variables**: contactName, storeName, address, city, state, zip, country, website

### 3. Submission Rejected Email
- **Template ID**: `submission-rejected`
- **Recipient**: Store submitter (contactEmail)
- **Trigger**: When a store submission is rejected
- **Variables**: contactName, storeName, address, city, state, zip, adminNotes

### 4. Submission Notification Email
- **Template ID**: `submission-notification`
- **Recipient**: help@storetrail.com
- **Trigger**: When a store submission is approved or rejected
- **Variables**: status, shop, submissionId, timestamp, storeName, storeType, contactName, contactEmail, contactPhone, address, address2, city, state, zip, country, website, adminNotes

## Email Functions

### Support Requests
```javascript
import { sendSupportRequestEmail } from '../helper/emailManager';

await sendSupportRequestEmail({
  subject: 'My issue',
  issueType: 'technical',
  description: 'Detailed description',
  shop: 'mystore.myshopify.com'
});
```

### Submission Approved
```javascript
import { sendSubmissionApprovedEmail } from '../helper/emailManager';

await sendSubmissionApprovedEmail(submission, shop);
```

### Submission Rejected
```javascript
import { sendSubmissionRejectedEmail } from '../helper/emailManager';

await sendSubmissionRejectedEmail(submission, shop);
```

## File Structure

```
app/
  helper/
    emailManager.js          # Email manager helper with all functions
  routes/
    app.support.jsx          # Support page (uses sendSupportRequestEmail)
    app.submissions.jsx      # Submissions page (uses approval/rejection emails)

scripts/
  setup-email-templates.js   # Template initialization script
```

## Testing

1. **Test support request**
   - Go to `/app/support`
   - Fill out the support form
   - Submit
   - Check help@storetrail.com for the email

2. **Test submission approval**
   - Go to `/app/submissions`
   - Approve a submission
   - Check the submitter's email and help@storetrail.com

3. **Test submission rejection**
   - Go to `/app/submissions`
   - Reject a submission
   - Check the submitter's email and help@storetrail.com

## Troubleshooting

### Templates not found
Run the setup script again:
```bash
npm run email:setup
```

### SendGrid API key not working
1. Check that the API key is set in your environment
2. Verify the API key has the correct permissions in SendGrid
3. Make sure the API key is not restricted to specific IP addresses

### Emails not being sent
1. Check the console for error messages
2. Verify the SendGrid API key is valid
3. Check SendGrid dashboard for delivery status
4. Ensure the recipient email addresses are valid

## Email Recipients

- **Support requests**: help@storetrail.com
- **Submission approved**: Submitter's email + help@storetrail.com
- **Submission rejected**: Submitter's email + help@storetrail.com

## Migration from Klaviyo

All Klaviyo code has been removed:
- ✅ `sendKlaviyoSupportEvent()` replaced with `sendSupportRequestEmail()`
- ✅ `sendKlaviyoNotification()` replaced with `sendSubmissionApprovedEmail()` and `sendSubmissionRejectedEmail()`
- ✅ `KLAVIYO_PRIVATE_API_KEY` no longer needed (can be removed from environment)
- ✅ Documentation click tracking removed (as requested)

## Support

For issues with the email manager integration, contact help@storetrail.com.

