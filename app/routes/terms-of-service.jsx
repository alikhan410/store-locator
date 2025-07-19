import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export const loader = async ({ request }) => {
  // This route should be publicly accessible without authentication
  return json({
    terms: {
      effectiveDate: "July 19, 2025",
      company: "Bernier LLC",
      contact: "mkbernier@gmail.com",
      appName: "Store Locator",
      appHandle: "store-locator-176",
    },
  });
};

export default function TermsOfService() {
  const { terms } = useLoaderData();

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      lineHeight: '1.6'
    }}>
      <h1>Terms of Service for Store Locator</h1>
      <p><strong>Effective Date:</strong> {terms.effectiveDate}</p>
      <p><strong>App Name:</strong> {terms.appName}</p>
      <p><strong>Company:</strong> {terms.company}</p>
      
      <h2>1. Acceptance of Terms</h2>
      <p>By installing and using the Store Locator app, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the app.</p>
      
      <h2>2. Description of Service</h2>
      <p>The Store Locator app allows Shopify merchants to:</p>
      <ul>
        <li>Manage store locations and contact information</li>
        <li>Import and export store data via CSV</li>
        <li>Display store locations to customers via a customizable widget</li>
        <li>Geocode addresses for accurate map display</li>
      </ul>
      
      <h2>3. Your Responsibilities</h2>
      <p>As a user of the Store Locator app, you agree to:</p>
      <ul>
        <li>Provide accurate and up-to-date store information</li>
        <li>Comply with all applicable laws and regulations</li>
        <li>Not use the app for any illegal or unauthorized purpose</li>
        <li>Maintain the security of your Shopify account</li>
        <li>Respect the privacy and data rights of your customers</li>
      </ul>
      
      <h2>4. Data and Privacy</h2>
      <p>Your use of the app is also governed by our Privacy Policy, which is incorporated into these terms by reference. You agree that:</p>
      <ul>
        <li>You have the right to provide any store data you upload</li>
        <li>You will not upload sensitive personal information of customers</li>
        <li>You consent to our processing of your data as described in our Privacy Policy</li>
      </ul>
      
      <h2>5. Intellectual Property</h2>
      <p>You retain ownership of your store data. We retain ownership of the app software and any improvements or modifications we make.</p>
      
      <h2>6. Service Availability</h2>
      <p>We strive to maintain high availability of the Store Locator app, but we do not guarantee uninterrupted service. We may need to perform maintenance or updates that temporarily affect availability.</p>
      
      <h2>7. Third-Party Services</h2>
      <p>The app integrates with third-party services including:</p>
      <ul>
        <li>Google Maps API for geocoding and map display</li>
        <li>Shopify APIs for store integration</li>
      </ul>
      <p>Your use of these services is subject to their respective terms of service.</p>
      
      <h2>8. Limitation of Liability</h2>
      <p>To the maximum extent permitted by law, {terms.company} shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the app.</p>
      
      <h2>9. Indemnification</h2>
      <p>You agree to indemnify and hold harmless {terms.company} from any claims, damages, or expenses arising from your use of the app or violation of these terms.</p>
      
      <h2>10. Termination</h2>
      <p>You may stop using the app at any time by uninstalling it from your Shopify store. We may terminate your access if you violate these terms. Upon termination, your data will be deleted as described in our Privacy Policy.</p>
      
      <h2>11. Changes to Terms</h2>
      <p>We may update these terms from time to time. We will notify you of significant changes through the app or by email. Your continued use of the app after changes indicates acceptance of the updated terms.</p>
      
      <h2>12. Governing Law</h2>
      <p>These terms are governed by the laws of Colorado, United States. Any disputes will be resolved in the courts of Colorado.</p>
      
      <h2>13. Contact Information</h2>
      <p>If you have questions about these terms:</p>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:mkbernier@gmail.com">mkbernier@gmail.com</a></li>
        <li><strong>Subject:</strong> Terms of Service Question - Store Locator</li>
      </ul>
      
      <hr style={{ margin: '40px 0' }} />
      
      <p><em>Last updated: {terms.effectiveDate}</em></p>
    </div>
  );
} 