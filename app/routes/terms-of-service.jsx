import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export const loader = async ({ request }) => {
  // This route should be publicly accessible without authentication
  return json({
    terms: {
      effectiveDate: "January 2025",
      company: "Bernier LLC",
      contact: "support@mbernier.com",
      website: "https://mbernier.com",
      appName: "Store Locator",
      appHandle: "store-locator-176",
      version: "1.0",
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
      lineHeight: '1.6',
      color: '#333'
    }}>
      <h1>Terms of Service</h1>
      <p><strong>Effective Date:</strong> {terms.effectiveDate}</p>
      <p><strong>App Name:</strong> {terms.appName}</p>
      <p><strong>Developer:</strong> {terms.company}</p>
      
      <h2>1. Acceptance of Terms</h2>
      <p>By installing, accessing, or using the Store Locator app ("the App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the App.</p>
      
      <h2>2. Description of Service</h2>
      <p>Store Locator is a Shopify app that enables merchants to:</p>
      <ul>
        <li>Manage and display store locations on their Shopify store</li>
        <li>Import and export store data via CSV</li>
        <li>Provide customers with a customizable store locator widget</li>
        <li>Integrate with Google Maps for location services</li>
        <li>Manage store information including addresses, contact details, and business hours</li>
      </ul>
      
      <h2>3. Eligibility and Account Requirements</h2>
      <ul>
        <li>You must be a Shopify merchant with an active store</li>
        <li>You must have the necessary permissions to install apps on your Shopify store</li>
        <li>You are responsible for maintaining the security of your account credentials</li>
        <li>You must provide accurate and complete information when using the App</li>
      </ul>
      
      <h2>4. App Usage and Permissions</h2>
      
      <h3>4.1 Required Permissions</h3>
      <p>The App requires the following Shopify permissions:</p>
      <ul>
        <li><code>read_themes</code> - To access theme files for widget integration</li>
        <li><code>write_app_proxy</code> - To create proxy routes for external access</li>
        <li><code>write_products</code> - To manage store location data</li>
        <li><code>write_themes</code> - To install and configure the store locator widget</li>
      </ul>
      
      <h3>4.2 Acceptable Use</h3>
      <p>You agree to use the App only for lawful purposes and in accordance with these Terms. You agree not to:</p>
      <ul>
        <li>Use the App to store or transmit malicious code</li>
        <li>Attempt to reverse engineer or decompile the App</li>
        <li>Use the App to violate any applicable laws or regulations</li>
        <li>Interfere with the proper functioning of the App or Shopify's services</li>
      </ul>
      
      <h2>5. Data and Privacy</h2>
      
      <h3>5.1 Data Collection</h3>
      <p>The App collects and processes the following data:</p>
      <ul>
        <li>Store location information (addresses, coordinates, contact details)</li>
        <li>Store business hours and additional information</li>
        <li>App usage data for service improvement</li>
        <li>Technical data necessary for app functionality</li>
      </ul>
      
      <h3>5.2 Data Processing</h3>
      <ul>
        <li>All data is processed in accordance with our Privacy Policy</li>
        <li>Data is stored securely using industry-standard encryption</li>
        <li>Data is isolated per Shopify store for privacy and security</li>
        <li>We do not share your data with third parties except as required for service provision</li>
      </ul>
      
      <h3>5.3 Data Rights</h3>
      <p>You have the right to:</p>
      <ul>
        <li>Export all your data at any time</li>
        <li>Request deletion of all your data</li>
        <li>Access and modify your store location data</li>
        <li>Control how your data is used within the App</li>
      </ul>
      
      <h2>6. Third-Party Services</h2>
      
      <h3>6.1 Google Maps Integration</h3>
      <p>The App integrates with Google Maps services for:</p>
      <ul>
        <li>Geocoding addresses to coordinates</li>
        <li>Displaying interactive maps</li>
        <li>Providing location-based services</li>
      </ul>
      <p>By using the App, you agree to comply with Google's Terms of Service for Maps services.</p>
      
      <h3>6.2 Fallback Services</h3>
      <p>The App includes fallback services (OpenStreetMap) to ensure reliability when Google Maps services are unavailable.</p>
      
      <h2>7. Service Availability and Support</h2>
      
      <h3>7.1 Service Availability</h3>
      <ul>
        <li>We strive to maintain 99.9% uptime for the App</li>
        <li>Scheduled maintenance will be announced in advance</li>
        <li>We are not liable for temporary service interruptions</li>
      </ul>
      
      <h3>7.2 Support</h3>
      <ul>
        <li>Technical support is available through our support channels</li>
        <li>Documentation and help resources are provided within the App</li>
        <li>We respond to support requests within 24-48 hours</li>
      </ul>
      
      <h2>8. Intellectual Property</h2>
      
      <h3>8.1 Our Rights</h3>
      <ul>
        <li>The App and its original content, features, and functionality are owned by {terms.company}</li>
        <li>All trademarks, service marks, and trade names are our property</li>
        <li>You may not copy, modify, or distribute the App without permission</li>
      </ul>
      
      <h3>8.2 Your Rights</h3>
      <ul>
        <li>You retain ownership of your store data and content</li>
        <li>You may customize the store locator widget according to your needs</li>
        <li>You may export your data at any time</li>
      </ul>
      
      <h2>9. Limitation of Liability</h2>
      
      <h3>9.1 Disclaimer</h3>
      <p><strong>THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.</strong></p>
      
      <h3>9.2 Limitation</h3>
      <p><strong>IN NO EVENT SHALL {terms.company.toUpperCase()} BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE APP.</strong></p>
      
      <h3>9.3 Maximum Liability</h3>
      <p><strong>OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT PAID BY YOU FOR THE APP IN THE 12 MONTHS PRECEDING THE CLAIM.</strong></p>
      
      <h2>10. Indemnification</h2>
      <p>You agree to indemnify and hold harmless {terms.company} from any claims, damages, or expenses arising from:</p>
      <ul>
        <li>Your use of the App</li>
        <li>Your violation of these Terms</li>
        <li>Your violation of any third-party rights</li>
        <li>Your violation of applicable laws or regulations</li>
      </ul>
      
      <h2>11. Termination</h2>
      
      <h3>11.1 Termination by You</h3>
      <p>You may uninstall the App at any time through your Shopify admin panel.</p>
      
      <h3>11.2 Termination by Us</h3>
      <p>We may terminate or suspend your access to the App if:</p>
      <ul>
        <li>You violate these Terms</li>
        <li>You engage in fraudulent or illegal activities</li>
        <li>Required by law or regulation</li>
        <li>For business reasons with 30 days' notice</li>
      </ul>
      
      <h3>11.3 Effect of Termination</h3>
      <p>Upon termination:</p>
      <ul>
        <li>Your access to the App will cease</li>
        <li>Your data will be deleted within 30 days</li>
        <li>You may export your data before termination</li>
      </ul>
      
      <h2>12. Changes to Terms</h2>
      <p>We may update these Terms from time to time. We will notify you of any material changes by:</p>
      <ul>
        <li>Posting the updated Terms in the App</li>
        <li>Sending an email notification</li>
        <li>Displaying a notice in the App</li>
      </ul>
      <p>Your continued use of the App after changes become effective constitutes acceptance of the new Terms.</p>
      
      <h2>13. Governing Law</h2>
      <p>These Terms are governed by and construed in accordance with the laws of the jurisdiction where {terms.company} is incorporated, without regard to conflict of law principles.</p>
      
      <h2>14. Dispute Resolution</h2>
      
      <h3>14.1 Informal Resolution</h3>
      <p>We encourage you to contact us first to resolve any disputes informally.</p>
      
      <h3>14.2 Arbitration</h3>
      <p>Any disputes not resolved informally shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.</p>
      
      <h2>15. Severability</h2>
      <p>If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.</p>
      
      <h2>16. Entire Agreement</h2>
      <p>These Terms constitute the entire agreement between you and {terms.company} regarding the App and supersede all prior agreements and understandings.</p>
      
      <h2>17. Contact Information</h2>
      <p>For questions about these Terms, please contact us:</p>
      
      <p><strong>{terms.company}</strong><br />
      Email: <a href={`mailto:${terms.contact}`}>{terms.contact}</a><br />
      Website: <a href={terms.website}>{terms.website}</a></p>
      
      <hr style={{ margin: '40px 0', border: 'none', borderTop: '1px solid #ddd' }} />
      
      <p><em>Last Updated: {terms.effectiveDate}</em><br />
      <em>Version: {terms.version}</em></p>
    </div>
  );
} 