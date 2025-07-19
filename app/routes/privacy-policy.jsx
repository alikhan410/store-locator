import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export const loader = async ({ request }) => {
  // This route should be publicly accessible without authentication
  return json({
    privacyPolicy: {
      effectiveDate: "July 19, 2025",
      company: "Bernier LLC",
      contact: "mkbernier@gmail.com",
      appName: "Store Locator",
      appHandle: "store-locator-176",
    },
  });
};

export default function PrivacyPolicy() {
  const { privacyPolicy } = useLoaderData();

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      lineHeight: '1.6'
    }}>
      <h1>Privacy Policy for Store Locator</h1>
      <p><strong>Effective Date:</strong> {privacyPolicy.effectiveDate}</p>
      <p><strong>App Name:</strong> {privacyPolicy.appName}</p>
      <p><strong>Company:</strong> {privacyPolicy.company}</p>
      
      <h2>1. Who We Are</h2>
      <p>{privacyPolicy.company} is a Colorado-based business that develops the Store Locator app for Shopify merchants.</p>
      
      <h2>2. Information We Collect</h2>
      <p>We collect the following types of information when you use our Store Locator app:</p>
      <ul>
        <li><strong>Store Information:</strong> Store names, addresses, phone numbers, websites, and business hours</li>
        <li><strong>Shopify Data:</strong> Your Shopify store domain and basic store information</li>
        <li><strong>Usage Data:</strong> How you interact with our app (features used, settings configured)</li>
        <li><strong>Technical Data:</strong> IP address, browser type, and app performance data</li>
      </ul>
      
      <h2>3. How We Use Your Information</h2>
      <p>We use your information to:</p>
      <ul>
        <li>Provide and improve the Store Locator functionality</li>
        <li>Display store locations to your customers</li>
        <li>Send you important app updates and notifications</li>
        <li>Provide customer support and troubleshoot issues</li>
        <li>Ensure app security and prevent fraud</li>
      </ul>
      
      <h2>4. Data Storage and Security</h2>
      <p>Your data is:</p>
      <ul>
        <li>Stored securely using industry-standard encryption</li>
        <li>Isolated by Shopify store (your data is separate from other merchants)</li>
        <li>Backed up regularly to prevent data loss</li>
        <li>Protected by Shopify's security infrastructure</li>
      </ul>
      
      <h2>5. Data Retention</h2>
      <p>We retain your data only as long as:</p>
      <ul>
        <li>Your app remains installed on your Shopify store</li>
        <li>You actively use the Store Locator functionality</li>
        <li>Required for legal or regulatory compliance</li>
      </ul>
      <p>When you uninstall the app, all your data is automatically deleted within 30 days.</p>
      
      <h2>6. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access all your data stored in our app</li>
        <li>Export your data in CSV format</li>
        <li>Delete all your data at any time</li>
        <li>Request information about how your data is used</li>
        <li>Contact us with privacy concerns</li>
      </ul>
      
      <h2>7. Third-Party Services</h2>
      <p>We use the following third-party services:</p>
      <ul>
        <li><strong>Google Maps API:</strong> For geocoding addresses and displaying maps</li>
        <li><strong>Shopify APIs:</strong> For app integration and authentication</li>
        <li><strong>Hosting Services:</strong> For app infrastructure and data storage</li>
      </ul>
      
      <h2>8. GDPR Compliance</h2>
      <p>We comply with the General Data Protection Regulation (GDPR) and provide:</p>
      <ul>
        <li>Data portability (export functionality)</li>
        <li>Right to be forgotten (deletion functionality)</li>
        <li>Transparent data processing</li>
        <li>Secure data handling</li>
      </ul>
      
      <h2>9. Contact Information</h2>
      <p>If you have questions about this privacy policy or your data:</p>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:mkbernier@gmail.com">mkbernier@gmail.com</a></li>
        <li><strong>Subject:</strong> Privacy Policy Question - Store Locator</li>
      </ul>
      
      <h2>10. Changes to This Policy</h2>
      <p>We may update this privacy policy from time to time. Changes will be posted here and in the app. Your continued use of the app indicates acceptance of any updates.</p>
      
      <hr style={{ margin: '40px 0' }} />
      
      <p><em>Last updated: {privacyPolicy.effectiveDate}</em></p>
    </div>
  );
} 